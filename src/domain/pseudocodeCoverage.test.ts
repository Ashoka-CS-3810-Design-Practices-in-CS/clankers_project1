import { describe, expect, it } from 'vitest';
import type { OperationResult } from './visualization';
import { BstModel } from '../structures/bst/BstModel';
import { BstOperations } from '../structures/bst/BstOperations';
import { GraphModel } from '../structures/graph/GraphModel';
import { GraphOperations } from '../structures/graph/GraphOperations';
import { LinkedListModel } from '../structures/linked-list/LinkedListModel';
import { LinkedListOperations } from '../structures/linked-list/LinkedListOperations';
import { PriorityQueueModel } from '../structures/priority-queue/PriorityQueueModel';
import { PriorityQueueOperations } from '../structures/priority-queue/PriorityQueueOperations';
import { QueueModel } from '../structures/queue/QueueModel';
import { QueueOperations } from '../structures/queue/QueueOperations';
import { StackModel } from '../structures/stack/StackModel';
import { StackOperations } from '../structures/stack/StackOperations';

const list = new LinkedListOperations();
const stack = new StackOperations();
const queue = new QueueOperations();
const bst = new BstOperations();
const heap = new PriorityQueueOperations();
const graph = new GraphOperations();

/** Every operation, on sample data and (where it applies) on an empty structure. */
const traces: Record<string, () => OperationResult<unknown, unknown>> = {
  'list insert head': () => list.insertHead(LinkedListModel.sample(), 1),
  'list insert head (empty)': () => list.insertHead(new LinkedListModel(), 1),
  'list insert tail': () => list.insertTail(LinkedListModel.sample(), 1),
  'list insert tail (empty)': () => list.insertTail(new LinkedListModel(), 1),
  'list search hit': () => list.search(LinkedListModel.sample(), 21),
  'list search miss': () => list.search(LinkedListModel.sample(), 99),
  'list delete head': () => list.deleteFirstMatch(LinkedListModel.sample(), 8),
  'list delete middle': () => list.deleteFirstMatch(LinkedListModel.sample(), 21),
  'list delete miss': () => list.deleteFirstMatch(LinkedListModel.sample(), 99),
  'list traverse': () => list.traverse(LinkedListModel.sample()),
  'stack push': () => stack.push(StackModel.sample(), 5),
  'stack pop': () => stack.pop(StackModel.sample()),
  'stack pop (empty)': () => stack.pop(new StackModel()),
  'stack peek': () => stack.peek(StackModel.sample()),
  'stack peek (empty)': () => stack.peek(new StackModel()),
  'stack inspect': () => stack.inspect(StackModel.sample()),
  'queue enqueue': () => queue.enqueue(QueueModel.sample(), 5),
  'queue dequeue': () => queue.dequeue(QueueModel.sample()),
  'queue dequeue (empty)': () => queue.dequeue(new QueueModel()),
  'queue peek': () => queue.peek(QueueModel.sample()),
  'queue inspect': () => queue.inspect(QueueModel.sample()),
  'bst insert left': () => bst.insert(BstModel.sample(), 25),
  'bst insert right': () => bst.insert(BstModel.sample(), 65),
  'bst insert duplicate': () => bst.insert(BstModel.sample(), 30),
  'bst insert (empty)': () => bst.insert(new BstModel(), 30),
  'bst search hit': () => bst.search(BstModel.sample(), 60),
  'bst search miss': () => bst.search(BstModel.sample(), 65),
  'bst delete two children': () => bst.delete(BstModel.sample(), 50),
  'bst delete leaf': () => bst.delete(BstModel.sample(), 20),
  'bst delete one child': () => bst.delete(BstModel.fromValues([50, 30, 20]), 30),
  'bst delete duplicate': () => bst.delete(BstModel.fromValues([50, 30, 30]), 30),
  'bst delete miss': () => bst.delete(BstModel.sample(), 99),
  'bst inorder': () => bst.traverse(BstModel.sample(), 'inorder'),
  'bst preorder': () => bst.traverse(BstModel.sample(), 'preorder'),
  'bst postorder': () => bst.traverse(BstModel.sample(), 'postorder'),
  'heap insert to root': () => heap.insert(PriorityQueueModel.sample(), -2),
  'heap insert stops early': () => heap.insert(PriorityQueueModel.sample(), 4),
  'heap insert (empty)': () => heap.insert(new PriorityQueueModel(), 4),
  'heap extract': () => heap.extractMin(PriorityQueueModel.sample()),
  'heap extract single': () => heap.extractMin(PriorityQueueModel.fromValues([1])),
  'heap extract (empty)': () => heap.extractMin(new PriorityQueueModel()),
  'heap peek': () => heap.peekMin(PriorityQueueModel.sample()),
  'graph add vertex': () => graph.addVertex(GraphModel.sample(), 9),
  'graph remove vertex': () => graph.removeVertex(GraphModel.sample(), 4),
  'graph add edge': () => graph.addEdge(GraphModel.sample(), 1, 6),
  'graph remove edge': () => graph.removeEdge(GraphModel.sample(), 1, 2),
  'graph bfs': () => graph.bfs(GraphModel.sample(), 1),
  'graph dfs': () => graph.dfs(GraphModel.sample(), 1),
};

describe('pseudocode coverage', () => {
  it.each(Object.entries(traces))('%s: every step points at a pseudocode line', (_, run) => {
    const result = run();
    expect(result.pseudocode?.length).toBeGreaterThan(0);
    expect(result.pseudocode!.length).toBeLessThanOrEqual(10);
    for (const step of result.steps) {
      expect(step.line, step.message).toBeGreaterThanOrEqual(1);
      expect(step.line, step.message).toBeLessThanOrEqual(result.pseudocode!.length);
    }
  });

  it('highlights the branch that actually ran', () => {
    const lines = (result: OperationResult<unknown, unknown>) => result.steps.map((s) => s.line);
    expect(lines(bst.insert(BstModel.sample(), 65))).toEqual([2, 8, 5, 8, 9]);
    expect(lines(bst.delete(BstModel.sample(), 50)).at(-1)).toBe(7);
    expect(lines(heap.insert(PriorityQueueModel.sample(), -2))).toEqual([1, 1, 4, 5, 4, 5, 2]);
    expect(lines(list.deleteFirstMatch(LinkedListModel.sample(), 8)).at(-1)).toBe(5);
  });
});
