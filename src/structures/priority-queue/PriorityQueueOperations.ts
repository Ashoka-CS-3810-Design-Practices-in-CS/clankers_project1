import { StepRecorder } from '../../domain/StepRecorder';
import type { ComplexityInfo, OperationResult } from '../../domain/visualization';
import {
  PriorityQueueModel,
  type HeapEvent,
  type PriorityQueueSnapshot,
} from './PriorityQueueModel';

export type PriorityQueueResult = OperationResult<PriorityQueueModel, PriorityQueueSnapshot>;

const COMPLEXITY = {
  insert: {
    time: 'O(log n)',
    space: 'O(1)',
    explanation:
      'The new item starts at the next open leaf and swaps upward at most once per level of the tree.',
  },
  extract: {
    time: 'O(log n)',
    space: 'O(1)',
    explanation:
      'The last item replaces the root and swaps downward with its smaller child at most once per level.',
  },
  peek: {
    time: 'O(1)',
    space: 'O(1)',
    explanation: 'The minimum is always stored at the root, index 0 of the heap array.',
  },
} satisfies Record<string, ComplexityInfo>;

const PSEUDOCODE = {
  insert: [
    'i ← size; heap[i] ← value  // next open leaf',
    'while i > 0:',
    '  p ← parent(i)',
    '  if heap[i] ≥ heap[p]: break',
    '  swap(heap[i], heap[p])',
    '  i ← p',
  ],
  extract: [
    'if size = 0: report underflow',
    'min ← heap[0]',
    'heap[0] ← heap[last]; remove last',
    'i ← 0',
    'while i has a child:',
    '  c ← smaller child of i',
    '  if heap[i] ≤ heap[c]: break',
    '  swap(heap[i], heap[c]); i ← c',
    'return min',
  ],
  peek: ['if size = 0: report underflow', 'return heap[0]'],
} satisfies Record<string, readonly string[]>;

export class PriorityQueueOperations {
  insert(model: PriorityQueueModel, value: number): PriorityQueueResult {
    const working = model.clone();
    const recorder = new StepRecorder<PriorityQueueSnapshot>();
    const visited: string[] = [];

    recorder.record({
      message: working.isEmpty()
        ? `The heap is empty, so ${value} will become the root.`
        : `Prepare to add ${value} at the next open position so the tree stays complete.`,
      snapshot: working.snapshot(),
      line: 1,
    });

    working.insert(value, (event: HeapEvent) => {
      switch (event.kind) {
        case 'placed':
          visited.push(event.item.id);
          recorder.record({
            message: `${event.item.value} is placed at index ${event.index}, the next open leaf.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.item.id],
            visitedNodeIds: visited,
            line: 1,
          });
          break;
        case 'compare':
          recorder.record({
            message: event.willSwap
              ? `Compare ${event.item.value} with its parent ${event.other.value}: the child is smaller, so they must swap.`
              : `Compare ${event.item.value} with its parent ${event.other.value}: the parent is not larger, so heap order holds.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.item.id],
            visitedNodeIds: visited,
            matchedNodeIds: [event.other.id],
            line: 4,
          });
          break;
        case 'swap':
          recorder.record({
            message: `${event.item.value} swaps upward with ${event.other.value}.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.item.id],
            visitedNodeIds: visited,
            line: 5,
          });
          break;
        case 'settled':
          recorder.record({
            message: `${event.item.value} is at the root, so it is now the highest-priority item.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.item.id],
            visitedNodeIds: visited,
            line: 2,
          });
          break;
        default:
          break;
      }
    });

    return this.result(
      working,
      recorder,
      'success',
      COMPLEXITY.insert,
      'Insert',
      PSEUDOCODE.insert,
    );
  }

  extractMin(model: PriorityQueueModel): PriorityQueueResult {
    const working = model.clone();
    const recorder = new StepRecorder<PriorityQueueSnapshot>();
    const root = working.peekMin();

    if (!root) {
      recorder.record({
        message: 'The priority queue is empty, so there is no minimum to remove.',
        snapshot: working.snapshot(),
        line: 1,
      });
      return this.result(
        working,
        recorder,
        'blocked',
        COMPLEXITY.extract,
        'Extract min',
        PSEUDOCODE.extract,
      );
    }

    recorder.record({
      message: `${root.value} is at the root, so it has the highest priority and leaves first.`,
      snapshot: working.snapshot(),
      activeNodeIds: [root.id],
      matchedNodeIds: [root.id],
      line: 2,
    });

    const visited: string[] = [];
    const output = [root.value];

    working.extractMin((event: HeapEvent) => {
      switch (event.kind) {
        case 'replaced-root':
          visited.push(event.moved.id);
          recorder.record({
            message: `Remove ${event.removed.value} and move the last item, ${event.moved.value}, into the root.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.moved.id],
            visitedNodeIds: visited,
            output,
            line: 3,
          });
          break;
        case 'compare':
          recorder.record({
            message: event.willSwap
              ? `Compare ${event.item.value} with its smaller child ${event.other.value}: the child is smaller, so they must swap.`
              : `Compare ${event.item.value} with its smaller child ${event.other.value}: the parent is not larger, so heap order is restored.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.item.id],
            visitedNodeIds: visited,
            matchedNodeIds: [event.other.id],
            output,
            line: 7,
          });
          break;
        case 'swap':
          recorder.record({
            message: `${event.item.value} swaps downward with ${event.other.value}.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.item.id],
            visitedNodeIds: visited,
            output,
            line: 8,
          });
          break;
        case 'settled':
          recorder.record({
            message: `${event.item.value} has no children left to compare, so heap order is restored.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.item.id],
            visitedNodeIds: visited,
            output,
            line: 5,
          });
          break;
        default:
          break;
      }
    });

    if (working.isEmpty()) {
      recorder.record({
        message: `${root.value} was the only item. The priority queue is now empty.`,
        snapshot: working.snapshot(),
        output,
        line: 9,
      });
    }

    return this.result(
      working,
      recorder,
      'success',
      COMPLEXITY.extract,
      'Extract min',
      PSEUDOCODE.extract,
    );
  }

  peekMin(model: PriorityQueueModel): PriorityQueueResult {
    const working = model.clone();
    const recorder = new StepRecorder<PriorityQueueSnapshot>();
    const root = working.peekMin();

    if (!root) {
      recorder.record({
        message: 'The priority queue is empty, so there is no minimum to inspect.',
        snapshot: working.snapshot(),
        line: 1,
      });
      return this.result(
        working,
        recorder,
        'blocked',
        COMPLEXITY.peek,
        'Peek min',
        PSEUDOCODE.peek,
      );
    }

    recorder.record({
      message: 'Read the root without removing it.',
      snapshot: working.snapshot(),
      line: 1,
    });
    recorder.record({
      message: `${root.value} is the minimum. The heap remains unchanged.`,
      snapshot: working.snapshot(),
      activeNodeIds: [root.id],
      matchedNodeIds: [root.id],
      output: [root.value],
      line: 2,
    });
    return this.result(working, recorder, 'success', COMPLEXITY.peek, 'Peek min', PSEUDOCODE.peek);
  }

  private result(
    model: PriorityQueueModel,
    recorder: StepRecorder<PriorityQueueSnapshot>,
    status: PriorityQueueResult['status'],
    complexity: ComplexityInfo,
    operationLabel: string,
    pseudocode: readonly string[],
  ): PriorityQueueResult {
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
