import { stackCode } from './StackPseudocode';
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
    const recorder = new StepRecorder<StackSnapshot>(stackCode.push);
    recorder.record({
      pseudocodeLineId: 'push.prepare',
      message: `Prepare to place ${value} above the current top item.`,
      snapshot: working.snapshot(),
    });
    const pushed = working.push(value);
    recorder.record({
      pseudocodeLineId: 'push.add',
      message: `${value} is now at the top of the stack.`,
      snapshot: working.snapshot(),
      activeNodeIds: [pushed.id],
      visitedNodeIds: [pushed.id],
    });
    return this.result(working, recorder, 'success', COMPLEXITY.push, 'Push');
  }

  pop(model: StackModel): StackResult {
    const working = model.clone();
    const recorder = new StepRecorder<StackSnapshot>(stackCode.pop);
    const top = working.peek();

    if (!top) {
      recorder.record({
        pseudocodeLineId: 'pop.empty',
        message: 'The stack is empty, so there is no top item to remove.',
        snapshot: working.snapshot(),
      });
      return this.result(working, recorder, 'blocked', COMPLEXITY.pop, 'Pop');
    }

    recorder.record({
      pseudocodeLineId: 'pop.read',
      message: `${top.value} is at the top and will be removed first.`,
      snapshot: working.snapshot(),
      activeNodeIds: [top.id],
      matchedNodeIds: [top.id],
    });
    working.pop();
    recorder.record({
      pseudocodeLineId: 'pop.remove',
      message: `${top.value} was popped. The item below it becomes the new top.`,
      snapshot: working.snapshot(),
      output: [top.value],
    });
    return this.result(working, recorder, 'success', COMPLEXITY.pop, 'Pop');
  }

  peek(model: StackModel): StackResult {
    const working = model.clone();
    const recorder = new StepRecorder<StackSnapshot>(stackCode.peek);
    const top = working.peek();

    if (!top) {
      recorder.record({
        pseudocodeLineId: 'peek.empty',
        message: 'The stack is empty, so there is no top item to inspect.',
        snapshot: working.snapshot(),
      });
      return this.result(working, recorder, 'blocked', COMPLEXITY.peek, 'Peek');
    }

    recorder.record({
      pseudocodeLineId: 'peek.read',
      message: 'Read the item at the top without removing it.',
      snapshot: working.snapshot(),
    });
    recorder.record({
      pseudocodeLineId: 'peek.return',
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
    const recorder = new StepRecorder<StackSnapshot>(stackCode.inspect);
    const visited: string[] = [];
    const output: number[] = [];
    const items = [...working.items()].reverse();
    recorder.record({
      pseudocodeLineId: 'inspect.start',
      message: 'Begin at the top and inspect each item toward the bottom.',
      snapshot: working.snapshot(),
    });

    items.forEach((item) => {
      visited.push(item.id);
      output.push(item.value);
      recorder.record({
        pseudocodeLineId: 'inspect.visit',
        message: `Inspect ${item.value} and continue to the item below it.`,
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
      pseudocode: recorder.pseudocode,
      status,
      complexity: Object.freeze({ ...complexity }),
      operationLabel,
    });
  }
}
