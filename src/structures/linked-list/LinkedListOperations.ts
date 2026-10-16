import { StepRecorder } from '../../domain/StepRecorder';
import type { ComplexityInfo, OperationResult } from '../../domain/visualization';
import { LinkedListModel, type LinkedListSnapshot } from './LinkedListModel';

export type LinkedListResult = OperationResult<LinkedListModel, LinkedListSnapshot>;

const COMPLEXITY = {
  insertHead: {
    time: 'O(1)',
    space: 'O(1)',
    explanation: 'The new node is linked directly before the current head.',
  },
  insertTail: {
    time: 'O(n)',
    space: 'O(1)',
    explanation:
      'The selected library walks from the head because it does not store a tail pointer.',
  },
  search: {
    time: 'O(n)',
    space: 'O(1)',
    explanation: 'Nodes are compared from the head until the first match or the end.',
  },
  delete: {
    time: 'O(n)',
    space: 'O(1)',
    explanation: 'The first matching node is located, then one link is changed.',
  },
  traverse: {
    time: 'O(n)',
    space: 'O(n)',
    explanation:
      'Every node is visited and its value is retained in the displayed traversal output.',
  },
} satisfies Record<string, ComplexityInfo>;

const PSEUDOCODE = {
  insertHead: ['node ← new Node(value)', 'node.next ← head', 'head ← node'],
  insertTail: [
    'node ← new Node(value)',
    'if head = null: head ← node; return',
    'current ← head',
    'while current.next ≠ null:',
    '  current ← current.next',
    'current.next ← node',
  ],
  search: [
    'current ← head',
    'while current ≠ null:',
    '  if current.value = target: return current',
    '  current ← current.next',
    'return not found',
  ],
  delete: [
    'prev ← null; current ← head',
    'while current ≠ null and current.value ≠ target:',
    '  prev ← current; current ← current.next',
    'if current = null: return  // not found',
    'if prev = null: head ← current.next',
    'else: prev.next ← current.next',
  ],
  traverse: [
    'current ← head',
    'while current ≠ null:',
    '  output(current.value)',
    '  current ← current.next',
    'return output',
  ],
} satisfies Record<string, readonly string[]>;

export class LinkedListOperations {
  insertHead(model: LinkedListModel, value: number): LinkedListResult {
    const working = model.clone();
    const recorder = new StepRecorder<LinkedListSnapshot>();
    recorder.record({
      message: `Prepare to insert ${value} before the current head.`,
      snapshot: working.snapshot(),
      line: 1,
    });
    const inserted = working.insertFirst(value);
    recorder.record({
      message: `${value} is now the head. Its next reference points to the previous first node.`,
      snapshot: working.snapshot(),
      activeNodeIds: [inserted.id],
      visitedNodeIds: [inserted.id],
      line: 3,
    });
    return this.result(
      working,
      recorder,
      'success',
      COMPLEXITY.insertHead,
      'Insert at head',
      PSEUDOCODE.insertHead,
    );
  }

  insertTail(model: LinkedListModel, value: number): LinkedListResult {
    const working = model.clone();
    const recorder = new StepRecorder<LinkedListSnapshot>();
    const existing = working.items();
    const visited: string[] = [];
    recorder.record({
      message: `Find the final node before appending ${value}.`,
      snapshot: working.snapshot(),
      line: 1,
    });

    existing.forEach((item, index) => {
      visited.push(item.id);
      recorder.record({
        message:
          item === existing.at(-1)
            ? `${item.value} is the current tail.`
            : `${item.value} has a next node. Continue.`,
        snapshot: working.snapshot(),
        activeNodeIds: [item.id],
        visitedNodeIds: visited,
        line: index === 0 ? 3 : 5,
      });
    });

    const inserted = working.insertLast(value);
    recorder.record({
      message:
        existing.length === 0
          ? `${value} becomes the head and tail.`
          : `Link the previous tail to ${value}.`,
      snapshot: working.snapshot(),
      activeNodeIds: [inserted.id],
      visitedNodeIds: [...visited, inserted.id],
      line: existing.length === 0 ? 2 : 6,
    });
    return this.result(
      working,
      recorder,
      'success',
      COMPLEXITY.insertTail,
      'Insert at tail',
      PSEUDOCODE.insertTail,
    );
  }

  search(model: LinkedListModel, value: number): LinkedListResult {
    const working = model.clone();
    const recorder = new StepRecorder<LinkedListSnapshot>();
    const visited: string[] = [];
    const items = working.items();
    recorder.record({
      message: `Search from the head for the first node containing ${value}.`,
      snapshot: working.snapshot(),
      line: 1,
    });

    for (const item of items) {
      visited.push(item.id);
      const matched = item.value === value;
      recorder.record({
        message: matched
          ? `Found ${value}. The search stops at the first match.`
          : `${item.value} does not match ${value}.`,
        snapshot: working.snapshot(),
        activeNodeIds: [item.id],
        visitedNodeIds: visited,
        matchedNodeIds: matched ? [item.id] : [],
        line: 3,
      });
      if (matched) {
        return this.result(
          working,
          recorder,
          'success',
          COMPLEXITY.search,
          'Search',
          PSEUDOCODE.search,
        );
      }
    }

    recorder.record({
      message: `No node contains ${value}. The list is unchanged.`,
      snapshot: working.snapshot(),
      visitedNodeIds: visited,
      line: 5,
    });
    return this.result(
      working,
      recorder,
      'not-found',
      COMPLEXITY.search,
      'Search',
      PSEUDOCODE.search,
    );
  }

  deleteFirstMatch(model: LinkedListModel, value: number): LinkedListResult {
    const working = model.clone();
    const recorder = new StepRecorder<LinkedListSnapshot>();
    const visited: string[] = [];
    const items = working.items();
    recorder.record({
      message: `Locate the first node containing ${value}.`,
      snapshot: working.snapshot(),
      line: 1,
    });

    for (const [index, item] of items.entries()) {
      visited.push(item.id);
      const matched = item.value === value;
      recorder.record({
        message: matched
          ? `Found ${value}. Redirect the previous link around this node.`
          : `${item.value} is not the target.`,
        snapshot: working.snapshot(),
        activeNodeIds: [item.id],
        visitedNodeIds: visited,
        matchedNodeIds: matched ? [item.id] : [],
        line: 2,
      });
      if (matched) {
        working.removeAt(index);
        recorder.record({
          message: `${value} was removed. The remaining nodes stay in order.`,
          snapshot: working.snapshot(),
          visitedNodeIds: visited.filter((id) => id !== item.id),
          line: index === 0 ? 5 : 6,
        });
        return this.result(
          working,
          recorder,
          'success',
          COMPLEXITY.delete,
          'Delete first match',
          PSEUDOCODE.delete,
        );
      }
    }

    recorder.record({
      message: `No node contains ${value}, so nothing was removed.`,
      snapshot: working.snapshot(),
      visitedNodeIds: visited,
      line: 4,
    });
    return this.result(
      working,
      recorder,
      'not-found',
      COMPLEXITY.delete,
      'Delete first match',
      PSEUDOCODE.delete,
    );
  }

  traverse(model: LinkedListModel): LinkedListResult {
    const working = model.clone();
    const recorder = new StepRecorder<LinkedListSnapshot>();
    const visited: string[] = [];
    const output: number[] = [];
    const items = working.items();
    recorder.record({
      message: 'Begin at the head and follow each next reference.',
      snapshot: working.snapshot(),
      line: 1,
    });

    items.forEach((item) => {
      visited.push(item.id);
      output.push(item.value);
      recorder.record({
        message: `Visit ${item.value} and append it to the traversal output.`,
        snapshot: working.snapshot(),
        activeNodeIds: [item.id],
        visitedNodeIds: visited,
        output,
        line: 3,
      });
    });

    recorder.record({
      message:
        items.length === 0
          ? 'The list is empty, so traversal finishes immediately.'
          : 'The final next reference is null. Traversal is complete.',
      snapshot: working.snapshot(),
      visitedNodeIds: visited,
      output,
      line: 5,
    });
    return this.result(
      working,
      recorder,
      'success',
      COMPLEXITY.traverse,
      'Traverse',
      PSEUDOCODE.traverse,
    );
  }

  private result(
    model: LinkedListModel,
    recorder: StepRecorder<LinkedListSnapshot>,
    status: LinkedListResult['status'],
    complexity: ComplexityInfo,
    operationLabel: string,
    pseudocode: readonly string[],
  ): LinkedListResult {
    return Object.freeze({
      model,
      steps: recorder.steps(),
      status,
      complexity: Object.freeze({ ...complexity }),
      operationLabel,
      pseudocode: Object.freeze([...pseudocode]),
    });
  }
}
