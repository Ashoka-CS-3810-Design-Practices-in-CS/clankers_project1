import type { VisualizationStep } from './visualization';
import type { PseudocodeDefinition, PseudocodeLineId } from './pseudocode';

interface StepInput<TSnapshot> {
  readonly pseudocodeLineId?: PseudocodeLineId;
  readonly message: string;
  readonly snapshot: TSnapshot;
  readonly activeNodeIds?: readonly string[];
  readonly visitedNodeIds?: readonly string[];
  readonly matchedNodeIds?: readonly string[];
  readonly output?: readonly number[];
}

export class StepRecorder<TSnapshot> {
  private readonly recordedSteps: VisualizationStep<TSnapshot>[] = [];

  constructor(readonly pseudocode?: PseudocodeDefinition) {}

  record(input: StepInput<TSnapshot>): void {
    if (
      this.pseudocode &&
      !this.pseudocode.lines.some((line) => line.id === input.pseudocodeLineId)
    ) {
      throw new Error(`Invalid pseudocode line for ${this.pseudocode.title}`);
    }
    const step = Object.freeze({
      ...(input.pseudocodeLineId ? { pseudocodeLineId: input.pseudocodeLineId } : {}),
      id: `step-${this.recordedSteps.length + 1}`,
      message: input.message,
      snapshot: input.snapshot,
      activeNodeIds: Object.freeze([...(input.activeNodeIds ?? [])]),
      visitedNodeIds: Object.freeze([...(input.visitedNodeIds ?? [])]),
      matchedNodeIds: Object.freeze([...(input.matchedNodeIds ?? [])]),
      output: Object.freeze([...(input.output ?? [])]),
    });

    this.recordedSteps.push(step);
  }

  steps(): readonly VisualizationStep<TSnapshot>[] {
    return Object.freeze([...this.recordedSteps]);
  }
}
