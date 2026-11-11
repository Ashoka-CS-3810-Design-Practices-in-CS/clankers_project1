import { heapCode } from './PriorityQueuePseudocode';
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

export class PriorityQueueOperations {
  insert(model: PriorityQueueModel, value: number): PriorityQueueResult {
    const working = model.clone();
    const recorder = new StepRecorder<PriorityQueueSnapshot>(heapCode.insert);
    const visited: string[] = [];

    recorder.record({
      pseudocodeLineId: 'insert.start',
      message: working.isEmpty()
        ? `The heap is empty, so ${value} will become the root.`
        : `Prepare to add ${value} at the next open position so the tree stays complete.`,
      snapshot: working.snapshot(),
    });

    working.insert(value, (event: HeapEvent) => {
      switch (event.kind) {
        case 'placed':
          visited.push(event.item.id);
          recorder.record({
            pseudocodeLineId: 'insert.place',
            message: `${event.item.value} is placed at index ${event.index}, the next open leaf.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.item.id],
            visitedNodeIds: visited,
          });
          break;
        case 'compare':
          // Every comparison runs the compare line. When it does not swap, a
          // separate step then runs the stop line, so the highlighted
          // pseudocode always matches what the narration describes.
          recorder.record({
            pseudocodeLineId: 'insert.compare',
            message: event.willSwap
              ? `Compare ${event.item.value} with its parent ${event.other.value}: the child is smaller, so they must swap.`
              : `Compare ${event.item.value} with its parent ${event.other.value}: ${event.item.value} is not smaller, so no swap is needed.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.item.id],
            visitedNodeIds: visited,
            matchedNodeIds: [event.other.id],
          });
          if (!event.willSwap) {
            recorder.record({
              pseudocodeLineId: 'insert.stop',
              message: `The parent ${event.other.value} is not larger than ${event.item.value}, so heap order holds and sift-up stops.`,
              snapshot: working.snapshot(),
              activeNodeIds: [event.item.id],
              visitedNodeIds: visited,
              matchedNodeIds: [event.other.id],
            });
          }
          break;
        case 'swap':
          recorder.record({
            pseudocodeLineId: 'insert.swap',
            message: `${event.item.value} swaps upward with ${event.other.value}.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.item.id],
            visitedNodeIds: visited,
          });
          break;
        case 'settled':
          recorder.record({
            pseudocodeLineId: 'insert.root',
            message: `${event.item.value} is at the root, so it is now the highest-priority item.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.item.id],
            visitedNodeIds: visited,
          });
          break;
        default:
          break;
      }
    });

    return this.result(working, recorder, 'success', COMPLEXITY.insert, 'Insert');
  }

  extractMin(model: PriorityQueueModel): PriorityQueueResult {
    const working = model.clone();
    const recorder = new StepRecorder<PriorityQueueSnapshot>(heapCode.extractMin);
    const root = working.peekMin();

    if (!root) {
      recorder.record({
        pseudocodeLineId: 'extract.empty',
        message: 'The priority queue is empty, so there is no minimum to remove.',
        snapshot: working.snapshot(),
      });
      return this.result(working, recorder, 'blocked', COMPLEXITY.extract, 'Extract min');
    }

    recorder.record({
      pseudocodeLineId: 'extract.read',
      message: `${root.value} is at the root, so it has the highest priority and leaves first.`,
      snapshot: working.snapshot(),
      activeNodeIds: [root.id],
      matchedNodeIds: [root.id],
    });

    const visited: string[] = [];
    const output = [root.value];

    working.extractMin((event: HeapEvent) => {
      switch (event.kind) {
        case 'replaced-root':
          visited.push(event.moved.id);
          recorder.record({
            pseudocodeLineId: 'extract.replace',
            message: `Remove ${event.removed.value} and move the last item, ${event.moved.value}, into the root.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.moved.id],
            visitedNodeIds: visited,
            output,
          });
          break;
        case 'compare':
          // As in insert: compare first, then a separate stop step if no swap.
          recorder.record({
            pseudocodeLineId: 'extract.compare',
            message: event.willSwap
              ? `Compare ${event.item.value} with its smaller child ${event.other.value}: the child is smaller, so they must swap.`
              : `Compare ${event.item.value} with its smaller child ${event.other.value}: ${event.item.value} is not larger, so no swap is needed.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.item.id],
            visitedNodeIds: visited,
            matchedNodeIds: [event.other.id],
            output,
          });
          if (!event.willSwap) {
            recorder.record({
              pseudocodeLineId: 'extract.stop',
              message: `${event.item.value} is no larger than either child, so heap order is restored and sift-down stops.`,
              snapshot: working.snapshot(),
              activeNodeIds: [event.item.id],
              visitedNodeIds: visited,
              matchedNodeIds: [event.other.id],
              output,
            });
          }
          break;
        case 'swap':
          recorder.record({
            pseudocodeLineId: 'extract.swap',
            message: `${event.item.value} swaps downward with ${event.other.value}.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.item.id],
            visitedNodeIds: visited,
            output,
          });
          break;
        case 'settled':
          recorder.record({
            pseudocodeLineId: 'extract.leaf',
            message: `${event.item.value} has no children left to compare, so heap order is restored.`,
            snapshot: working.snapshot(),
            activeNodeIds: [event.item.id],
            visitedNodeIds: visited,
            output,
          });
          break;
        default:
          break;
      }
    });

    if (working.isEmpty()) {
      recorder.record({
        pseudocodeLineId: 'extract.only',
        message: `${root.value} was the only item. The priority queue is now empty.`,
        snapshot: working.snapshot(),
        output,
      });
    }

    return this.result(working, recorder, 'success', COMPLEXITY.extract, 'Extract min');
  }

  peekMin(model: PriorityQueueModel): PriorityQueueResult {
    const working = model.clone();
    const recorder = new StepRecorder<PriorityQueueSnapshot>(heapCode.peekMin);
    const root = working.peekMin();

    if (!root) {
      recorder.record({
        pseudocodeLineId: 'peek.empty',
        message: 'The priority queue is empty, so there is no minimum to inspect.',
        snapshot: working.snapshot(),
      });
      return this.result(working, recorder, 'blocked', COMPLEXITY.peek, 'Peek min');
    }

    recorder.record({
      pseudocodeLineId: 'peek.read',
      message: 'Read the root without removing it.',
      snapshot: working.snapshot(),
    });
    recorder.record({
      pseudocodeLineId: 'peek.return',
      message: `${root.value} is the minimum. The heap remains unchanged.`,
      snapshot: working.snapshot(),
      activeNodeIds: [root.id],
      matchedNodeIds: [root.id],
      output: [root.value],
    });
    return this.result(working, recorder, 'success', COMPLEXITY.peek, 'Peek min');
  }

  private result(
    model: PriorityQueueModel,
    recorder: StepRecorder<PriorityQueueSnapshot>,
    status: PriorityQueueResult['status'],
    complexity: ComplexityInfo,
    operationLabel: string,
  ): PriorityQueueResult {
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
