import type { OperationResult } from '../domain/visualization';
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

export interface WorstCase {
  readonly name: string;
  readonly run: () => OperationResult<unknown, unknown>;
}

const range = (count: number, start = 1) => Array.from({ length: count }, (_, i) => start + i);

/** Complete graph on n vertices: every pair connected, n(n - 1) / 2 edges. */
function completeGraph(n: number): GraphModel {
  const labels = range(n);
  const edges: [number, number][] = [];
  labels.forEach((a) => labels.filter((b) => b > a).forEach((b) => edges.push([a, b])));
  return GraphModel.fromEdges(labels, edges);
}

/**
 * The most expensive trace each structure can produce at its interface limit.
 * Models are built once, outside the timed call, so only trace generation is measured.
 */
export function worstCases(): readonly WorstCase[] {
  const list = LinkedListModel.fromValues(range(49));
  const stack = StackModel.fromValues(range(50));
  const queue = QueueModel.fromValues(range(50));
  const skewedTree = BstModel.fromValues(range(30));
  const fullTree = BstModel.fromValues(range(31));
  const heap = PriorityQueueModel.fromValues(range(49, 100));
  const fullHeap = PriorityQueueModel.fromValues(range(50, 100));
  const k12 = completeGraph(12);

  const listOps = new LinkedListOperations();
  const stackOps = new StackOperations();
  const queueOps = new QueueOperations();
  const bstOps = new BstOperations();
  const heapOps = new PriorityQueueOperations();
  const graphOps = new GraphOperations();

  return [
    { name: 'Linked List: insert tail at 49 nodes', run: () => listOps.insertTail(list, 50) },
    { name: 'Linked List: traverse 49 nodes', run: () => listOps.traverse(list) },
    { name: 'Stack: inspect all 50 items', run: () => stackOps.inspect(stack) },
    { name: 'Queue: inspect all 50 items', run: () => queueOps.inspect(queue) },
    { name: 'BST: insert into 30-node skewed tree', run: () => bstOps.insert(skewedTree, 31) },
    {
      name: 'BST: inorder traversal of 31 nodes',
      run: () => bstOps.traverse(fullTree, 'inorder'),
    },
    { name: 'Priority Queue: insert new minimum at 49', run: () => heapOps.insert(heap, -1) },
    { name: 'Priority Queue: extract min at 50', run: () => heapOps.extractMin(fullHeap) },
    { name: 'Graph: BFS on complete graph K12', run: () => graphOps.bfs(k12, 1) },
    { name: 'Graph: DFS on complete graph K12', run: () => graphOps.dfs(k12, 1) },
  ];
}

/** Total number of entries held in every array of a snapshot (items, nodes, vertices, edges). */
export function snapshotEntries(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length + value.reduce((sum: number, item) => sum + snapshotEntries(item), 0);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).reduce((sum: number, item) => sum + snapshotEntries(item), 0);
  }
  return 0;
}
