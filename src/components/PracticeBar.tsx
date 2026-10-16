import type { PracticeScore } from '../practice/practice';

interface PracticeBarProps {
  /** Unique per workspace, because every workspace stays mounted. */
  readonly idPrefix: string;
  readonly enabled: boolean;
  readonly onToggle: (enabled: boolean) => void;
  readonly disabled: boolean;
  readonly score: PracticeScore;
}

export function PracticeBar({ idPrefix, enabled, onToggle, disabled, score }: PracticeBarProps) {
  const hintId = `${idPrefix}-practice-hint`;
  return (
    <section className="practice-bar" aria-label="Practice mode">
      <label className="practice-toggle">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onToggle(event.target.checked)}
          disabled={disabled}
          aria-describedby={hintId}
        />
        Practice mode
      </label>
      <p id={hintId}>Playback pauses at key steps and asks you to predict what happens next.</p>
      {enabled && (
        <p className="practice-score" aria-live="polite">
          Score: {score.correct} of {score.answered} correct
        </p>
      )}
    </section>
  );
}
