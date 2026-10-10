import { describe, expect, it } from 'vitest';
import { QueueModel, QUEUE_CAPACITY } from './QueueModel';
import { QueueOperations } from './QueueOperations';
import { validateQueueCapacity } from './queueValidation';

const operations = new QueueOperations();

describe('QueueModel', () => {
  it('keeps stable ids while cloning and enqueuing duplicate values', () => {
    const model = QueueModel.fromValues([4, 4]);
    const originalIds = model.items().map((item) => item.id);
    const clone = model.clone();
    const added = clone.enqueue(4);

    expect(
      clone
        .items()
        .slice(0, 2)
        .map((item) => item.id),
    ).toEqual(originalIds);
    expect(added.id).not.toBe(originalIds[0]);
    expect(new Set(clone.items().map((item) => item.id)).size).toBe(3);
  });

  it('serves items in first-in, first-out order', () => {
    const model = new QueueModel();
    [1, 2, 3].forEach((value) => model.enqueue(value));

    expect(model.dequeue()?.value).toBe(1);
    model.enqueue(4);
    expect(model.items().map((item) => item.value)).toEqual([2, 3, 4]);
    expect(model.front()?.value).toBe(2);
    expect(model.rear()?.value).toBe(4);
  });

  it('keeps order and ids correct across many dequeues and compactions', () => {
    const model = new QueueModel();
    for (let value = 1; value <= 20; value += 1) model.enqueue(value);
    for (let count = 0; count < 15; count += 1) model.dequeue();
    model.enqueue(21);

    expect(model.size()).toBe(6);
    expect(model.items().map((item) => item.value)).toEqual([16, 17, 18, 19, 20, 21]);
    expect(model.rear()?.id).toBe('queue-21');
    expect(model.clone().enqueue(22).id).toBe('queue-22');
  });

  it('returns null instead of throwing when empty', () => {
    const model = new QueueModel();
    expect(model.dequeue()).toBeNull();
    expect(model.front()).toBeNull();
    expect(model.rear()).toBeNull();
    expect(model.isEmpty()).toBe(true);
  });

  it('returns deeply immutable snapshots', () => {
    const snapshot = QueueModel.fromValues([1, 2]).snapshot();
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.items)).toBe(true);
    expect(snapshot.items.every(Object.isFrozen)).toBe(true);
  });
});

describe('QueueOperations', () => {
  it('enqueues a value at the rear in constant time', () => {
    const result = operations.enqueue(QueueModel.fromValues([1, 2]), 3);
    expect(result.model.items().map((item) => item.value)).toEqual([1, 2, 3]);
    expect(result.complexity).toMatchObject({ time: 'O(1)', space: 'O(1)' });
    expect(result.steps.at(-1)?.activeNodeIds).toEqual([result.model.rear()?.id]);
  });

  it('dequeues only the front duplicate', () => {
    const result = operations.dequeue(QueueModel.fromValues([5, 8, 5]));
    expect(result.model.items().map((item) => item.value)).toEqual([8, 5]);
    expect(result.model.items().map((item) => item.id)).toEqual(['queue-2', 'queue-3']);
    expect(result.steps.at(-1)?.output).toEqual([5]);
    expect(result.complexity).toMatchObject({ time: 'O(1)', space: 'O(1)' });
  });

  it('peeks at the front without changing the model', () => {
    const model = QueueModel.fromValues([5, 8]);
    const result = operations.peek(model);
    expect(result.model.snapshot()).toEqual(model.snapshot());
    expect(result.steps.at(-1)?.output).toEqual([5]);
    expect(result.steps.at(-1)?.matchedNodeIds).toEqual([model.front()?.id]);
  });

  it('does not mutate the committed model', () => {
    const model = QueueModel.fromValues([1, 2]);
    operations.dequeue(model);
    operations.enqueue(model, 3);
    expect(model.items().map((item) => item.value)).toEqual([1, 2]);
  });

  it('blocks dequeue and peek on an empty queue', () => {
    const model = new QueueModel();
    expect(operations.dequeue(model).status).toBe('blocked');
    expect(operations.peek(model).status).toBe('blocked');
    expect(operations.dequeue(model).model.isEmpty()).toBe(true);
  });

  it('inspects values from front to rear', () => {
    const result = operations.inspect(QueueModel.fromValues([12, 19, 26]));
    expect(result.steps.at(-1)?.output).toEqual([12, 19, 26]);
    expect(result.complexity).toMatchObject({ time: 'O(n)', space: 'O(n)' });
  });

  it('generates deterministic immutable step logs', () => {
    const first = operations.inspect(QueueModel.fromValues([1, 2]));
    const second = operations.inspect(QueueModel.fromValues([1, 2]));
    expect(first.steps).toEqual(second.steps);
    expect(Object.isFrozen(first.steps)).toBe(true);
    expect(first.steps.every(Object.isFrozen)).toBe(true);
  });
});

describe('queue validation', () => {
  it('blocks enqueues at the visual capacity', () => {
    expect(validateQueueCapacity(QUEUE_CAPACITY).ok).toBe(false);
    expect(validateQueueCapacity(QUEUE_CAPACITY - 1).ok).toBe(true);
  });
});
