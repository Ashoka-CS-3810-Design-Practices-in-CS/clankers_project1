import type { ValidationResult } from './visualization';

/** Optional sign followed by decimal digits only, so inputs such as 1e3, 0x10, or 2.5 are rejected. */
const INTEGER_PATTERN = /^[+-]?\d+$/;

export function parseIntegerInput(input: string): ValidationResult<number> {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: 'Enter an integer before choosing an operation.' };
  }

  if (!INTEGER_PATTERN.test(trimmed)) {
    return {
      ok: false,
      message:
        'Enter an integer using digits only, with an optional minus sign, for example 21 or -8.',
    };
  }

  const value = Number(trimmed);
  if (!Number.isSafeInteger(value)) {
    return {
      ok: false,
      message:
        'Use a whole number within JavaScript’s safe integer range: -9,007,199,254,740,991 to 9,007,199,254,740,991 (inclusive).',
    };
  }

  return { ok: true, value: value === 0 ? 0 : value };
}
