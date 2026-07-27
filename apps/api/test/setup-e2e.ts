/**
 * Environment for the e2e run, applied before Nest reads its config.
 *
 * DATABASE_URL is deliberately NOT defaulted: these tests destroy every row in
 * the schema they point at, so they must fail loudly rather than quietly find a
 * development database.
 */
process.env.NODE_ENV = 'test';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'e2e tests need DATABASE_URL to point at a disposable database — they truncate every table.',
  );
}

process.env.JWT_ACCESS_SECRET ??= 'e2e-access-secret-that-is-long-enough-000000';
process.env.JWT_REFRESH_SECRET ??= 'e2e-refresh-secret-that-is-long-enough-0000';
process.env.SWAGGER_ENABLED = 'false';

// 1x speed means the first automatic status change is 90 seconds away, so the
// background progression cannot race an assertion mid-test.
process.env.ORDER_SIMULATION_SPEEDUP = '1';

// Rate limiting off: a suite firing dozens of logins would otherwise trip it.
process.env.THROTTLE_LIMIT = '100000';
