import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Injects the JWT-derived user. Returns undefined on routes guarded by
 * OptionalJwtAuthGuard, which is how guest checkout stays possible.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const { user } = request;

    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
