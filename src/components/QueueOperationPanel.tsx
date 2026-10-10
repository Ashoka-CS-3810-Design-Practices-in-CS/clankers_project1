interface QueueOperationPanelProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly onEnqueue: () => void;
  readonly onDequeue: () => void;
  readonly onPeek: () => void;
  readonly onInspect: () => void;
  readonly onSample: () => void;
  readonly onReset: () => void;
  readonly disabled: boolean;
  readonly error: string;
}

export function QueueOperationPanel({
  value,
  onValueChange,
  onEnqueue,
  onDequeue,
  onPeek,
  onInspect,
  onSample,
  onReset,
  disabled,
  error,
}: QueueOperationPanelProps) {
  return (
    <section className="operation-panel" aria-labelledby="queue-operation-heading">
      <div className="operation-copy">
        <h2 id="queue-operation-heading">Choose an operation</h2>
        <p>Enqueue joins at the rear. Dequeue and Peek front always use the oldest item.</p>
      </div>
      <div className="operation-form">
        <label htmlFor="queue-item-value">Queue value</label>
        <div className="value-row">
          <input
            id="queue-item-value"
            name="queue-item-value"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Example: 12…"
            disabled={disabled}
            aria-describedby={error ? 'queue-input-error' : 'queue-input-hint'}
            aria-invalid={Boolean(error)}
          />
          <span id="queue-input-hint" className="input-hint">
            Signed safe integers, for example 12 or -5
          </span>
        </div>
        <div className="action-grid">
          <button type="button" onClick={onEnqueue} disabled={disabled}>
            Enqueue
          </button>
          <button type="button" onClick={onDequeue} disabled={disabled}>
            Dequeue
          </button>
          <button type="button" onClick={onPeek} disabled={disabled}>
            Peek front
          </button>
          <button type="button" onClick={onInspect} disabled={disabled}>
            Inspect all
          </button>
        </div>
        {error && (
          <p id="queue-input-error" className="input-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="utility-actions">
        <button type="button" className="quiet-button" onClick={onSample} disabled={disabled}>
          Load sample
        </button>
        <button type="button" className="quiet-button danger" onClick={onReset} disabled={disabled}>
          Reset queue
        </button>
      </div>
    </section>
  );
}
