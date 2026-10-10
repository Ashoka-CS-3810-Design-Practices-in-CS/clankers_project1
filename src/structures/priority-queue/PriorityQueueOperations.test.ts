import { describe, expect, it } from 'vitest';
import { PRIORITY_QUEUE_CAPACITY, PriorityQueueModel } from './PriorityQueueModel';
import { PriorityQueueOperations } from './PriorityQueueOperations';
import { validatePriorityQueueCapacity } from './priorityQueueValidation';

const operations = new PriorityQueueOperations();
const values = (model: PriorityQueueModel) => model.items().map((item) => item.value);

describe('PriorityQueueModel', () => {
  it('keeps the minimum at the root after every insert', () => {
    const model = new PriorityQueueModel();
    [7, 3, 9, 1, 5, 8].forEach((value) => {
      model.insert(value);
      expect(model.isValidHeap()).toBe(true);
    });
    expect(model.peekMin()?.value).toBe(1);
    expect(values(model)).toEqual([1, 3, 8, 7, 5, 9]);
  });

  it('extracts values in ascending order', () => {
    const model = PriorityQueueModel.fromValues([12, -4, 7, 7, 0, 25, 3, -4]);
    const extracted: number[] = [];
    while (!model.isEmpty()) {
      extracted.push(model.extractMin()?.value as number);
      expect(model.isValidHeap()).toBe(true);
    }
    expect(extracted).toEqual([-4, -4, 0, 3, 7, 7, 12, 25]);
  });

  it('keeps stable ids for duplicate values through clones', () => {
    const model = PriorityQueueModel.fromValues([4, 4]);
    const clone = model.clone();
    const added = clone.insert(4);
    expect(new Set(clone.items().map((item) => item.id)).size).toBe(3);
    expect(added.id).toBe('pq-3');
    expect(model.size()).toBe(2);
  });

  it('returns null when empty and immutable snapshots otherwise', () => {
    const empty = new PriorityQueueModel();
    expect(empty.extractMin()).toBeNull();
    expect(empty.peekMin()).toBeNull();

    const snapshot = PriorityQueueModel.fromValues([2, 1]).snapshot();
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.items)).toBe(true);
    expect(snapshot.items.every(Object.isFrozen)).toBe(true);
  });
});

describe('PriorityQueueOperations', () => {
  it('sifts an inserted minimum up to the root with logarithmic complexity', () => {
    const result = operations.insert(PriorityQueueModel.fromValues([3, 5, 8, 7]), 1);
    expect(result.model.peekMin()?.value).toBe(1);
    expect(result.model.isValidHeap()).toBe(true);
    expect(result.complexity).toMatchObject({ time: 'O(log n)', space: 'O(1)' });
    expect(result.steps.filter((step) => step.message.includes('swaps upward'))).toHaveLength(2);
    expect(result.steps.at(-1)?.message).toContain('is at the root');
  });

  it('stops sifting up when the parent is already smaller', () => {
    const result = operations.insert(PriorityQueueModel.fromValues([1, 5]), 9);
    expect(values(result.model)).toEqual([1, 5, 9]);
    expect(result.steps.at(-1)?.message).toContain('heap order holds');
  });

  it('extracts the minimum and restores heap order', () => {
    const result = operations.extractMin(PriorityQueueModel.sample());
    expect(result.status).toBe('success');
    expect(result.steps.at(-1)?.output).toEqual([1]);
    expect(result.model.peekMin()?.value).toBe(3);
    expect(result.model.size()).toBe(5);
    expect(result.model.isValidHeap()).toBe(true);
    expect(result.complexity).toMatchObject({ time: 'O(log n)', space: 'O(1)' });
  });

  it('empties a single-item heap on extract', () => {
    const result = operations.extractMin(PriorityQueueModel.fromValues([6]));
    expect(result.model.isEmpty()).toBe(true);
    expect(result.steps.at(-1)?.message).toContain('now empty');
  });

  it('peeks at the minimum without changing the heap', () => {
    const model = PriorityQueueModel.sample();
    const result = operations.peekMin(model);
    expect(result.model.snapshot()).toEqual(model.snapshot());
    expect(result.steps.at(-1)?.output).toEqual([1]);
    expect(result.complexity).toMatchObject({ time: 'O(1)', space: 'O(1)' });
  });

  it('does not mutate the committed model', () => {
    const model = PriorityQueueModel.sample();
    const before = model.snapshot();
    operations.insert(model, -10);
    operations.extractMin(model);
    expect(model.snapshot()).toEqual(before);
  });

  it('blocks extract and peek on an empty priority queue', () => {
    const model = new PriorityQueueModel();
    expect(operations.extractMin(model).status).toBe('blocked');
    expect(operations.peekMin(model).status).toBe('blocked');
  });

  it('generates deterministic immutable step logs', () => {
    const first = operations.extractMin(PriorityQueueModel.sample());
    const second = operations.extractMin(PriorityQueueModel.sample());
    expect(first.steps).toEqual(second.steps);
    expect(Object.isFrozen(first.steps)).toBe(true);
    expect(first.steps.every(Object.isFrozen)).toBe(true);
  });
});

describe('priority queue validation', () => {
  it('blocks inserts at the visual capacity', () => {
    expect(validatePriorityQueueCapacity(PRIORITY_QUEUE_CAPACITY).ok).toBe(false);
    expect(validatePriorityQueueCapacity(PRIORITY_QUEUE_CAPACITY - 1).ok).toBe(true);
  });
});
