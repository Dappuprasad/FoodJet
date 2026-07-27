import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Attaches `request.user` when a valid bearer token is present and shrugs when
 * it isn't. Used on checkout so signed-in customers get the order filed against
 * their account while guests can still order.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser>(_err: unknown, user: TUser): TUser {
    return (user || undefined) as TUser;
  }
}
