import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  isProduction: process.env.NODE_ENV === 'production',
  swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  throttleLimit: Number(process.env.THROTTLE_LIMIT ?? 120),
}));

const DURATION_UNITS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };

/**
 * Parses "15m" / "7d" / "3600" into seconds. Kept as a number rather than
 * handing the raw string to jsonwebtoken so the TTL is one type everywhere —
 * the signing options, the `expiresIn` we return to the client, and the tests.
 */
export function parseDurationSeconds(value: string, fallbackSeconds: number): number {
  const match = /^(\d+)([smhd])?$/.exec(value.trim());
  if (!match) return fallbackSeconds;

  const amount = Number(match[1]);
  const unit = match[2] ?? 's';

  return amount * (DURATION_UNITS[unit] ?? 1);
}

export const authConfig = registerAs('auth', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET as string,
  refreshSecret: process.env.JWT_REFRESH_SECRET as string,
  accessTtlSeconds: parseDurationSeconds(process.env.JWT_ACCESS_TTL ?? '15m', 900),
  refreshTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
}));

export const ordersConfig = registerAs('orders', () => ({
  simulationSpeedup: Number(process.env.ORDER_SIMULATION_SPEEDUP ?? 40),
}));

export type AppConfig = ReturnType<typeof appConfig>;
export type AuthConfig = ReturnType<typeof authConfig>;
export type OrdersConfig = ReturnType<typeof ordersConfig>;
