import type { OperationResult, VisualizationStep } from '../domain/visualization';

/**
 * Spot the bug: a scenario pairs a correct operation with a deliberately broken one.
 * The learner steps through the broken trace and flags the first step that goes wrong.
 * Grading needs no answer key: the first step where the two traces differ is computed.
 */
export interface BugScenario<TModel, TSnapshot> {
  readonly id: string;
  /** What the learner is about to watch, e.g. "Extract min from the sample heap". */
  readonly setup: string;
  /** Plain explanation of the bug, shown after the learner flags a step. */
  readonly explanation: string;
  /** 1-based line of the operation's pseudocode that the bug changes. */
  readonly buggyLine: number;
  /** The wrong code shown on that line while the learner hunts. */
  readonly buggyCode: string;
  /** Builds the starting structure. */
  readonly start: () => TModel;
  /** Runs the real operation. */
  readonly correct: (model: TModel) => OperationResult<TModel, TSnapshot>;
  /** Builds the broken trace. It may reuse the correct trace's steps before the bug. */
  readonly buggySteps: (
    model: TModel,
    correct: OperationResult<TModel, TSnapshot>,
  ) => readonly VisualizationStep<TSnapshot>[];
}

export interface BugChallenge<TModel, TSnapshot> {
  readonly scenario: BugScenario<TModel, TSnapshot>;
  readonly startModel: TModel;
  readonly correct: OperationResult<TModel, TSnapshot>;
  readonly buggy: OperationResult<TModel, TSnapshot>;
  /** Index of the first step where the buggy trace differs from the correct one. */
  readonly divergence: number;
  /** The correct code for the buggy line. */
  readonly fixedCode: string;
}

export type FlagVerdict = 'exact' | 'early' | 'late';

/** What a step shows: the structure, its highlights, the output, and the line that ran. */
function fingerprint<TSnapshot>(step: VisualizationStep<TSnapshot>): string {
  return JSON.stringify([
    step.snapshot,
    step.activeNodeIds,
    step.visitedNodeIds,
    step.matchedNodeIds,
    step.output,
    step.line ?? null,
  ]);
}

/**
 * First index where the traces differ in anything the learner can see or the line that
 * ran. Narration is ignored, because buggy code narrates itself as if it were right.
 */
export function firstDivergence<TSnapshot>(
  correct: readonly VisualizationStep<TSnapshot>[],
  buggy: readonly VisualizationStep<TSnapshot>[],
): number {
  const shared = Math.min(correct.length, buggy.length);
  for (let index = 0; index < shared; index += 1) {
    if (fingerprint(correct[index]) !== fingerprint(buggy[index])) return index;
  }
  return shared;
}

export function gradeFlag(flagged: number, divergence: number): FlagVerdict {
  if (flagged === divergence) return 'exact';
  return flagged < divergence ? 'early' : 'late';
}

export function buildChallenge<TModel, TSnapshot>(
  scenario: BugScenario<TModel, TSnapshot>,
): BugChallenge<TModel, TSnapshot> {
  const startModel = scenario.start();
  const correct = scenario.correct(startModel);
  const pseudocode = correct.pseudocode ?? [];
  const fixedCode = pseudocode[scenario.buggyLine - 1] ?? '';
  const buggyPseudocode = pseudocode.map((line, index) =>
    index === scenario.buggyLine - 1 ? scenario.buggyCode : line,
  );
  const steps = scenario.buggySteps(startModel, correct);
  const buggy: OperationResult<TModel, TSnapshot> = Object.freeze({
    ...correct,
    model: startModel,
    steps,
    pseudocode: Object.freeze(buggyPseudocode),
  });
  return Object.freeze({
    scenario,
    startModel,
    correct,
    buggy,
    divergence: firstDivergence(correct.steps, steps),
    fixedCode,
  });
}
