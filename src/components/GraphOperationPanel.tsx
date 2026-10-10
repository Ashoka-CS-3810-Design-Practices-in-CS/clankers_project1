interface GraphOperationPanelProps {
  readonly vertex: string;
  readonly target: string;
  readonly onVertexChange: (value: string) => void;
  readonly onTargetChange: (value: string) => void;
  readonly onAddVertex: () => void;
  readonly onRemoveVertex: () => void;
  readonly onAddEdge: () => void;
  readonly onRemoveEdge: () => void;
  readonly onBfs: () => void;
  readonly onDfs: () => void;
  readonly onSample: () => void;
  readonly onReset: () => void;
  readonly disabled: boolean;
  readonly error: string;
}

export function GraphOperationPanel({
  vertex,
  target,
  onVertexChange,
  onTargetChange,
  onAddVertex,
  onRemoveVertex,
  onAddEdge,
  onRemoveEdge,
  onBfs,
  onDfs,
  onSample,
  onReset,
  disabled,
  error,
}: GraphOperationPanelProps) {
  const describedBy = error ? 'graph-input-error' : 'graph-input-hint';
  return (
    <section className="operation-panel" aria-labelledby="graph-operation-heading">
      <div className="operation-copy">
        <h2 id="graph-operation-heading">Choose an operation</h2>
        <p>
          Vertex operations and BFS/DFS use the first field. Edge operations connect both fields.
        </p>
      </div>
      <div className="operation-form">
        <div className="graph-fields">
          <div>
            <label htmlFor="graph-vertex-value">Vertex</label>
            <input
              id="graph-vertex-value"
              name="graph-vertex-value"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              value={vertex}
              onChange={(event) => onVertexChange(event.target.value)}
              placeholder="Example: 1…"
              disabled={disabled}
              aria-describedby={describedBy}
              aria-invalid={Boolean(error)}
            />
          </div>
          <div>
            <label htmlFor="graph-target-value">Second vertex (edges)</label>
            <input
              id="graph-target-value"
              name="graph-target-value"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              value={target}
              onChange={(event) => onTargetChange(event.target.value)}
              placeholder="Example: 4…"
              disabled={disabled}
              aria-describedby={describedBy}
              aria-invalid={Boolean(error)}
            />
          </div>
        </div>
        <span id="graph-input-hint" className="input-hint">
          Unique integer labels from -999 to 999, maximum 12 vertices
        </span>
        <div className="action-grid">
          <button type="button" onClick={onAddVertex} disabled={disabled}>
            Add vertex
          </button>
          <button type="button" onClick={onRemoveVertex} disabled={disabled}>
            Remove vertex
          </button>
          <button type="button" onClick={onAddEdge} disabled={disabled}>
            Add edge
          </button>
          <button type="button" onClick={onRemoveEdge} disabled={disabled}>
            Remove edge
          </button>
          <button type="button" onClick={onBfs} disabled={disabled}>
            BFS
          </button>
          <button type="button" onClick={onDfs} disabled={disabled}>
            DFS
          </button>
        </div>
        {error && (
          <p id="graph-input-error" className="input-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="utility-actions">
        <button type="button" className="quiet-button" onClick={onSample} disabled={disabled}>
          Load sample
        </button>
        <button type="button" className="quiet-button danger" onClick={onReset} disabled={disabled}>
          Reset graph
        </button>
      </div>
    </section>
  );
}
