import { linkedListCode } from './LinkedListPseudocode';
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

export class LinkedListOperations {
  insertHead(model: LinkedListModel, value: number): LinkedListResult {
    const working = model.clone();
    const recorder = new StepRecorder<LinkedListSnapshot>(linkedListCode.insertHead);
    recorder.record({
      pseudocodeLineId: 'head.prepare',
      message: `Prepare to insert ${value} before the current head.`,
      snapshot: working.snapshot(),
    });
    const inserted = working.insertFirst(value);
    recorder.record({
      pseudocodeLineId: 'head.link',
      message: `${value} is now the head. Its next reference points to the previous first node.`,
      snapshot: working.snapshot(),
      activeNodeIds: [inserted.id],
      visitedNodeIds: [inserted.id],
    });
    return this.result(working, recorder, 'success', COMPLEXITY.insertHead, 'Insert at head');
  }

  insertTail(model: LinkedListModel, value: number): LinkedListResult {
    const working = model.clone();
    const recorder = new StepRecorder<LinkedListSnapshot>(linkedListCode.insertTail);
    const existing = working.items();
    const visited: string[] = [];
    recorder.record({
      pseudocodeLineId: 'tail.start',
      message: `Find the final node before appending ${value}.`,
      snapshot: working.snapshot(),
    });

    existing.forEach((item) => {
      visited.push(item.id);
      recorder.record({
        pseudocodeLineId: 'tail.walk',
        message:
          item === existing.at(-1)
            ? `${item.value} is the current tail.`
            : `${item.value} has a next node. Continue.`,
        snapshot: working.snapshot(),
        activeNodeIds: [item.id],
        visitedNodeIds: visited,
      });
    });

    const inserted = working.insertLast(value);
    recorder.record({
      pseudocodeLineId: 'tail.link',
      message:
        existing.length === 0
          ? `${value} becomes the head and tail.`
          : `Link the previous tail to ${value}.`,
      snapshot: working.snapshot(),
      activeNodeIds: [inserted.id],
      visitedNodeIds: [...visited, inserted.id],
    });
    return this.result(working, recorder, 'success', COMPLEXITY.insertTail, 'Insert at tail');
  }

  search(model: LinkedListModel, value: number): LinkedListResult {
    const working = model.clone();
    const recorder = new StepRecorder<LinkedListSnapshot>(linkedListCode.search);
    const visited: string[] = [];
    const items = working.items();
    recorder.record({
      pseudocodeLineId: 'search.start',
      message: `Search from the head for the first node containing ${value}.`,
      snapshot: working.snapshot(),
    });

    for (const item of items) {
      visited.push(item.id);
      const matched = item.value === value;
      recorder.record({
        pseudocodeLineId: matched ? 'search.found' : 'search.compare',
        message: matched
          ? `Found ${value}. The search stops at the first match.`
          : `${item.value} does not match ${value}.`,
        snapshot: working.snapshot(),
        activeNodeIds: [item.id],
        visitedNodeIds: visited,
        matchedNodeIds: matched ? [item.id] : [],
      });
      if (matched) {
        return this.result(working, recorder, 'success', COMPLEXITY.search, 'Search');
      }
    }

    recorder.record({
      pseudocodeLineId: 'search.missing',
      message: `No node contains ${value}. The list is unchanged.`,
      snapshot: working.snapshot(),
      visitedNodeIds: visited,
    });
    return this.result(working, recorder, 'not-found', COMPLEXITY.search, 'Search');
  }

  deleteFirstMatch(model: LinkedListModel, value: number): LinkedListResult {
    const working = model.clone();
    const recorder = new StepRecorder<LinkedListSnapshot>(linkedListCode.deleteFirstMatch);
    const visited: string[] = [];
    const items = working.items();
    recorder.record({
      pseudocodeLineId: 'delete.start',
      message: `Locate the first node containing ${value}.`,
      snapshot: working.snapshot(),
    });

    for (const [index, item] of items.entries()) {
      visited.push(item.id);
      const matched = item.value === value;
      recorder.record({
        pseudocodeLineId: matched ? 'delete.found' : 'delete.compare',
        message: matched
          ? `Found ${value}. Redirect the previous link around this node.`
          : `${item.value} is not the target.`,
        snapshot: working.snapshot(),
        activeNodeIds: [item.id],
        visitedNodeIds: visited,
        matchedNodeIds: matched ? [item.id] : [],
      });
      if (matched) {
        working.removeAt(index);
        recorder.record({
          pseudocodeLineId: 'delete.unlink',
          message: `${value} was removed. The remaining nodes stay in order.`,
          snapshot: working.snapshot(),
          visitedNodeIds: visited.filter((id) => id !== item.id),
        });
        return this.result(working, recorder, 'success', COMPLEXITY.delete, 'Delete first match');
      }
    }

    recorder.record({
      pseudocodeLineId: 'delete.missing',
      message: `No node contains ${value}, so nothing was removed.`,
      snapshot: working.snapshot(),
      visitedNodeIds: visited,
    });
    return this.result(working, recorder, 'not-found', COMPLEXITY.delete, 'Delete first match');
  }

  traverse(model: LinkedListModel): LinkedListResult {
    const working = model.clone();
    const recorder = new StepRecorder<LinkedListSnapshot>(linkedListCode.traverse);
    const visited: string[] = [];
    const output: number[] = [];
    const items = working.items();
    recorder.record({
      pseudocodeLineId: 'traverse.start',
      message: 'Begin at the head and follow each next reference.',
      snapshot: working.snapshot(),
    });

    items.forEach((item) => {
      visited.push(item.id);
      output.push(item.value);
      recorder.record({
        pseudocodeLineId: 'traverse.visit',
        message: `Visit ${item.value} and append it to the traversal output.`,
        snapshot: working.snapshot(),
        activeNodeIds: [item.id],
        visitedNodeIds: visited,
        output,
      });
    });

    recorder.record({
      pseudocodeLineId: 'traverse.done',
      message:
        items.length === 0
          ? 'The list is empty, so traversal finishes immediately.'
          : 'The final next reference is null. Traversal is complete.',
      snapshot: working.snapshot(),
      visitedNodeIds: visited,
      output,
    });
    return this.result(working, recorder, 'success', COMPLEXITY.traverse, 'Traverse');
  }

  private result(
    model: LinkedListModel,
    recorder: StepRecorder<LinkedListSnapshot>,
    status: LinkedListResult['status'],
    complexity: ComplexityInfo,
    operationLabel: string,
  ): LinkedListResult {
    return Object.freeze({
      model,
      steps: recorder.steps(),
      pseudocode: recorder.pseudocode,
      status,
      complexity: Object.freeze({ ...complexity }),
      operationLabel,
    });
  }
}
