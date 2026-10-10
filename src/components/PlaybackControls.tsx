import { PLAYBACK_SPEEDS, type PlaybackSpeed, type PlaybackState } from '../playback/playback';

interface PlaybackControlsProps {
  readonly state: PlaybackState;
  readonly hasSteps: boolean;
  readonly onPlay: () => void;
  readonly onPause: () => void;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onRestart: () => void;
  readonly onSpeedChange: (speed: PlaybackSpeed) => void;
}

export function PlaybackControls({
  state,
  hasSteps,
  onPlay,
  onPause,
  onPrevious,
  onNext,
  onRestart,
  onSpeedChange,
}: PlaybackControlsProps) {
  const atStart = state.index === 0;
  const atEnd = !hasSteps || state.index >= state.total - 1;

  return (
    <section className="playback" aria-label="Playback controls">
      <div className="playback-buttons">
        <button type="button" onClick={onRestart} disabled={!hasSteps || atStart}>
          Restart
        </button>
        <button type="button" onClick={onPrevious} disabled={!hasSteps || atStart}>
          Previous
        </button>
        {state.phase === 'playing' ? (
          <button type="button" className="primary-button" onClick={onPause}>
            Pause
          </button>
        ) : (
          <button type="button" className="primary-button" onClick={onPlay} disabled={atEnd}>
            Play
          </button>
        )}
        <button type="button" onClick={onNext} disabled={atEnd}>
          Next
        </button>
      </div>
      <div className="playback-progress" aria-live="polite">
        <span>
          {hasSteps ? `Step ${state.index + 1} of ${state.total}` : 'No operation loaded'}
        </span>
        <div className="step-track" aria-hidden="true">
          <span
            style={{
              transform: `scaleX(${hasSteps ? (state.index + 1) / state.total : 0})`,
            }}
          />
        </div>
      </div>
      <label className="speed-control">
        Speed
        <select
          value={state.speed}
          onChange={(event) => onSpeedChange(Number(event.target.value) as PlaybackSpeed)}
        >
          {PLAYBACK_SPEEDS.map((speed) => (
            <option value={speed} key={speed}>
              {speed}x
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
