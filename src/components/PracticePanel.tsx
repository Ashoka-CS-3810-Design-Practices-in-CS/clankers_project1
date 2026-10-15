import { useEffect, useRef, useState } from 'react';
import type { PracticeQuestion } from '../practice/practice';

interface PracticePanelProps {
  /** Unique per workspace, because every workspace stays mounted. */
  readonly idPrefix: string;
  readonly question: PracticeQuestion;
  /** Called once the learner has seen the feedback and wants to reveal the step. */
  readonly onContinue: (correct: boolean) => void;
}

/**
 * Asks one "predict the next step" question. The parent remounts it per question
 * (key = stepIndex), so local answer state never leaks between questions.
 */
export function PracticePanel({ idPrefix, question, onContinue }: PracticePanelProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const answered = chosen !== null;
  const correct = chosen === question.correctOptionId;
  const headingId = `${idPrefix}-practice-heading`;
  const promptId = `${idPrefix}-practice-prompt`;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (answered) continueRef.current?.focus();
  }, [answered]);

  return (
    <section className="practice-card" aria-labelledby={headingId}>
      <h2 id={headingId} ref={headingRef} tabIndex={-1}>
        Predict the next step
      </h2>
      <p id={promptId} className="practice-prompt">
        {question.prompt}
      </p>
      <div className="practice-options" role="group" aria-labelledby={promptId}>
        {question.options.map((option) => {
          const state = !answered
            ? ''
            : option.id === question.correctOptionId
              ? 'is-correct'
              : option.id === chosen
                ? 'is-wrong'
                : 'is-dimmed';
          return (
            <button
              type="button"
              key={option.id}
              className={`practice-option ${state}`}
              onClick={() => setChosen(option.id)}
              disabled={answered}
              aria-pressed={option.id === chosen}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <div className="practice-feedback" role="status" aria-live="polite">
        {answered && (
          <p className={correct ? 'feedback-correct' : 'feedback-wrong'}>
            <strong>{correct ? 'Correct.' : 'Not quite.'}</strong> {question.explanation}
          </p>
        )}
      </div>
      {answered && (
        <button
          type="button"
          ref={continueRef}
          className="primary-button practice-continue"
          onClick={() => onContinue(correct)}
        >
          Show the step
        </button>
      )}
    </section>
  );
}
