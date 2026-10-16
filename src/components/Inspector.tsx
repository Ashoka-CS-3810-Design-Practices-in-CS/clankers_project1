import type { ComplexityInfo, OperationStatus, VisualizationStep } from '../domain/visualization';

interface InspectorProps<TSnapshot> {
  readonly operationLabel?: string;
  readonly complexity?: ComplexityInfo;
  readonly status?: OperationStatus;
  readonly step?: VisualizationStep<TSnapshot>;
  readonly outputHeading: string;
  readonly emptyOutputCopy: string;
  readonly matchedLabel?: string;
  readonly pseudocode?: readonly string[];
  /** Marks a line as the bug once a spot-the-bug answer is revealed. */
  readonly buggyLine?: number;
}

export function Inspector<TSnapshot>({
  operationLabel,
  complexity,
  status,
  step,
  outputHeading,
  emptyOutputCopy,
  matchedLabel = 'Matched',
  pseudocode,
  buggyLine,
}: InspectorProps<TSnapshot>) {
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
        {status === 'blocked' && step && (
          <p className="status-note">Result: operation unavailable</p>
        )}
      </section>

      {pseudocode && pseudocode.length > 0 && (
        <section
          className="inspector-section pseudocode-section"
          aria-labelledby="pseudocode-heading"
        >
          <h2 id="pseudocode-heading">Pseudocode</h2>
          <ol className="pseudocode">
            {pseudocode.map((line, index) => {
              const current = step?.line === index + 1;
              const buggy = buggyLine === index + 1;
              const className = [current && 'is-current', buggy && 'is-buggy']
                .filter(Boolean)
                .join(' ');
              return (
                <li
                  key={`${index}-${line}`}
                  className={className || undefined}
                  aria-current={current ? 'step' : undefined}
                >
                  <code>{line}</code>
                </li>
              );
            })}
          </ol>
        </section>
      )}

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
        <h2>{outputHeading}</h2>
        {step?.output.length ? (
          <output className="traversal-output" aria-label={outputHeading}>
            {step.output.map((value, index) => (
              <span key={`${value}-${index}`}>{value}</span>
            ))}
          </output>
        ) : (
          <p className="muted-copy">{emptyOutputCopy}</p>
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
          {matchedLabel}
        </span>
      </section>
    </aside>
  );
}
