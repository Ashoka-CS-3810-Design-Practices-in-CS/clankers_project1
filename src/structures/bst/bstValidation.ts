import type { ValidationResult } from '../../domain/visualization';
import { BST_CAPACITY } from './BstModel';

export function validateBstCapacity(size: number, duplicate: boolean): ValidationResult<void> {
  if (!duplicate && size >= BST_CAPACITY) {
    return {
      ok: false,
      message: `The visualizer is limited to ${BST_CAPACITY} distinct nodes so the tree remains readable.`,
    };
  }
  return { ok: true };
}
