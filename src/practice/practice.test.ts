import { describe, expect, it } from 'vitest';
import {
  arrangeOptions,
  chooseQuestions,
  EMPTY_SCORE,
  recordAnswer,
  type PracticeQuestion,
} from './practice';

function question(stepIndex: number, decisive = false): PracticeQuestion {
  return {
    stepIndex,
    prompt: `Q${stepIndex}`,
    options: [{ id: 'a', label: 'A' }],
    correctOptionId: 'a',
    explanation: '',
    decisive,
  };
}

const indexes = (questions: readonly PracticeQuestion[]) => questions.map((q) => q.stepIndex);

describe('chooseQuestions', () => {
  it('keeps every question when there are no more than the limit', () => {
    expect(indexes(chooseQuestions([question(0), question(1, true)]))).toEqual([0, 1]);
  });

  it('always keeps decisive questions and spreads the rest across the trace', () => {
    const all = [0, 1, 2, 3, 4, 5].map((index) => question(index)).concat(question(6, true));
    expect(indexes(chooseQuestions(all, 3))).toEqual([0, 5, 6]);
  });

  it('prefers the latest decisive questions when there are too many', () => {
    const all = [0, 1, 2, 3].map((index) => question(index, true));
    expect(indexes(chooseQuestions(all, 2))).toEqual([2, 3]);
  });

  it('is deterministic and handles a zero limit', () => {
    const all = [0, 1, 2, 3, 4].map((index) => question(index));
    expect(chooseQuestions(all)).toEqual(chooseQuestions(all));
    expect(chooseQuestions(all, 0)).toEqual([]);
  });
});

describe('arrangeOptions', () => {
  const options = ['a', 'b', 'c'].map((id) => ({ id, label: id }));

  it('rotates by the seed without losing options', () => {
    expect(arrangeOptions(options, 1).map((o) => o.id)).toEqual(['b', 'c', 'a']);
    expect(arrangeOptions(options, 3).map((o) => o.id)).toEqual(['a', 'b', 'c']);
    expect(arrangeOptions(options, -1).map((o) => o.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('recordAnswer', () => {
  it('counts answers and correct answers', () => {
    const score = recordAnswer(recordAnswer(EMPTY_SCORE, true), false);
    expect(score).toEqual({ answered: 2, correct: 1 });
  });
});
