import type { ApiError as ApiErrorBody } from '@foodjet/shared';

/**
 * Every failed request surfaces as one of these, so callers never have to guess
 * whether they are holding a Response, a TypeError from a dropped connection,
 * or a validation payload.
 */
export class ApiError extends Error {
  readonly status: number;
  /** Field-level validation messages keyed by property path. */
  readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, status: number, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  static fromBody(body: Partial<ApiErrorBody>, status: number): ApiError {
    return new ApiError(
      body.message ?? defaultMessageFor(status),
      status,
      body.errors ?? {},
    );
  }

  /** A network failure — the request never reached the server. */
  static offline(): ApiError {
    return new ApiError(
      'Could not reach the server. Check your connection and try again.',
      0,
    );
  }

  get isValidation(): boolean {
    return this.status === 400 || this.status === 422;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

function defaultMessageFor(status: number): string {
  if (status === 404) return 'Not found';
  if (status === 403) return 'You do not have permission to do that';
  if (status === 429) return 'Too many requests — please slow down';
  if (status >= 500) return 'Something went wrong on our side. Please try again.';
  return 'Request failed';
}
