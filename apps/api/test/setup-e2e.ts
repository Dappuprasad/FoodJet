/**
 * Environment for the e2e run, applied before Nest reads its config.
 *
 * These tests truncate every table. Two separate guards stand between that and
 * a real database, because `npm run test:e2e` picking up a working .env is an
 * extremely easy mistake to make — and an unrecoverable one.
 */
process.env.NODE_ENV = 'test';

const url = process.env.E2E_DATABASE_URL;

if (!url) {
  throw new Error(
    [
      'e2e tests destroy every row in the database they run against, so they',
      'refuse to use DATABASE_URL. Point E2E_DATABASE_URL at a disposable',
      'database instead:',
      '',
      '  E2E_DATABASE_URL="postgresql://..." npm run test:e2e -w @foodjet/api',
      '',
      'Create a throwaway Supabase project (or a local database) for this —',
      'never the one serving the deployed app.',
    ].join('\n'),
  );
}

// A second, cheaper guard: refuse anything that is obviously the live database.
if (process.env.DATABASE_URL && url === process.env.DATABASE_URL) {
  throw new Error(
    'E2E_DATABASE_URL is identical to DATABASE_URL. These tests would wipe the ' +
      'database the app is using. Point them at a disposable one.',
  );
}

// Prisma reads DATABASE_URL / DIRECT_DATABASE_URL, so the disposable URL is
// swapped in only after the checks above have passed.
process.env.DATABASE_URL = url;
process.env.DIRECT_DATABASE_URL = process.env.E2E_DIRECT_DATABASE_URL ?? url;

process.env.JWT_ACCESS_SECRET ??= 'e2e-access-secret-that-is-long-enough-000000';
process.env.JWT_REFRESH_SECRET ??= 'e2e-refresh-secret-that-is-long-enough-0000';
process.env.SWAGGER_ENABLED = 'false';

// 1x speed means the first automatic status change is 90 seconds away, so the
// background progression cannot race an assertion mid-test.
process.env.ORDER_SIMULATION_SPEEDUP = '1';

// Rate limiting off: a suite firing dozens of logins would otherwise trip it.
process.env.THROTTLE_LIMIT = '100000';
