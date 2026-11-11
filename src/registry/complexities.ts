import type { ComplexityInfo } from '../domain/visualization';
import { BST_COMPLEXITY } from '../structures/bst/BstOperations';
import { GRAPH_COMPLEXITY } from '../structures/graph/GraphOperations';
import { LINKED_LIST_COMPLEXITY } from '../structures/linked-list/LinkedListOperations';
import { PRIORITY_QUEUE_COMPLEXITY } from '../structures/priority-queue/PriorityQueueOperations';
import { QUEUE_COMPLEXITY } from '../structures/queue/QueueOperations';
import { STACK_COMPLEXITY } from '../structures/stack/StackOperations';
import type { AvailableStructureId } from '../App';

export interface ComplexityRow {
  /** The operation as its button is labelled in the workspace. */
  readonly operation: string;
  readonly complexity: ComplexityInfo;
}

export interface StructureComplexities {
  readonly id: AvailableStructureId;
  readonly label: string;
  /** What n (or V and E) counts for this structure. */
  readonly sizeNote: string;
  readonly rows: readonly ComplexityRow[];
}

/**
 * Every operation's worst-case cost, read from the same constants each operation
 * attaches to its trace, so the reference page cannot disagree with playback.
 */
export const COMPLEXITY_TABLE: readonly StructureComplexities[] = Object.freeze([
  {
    id: 'linked-list',
    label: 'Linked List',
    sizeNote: 'n = number of nodes',
    rows: [
      { operation: 'Insert head', complexity: LINKED_LIST_COMPLEXITY.insertHead },
      { operation: 'Insert tail', complexity: LINKED_LIST_COMPLEXITY.insertTail },
      { operation: 'Search', complexity: LINKED_LIST_COMPLEXITY.search },
      { operation: 'Delete first', complexity: LINKED_LIST_COMPLEXITY.delete },
      { operation: 'Traverse', complexity: LINKED_LIST_COMPLEXITY.traverse },
    ],
  },
  {
    id: 'stack',
    label: 'Stack',
    sizeNote: 'n = number of items',
    rows: [
      { operation: 'Push', complexity: STACK_COMPLEXITY.push },
      { operation: 'Pop', complexity: STACK_COMPLEXITY.pop },
      { operation: 'Peek', complexity: STACK_COMPLEXITY.peek },
      { operation: 'Inspect all', complexity: STACK_COMPLEXITY.inspect },
    ],
  },
  {
    id: 'queue',
    label: 'Queue',
    sizeNote: 'n = number of items',
    rows: [
      { operation: 'Enqueue', complexity: QUEUE_COMPLEXITY.enqueue },
      { operation: 'Dequeue', complexity: QUEUE_COMPLEXITY.dequeue },
      { operation: 'Peek front', complexity: QUEUE_COMPLEXITY.peek },
      { operation: 'Inspect all', complexity: QUEUE_COMPLEXITY.inspect },
    ],
  },
  {
    id: 'bst',
    label: 'Binary Search Tree',
    sizeNote: 'n = number of nodes; the tree is not self-balancing',
    rows: [
      { operation: 'Insert', complexity: BST_COMPLEXITY.insert },
      { operation: 'Search', complexity: BST_COMPLEXITY.search },
      { operation: 'Delete', complexity: BST_COMPLEXITY.delete },
      { operation: 'Inorder, Preorder, Postorder', complexity: BST_COMPLEXITY.traverse },
    ],
  },
  {
    id: 'priority-queue',
    label: 'Priority Queue',
    sizeNote: 'n = number of items in the binary min-heap',
    rows: [
      { operation: 'Insert', complexity: PRIORITY_QUEUE_COMPLEXITY.insert },
      { operation: 'Extract min', complexity: PRIORITY_QUEUE_COMPLEXITY.extract },
      { operation: 'Peek min', complexity: PRIORITY_QUEUE_COMPLEXITY.peek },
    ],
  },
  {
    id: 'graph',
    label: 'Graph',
    sizeNote: 'V = vertices, E = edges; adjacency lists sorted by label',
    rows: [
      { operation: 'Add vertex', complexity: GRAPH_COMPLEXITY.addVertex },
      { operation: 'Remove vertex', complexity: GRAPH_COMPLEXITY.removeVertex },
      { operation: 'Add edge', complexity: GRAPH_COMPLEXITY.addEdge },
      { operation: 'Remove edge', complexity: GRAPH_COMPLEXITY.removeEdge },
      { operation: 'BFS', complexity: GRAPH_COMPLEXITY.bfs },
      { operation: 'DFS', complexity: GRAPH_COMPLEXITY.dfs },
    ],
  },
]);
