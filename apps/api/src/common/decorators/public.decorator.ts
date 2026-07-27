import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opts a route out of the globally registered JwtAuthGuard.
 *
 * Authentication is on by default and switched off per route rather than the
 * other way round, so forgetting a decorator locks an endpoint down instead of
 * quietly exposing it.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
