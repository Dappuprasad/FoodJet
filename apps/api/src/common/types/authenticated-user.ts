import type { UserRole } from '@foodjet/shared';

/** What the JWT strategy attaches to `request.user`. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload {
  /** User id. */
  sub: string;
  email: string;
  role: UserRole;
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
