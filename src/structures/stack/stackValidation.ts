import type { ValidationResult } from '../../domain/visualization';
import { STACK_CAPACITY } from './StackModel';

export function validateStackCapacity(size: number): ValidationResult<void> {
  if (size >= STACK_CAPACITY) {
    return {
      ok: false,
      message: `The visualizer is limited to ${STACK_CAPACITY} items so every step stays readable.`,
    };
  }
  return { ok: true };
}
