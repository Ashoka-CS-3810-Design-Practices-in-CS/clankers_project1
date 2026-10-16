import { StepRecorder } from '../domain/StepRecorder';
import type { VisualizationStep } from '../domain/visualization';
import { QueueModel, type QueueSnapshot } from '../structures/queue/QueueModel';
import { QueueOperations } from '../structures/queue/QueueOperations';
import { StackModel, type StackSnapshot } from '../structures/stack/StackModel';
import { StackOperations } from '../structures/stack/StackOperations';
import type { BugScenario } from './bugHunt';

/**
 * Stack and Queue bugs. Both are "wrong end" bugs, the classic way LIFO and FIFO
 * code goes wrong, so they share one builder.
 */

interface Item {
  readonly id: string;
  readonly value: number;
}

function snapshotOf(items: readonly Item[]) {
  return Object.freeze({ items: Object.freeze(items.map((item) => Object.freeze({ ...item }))) });
}

/** Removal from the wrong end: highlights and removes `victim` instead of the real exit item. */
function wrongEndRemoval<TSnapshot extends { items: readonly Item[] }>(
  items: readonly Item[],
  victim: Item,
  firstMessage: string,
  secondMessage: string,
): readonly VisualizationStep<TSnapshot>[] {
  const recorder = new StepRecorder<TSnapshot>();
  recorder.record({
    message: firstMessage,
    snapshot: snapshotOf(items) as unknown as TSnapshot,
    activeNodeIds: [victim.id],
    matchedNodeIds: [victim.id],
    line: 2,
  });
  recorder.record({
    message: secondMessage,
    snapshot: snapshotOf(items.filter((item) => item.id !== victim.id)) as unknown as TSnapshot,
    output: [victim.value],
    line: 3,
  });
  return recorder.steps();
}

/** Insertion at the wrong end: the new item is placed where it would leave last. */
function wrongEndInsertion<TSnapshot extends { items: readonly Item[] }>(
  correctSteps: readonly VisualizationStep<TSnapshot>[],
  placeFirst: boolean,
): readonly VisualizationStep<TSnapshot>[] {
  const [first, last] = [correctSteps[0], correctSteps.at(-1)!];
  const items = last.snapshot.items;
  const added = items.find((item) => item.id === last.activeNodeIds[0])!;
  const others = items.filter((item) => item.id !== added.id);
  const recorder = new StepRecorder<TSnapshot>();
  recorder.record({
    message: last.message,
    snapshot: snapshotOf(
      placeFirst ? [added, ...others] : [...others, added],
    ) as unknown as TSnapshot,
    activeNodeIds: last.activeNodeIds,
    visitedNodeIds: last.visitedNodeIds,
    line: 2,
  });
  return [first, ...recorder.steps()];
}

const stackOps = new StackOperations();
const queueOps = new QueueOperations();

export const STACK_BUGS: readonly BugScenario<StackModel, StackSnapshot>[] = [
  {
    id: 'stack-pop-bottom',
    setup: 'Pop from the sample stack (34 on top, 8 at the bottom)',
    explanation:
      'Pop reads index 0, the bottom, so the oldest item leaves first. That is queue behaviour. A stack must remove items[top], the most recent push.',
    buggyLine: 2,
    buggyCode: 'value ← items[0]',
    start: () => StackModel.sample(),
    correct: (model) => stackOps.pop(model),
    buggySteps: (model) => {
      const items = model.items();
      return wrongEndRemoval<StackSnapshot>(
        items,
        items[0],
        `${items[0].value} will be popped first.`,
        `${items[0].value} was popped. The item below it becomes the new top.`,
      );
    },
  },
  {
    id: 'stack-push-bottom',
    setup: 'Push 55 onto the sample stack (34 on top)',
    explanation:
      'Push writes to the bottom and shifts everything up, so 55 would be popped last instead of first, and the push costs O(n). It must write to items[top + 1].',
    buggyLine: 2,
    buggyCode: 'items[0] ← value  // after shifting every item up',
    start: () => StackModel.sample(),
    correct: (model) => stackOps.push(model, 55),
    // Stack snapshots list items bottom to top, so "first" is the bottom.
    buggySteps: (_, correct) => wrongEndInsertion(correct.steps, true),
  },
];

export const QUEUE_BUGS: readonly BugScenario<QueueModel, QueueSnapshot>[] = [
  {
    id: 'queue-dequeue-rear',
    setup: 'Dequeue from the sample queue (5 at the front, 26 at the rear)',
    explanation:
      'Dequeue reads the rear, so the newest item leaves first. That is stack behaviour. A queue must remove items[front], the item that has waited longest.',
    buggyLine: 2,
    buggyCode: 'value ← items[rear]',
    start: () => QueueModel.sample(),
    correct: (model) => queueOps.dequeue(model),
    buggySteps: (model) => {
      const items = model.items();
      const rear = items.at(-1)!;
      return wrongEndRemoval<QueueSnapshot>(
        items,
        rear,
        `${rear.value} leaves the queue first.`,
        `${rear.value} was dequeued. The next item becomes the new front.`,
      );
    },
  },
  {
    id: 'queue-enqueue-front',
    setup: 'Enqueue 40 into the sample queue (5 at the front)',
    explanation:
      'Enqueue places 40 at the front, so it jumps the line and is dequeued next. New items must join at the rear.',
    buggyLine: 2,
    buggyCode: 'front ← front − 1; items[front] ← value',
    start: () => QueueModel.sample(),
    correct: (model) => queueOps.enqueue(model, 40),
    // Queue snapshots list items front to rear, so "first" is the front.
    buggySteps: (_, correct) => wrongEndInsertion(correct.steps, true),
  },
];
