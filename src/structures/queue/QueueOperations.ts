import { StepRecorder } from '../../domain/StepRecorder';
import type { ComplexityInfo, OperationResult } from '../../domain/visualization';
import { QueueModel, type QueueSnapshot } from './QueueModel';

export type QueueResult = OperationResult<QueueModel, QueueSnapshot>;

const COMPLEXITY = {
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

const PSEUDOCODE = {
  enqueue: ['rear ← rear + 1', 'items[rear] ← value'],
  dequeue: [
    'if front > rear: report underflow',
    'value ← items[front]',
    'front ← front + 1  // nothing shifts',
    'return value',
  ],
  peek: ['if front > rear: report underflow', 'return items[front]'],
  inspect: ['i ← front', 'while i ≤ rear:', '  output(items[i])', '  i ← i + 1', 'return output'],
} satisfies Record<string, readonly string[]>;

export class QueueOperations {
  enqueue(model: QueueModel, value: number): QueueResult {
    const working = model.clone();
    const recorder = new StepRecorder<QueueSnapshot>();
    const previousRear = working.rear();

    recorder.record({
      message: previousRear
        ? `Prepare to place ${value} behind the current rear item, ${previousRear.value}.`
        : `The queue is empty, so ${value} will become both the front and the rear.`,
      snapshot: working.snapshot(),
      activeNodeIds: previousRear ? [previousRear.id] : [],
      line: 1,
    });
    const added = working.enqueue(value);
    recorder.record({
      message: `${value} joined at the rear of the queue.`,
      snapshot: working.snapshot(),
      activeNodeIds: [added.id],
      visitedNodeIds: [added.id],
      line: 2,
    });
    return this.result(
      working,
      recorder,
      'success',
      COMPLEXITY.enqueue,
      'Enqueue',
      PSEUDOCODE.enqueue,
    );
  }

  dequeue(model: QueueModel): QueueResult {
    const working = model.clone();
    const recorder = new StepRecorder<QueueSnapshot>();
    const front = working.front();

    if (!front) {
      recorder.record({
        message: 'The queue is empty, so there is no front item to remove.',
        snapshot: working.snapshot(),
        line: 1,
      });
      return this.result(
        working,
        recorder,
        'blocked',
        COMPLEXITY.dequeue,
        'Dequeue',
        PSEUDOCODE.dequeue,
      );
    }

    recorder.record({
      message: `${front.value} has waited longest, so it leaves from the front first.`,
      snapshot: working.snapshot(),
      activeNodeIds: [front.id],
      matchedNodeIds: [front.id],
      line: 2,
    });
    working.dequeue();
    recorder.record({
      message: working.isEmpty()
        ? `${front.value} was dequeued. The queue is now empty.`
        : `${front.value} was dequeued. The next item becomes the new front.`,
      snapshot: working.snapshot(),
      output: [front.value],
      line: 3,
    });
    return this.result(
      working,
      recorder,
      'success',
      COMPLEXITY.dequeue,
      'Dequeue',
      PSEUDOCODE.dequeue,
    );
  }

  peek(model: QueueModel): QueueResult {
    const working = model.clone();
    const recorder = new StepRecorder<QueueSnapshot>();
    const front = working.front();

    if (!front) {
      recorder.record({
        message: 'The queue is empty, so there is no front item to inspect.',
        snapshot: working.snapshot(),
        line: 1,
      });
      return this.result(
        working,
        recorder,
        'blocked',
        COMPLEXITY.peek,
        'Peek front',
        PSEUDOCODE.peek,
      );
    }

    recorder.record({
      message: 'Read the item at the front without removing it.',
      snapshot: working.snapshot(),
      line: 1,
    });
    recorder.record({
      message: `${front.value} is at the front. The queue remains unchanged.`,
      snapshot: working.snapshot(),
      activeNodeIds: [front.id],
      matchedNodeIds: [front.id],
      output: [front.value],
      line: 2,
    });
    return this.result(
      working,
      recorder,
      'success',
      COMPLEXITY.peek,
      'Peek front',
      PSEUDOCODE.peek,
    );
  }

  inspect(model: QueueModel): QueueResult {
    const working = model.clone();
    const recorder = new StepRecorder<QueueSnapshot>();
    const visited: string[] = [];
    const output: number[] = [];
    const items = working.items();
    recorder.record({
      message: 'Begin at the front and inspect each item toward the rear.',
      snapshot: working.snapshot(),
      line: 1,
    });

    items.forEach((item) => {
      visited.push(item.id);
      output.push(item.value);
      recorder.record({
        message: `Inspect ${item.value} and continue to the item behind it.`,
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
          ? 'The queue is empty, so inspection finishes immediately.'
          : 'The rear item has been reached. Inspection is complete.',
      snapshot: working.snapshot(),
      visitedNodeIds: visited,
      output,
      line: 5,
    });
    return this.result(
      working,
      recorder,
      'success',
      COMPLEXITY.inspect,
      'Inspect all',
      PSEUDOCODE.inspect,
    );
  }

  private result(
    model: QueueModel,
    recorder: StepRecorder<QueueSnapshot>,
    status: QueueResult['status'],
    complexity: ComplexityInfo,
    operationLabel: string,
    pseudocode: readonly string[],
  ): QueueResult {
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
