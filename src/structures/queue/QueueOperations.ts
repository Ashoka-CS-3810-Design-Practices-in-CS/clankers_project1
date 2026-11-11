import { queueCode } from './QueuePseudocode';
import { StepRecorder } from '../../domain/StepRecorder';
import type { ComplexityInfo, OperationResult } from '../../domain/visualization';
import { QueueModel, type QueueSnapshot } from './QueueModel';

export type QueueResult = OperationResult<QueueModel, QueueSnapshot>;

/** Worst-case costs shown in each trace and in the complexity reference page. */
export const QUEUE_COMPLEXITY = {
  enqueue: {
    time: 'O(1)',
    space: 'O(1)',
    explanation: 'The new item is attached directly behind the current rear.',
  },
  dequeue: {
    time: 'O(1)',
    space: 'O(1)',
    explanation:
      'Only the front item is removed. The front index moves forward instead of shifting every remaining item.',
  },
  peek: {
    time: 'O(1)',
    space: 'O(1)',
    explanation: 'The front item is read without changing the queue.',
  },
  inspect: {
    time: 'O(n)',
    space: 'O(n)',
    explanation: 'Every item is visited from front to rear and retained in the displayed output.',
  },
} satisfies Record<string, ComplexityInfo>;

export class QueueOperations {
  enqueue(model: QueueModel, value: number): QueueResult {
    const working = model.clone();
    const recorder = new StepRecorder<QueueSnapshot>(queueCode.enqueue);
    const previousRear = working.rear();

    recorder.record({
      pseudocodeLineId: 'enqueue.prepare',
      message: previousRear
        ? `Prepare to place ${value} behind the current rear item, ${previousRear.value}.`
        : `The queue is empty, so ${value} will become both the front and the rear.`,
      snapshot: working.snapshot(),
      activeNodeIds: previousRear ? [previousRear.id] : [],
    });
    const added = working.enqueue(value);
    recorder.record({
      pseudocodeLineId: 'enqueue.add',
      message: `${value} joined at the rear of the queue.`,
      snapshot: working.snapshot(),
      activeNodeIds: [added.id],
      visitedNodeIds: [added.id],
    });
    return this.result(working, recorder, 'success', QUEUE_COMPLEXITY.enqueue, 'Enqueue');
  }

  dequeue(model: QueueModel): QueueResult {
    const working = model.clone();
    const recorder = new StepRecorder<QueueSnapshot>(queueCode.dequeue);
    const front = working.front();

    if (!front) {
      recorder.record({
        pseudocodeLineId: 'dequeue.empty',
        message: 'The queue is empty, so there is no front item to remove.',
        snapshot: working.snapshot(),
      });
      return this.result(working, recorder, 'blocked', QUEUE_COMPLEXITY.dequeue, 'Dequeue');
    }

    recorder.record({
      pseudocodeLineId: 'dequeue.read',
      message: `${front.value} has waited longest, so it leaves from the front first.`,
      snapshot: working.snapshot(),
      activeNodeIds: [front.id],
      matchedNodeIds: [front.id],
    });
    working.dequeue();
    recorder.record({
      pseudocodeLineId: 'dequeue.remove',
      message: working.isEmpty()
        ? `${front.value} was dequeued. The queue is now empty.`
        : `${front.value} was dequeued. The next item becomes the new front.`,
      snapshot: working.snapshot(),
      output: [front.value],
    });
    return this.result(working, recorder, 'success', QUEUE_COMPLEXITY.dequeue, 'Dequeue');
  }

  peek(model: QueueModel): QueueResult {
    const working = model.clone();
    const recorder = new StepRecorder<QueueSnapshot>(queueCode.peek);
    const front = working.front();

    if (!front) {
      recorder.record({
        pseudocodeLineId: 'peek.empty',
        message: 'The queue is empty, so there is no front item to inspect.',
        snapshot: working.snapshot(),
      });
      return this.result(working, recorder, 'blocked', QUEUE_COMPLEXITY.peek, 'Peek front');
    }

    recorder.record({
      pseudocodeLineId: 'peek.read',
      message: 'Read the item at the front without removing it.',
      snapshot: working.snapshot(),
    });
    recorder.record({
      pseudocodeLineId: 'peek.return',
      message: `${front.value} is at the front. The queue remains unchanged.`,
      snapshot: working.snapshot(),
      activeNodeIds: [front.id],
      matchedNodeIds: [front.id],
      output: [front.value],
    });
    return this.result(working, recorder, 'success', QUEUE_COMPLEXITY.peek, 'Peek front');
  }

  inspect(model: QueueModel): QueueResult {
    const working = model.clone();
    const recorder = new StepRecorder<QueueSnapshot>(queueCode.inspect);
    const visited: string[] = [];
    const output: number[] = [];
    const items = working.items();
    recorder.record({
      pseudocodeLineId: 'inspect.start',
      message: 'Begin at the front and inspect each item toward the rear.',
      snapshot: working.snapshot(),
    });

    items.forEach((item) => {
      visited.push(item.id);
      output.push(item.value);
      recorder.record({
        pseudocodeLineId: 'inspect.visit',
        message: `Inspect ${item.value} and continue to the item behind it.`,
        snapshot: working.snapshot(),
        activeNodeIds: [item.id],
        visitedNodeIds: visited,
        output,
      });
    });

    recorder.record({
      pseudocodeLineId: 'inspect.done',
      message:
        items.length === 0
          ? 'The queue is empty, so inspection finishes immediately.'
          : 'The rear item has been reached. Inspection is complete.',
      snapshot: working.snapshot(),
      visitedNodeIds: visited,
      output,
    });
    return this.result(working, recorder, 'success', QUEUE_COMPLEXITY.inspect, 'Inspect all');
  }

  private result(
    model: QueueModel,
    recorder: StepRecorder<QueueSnapshot>,
    status: QueueResult['status'],
    complexity: ComplexityInfo,
    operationLabel: string,
  ): QueueResult {
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
