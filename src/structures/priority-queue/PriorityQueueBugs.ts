import { StepRecorder } from '../../domain/StepRecorder';
import type { BugScenario } from '../../practice/bugHunt';
import {
  PriorityQueueModel,
  type HeapItem,
  type PriorityQueueSnapshot,
} from './PriorityQueueModel';
import { PriorityQueueOperations } from './PriorityQueueOperations';

const operations = new PriorityQueueOperations();

function snapshotOf(items: readonly HeapItem[]): PriorityQueueSnapshot {
  return Object.freeze({ items: Object.freeze(items.map((item) => Object.freeze({ ...item }))) });
}

/** Sift-down swaps with the larger child instead of the smaller one. */
const siftDownLargerChild: BugScenario<PriorityQueueModel, PriorityQueueSnapshot> = {
  id: 'heap-sift-down-larger-child',
  setup: 'Extract min from the sample heap [1, 3, 8, 7, 5, 9]',
  explanation:
    'Sift-down picks the larger child, 8, so 8 becomes the root even though its sibling 3 is smaller. The root is no longer the minimum. Sift-down must swap with the smaller child so the item moving up is ≤ its sibling.',
  buggyLine: 6,
  buggyCode: '  c ← larger child of i',
  start: () => PriorityQueueModel.sample(),
  correct: (model) => operations.extractMin(model),
  buggySteps: (_, correct) => {
    // Reuse the removal and the root replacement, then sift down the wrong way.
    const prefix = correct.steps.slice(0, 2);
    const replaced = prefix[1];
    const items = [...replaced.snapshot.items];
    const output = replaced.output;
    const recorder = new StepRecorder<PriorityQueueSnapshot>();
    const moving = items[0];
    const visited = [moving.id];
    let index = 0;
    for (;;) {
      const children = [2 * index + 1, 2 * index + 2].filter((child) => child < items.length);
      if (children.length === 0) {
        recorder.record({
          message: `${moving.value} has no children left to compare, so heap order is restored.`,
          snapshot: snapshotOf(items),
          activeNodeIds: [moving.id],
          visitedNodeIds: visited,
          output,
          line: 5,
        });
        break;
      }
      const child = children.reduce((best, next) =>
        items[next].value > items[best].value ? next : best,
      ); // the bug: larger child
      const swap = items[child].value < moving.value;
      recorder.record({
        message: swap
          ? `Compare ${moving.value} with its child ${items[child].value}: the child is smaller, so they must swap.`
          : `Compare ${moving.value} with its child ${items[child].value}: the parent is not larger, so heap order is restored.`,
        snapshot: snapshotOf(items),
        activeNodeIds: [moving.id],
        visitedNodeIds: visited,
        matchedNodeIds: [items[child].id],
        output,
        line: 7,
      });
      if (!swap) break;
      [items[index], items[child]] = [items[child], items[index]];
      recorder.record({
        message: `${moving.value} swaps downward with ${items[index].value}.`,
        snapshot: snapshotOf(items),
        activeNodeIds: [moving.id],
        visitedNodeIds: visited,
        output,
        line: 8,
      });
      index = child;
    }
    return [...prefix, ...recorder.steps()];
  },
};

/** Sift-up stops after a single swap. */
const siftUpOnce: BugScenario<PriorityQueueModel, PriorityQueueSnapshot> = {
  id: 'heap-sift-up-once',
  setup: 'Insert -2 into the sample heap [1, 3, 8, 7, 5, 9]',
  explanation:
    'Sift-up breaks out after the first swap, so -2 stops below 1 and the root is no longer the minimum. The loop must keep moving up (i ← p) until the parent is not larger or the item reaches the root.',
  buggyLine: 6,
  buggyCode: '  break  // stops after one swap',
  start: () => PriorityQueueModel.sample(),
  correct: (model) => operations.insert(model, -2),
  buggySteps: (_, correct) => {
    const firstSwap = correct.steps.findIndex((step) => step.line === 5);
    const swapStep = correct.steps[firstSwap];
    const recorder = new StepRecorder<PriorityQueueSnapshot>();
    recorder.record({
      message: '-2 has moved up one level, so sift-up stops.',
      snapshot: swapStep.snapshot,
      activeNodeIds: swapStep.activeNodeIds,
      visitedNodeIds: swapStep.visitedNodeIds,
      line: 6,
    });
    return [...correct.steps.slice(0, firstSwap + 1), ...recorder.steps()];
  },
};

export const PRIORITY_QUEUE_BUGS = [siftDownLargerChild, siftUpOnce] as const;
