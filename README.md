# FoodJet

A food delivery application: browse a menu, place an order, and watch it move
through the kitchen in real time.

Built as a TypeScript monorepo — a NestJS REST + WebSocket API backed by
PostgreSQL, and a React front end that shares its domain types with the server.

```
┌──────────────┐   REST + WebSocket   ┌──────────────┐   Prisma   ┌────────────┐
│  React SPA   │ ───────────────────▶ │  NestJS API  │ ─────────▶ │ PostgreSQL │
│   (Vercel)   │ ◀─────────────────── │   (Render)   │            │ (Supabase) │
└──────────────┘   live order status  └──────────────┘            └────────────┘
        │                                     │
        └──────────── @foodjet/shared ────────┘
             types · pricing rules · order state machine
```

## Contents

- [Why it is built this way](#why-it-is-built-this-way)
- [Stack](#stack)
- [Running it locally](#running-it-locally)
- [Project layout](#project-layout)
- [API](#api)
- [Testing](#testing)
- [Deployment](#deployment)

## Why it is built this way

A few decisions are worth calling out, because they are the interesting part.

**The server owns every price.** Checkout sends menu item ids and quantities —
nothing else. No prices, no line totals, no order total. The API loads the
current prices from the database, recomputes the whole breakdown, and stores
that. A client cannot ask to be charged less, because the client is never asked
what to charge.

**Money is integers.** Every amount is stored, transmitted and calculated in
paise (`32000`, not `320.00`). Floating point is fine until `0.1 + 0.2` turns up
on an invoice. Formatting to `₹320` happens once, at the display layer.

**One implementation of the pricing rules.** `@foodjet/shared` exports
`calculatePricing`, and both sides import it — the client to preview a total in
the cart, the server to decide what to actually charge. The cart and the receipt
cannot disagree, because there is only one rule set.

**Order status is a state machine, not a column.** `RECEIVED → PREPARING →
OUT_FOR_DELIVERY → DELIVERED`, with `CANCELLED` reachable only before dispatch.
Transitions are validated centrally, so an order cannot skip a stage or come
back out of a terminal state — including via the admin endpoints. The admin UI
renders its buttons *from* the transition table, so it cannot offer a move the
API would reject.

**Live tracking is genuinely live.** Order progression runs on the server and is
pushed over Socket.IO to a room per order. Every viewer of an order sees the same
status at the same moment, it survives a page refresh, and an admin override
takes effect immediately. If the socket cannot connect, the client falls back to
polling rather than showing a frozen page.

**Authentication fails closed.** A global guard protects every route; public
endpoints opt out explicitly with `@Public()`. Forgetting a decorator locks an
endpoint down instead of quietly exposing it. Passwords are hashed with argon2id
at OWASP's recommended parameters, and refresh tokens rotate on every use — a
replayed token revokes the whole session rather than silently working twice.

**Guest checkout still works.** An account is optional. Orders placed without one
are readable by anyone holding the order id, which is what makes a tracking link
work; orders attached to an account are restricted to their owner and to admins.

## Stack

| Layer     | Choice                                                            |
| --------- | ----------------------------------------------------------------- |
| Front end | React 19, TypeScript, Vite, React Router 7, Socket.IO client      |
| API       | NestJS 11, TypeScript, Prisma 6, Passport JWT, argon2, Socket.IO  |
| Database  | PostgreSQL (Supabase)                                             |
| Shared    | `@foodjet/shared` — dual ESM/CJS package consumed by both apps    |
| Testing   | Jest + Supertest (API), Vitest + Testing Library (web)            |
| Tooling   | npm workspaces, ESLint 9 flat config with type-aware rules        |

## Running it locally

**Requirements:** Node 20.11+ and a PostgreSQL database. The free tier at
[supabase.com](https://supabase.com) is enough and takes about three minutes to
set up.

```bash
git clone <your-repo-url> foodjet
cd foodjet
npm install
```

Configure the API:

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` and set:

- `DATABASE_URL` — Supabase **transaction pooler**, port `6543`, with
  `?pgbouncer=true&connection_limit=1` appended
- `DIRECT_DATABASE_URL` — Supabase **session pooler**, same host on port `5432`.
  Migrations need a session-mode connection because the transaction pooler
  cannot run DDL.

  Use the session pooler rather than the "direct connection"
  (`db.<ref>.supabase.co`) — Supabase serves that host over IPv6 only, which
  most home networks and free-tier hosts cannot reach.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — 32+ characters each. Generate
  them with:

  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  ```

The API validates its environment at boot and refuses to start on a missing or
short secret, rather than failing on the first request that needs one.

Create the schema and load the menu:

```bash
npm run db:deploy -w @foodjet/api   # apply migrations
npm run db:seed                     # 10 dishes + demo accounts
```

Start both apps:

```bash
npm run dev
```

| URL                            | What       |
| ------------------------------ | ---------- |
| http://localhost:5173          | Web app    |
| http://localhost:3001/api/v1   | API        |
| http://localhost:3001/api/docs | Swagger UI |

Seeded accounts:

| Role     | Email             | Password      |
| -------- | ----------------- | ------------- |
| Customer | demo@foodjet.dev  | `Demo@12345`  |
| Admin    | admin@foodjet.dev | `Admin@12345` |

The demo runs the kitchen clock at 40× (`ORDER_SIMULATION_SPEEDUP`), so a full
order lifecycle plays out in about a minute instead of forty. Set it to `1` for
realistic timings.

## Project layout

```
apps/
  api/                     NestJS API
    prisma/                schema, migrations, seed
    src/
      common/              guards, filters, decorators, validation
      config/              typed config + boot-time env validation
      modules/
        auth/              register, login, refresh rotation, JWT strategy
        menu/              public browsing + admin CRUD
        orders/            pricing, state machine, kitchen simulation
        realtime/          Socket.IO gateway
        health/            liveness + database check
    test/                  e2e suite
  web/                     React client
    src/
      components/          presentational + shared UI
      context/             cart, auth, toasts
      hooks/               useMenu, useOrderTracking
      lib/                 typed API client, socket, formatting
      pages/               route components
packages/
  shared/                  types, pricing, order state machine
```

## API

Base URL `/api/v1`. Interactive docs at `/api/docs`. Every failure returns the
same shape, so the client has one error contract to parse:

```json
{
  "statusCode": 400,
  "message": "Enter a valid 10-digit Indian mobile number",
  "errors": { "phone": ["Enter a valid 10-digit Indian mobile number"] },
  "path": "/api/v1/orders",
  "timestamp": "2026-07-27T09:12:44.000Z"
}
```

| Method | Path                       | Auth     | Purpose                              |
| ------ | -------------------------- | -------- | ------------------------------------ |
| GET    | `/menu`                    | –        | Browse, with category/search filters |
| GET    | `/menu/:idOrSlug`          | –        | One dish                             |
| POST   | `/orders`                  | optional | Place an order (guest or signed in)  |
| GET    | `/orders/:id`              | optional | Track an order                       |
| GET    | `/orders/reference/:ref`   | optional | Look up by printed reference         |
| GET    | `/orders/me`               | customer | Order history                        |
| POST   | `/orders/:id/cancel`       | customer | Cancel before dispatch               |
| POST   | `/auth/register`           | –        | Create an account                    |
| POST   | `/auth/login`              | –        | Start a session                      |
| POST   | `/auth/refresh`            | cookie   | Rotate tokens                        |
| POST   | `/auth/logout`             | –        | Revoke the refresh token             |
| GET    | `/auth/me`                 | customer | Current user                         |
| GET    | `/admin/orders`            | admin    | All orders, paginated                |
| PATCH  | `/admin/orders/:id/status` | admin    | Move an order along                  |
| GET    | `/admin/menu`              | admin    | Full catalogue incl. delisted        |
| POST   | `/admin/menu`              | admin    | Add a dish                           |
| PATCH  | `/admin/menu/:id`          | admin    | Edit a dish                          |
| DELETE | `/admin/menu/:id`          | admin    | Delist a dish                        |
| GET    | `/health`                  | –        | Liveness + database check            |

### WebSocket

Namespace `/orders`. Authenticate by passing the access token in the handshake:

```ts
io('/orders', { auth: { token: accessToken } });

socket.emit('order:subscribe', { orderId });
socket.on('order:snapshot', ({ order }) => {/* full order */});
socket.on('order:status-changed', ({ status, event }) => {/* one transition */});
```

Subscribing is read-only, and it reuses the REST authorisation rules — a socket
cannot see an order the same caller could not have fetched over HTTP.

## Testing

```bash
npm test           # unit tests across all workspaces
npm run lint
npm run typecheck
```

The e2e suite needs a database, and it **truncates every table** between runs.
It therefore refuses to touch `DATABASE_URL` at all and requires a separate,
disposable one:

```bash
E2E_DATABASE_URL="postgresql://..." npm run test:e2e -w @foodjet/api
```

A second free Supabase project works well for this. The run aborts with an
explanation if `E2E_DATABASE_URL` is missing, or if it matches `DATABASE_URL` —
the failure mode being guarded against is a developer with a working `.env`
running the suite and wiping the database the deployed app is serving.

## Deployment

Three free tiers. The API is a long-running Node service rather than a
serverless function because it holds WebSocket connections.

**1. Database — Supabase.** Create a project and copy both pooler connection
strings (transaction on `6543`, session on `5432`).

**2. API — Render.** `render.yaml` is a blueprint: point Render at the repo and
it picks up the build and start commands. Set `DATABASE_URL`,
`DIRECT_DATABASE_URL` and `CORS_ORIGINS` (your exact Vercel URL — credentialed
CORS forbids a wildcard); the JWT secrets are generated for you. Migrations run
on boot, so a deploy can never serve a schema it does not have.

**3. Web — Vercel.** Import the repo; `vercel.json` supplies the build config.
Set one environment variable:

```
VITE_API_URL=https://<your-api>.onrender.com/api/v1
```

> Two free-tier caveats worth knowing before someone opens your demo link:
> Render sleeps the API after inactivity, so the first request takes a few
> seconds to wake it (`/health` is a cheap way to warm it), and Supabase pauses
> a project after about a week with no queries — you resume it from the
> dashboard in one click.
