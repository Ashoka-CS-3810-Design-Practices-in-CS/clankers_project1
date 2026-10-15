/**
 * Practice mode: playback holds at chosen steps and asks the learner to predict
 * the next one. Every answer is checkable because the full trace already exists.
 * This module is structure-agnostic; each structure supplies its own question builder.
 */

export interface PracticeOption {
  readonly id: string;
  readonly label: string;
}

export interface PracticeQuestion {
  /** The question is asked while this step is shown; step `stepIndex + 1` reveals the answer. */
  readonly stepIndex: number;
  readonly prompt: string;
  readonly options: readonly PracticeOption[];
  readonly correctOptionId: string;
  /** Shown after answering, right or wrong. */
  readonly explanation: string;
  /** A turning point (match found, end reached, a link changes); preferred as a checkpoint. */
  readonly decisive: boolean;
}

export interface PracticeScore {
  readonly answered: number;
  readonly correct: number;
}

export const EMPTY_SCORE: PracticeScore = Object.freeze({ answered: 0, correct: 0 });

export const MAX_CHECKPOINTS = 3;

/**
 * Picks at most `max` questions so practice stays short: every decisive question
 * first (latest ones if there are too many), then routine questions spread evenly
 * across the trace. Deterministic, so the same trace always asks the same questions.
 */
export function chooseQuestions(
  questions: readonly PracticeQuestion[],
  max: number = MAX_CHECKPOINTS,
): readonly PracticeQuestion[] {
  if (max <= 0) return [];
  const decisive = questions.filter((question) => question.decisive).slice(-max);
  const routine = questions.filter((question) => !question.decisive);
  const slots = Math.min(max - decisive.length, routine.length);
  const spread: PracticeQuestion[] = [];
  for (let i = 0; i < slots; i += 1) {
    const position = slots === 1 ? 0 : Math.round((i * (routine.length - 1)) / (slots - 1));
    spread.push(routine[position]);
  }
  return Object.freeze(
    [...decisive, ...spread].sort((left, right) => left.stepIndex - right.stepIndex),
  );
}

/** Rotates options by a seed so the correct answer does not always sit in the same place. */
export function arrangeOptions(
  options: readonly PracticeOption[],
  seed: number,
): readonly PracticeOption[] {
  if (options.length === 0) return options;
  const shift = ((seed % options.length) + options.length) % options.length;
  return Object.freeze([...options.slice(shift), ...options.slice(0, shift)]);
}

export function recordAnswer(score: PracticeScore, correct: boolean): PracticeScore {
  return { answered: score.answered + 1, correct: score.correct + (correct ? 1 : 0) };
}
