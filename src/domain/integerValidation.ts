import type { ValidationResult } from './visualization';

export function parseIntegerInput(input: string): ValidationResult<number> {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: 'Enter an integer before choosing an operation.' };
  }

  const value = Number(trimmed);
  if (!Number.isSafeInteger(value)) {
    return { ok: false, message: 'Use a whole number within JavaScript’s safe integer range.' };
  }

  return { ok: true, value };
}
