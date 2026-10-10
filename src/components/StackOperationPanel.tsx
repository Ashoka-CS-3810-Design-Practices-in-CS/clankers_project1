interface StackOperationPanelProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly onPush: () => void;
  readonly onPop: () => void;
  readonly onPeek: () => void;
  readonly onInspect: () => void;
  readonly onSample: () => void;
  readonly onReset: () => void;
  readonly disabled: boolean;
  readonly error: string;
}

export function StackOperationPanel({
  value,
  onValueChange,
  onPush,
  onPop,
  onPeek,
  onInspect,
  onSample,
  onReset,
  disabled,
  error,
}: StackOperationPanelProps) {
  return (
    <section className="operation-panel" aria-labelledby="stack-operation-heading">
      <div className="operation-copy">
        <h2 id="stack-operation-heading">Choose an operation</h2>
        <p>Push adds to the top. Pop and Peek always use the most recent item.</p>
      </div>
      <div className="operation-form">
        <label htmlFor="stack-item-value">Item value</label>
        <div className="value-row">
          <input
            id="stack-item-value"
            name="stack-item-value"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Example: 21…"
            disabled={disabled}
            aria-describedby={error ? 'stack-input-error' : 'stack-input-hint'}
            aria-invalid={Boolean(error)}
          />
          <span id="stack-input-hint" className="input-hint">
            Signed safe integers, for example 21 or -8
          </span>
        </div>
        <div className="action-grid">
          <button type="button" onClick={onPush} disabled={disabled}>
            Push
          </button>
          <button type="button" onClick={onPop} disabled={disabled}>
            Pop
          </button>
          <button type="button" onClick={onPeek} disabled={disabled}>
            Peek
          </button>
          <button type="button" onClick={onInspect} disabled={disabled}>
            Inspect all
          </button>
        </div>
        {error && (
          <p id="stack-input-error" className="input-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="utility-actions">
        <button type="button" className="quiet-button" onClick={onSample} disabled={disabled}>
          Load sample
        </button>
        <button type="button" className="quiet-button danger" onClick={onReset} disabled={disabled}>
          Reset stack
        </button>
      </div>
    </section>
  );
}
