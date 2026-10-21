import { describe, expect, it } from 'vitest';
import { definePseudocode } from './pseudocode';
import { StepRecorder } from './StepRecorder';
import type { OperationResult } from './visualization';
import { LinkedListModel } from '../structures/linked-list/LinkedListModel';
import { LinkedListOperations } from '../structures/linked-list/LinkedListOperations';
import { StackModel } from '../structures/stack/StackModel';
import { StackOperations } from '../structures/stack/StackOperations';
import { QueueModel } from '../structures/queue/QueueModel';
import { QueueOperations } from '../structures/queue/QueueOperations';
import { BstModel } from '../structures/bst/BstModel';
import { BstOperations } from '../structures/bst/BstOperations';
import { PriorityQueueModel } from '../structures/priority-queue/PriorityQueueModel';
import { PriorityQueueOperations } from '../structures/priority-queue/PriorityQueueOperations';
import { GraphModel } from '../structures/graph/GraphModel';
import { GraphOperations } from '../structures/graph/GraphOperations';

function verify(result: OperationResult<unknown, unknown>) {
  expect(result.pseudocode).toBeDefined();
  expect(Object.isFrozen(result.pseudocode)).toBe(true);
  expect(Object.isFrozen(result.pseudocode?.lines)).toBe(true);
  const ids = result.pseudocode!.lines.map((line) => line.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(result.steps.length).toBeGreaterThan(0);
  for (const step of result.steps) {
    expect(ids).toContain(step.pseudocodeLineId);
    expect(Object.isFrozen(step)).toBe(true);
  }
}

describe('pseudocode trace coverage', () => {
  it.each([{ values: [] }, { values: [8] }, { values: [8, 13, 8, 21] }])(
    'covers all linked list branches for $values',
    ({ values }) => {
      const model = LinkedListModel.fromValues(values);
      const op = new LinkedListOperations();
      [
        op.insertHead(model, -3),
        op.insertTail(model, -3),
        op.traverse(model),
        op.search(model, 8),
        op.search(model, 99),
        op.deleteFirstMatch(model, 8),
        op.deleteFirstMatch(model, 99),
      ].forEach(verify);
      expect(op.search(model, 8).steps).toEqual(op.search(model, 8).steps);
    },
  );

  it('covers empty and populated stack and queue operations', () => {
    const stack = new StackOperations();
    const queue = new QueueOperations();
    for (const model of [new StackModel(), StackModel.sample()]) {
      [stack.push(model, 3), stack.pop(model), stack.peek(model), stack.inspect(model)].forEach(
        verify,
      );
    }
    for (const model of [new QueueModel(), QueueModel.sample()]) {
      [
        queue.enqueue(model, 3),
        queue.dequeue(model),
        queue.peek(model),
        queue.inspect(model),
      ].forEach(verify);
    }
  });

  it('covers BST branches, duplicate counts, deletion cases and traversal orders', () => {
    const op = new BstOperations();
    for (const values of [[], [5], [5, 3], [5, 3, 7, 6], [5, 5, 3]]) {
      const model = BstModel.fromValues(values);
      [
        op.insert(model, 5),
        op.insert(model, 4),
        op.insert(model, 9),
        op.search(model, 3),
        op.search(model, 99),
        op.delete(model, 5),
        op.delete(model, 99),
        ...(['inorder', 'preorder', 'postorder'] as const).map((order) =>
          op.traverse(model, order),
        ),
      ].forEach(verify);
    }
    const ids = [[], [5], [5, 3], [5, 3, 7], [5, 5]].map(
      (values) => op.delete(BstModel.fromValues(values), 5).steps.at(-1)?.pseudocodeLineId,
    );
    expect(ids).toEqual([
      'delete.missing',
      'delete.leaf',
      'delete.child',
      'delete.successor',
      'delete.count',
    ]);
  });

  it('covers heap comparisons, swaps, stops and underflow', () => {
    const op = new PriorityQueueOperations();
    for (const model of [
      new PriorityQueueModel(),
      PriorityQueueModel.fromValues([5]),
      PriorityQueueModel.fromValues([2, 3, 4, 8, 9, 6]),
    ]) {
      [op.insert(model, 1), op.insert(model, 99), op.extractMin(model), op.peekMin(model)].forEach(
        verify,
      );
    }
  });

  it('covers graph editing and cyclic, disconnected and single-vertex traversals', () => {
    const op = new GraphOperations();
    const graph = new GraphModel();
    for (const value of [1, 2, 3, 4]) graph.addVertex(value);
    graph.addEdge(1, 2);
    graph.addEdge(2, 3);
    graph.addEdge(3, 1);
    [
      op.addVertex(graph, 5),
      op.removeVertex(graph, 1),
      op.removeVertex(graph, 4),
      op.addEdge(graph, 3, 4),
      op.removeEdge(graph, 1, 2),
      op.bfs(graph, 1),
      op.dfs(graph, 1),
      op.bfs(graph, 4),
      op.dfs(graph, 4),
    ].forEach(verify);
  });

  it('rejects invalid line references and duplicate semantic IDs', () => {
    const definition = definePseudocode('Example', [['example.start', 'start']]);
    const recorder = new StepRecorder(definition);
    expect(() =>
      recorder.record({ snapshot: {}, message: '', pseudocodeLineId: 'wrong.line' }),
    ).toThrow();
    expect(() =>
      definePseudocode('Bad', [
        ['a.b', 'one'],
        ['a.b', 'two'],
      ]),
    ).toThrow();
  });
});
