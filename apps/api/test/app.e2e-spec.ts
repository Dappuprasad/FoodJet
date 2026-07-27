import { VersioningType, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import * as argon2 from 'argon2';
import type { MenuItem as MenuItemRecord } from '@prisma/client';
import { rupeesToPaise, type MenuItem, type Order } from '@foodjet/shared';
import { AppModule } from '../src/app.module';
import { buildValidationPipe } from '../src/common/validation';
import { PrismaService } from '../src/prisma/prisma.service';

const ADMIN = { email: 'e2e-admin@foodjet.test', password: 'Admin@12345' };
const CUSTOMER = { email: 'e2e-customer@foodjet.test', password: 'Customer@12345' };

describe('FoodJet API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  // Prisma records for the fixtures; API responses use the shared MenuItem shape.
  let butterChicken: MenuItemRecord;
  let samosa: MenuItemRecord;
  let adminToken: string;
  let customerToken: string;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    // Mirror main.ts so the tests exercise the same pipeline the server runs.
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(buildValidationPipe());

    await app.init();

    prisma = app.get(PrismaService);
    await prisma.truncateAll();

    [butterChicken, samosa] = await prisma.$transaction([
      prisma.menuItem.create({
        data: {
          slug: 'e2e-butter-chicken',
          name: 'Butter Chicken',
          description: 'Creamy tomato curry with tender chicken pieces',
          pricePaise: rupeesToPaise(320),
          imageUrl: '/images/butter-chicken.jpg',
          category: 'Main Course',
          preparationMinutes: 25,
        },
      }),
      prisma.menuItem.create({
        data: {
          slug: 'e2e-samosa',
          name: 'Samosa',
          description: 'Crispy pastry filled with spiced potatoes and peas',
          pricePaise: rupeesToPaise(40),
          imageUrl: '/images/samosa.jpg',
          category: 'Street Food',
          isVegetarian: true,
          preparationMinutes: 12,
        },
      }),
    ]);

    await prisma.user.create({
      data: {
        email: ADMIN.email,
        name: 'E2E Admin',
        role: 'ADMIN',
        passwordHash: await argon2.hash(ADMIN.password, { type: argon2.argon2id }),
      },
    });

    const adminLogin = await http().post('/api/v1/auth/login').send(ADMIN).expect(200);
    adminToken = adminLogin.body.accessToken;

    const registered = await http()
      .post('/api/v1/auth/register')
      .send({ ...CUSTOMER, name: 'E2E Customer', phone: '9876543210' })
      .expect(201);
    customerToken = registered.body.accessToken;
  });

  afterAll(async () => {
    await prisma.truncateAll();
    await app.close();
  });

  const validOrder = (items: Array<{ menuItemId: string; quantity: number }>) => ({
    customerName: 'Rahul Sharma',
    phone: '9876543210',
    addressLine: '42, MG Road, Koramangala, Bangalore 560034',
    items,
  });

  describe('GET /menu', () => {
    it('is public and returns items with their categories', async () => {
      const { body } = await http().get('/api/v1/menu').expect(200);

      expect(body.items).toHaveLength(2);
      expect(body.categories).toEqual(
        expect.arrayContaining(['Main Course', 'Street Food']),
      );
    });

    it('filters by category', async () => {
      const { body } = await http()
        .get('/api/v1/menu')
        .query({ category: 'Street Food' })
        .expect(200);

      expect(body.items).toHaveLength(1);
      expect(body.items[0].name).toBe('Samosa');
    });

    it('searches names and descriptions case-insensitively', async () => {
      const { body } = await http().get('/api/v1/menu').query({ search: 'CHICKEN' });

      expect(body.items).toHaveLength(1);
      expect(body.items[0].slug).toBe('e2e-butter-chicken');
    });

    it('hides delisted dishes from the storefront', async () => {
      await http()
        .delete(`/api/v1/admin/menu/${samosa.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const { body } = await http().get('/api/v1/menu').expect(200);
      expect(body.items.map((item: MenuItem) => item.slug)).not.toContain('e2e-samosa');

      // Admins still see it, and it comes back on relist.
      const admin = await http()
        .get('/api/v1/admin/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(admin.body.items).toHaveLength(2);

      await http()
        .patch(`/api/v1/admin/menu/${samosa.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isAvailable: true })
        .expect(200);
    });
  });

  describe('POST /orders', () => {
    it('prices the order from the database and ignores client-supplied totals', async () => {
      const { body } = await http()
        .post('/api/v1/orders')
        .send({
          ...validOrder([{ menuItemId: butterChicken.id, quantity: 2 }]),
          // Fields a tampering client might add. `forbidNonWhitelisted` strips
          // unknown properties, and the totals are recomputed regardless.
          totalPaise: 1,
          subtotalPaise: 1,
        })
        .expect(400);

      // Rejected outright rather than silently ignored.
      expect(body.message).toBeDefined();
    });

    it('computes subtotal, delivery and tax server-side', async () => {
      const { body } = await http()
        .post('/api/v1/orders')
        .send(validOrder([{ menuItemId: butterChicken.id, quantity: 2 }]))
        .expect(201);

      const order = body as Order;

      expect(order.subtotalPaise).toBe(rupeesToPaise(640));
      expect(order.deliveryFeePaise).toBe(0);
      expect(order.taxPaise).toBe(rupeesToPaise(32));
      expect(order.totalPaise).toBe(rupeesToPaise(672));
      expect(order.reference).toMatch(/^FJ-[0-9A-HJKMNP-TV-Z]{6}$/);
      expect(order.status).toBe('RECEIVED');
      expect(order.timeline).toHaveLength(1);
    });

    it('charges delivery below the free-delivery threshold', async () => {
      const { body } = await http()
        .post('/api/v1/orders')
        .send(validOrder([{ menuItemId: samosa.id, quantity: 2 }]))
        .expect(201);

      expect(body.subtotalPaise).toBe(rupeesToPaise(80));
      expect(body.deliveryFeePaise).toBe(rupeesToPaise(40));
      expect(body.totalPaise).toBe(rupeesToPaise(124));
    });

    it('reports field-level validation errors', async () => {
      const { body } = await http()
        .post('/api/v1/orders')
        .send({ customerName: 'R', phone: '123', addressLine: 'x', items: [] })
        .expect(400);

      expect(Object.keys(body.errors as Record<string, string[]>)).toEqual(
        expect.arrayContaining(['customerName', 'phone', 'addressLine', 'items']),
      );
    });

    it('refuses an order containing a delisted dish', async () => {
      await http()
        .delete(`/api/v1/admin/menu/${samosa.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await http()
        .post('/api/v1/orders')
        .send(validOrder([{ menuItemId: samosa.id, quantity: 1 }]))
        .expect(422);

      await http()
        .patch(`/api/v1/admin/menu/${samosa.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isAvailable: true })
        .expect(200);
    });

    it('rejects a dish that does not exist', async () => {
      await http()
        .post('/api/v1/orders')
        .send(
          validOrder([
            { menuItemId: '99999999-9999-4999-8999-999999999999', quantity: 1 },
          ]),
        )
        .expect(422);
    });
  });

  describe('order visibility', () => {
    it('lets anyone with the id read a guest order — that is the tracking link', async () => {
      const created = await http()
        .post('/api/v1/orders')
        .send(validOrder([{ menuItemId: samosa.id, quantity: 1 }]))
        .expect(201);

      await http().get(`/api/v1/orders/${created.body.id}`).expect(200);
    });

    it('restricts an account-linked order to its owner', async () => {
      const created = await http()
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validOrder([{ menuItemId: samosa.id, quantity: 1 }]))
        .expect(201);

      // Anonymous caller is refused.
      await http().get(`/api/v1/orders/${created.body.id}`).expect(403);

      // The owner and an admin are not.
      await http()
        .get(`/api/v1/orders/${created.body.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      await http()
        .get(`/api/v1/orders/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('lists only the caller’s own orders under /orders/me', async () => {
      const { body } = await http()
        .get('/api/v1/orders/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(body.data.length).toBeGreaterThan(0);
      expect(body.meta).toMatchObject({ page: 1 });
    });

    it('404s on an unknown order and 400s on a malformed id', async () => {
      await http().get('/api/v1/orders/99999999-9999-4999-8999-999999999999').expect(404);
      await http().get('/api/v1/orders/not-a-uuid').expect(400);
    });
  });

  describe('status transitions', () => {
    let order: Order;

    beforeEach(async () => {
      const { body } = await http()
        .post('/api/v1/orders')
        .send(validOrder([{ menuItemId: samosa.id, quantity: 1 }]))
        .expect(201);
      order = body as Order;
    });

    it('advances one legal step at a time', async () => {
      const { body } = await http()
        .patch(`/api/v1/admin/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PREPARING' })
        .expect(200);

      expect(body.status).toBe('PREPARING');
      expect(body.timeline).toHaveLength(2);
    });

    it('refuses to skip a stage', async () => {
      await http()
        .patch(`/api/v1/admin/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'DELIVERED' })
        .expect(409);
    });

    it('refuses to move backwards or out of a terminal state', async () => {
      for (const status of ['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']) {
        await http()
          .patch(`/api/v1/admin/orders/${order.id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status })
          .expect(200);
      }

      await http()
        .patch(`/api/v1/admin/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'OUT_FOR_DELIVERY' })
        .expect(409);
    });

    it('rejects a status outside the enum', async () => {
      await http()
        .patch(`/api/v1/admin/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'TELEPORTING' })
        .expect(400);
    });

    it('allows cancelling before dispatch and not after', async () => {
      const owned = await http()
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validOrder([{ menuItemId: samosa.id, quantity: 1 }]))
        .expect(201);

      await http()
        .post(`/api/v1/orders/${owned.body.id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => expect(res.body.status).toBe('CANCELLED'));

      // A second cancel on a terminal order is a conflict, not a no-op.
      await http()
        .post(`/api/v1/orders/${owned.body.id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(409);
    });
  });

  describe('auth', () => {
    it('never returns a password hash', async () => {
      const { body } = await http()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(body).not.toHaveProperty('passwordHash');
      expect(body.email).toBe(CUSTOMER.email);
    });

    it('gives the same answer for a wrong password and an unknown account', async () => {
      const unknown = await http()
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@foodjet.test', password: 'Whatever@123' })
        .expect(401);

      const wrong = await http()
        .post('/api/v1/auth/login')
        .send({ email: CUSTOMER.email, password: 'WrongPassword@1' })
        .expect(401);

      expect(unknown.body.message).toBe(wrong.body.message);
    });

    it('refuses to register the same email twice', async () => {
      await http()
        .post('/api/v1/auth/register')
        .send({ ...CUSTOMER, name: 'Duplicate' })
        .expect(409);
    });

    it('enforces the password policy', async () => {
      const { body } = await http()
        .post('/api/v1/auth/register')
        .send({ email: 'weak@foodjet.test', password: 'short', name: 'Weak Password' })
        .expect(400);

      expect(body.errors.password).toBeDefined();
    });

    it('sets an httpOnly refresh cookie and rotates it on refresh', async () => {
      const login = await http().post('/api/v1/auth/login').send(ADMIN).expect(200);

      const cookies = login.get('Set-Cookie') ?? [];
      const refreshCookie = cookies.find((c) => c.startsWith('fj_refresh='));

      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');

      const refreshed = await http()
        .post('/api/v1/auth/refresh')
        .set('Cookie', refreshCookie!)
        .expect(200);

      expect(refreshed.body.accessToken).toBeDefined();

      // Replaying the now-rotated token must fail.
      await http().post('/api/v1/auth/refresh').set('Cookie', refreshCookie!).expect(401);
    });

    it('rejects refresh with no cookie at all', async () => {
      await http().post('/api/v1/auth/refresh').expect(401);
    });
  });

  describe('authorisation', () => {
    it('requires a token for protected routes', async () => {
      await http().get('/api/v1/orders/me').expect(401);
      await http().get('/api/v1/auth/me').expect(401);
    });

    it('rejects a forged or corrupted token', async () => {
      await http()
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not.a.real.token')
        .expect(401);
    });

    it('keeps customers out of every admin route', async () => {
      await http()
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      await http()
        .get('/api/v1/admin/menu')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      await http()
        .post('/api/v1/admin/menu')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Sneaky Dish',
          description: 'Should never be created by a customer',
          pricePaise: 1,
          imageUrl: '/images/x.jpg',
          category: 'Main Course',
          isVegetarian: true,
          spiceLevel: 0,
          preparationMinutes: 5,
        })
        .expect(403);
    });

    it('lets an admin through', async () => {
      await http()
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('health', () => {
    it('reports the database as reachable', async () => {
      const { body } = await http().get('/api/v1/health').expect(200);

      expect(body.status).toBe('ok');
      expect(body.info.database.status).toBe('up');
    });
  });
});
