import type { ValidationResult } from '../../domain/visualization';
import { PRIORITY_QUEUE_CAPACITY } from './PriorityQueueModel';

export function validatePriorityQueueCapacity(size: number): ValidationResult<void> {
  if (size >= PRIORITY_QUEUE_CAPACITY) {
    return {
      ok: false,
      message: `The visualizer is limited to ${PRIORITY_QUEUE_CAPACITY} items so every step stays readable.`,
    };
  }
  return { ok: true };
}
