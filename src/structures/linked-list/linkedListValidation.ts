import type { ValidationResult } from '../../domain/visualization';
import { LINKED_LIST_CAPACITY } from './LinkedListModel';

export { parseIntegerInput } from '../../domain/integerValidation';

export function validateInsertionCapacity(size: number): ValidationResult<void> {
  if (size >= LINKED_LIST_CAPACITY) {
    return {
      ok: false,
      message: `The visualizer is limited to ${LINKED_LIST_CAPACITY} nodes so every step stays readable.`,
    };
  }
  return { ok: true };
}
