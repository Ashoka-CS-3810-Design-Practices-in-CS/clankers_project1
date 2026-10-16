import type { VisualizationStep } from './visualization';

interface StepInput<TSnapshot> {
  readonly message: string;
  readonly snapshot: TSnapshot;
  readonly activeNodeIds?: readonly string[];
  readonly visitedNodeIds?: readonly string[];
  readonly matchedNodeIds?: readonly string[];
  readonly output?: readonly number[];
  readonly line?: number;
}

export class StepRecorder<TSnapshot> {
  private readonly recordedSteps: VisualizationStep<TSnapshot>[] = [];

  record(input: StepInput<TSnapshot>): void {
    const step = Object.freeze({
      id: `step-${this.recordedSteps.length + 1}`,
      message: input.message,
      snapshot: input.snapshot,
      activeNodeIds: Object.freeze([...(input.activeNodeIds ?? [])]),
      visitedNodeIds: Object.freeze([...(input.visitedNodeIds ?? [])]),
      matchedNodeIds: Object.freeze([...(input.matchedNodeIds ?? [])]),
      output: Object.freeze([...(input.output ?? [])]),
      ...(input.line === undefined ? {} : { line: input.line }),
    });

    this.recordedSteps.push(step);
  }

  steps(): readonly VisualizationStep<TSnapshot>[] {
    return Object.freeze([...this.recordedSteps]);
  }
}
