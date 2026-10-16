import { useCallback, useState } from 'react';
import type { PlaybackPhase } from '../playback/playback';
import { EMPTY_SCORE, recordAnswer, type PracticeQuestion, type PracticeScore } from './practice';

/**
 * Practice-mode state shared by every workspace: the on/off switch, the questions for the
 * current trace, and the running score. Playback holds are handled by the reducer; this hook
 * only decides which steps become checkpoints.
 */
export function usePractice() {
  const [enabled, setEnabledState] = useState(false);
  const [questions, setQuestions] = useState<readonly PracticeQuestion[]>([]);
  const [score, setScore] = useState<PracticeScore>(EMPTY_SCORE);

  const setEnabled = useCallback((on: boolean) => {
    setEnabledState(on);
    setScore(EMPTY_SCORE);
  }, []);

  /** Stores the questions for a new trace and returns their checkpoints for `playback.load`. */
  const prepare = useCallback(
    (build: () => readonly PracticeQuestion[]): number[] => {
      const asked = enabled ? build() : [];
      setQuestions(asked);
      return asked.map((question) => question.stepIndex);
    },
    [enabled],
  );

  const questionAt = (phase: PlaybackPhase, index: number): PracticeQuestion | undefined =>
    phase === 'question' ? questions.find((question) => question.stepIndex === index) : undefined;

  const record = useCallback((correct: boolean) => {
    setScore((current) => recordAnswer(current, correct));
  }, []);

  return { enabled, setEnabled, score, prepare, questionAt, record };
}
