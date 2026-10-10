interface OperationPanelProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly onInsertHead: () => void;
  readonly onInsertTail: () => void;
  readonly onSearch: () => void;
  readonly onDelete: () => void;
  readonly onTraverse: () => void;
  readonly onSample: () => void;
  readonly onReset: () => void;
  readonly disabled: boolean;
  readonly error: string;
}

export function OperationPanel(props: OperationPanelProps) {
  const {
    value,
    onValueChange,
    onInsertHead,
    onInsertTail,
    onSearch,
    onDelete,
    onTraverse,
    onSample,
    onReset,
    disabled,
    error,
  } = props;

  return (
    <section className="operation-panel" aria-labelledby="operation-heading">
      <div className="operation-copy">
        <h2 id="operation-heading">Choose an operation</h2>
        <p>Integer values may repeat. Search and delete stop at the first match.</p>
      </div>
      <div className="operation-form">
        <label htmlFor="node-value">Node value</label>
        <div className="value-row">
          <input
            id="node-value"
            name="node-value"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Example: 21…"
            disabled={disabled}
            aria-describedby={error ? 'input-error' : 'input-hint'}
            aria-invalid={Boolean(error)}
          />
          <span id="input-hint" className="input-hint">
            Signed safe integers, for example 21 or -8
          </span>
        </div>
        <div className="action-grid">
          <button type="button" onClick={onInsertHead} disabled={disabled}>
            Insert head
          </button>
          <button type="button" onClick={onInsertTail} disabled={disabled}>
            Insert tail
          </button>
          <button type="button" onClick={onSearch} disabled={disabled}>
            Search
          </button>
          <button type="button" onClick={onDelete} disabled={disabled}>
            Delete first
          </button>
          <button type="button" onClick={onTraverse} disabled={disabled}>
            Traverse
          </button>
        </div>
        {error && (
          <p id="input-error" className="input-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="utility-actions">
        <button type="button" className="quiet-button" onClick={onSample} disabled={disabled}>
          Load sample
        </button>
        <button type="button" className="quiet-button danger" onClick={onReset} disabled={disabled}>
          Reset list
        </button>
      </div>
    </section>
  );
}
