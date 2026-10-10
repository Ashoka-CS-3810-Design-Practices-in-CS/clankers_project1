import type { ValidationResult } from '../../domain/visualization';
import { LINKED_LIST_CAPACITY } from './LinkedListModel';

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

export function validateInsertionCapacity(size: number): ValidationResult<void> {
  if (size >= LINKED_LIST_CAPACITY) {
    return {
      ok: false,
      message: `The visualizer is limited to ${LINKED_LIST_CAPACITY} nodes so every step stays readable.`,
    };
  }
  return { ok: true };
}
