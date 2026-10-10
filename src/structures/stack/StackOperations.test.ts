import { describe, expect, it } from 'vitest';
import { StackModel, STACK_CAPACITY } from './StackModel';
import { StackOperations } from './StackOperations';
import { validateStackCapacity } from './stackValidation';

const operations = new StackOperations();

describe('StackModel', () => {
  it('keeps stable ids while cloning and pushing duplicate values', () => {
    const model = StackModel.fromValues([4, 4]);
    const originalIds = model.items().map((item) => item.id);
    const clone = model.clone();
    const pushed = clone.push(4);

    expect(
      clone
        .items()
        .slice(0, 2)
        .map((item) => item.id),
    ).toEqual(originalIds);
    expect(pushed.id).not.toBe(originalIds[0]);
    expect(new Set(clone.items().map((item) => item.id)).size).toBe(3);
  });

  it('returns deeply immutable snapshots', () => {
    const snapshot = StackModel.fromValues([1, 2]).snapshot();
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.items)).toBe(true);
    expect(snapshot.items.every(Object.isFrozen)).toBe(true);
  });
});

describe('StackOperations', () => {
  it('pushes a value to the top in constant time', () => {
    const result = operations.push(StackModel.fromValues([1, 2]), 3);
    expect(result.model.items().map((item) => item.value)).toEqual([1, 2, 3]);
    expect(result.complexity).toMatchObject({ time: 'O(1)', space: 'O(1)' });
    expect(result.steps.at(-1)?.activeNodeIds).toEqual([result.model.peek()?.id]);
  });

  it('pops only the top duplicate', () => {
    const result = operations.pop(StackModel.fromValues([5, 8, 5]));
    expect(result.model.items().map((item) => item.value)).toEqual([5, 8]);
    expect(result.steps.at(-1)?.output).toEqual([5]);
  });

  it('peeks without changing the model', () => {
    const model = StackModel.fromValues([5, 8]);
    const result = operations.peek(model);
    expect(result.model.snapshot()).toEqual(model.snapshot());
    expect(result.steps.at(-1)?.output).toEqual([8]);
    expect(result.steps.at(-1)?.matchedNodeIds).toEqual([model.peek()?.id]);
  });

  it('blocks pop and peek on an empty stack', () => {
    const model = new StackModel();
    expect(operations.pop(model).status).toBe('blocked');
    expect(operations.peek(model).status).toBe('blocked');
    expect(operations.pop(model).model.isEmpty()).toBe(true);
  });

  it('inspects values from top to bottom', () => {
    const result = operations.inspect(StackModel.fromValues([13, 21, 34]));
    expect(result.steps.at(-1)?.output).toEqual([34, 21, 13]);
    expect(result.complexity).toMatchObject({ time: 'O(n)', space: 'O(n)' });
  });

  it('generates deterministic immutable step logs', () => {
    const first = operations.inspect(StackModel.fromValues([1, 2]));
    const second = operations.inspect(StackModel.fromValues([1, 2]));
    expect(first.steps).toEqual(second.steps);
    expect(Object.isFrozen(first.steps)).toBe(true);
    expect(first.steps.every(Object.isFrozen)).toBe(true);
  });
});

describe('stack validation', () => {
  it('blocks pushes at the visual capacity', () => {
    expect(validateStackCapacity(STACK_CAPACITY).ok).toBe(false);
    expect(validateStackCapacity(STACK_CAPACITY - 1).ok).toBe(true);
  });
});
