import type { CookieOptions, Response } from 'express';

export const REFRESH_COOKIE_NAME = 'fj_refresh';

/** Scoped to the auth routes so it is never attached to menu or order calls. */
const COOKIE_PATH = '/api/v1/auth';

function baseOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    // The web client is served from a different origin than the API in
    // production, so the cookie has to be SameSite=None — which browsers only
    // honour together with Secure. Locally both run on localhost, where Lax
    // works and Secure would stop the cookie being set over plain HTTP.
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: COOKIE_PATH,
  };
}

export function setRefreshCookie(
  res: Response,
  token: string,
  expiresAt: Date,
  isProduction: boolean,
): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...baseOptions(isProduction),
    expires: expiresAt,
  });
}

export function clearRefreshCookie(res: Response, isProduction: boolean): void {
  res.clearCookie(REFRESH_COOKIE_NAME, baseOptions(isProduction));
}
