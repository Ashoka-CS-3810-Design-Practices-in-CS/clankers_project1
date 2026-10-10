import { describe, expect, it } from 'vitest';
import { LinkedListModel, LINKED_LIST_CAPACITY } from './LinkedListModel';
import { LinkedListOperations } from './LinkedListOperations';
import { parseIntegerInput, validateInsertionCapacity } from './linkedListValidation';

const operations = new LinkedListOperations();

describe('LinkedListModel', () => {
  it('keeps stable ids while cloning and adding duplicate values', () => {
    const model = LinkedListModel.fromValues([4, 4]);
    const originalIds = model.items().map((item) => item.id);
    const clone = model.clone();
    const inserted = clone.insertLast(4);

    expect(
      clone
        .items()
        .slice(0, 2)
        .map((item) => item.id),
    ).toEqual(originalIds);
    expect(inserted.id).not.toBe(originalIds[0]);
    expect(new Set(clone.items().map((item) => item.id)).size).toBe(3);
  });

  it('returns deeply immutable snapshots', () => {
    const snapshot = LinkedListModel.fromValues([1, 2]).snapshot();
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.nodes)).toBe(true);
    expect(snapshot.nodes.every(Object.isFrozen)).toBe(true);
  });
});

describe('LinkedListOperations', () => {
  it('inserts at the head in constant time', () => {
    const result = operations.insertHead(LinkedListModel.fromValues([2, 3]), 1);
    expect(result.model.items().map((item) => item.value)).toEqual([1, 2, 3]);
    expect(result.complexity.time).toBe('O(1)');
    expect(result.steps.at(-1)?.activeNodeIds).toEqual([result.model.items()[0].id]);
  });

  it('inserts at the tail after tracing every existing node', () => {
    const result = operations.insertTail(LinkedListModel.fromValues([1, 2]), 3);
    expect(result.model.items().map((item) => item.value)).toEqual([1, 2, 3]);
    expect(result.complexity.time).toBe('O(n)');
    expect(result.steps).toHaveLength(4);
  });

  it('searches for the first duplicate and stops there', () => {
    const model = LinkedListModel.fromValues([5, 8, 5]);
    const result = operations.search(model, 5);
    expect(result.status).toBe('success');
    expect(result.steps.at(-1)?.matchedNodeIds).toEqual([model.items()[0].id]);
    expect(result.steps.at(-1)?.visitedNodeIds).toHaveLength(1);
  });

  it('deletes only the first matching duplicate', () => {
    const result = operations.deleteFirstMatch(LinkedListModel.fromValues([5, 8, 5]), 5);
    expect(result.model.items().map((item) => item.value)).toEqual([8, 5]);
    expect(result.status).toBe('success');
  });

  it('leaves the model unchanged when a target is not found', () => {
    const model = LinkedListModel.fromValues([1, 2]);
    const result = operations.deleteFirstMatch(model, 9);
    expect(result.status).toBe('not-found');
    expect(result.model.snapshot()).toEqual(model.snapshot());
    expect(result.steps.at(-1)?.message).toContain('nothing was removed');
  });

  it('handles empty search and traversal without throwing', () => {
    const model = new LinkedListModel();
    expect(operations.search(model, 1).status).toBe('not-found');
    const traversal = operations.traverse(model);
    expect(traversal.steps.at(-1)?.output).toEqual([]);
    expect(traversal.steps.at(-1)?.message).toContain('empty');
  });

  it('produces traversal values in head-to-tail order', () => {
    const result = operations.traverse(LinkedListModel.fromValues([13, 21, 34]));
    expect(result.steps.at(-1)?.output).toEqual([13, 21, 34]);
    expect(result.complexity).toMatchObject({ time: 'O(n)', space: 'O(n)' });
  });

  it('generates deterministic immutable step logs', () => {
    const first = operations.search(LinkedListModel.fromValues([1, 2]), 2);
    const second = operations.search(LinkedListModel.fromValues([1, 2]), 2);
    expect(first.steps).toEqual(second.steps);
    expect(Object.isFrozen(first.steps)).toBe(true);
    expect(first.steps.every(Object.isFrozen)).toBe(true);
  });
});

describe('linked-list input validation', () => {
  it.each(['', '2.5', 'word', '9007199254740992'])('rejects invalid value %s', (value) => {
    expect(parseIntegerInput(value).ok).toBe(false);
  });

  it('accepts signed safe integers', () => {
    expect(parseIntegerInput('-42')).toEqual({ ok: true, value: -42 });
  });

  it('blocks insertions at the visual capacity', () => {
    expect(validateInsertionCapacity(LINKED_LIST_CAPACITY).ok).toBe(false);
    expect(validateInsertionCapacity(LINKED_LIST_CAPACITY - 1).ok).toBe(true);
  });
});
