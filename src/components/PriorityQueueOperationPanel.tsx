interface PriorityQueueOperationPanelProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly onInsert: () => void;
  readonly onExtract: () => void;
  readonly onPeek: () => void;
  readonly onSample: () => void;
  readonly onReset: () => void;
  readonly disabled: boolean;
  readonly error: string;
}

export function PriorityQueueOperationPanel({
  value,
  onValueChange,
  onInsert,
  onExtract,
  onPeek,
  onSample,
  onReset,
  disabled,
  error,
}: PriorityQueueOperationPanelProps) {
  return (
    <section className="operation-panel" aria-labelledby="pq-operation-heading">
      <div className="operation-copy">
        <h2 id="pq-operation-heading">Choose an operation</h2>
        <p>Smaller values have higher priority. Extract min always removes the smallest value.</p>
      </div>
      <div className="operation-form">
        <label htmlFor="pq-item-value">Priority value</label>
        <div className="value-row">
          <input
            id="pq-item-value"
            name="pq-item-value"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Example: 4…"
            disabled={disabled}
            aria-describedby={error ? 'pq-input-error' : 'pq-input-hint'}
            aria-invalid={Boolean(error)}
          />
          <span id="pq-input-hint" className="input-hint">
            Signed safe integers, for example 4 or -2
          </span>
        </div>
        <div className="action-grid">
          <button type="button" onClick={onInsert} disabled={disabled}>
            Insert
          </button>
          <button type="button" onClick={onExtract} disabled={disabled}>
            Extract min
          </button>
          <button type="button" onClick={onPeek} disabled={disabled}>
            Peek min
          </button>
        </div>
        {error && (
          <p id="pq-input-error" className="input-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="utility-actions">
        <button type="button" className="quiet-button" onClick={onSample} disabled={disabled}>
          Load sample
        </button>
        <button type="button" className="quiet-button danger" onClick={onReset} disabled={disabled}>
          Reset priority queue
        </button>
      </div>
    </section>
  );
}
