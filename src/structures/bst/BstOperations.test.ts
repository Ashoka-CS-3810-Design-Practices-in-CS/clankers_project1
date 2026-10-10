import { describe, expect, it } from 'vitest';
import { BST_CAPACITY, BstModel } from './BstModel';
import { BstOperations } from './BstOperations';
import { validateBstCapacity } from './bstValidation';

const operations = new BstOperations();

describe('BstModel', () => {
  it('builds an ordered tree and keeps stable ids while cloning', () => {
    const model = BstModel.fromValues([50, 30, 70, 60]);
    const original = model.snapshot();
    const clone = model.clone();
    clone.insert(80);

    expect(clone.traverse('inorder').map((node) => node.value)).toEqual([30, 50, 60, 70, 80]);
    expect(
      clone
        .snapshot()
        .nodes.slice(0, 4)
        .map((node) => node.id),
    ).toEqual(original.nodes.map((node) => node.id));
  });

  it('stores duplicate values as a count on one node', () => {
    const model = BstModel.fromValues([50, 30, 50, 50]);
    expect(model.size()).toBe(2);
    expect(model.pathTo(50).at(-1)).toMatchObject({ value: 50, count: 3 });

    const firstDeletion = model.delete(50);
    expect(firstDeletion.decremented).toBe(true);
    expect(model.pathTo(50).at(-1)?.count).toBe(2);
  });

  it('deletes leaf, one-child, and two-child nodes without breaking ordering', () => {
    const leafTree = BstModel.fromValues([50, 30, 70]);
    leafTree.delete(30);
    expect(leafTree.traverse('inorder').map((node) => node.value)).toEqual([50, 70]);

    const oneChildTree = BstModel.fromValues([50, 30, 20]);
    oneChildTree.delete(30);
    expect(oneChildTree.traverse('inorder').map((node) => node.value)).toEqual([20, 50]);

    const twoChildTree = BstModel.fromValues([50, 30, 70, 60, 80]);
    const successorId = twoChildTree.pathTo(60).at(-1)?.id;
    twoChildTree.delete(50);
    expect(twoChildTree.snapshot().rootId).toBe(successorId);
    expect(twoChildTree.traverse('inorder').map((node) => node.value)).toEqual([30, 60, 70, 80]);
  });

  it('returns deeply immutable snapshots', () => {
    const snapshot = BstModel.fromValues([2, 1, 3]).snapshot();
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.nodes)).toBe(true);
    expect(snapshot.nodes.every(Object.isFrozen)).toBe(true);
  });
});

describe('BstOperations', () => {
  it('records ordered insert comparisons and worst-case complexity', () => {
    const result = operations.insert(BstModel.fromValues([50, 30, 70]), 40);
    expect(result.model.traverse('inorder').map((node) => node.value)).toEqual([30, 40, 50, 70]);
    expect(result.steps.some((step) => step.message.includes('Continue left'))).toBe(true);
    expect(result.complexity).toMatchObject({ time: 'O(n)', space: 'O(1)' });
  });

  it('searches for a matching value and reports a missing value', () => {
    const model = BstModel.fromValues([50, 30, 70, 60]);
    const found = operations.search(model, 60);
    expect(found.status).toBe('success');
    expect(found.steps.at(-1)?.matchedNodeIds).toEqual([model.pathTo(60).at(-1)?.id]);
    expect(found.steps.at(-1)?.output).toEqual([60]);

    const missing = operations.search(model, 65);
    expect(missing.status).toBe('not-found');
    expect(missing.steps.at(-1)?.message).toContain('not in the tree');
  });

  it('deletes only one occurrence before removing a duplicate node', () => {
    const model = BstModel.fromValues([50, 30, 70, 30]);
    const decremented = operations.delete(model, 30);
    expect(decremented.model.pathTo(30).at(-1)?.count).toBe(1);
    const removed = operations.delete(decremented.model, 30);
    expect(removed.model.has(30)).toBe(false);
  });

  it('leaves the tree unchanged when delete cannot find the value', () => {
    const model = BstModel.fromValues([2, 1, 3]);
    const result = operations.delete(model, 9);
    expect(result.status).toBe('not-found');
    expect(result.model.snapshot()).toEqual(model.snapshot());
  });

  it('produces inorder, preorder, and postorder output including duplicates', () => {
    const model = BstModel.fromValues([4, 2, 6, 1, 3, 5, 7, 3]);
    expect(operations.traverse(model, 'inorder').steps.at(-1)?.output).toEqual([
      1, 2, 3, 3, 4, 5, 6, 7,
    ]);
    expect(operations.traverse(model, 'preorder').steps.at(-1)?.output).toEqual([
      4, 2, 1, 3, 3, 6, 5, 7,
    ]);
    expect(operations.traverse(model, 'postorder').steps.at(-1)?.output).toEqual([
      1, 3, 3, 2, 5, 7, 6, 4,
    ]);
  });

  it('handles empty operations and creates deterministic immutable logs', () => {
    const model = new BstModel();
    expect(operations.search(model, 1).status).toBe('not-found');
    expect(operations.delete(model, 1).status).toBe('not-found');
    expect(operations.traverse(model, 'inorder').steps.at(-1)?.output).toEqual([]);

    const first = operations.search(BstModel.fromValues([2, 1, 3]), 3);
    const second = operations.search(BstModel.fromValues([2, 1, 3]), 3);
    expect(first.steps).toEqual(second.steps);
    expect(Object.isFrozen(first.steps)).toBe(true);
    expect(first.steps.every(Object.isFrozen)).toBe(true);
  });
});

describe('BST validation', () => {
  it('blocks a new distinct node at capacity but permits a duplicate count', () => {
    expect(validateBstCapacity(BST_CAPACITY, false).ok).toBe(false);
    expect(validateBstCapacity(BST_CAPACITY, true).ok).toBe(true);
    expect(validateBstCapacity(BST_CAPACITY - 1, false).ok).toBe(true);
  });
});
