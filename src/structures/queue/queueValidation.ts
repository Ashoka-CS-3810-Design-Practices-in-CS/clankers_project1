import type { ValidationResult } from '../../domain/visualization';
import { QUEUE_CAPACITY } from './QueueModel';

export function validateQueueCapacity(size: number): ValidationResult<void> {
  if (size >= QUEUE_CAPACITY) {
    return {
      ok: false,
      message: `The visualizer is limited to ${QUEUE_CAPACITY} items so every step stays readable.`,
    };
  }
  return { ok: true };
}
