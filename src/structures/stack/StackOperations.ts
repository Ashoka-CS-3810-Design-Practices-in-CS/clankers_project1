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

const PSEUDOCODE = {
  push: ['top ← top + 1', 'items[top] ← value'],
  pop: ['if top < 0: report underflow', 'value ← items[top]', 'top ← top − 1', 'return value'],
  peek: ['if top < 0: report underflow', 'return items[top]'],
  inspect: ['i ← top', 'while i ≥ 0:', '  output(items[i])', '  i ← i − 1', 'return output'],
} satisfies Record<string, readonly string[]>;

export class StackOperations {
  push(model: StackModel, value: number): StackResult {
    const working = model.clone();
    const recorder = new StepRecorder<StackSnapshot>();
    recorder.record({
      message: `Prepare to place ${value} above the current top item.`,
      snapshot: working.snapshot(),
      line: 1,
    });
    const pushed = working.push(value);
    recorder.record({
      message: `${value} is now at the top of the stack.`,
      snapshot: working.snapshot(),
      activeNodeIds: [pushed.id],
      visitedNodeIds: [pushed.id],
      line: 2,
    });
    return this.result(working, recorder, 'success', COMPLEXITY.push, 'Push', PSEUDOCODE.push);
  }

  pop(model: StackModel): StackResult {
    const working = model.clone();
    const recorder = new StepRecorder<StackSnapshot>();
    const top = working.peek();

    if (!top) {
      recorder.record({
        message: 'The stack is empty, so there is no top item to remove.',
        snapshot: working.snapshot(),
        line: 1,
      });
      return this.result(working, recorder, 'blocked', COMPLEXITY.pop, 'Pop', PSEUDOCODE.pop);
    }

    recorder.record({
      message: `${top.value} is at the top and will be removed first.`,
      snapshot: working.snapshot(),
      activeNodeIds: [top.id],
      matchedNodeIds: [top.id],
      line: 2,
    });
    working.pop();
    recorder.record({
      message: `${top.value} was popped. The item below it becomes the new top.`,
      snapshot: working.snapshot(),
      output: [top.value],
      line: 3,
    });
    return this.result(working, recorder, 'success', COMPLEXITY.pop, 'Pop', PSEUDOCODE.pop);
  }

  peek(model: StackModel): StackResult {
    const working = model.clone();
    const recorder = new StepRecorder<StackSnapshot>();
    const top = working.peek();

    if (!top) {
      recorder.record({
        message: 'The stack is empty, so there is no top item to inspect.',
        snapshot: working.snapshot(),
        line: 1,
      });
      return this.result(working, recorder, 'blocked', COMPLEXITY.peek, 'Peek', PSEUDOCODE.peek);
    }

    recorder.record({
      message: 'Read the item at the top without removing it.',
      snapshot: working.snapshot(),
      line: 1,
    });
    recorder.record({
      message: `${top.value} is at the top. The stack remains unchanged.`,
      snapshot: working.snapshot(),
      activeNodeIds: [top.id],
      matchedNodeIds: [top.id],
      output: [top.value],
      line: 2,
    });
    return this.result(working, recorder, 'success', COMPLEXITY.peek, 'Peek', PSEUDOCODE.peek);
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
      line: 1,
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
        line: 3,
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
    model: StackModel,
    recorder: StepRecorder<StackSnapshot>,
    status: StackResult['status'],
    complexity: ComplexityInfo,
    operationLabel: string,
    pseudocode: readonly string[],
  ): StackResult {
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
