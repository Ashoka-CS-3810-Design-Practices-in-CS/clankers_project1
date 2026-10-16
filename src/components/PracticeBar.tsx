import type { PracticeScore } from '../practice/practice';

interface PracticeBarProps {
  /** Unique per workspace, because every workspace stays mounted. */
  readonly idPrefix: string;
  readonly enabled: boolean;
  readonly onToggle: (enabled: boolean) => void;
  readonly disabled: boolean;
  readonly score: PracticeScore;
  /** Starts a spot-the-bug challenge. */
  readonly onSpotBug: () => void;
  readonly spotBugDisabled: boolean;
}

export function PracticeBar({
  idPrefix,
  enabled,
  onToggle,
  disabled,
  score,
  onSpotBug,
  spotBugDisabled,
}: PracticeBarProps) {
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
      <button
        type="button"
        className="quiet-button spot-bug"
        onClick={onSpotBug}
        disabled={spotBugDisabled}
      >
        Spot the bug
      </button>
      {(enabled || score.answered > 0) && (
        <p className="practice-score" aria-live="polite">
          Score: {score.correct} of {score.answered} correct
        </p>
      )}
    </section>
  );
}
