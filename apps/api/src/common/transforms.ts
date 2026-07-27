import type { TransformFnParams } from 'class-transformer';

/**
 * Shared `@Transform` helpers.
 *
 * class-transformer types the incoming value as `any`, so each helper narrows it
 * once here rather than leaking an implicit `any` into every DTO.
 */

export function trim({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function normaliseEmail({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export function toBoolean({ value }: TransformFnParams): unknown {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['1', 'true', 'yes'].includes(value.toLowerCase());
  return value;
}

export function toNumber({ value }: TransformFnParams): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  return Number(value);
}
