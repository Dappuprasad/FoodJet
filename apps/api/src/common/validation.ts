import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export const FIELD_ERRORS_KEY = 'fieldErrors';

export interface FieldErrorPayload {
  [FIELD_ERRORS_KEY]: Record<string, string[]>;
}

/**
 * Flattens class-validator's nested error tree into `{ "items.0.quantity": [...] }`
 * so the checkout form can highlight the offending input instead of dumping a
 * sentence at the top of the page.
 */
function flatten(errors: ValidationError[], parentPath = ''): Record<string, string[]> {
  return errors.reduce<Record<string, string[]>>((acc, error) => {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const messages = Object.values(error.constraints ?? {});

    if (messages.length) {
      acc[path] = [...(acc[path] ?? []), ...messages];
    }

    if (error.children?.length) {
      Object.assign(acc, flatten(error.children, path));
    }

    return acc;
  }, {});
}

export function buildValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors: ValidationError[]) => {
      const fieldErrors = flatten(errors);
      const first = Object.values(fieldErrors)[0]?.[0];

      return new BadRequestException({
        message: first ?? 'Validation failed',
        [FIELD_ERRORS_KEY]: fieldErrors,
      });
    },
  });
}
