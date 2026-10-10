import { StepRecorder } from '../../domain/StepRecorder';
import type { ComplexityInfo, OperationResult } from '../../domain/visualization';
import { StackModel, type StackSnapshot } from './StackModel';

export type StackResult = OperationResult<StackModel, StackSnapshot>;

const COMPLEXITY = {
  push: {
    time: 'O(1)',
    space: 'O(1)',
    explanation: 'The new item is appended directly to the top of the stack.',
  },
  pop: {
    time: 'O(1)',
    space: 'O(1)',
    explanation: 'Only the item at the top of the stack is removed.',
  },
  peek: {
    time: 'O(1)',
    space: 'O(1)',
    explanation: 'The top item is read without changing the stack.',
  },
  inspect: {
    time: 'O(n)',
    space: 'O(n)',
    explanation: 'Every item is visited from top to bottom and retained in the displayed output.',
  },
} satisfies Record<string, ComplexityInfo>;

export class StackOperations {
  push(model: StackModel, value: number): StackResult {
    const working = model.clone();
    const recorder = new StepRecorder<StackSnapshot>();
    recorder.record({
      message: `Prepare to place ${value} above the current top item.`,
      snapshot: working.snapshot(),
    });
    const pushed = working.push(value);
    recorder.record({
      message: `${value} is now at the top of the stack.`,
      snapshot: working.snapshot(),
      activeNodeIds: [pushed.id],
      visitedNodeIds: [pushed.id],
    });
    return this.result(working, recorder, 'success', COMPLEXITY.push, 'Push');
  }

  pop(model: StackModel): StackResult {
    const working = model.clone();
    const recorder = new StepRecorder<StackSnapshot>();
    const top = working.peek();

    if (!top) {
      recorder.record({
        message: 'The stack is empty, so there is no top item to remove.',
        snapshot: working.snapshot(),
      });
      return this.result(working, recorder, 'blocked', COMPLEXITY.pop, 'Pop');
    }

    recorder.record({
      message: `${top.value} is at the top and will be removed first.`,
      snapshot: working.snapshot(),
      activeNodeIds: [top.id],
      matchedNodeIds: [top.id],
    });
    working.pop();
    recorder.record({
      message: `${top.value} was popped. The item below it becomes the new top.`,
      snapshot: working.snapshot(),
      output: [top.value],
    });
    return this.result(working, recorder, 'success', COMPLEXITY.pop, 'Pop');
  }

  peek(model: StackModel): StackResult {
    const working = model.clone();
    const recorder = new StepRecorder<StackSnapshot>();
    const top = working.peek();

    if (!top) {
      recorder.record({
        message: 'The stack is empty, so there is no top item to inspect.',
        snapshot: working.snapshot(),
      });
      return this.result(working, recorder, 'blocked', COMPLEXITY.peek, 'Peek');
    }

    recorder.record({
      message: 'Read the item at the top without removing it.',
      snapshot: working.snapshot(),
    });
    recorder.record({
      message: `${top.value} is at the top. The stack remains unchanged.`,
      snapshot: working.snapshot(),
      activeNodeIds: [top.id],
      matchedNodeIds: [top.id],
      output: [top.value],
    });
    return this.result(working, recorder, 'success', COMPLEXITY.peek, 'Peek');
  }

  inspect(model: StackModel): StackResult {
    const working = model.clone();
    const recorder = new StepRecorder<StackSnapshot>();
    const visited: string[] = [];
    const output: number[] = [];
    const items = [...working.items()].reverse();
    recorder.record({
      message: 'Begin at the top and inspect each item toward the bottom.',
      snapshot: working.snapshot(),
    });

    items.forEach((item) => {
      visited.push(item.id);
      output.push(item.value);
      recorder.record({
        message: `Inspect ${item.value} and continue to the item below it.`,
        snapshot: working.snapshot(),
        activeNodeIds: [item.id],
        visitedNodeIds: visited,
        output,
      });
    });

    recorder.record({
      message:
        items.length === 0
          ? 'The stack is empty, so inspection finishes immediately.'
          : 'The bottom item has been reached. Inspection is complete.',
      snapshot: working.snapshot(),
      visitedNodeIds: visited,
      output,
    });
    return this.result(working, recorder, 'success', COMPLEXITY.inspect, 'Inspect all');
  }

  private result(
    model: StackModel,
    recorder: StepRecorder<StackSnapshot>,
    status: StackResult['status'],
    complexity: ComplexityInfo,
    operationLabel: string,
  ): StackResult {
    return Object.freeze({
      model,
      steps: recorder.steps(),
      status,
      complexity: Object.freeze({ ...complexity }),
      operationLabel,
    });
  }
}
