import type { ComplexityInfo, OperationStatus, VisualizationStep } from '../domain/visualization';
import type { LinkedListSnapshot } from '../structures/linked-list/LinkedListModel';

interface InspectorProps {
  readonly operationLabel?: string;
  readonly complexity?: ComplexityInfo;
  readonly status?: OperationStatus;
  readonly step?: VisualizationStep<LinkedListSnapshot>;
}

export function Inspector({ operationLabel, complexity, status, step }: InspectorProps) {
  return (
    <aside className="inspector" aria-label="Operation inspector">
      <section className="inspector-section current-step">
        <div className="section-heading-row">
          <h2>Current step</h2>
          {operationLabel && <span className="operation-name">{operationLabel}</span>}
        </div>
        <p className="step-message" aria-live="polite">
          {step?.message ?? 'Choose an operation to generate a trace.'}
        </p>
        {status === 'not-found' && step && <p className="status-note">Result: target not found</p>}
      </section>

      <section className="inspector-section">
        <h2>Complexity</h2>
        {complexity ? (
          <>
            <dl className="complexity-grid">
              <div>
                <dt>Worst-case time</dt>
                <dd>{complexity.time}</dd>
              </div>
              <div>
                <dt>Auxiliary space</dt>
                <dd>{complexity.space}</dd>
              </div>
            </dl>
            <p className="complexity-note">{complexity.explanation}</p>
          </>
        ) : (
          <p className="muted-copy">Complexity appears here when an operation starts.</p>
        )}
      </section>

      <section className="inspector-section">
        <h2>Traversal output</h2>
        {step?.output.length ? (
          <output className="traversal-output" aria-label="Traversal output">
            {step.output.map((value, index) => (
              <span key={`${value}-${index}`}>{value}</span>
            ))}
          </output>
        ) : (
          <p className="muted-copy">Run Traverse to collect values from head to null.</p>
        )}
      </section>

      <section className="legend" aria-label="Visualization legend">
        <span>
          <i className="legend-swatch active" />
          Current
        </span>
        <span>
          <i className="legend-swatch visited" />
          Visited
        </span>
        <span>
          <i className="legend-swatch matched" />
          Matched
        </span>
      </section>
    </aside>
  );
}
