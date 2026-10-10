import type { TraversalOrder } from '../structures/bst/BstModel';

interface BstOperationPanelProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly onInsert: () => void;
  readonly onSearch: () => void;
  readonly onDelete: () => void;
  readonly onTraverse: (order: TraversalOrder) => void;
  readonly onSample: () => void;
  readonly onReset: () => void;
  readonly disabled: boolean;
  readonly error: string;
}

export function BstOperationPanel({
  value,
  onValueChange,
  onInsert,
  onSearch,
  onDelete,
  onTraverse,
  onSample,
  onReset,
  disabled,
  error,
}: BstOperationPanelProps) {
  return (
    <section className="operation-panel" aria-labelledby="bst-operation-heading">
      <div className="operation-copy">
        <h2 id="bst-operation-heading">Choose an operation</h2>
        <p>
          Smaller values branch left and larger values branch right. Duplicates increase a count.
        </p>
      </div>
      <div className="operation-form">
        <label htmlFor="bst-node-value">Tree node value</label>
        <div className="value-row">
          <input
            id="bst-node-value"
            name="bst-node-value"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Example: 42…"
            disabled={disabled}
            aria-describedby={error ? 'bst-input-error' : 'bst-input-hint'}
            aria-invalid={Boolean(error)}
          />
          <span id="bst-input-hint" className="input-hint">
            Signed safe integers, maximum 31 distinct nodes
          </span>
        </div>
        <div className="action-grid">
          <button type="button" onClick={onInsert} disabled={disabled}>
            Insert
          </button>
          <button type="button" onClick={onSearch} disabled={disabled}>
            Search
          </button>
          <button type="button" onClick={onDelete} disabled={disabled}>
            Delete
          </button>
          <button type="button" onClick={() => onTraverse('inorder')} disabled={disabled}>
            Inorder
          </button>
          <button type="button" onClick={() => onTraverse('preorder')} disabled={disabled}>
            Preorder
          </button>
          <button type="button" onClick={() => onTraverse('postorder')} disabled={disabled}>
            Postorder
          </button>
        </div>
        {error && (
          <p id="bst-input-error" className="input-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="utility-actions">
        <button type="button" className="quiet-button" onClick={onSample} disabled={disabled}>
          Load sample
        </button>
        <button type="button" className="quiet-button danger" onClick={onReset} disabled={disabled}>
          Reset tree
        </button>
      </div>
    </section>
  );
}
