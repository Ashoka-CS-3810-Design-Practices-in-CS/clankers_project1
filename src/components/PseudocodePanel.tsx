import { useEffect, useRef } from 'react';
import type { PseudocodeDefinition } from '../domain/pseudocode';
import type { VisualizationStep } from '../domain/visualization';

interface PseudocodePanelProps {
  readonly definition?: PseudocodeDefinition;
  readonly steps: readonly VisualizationStep<unknown>[];
  readonly index: number;
}

export function PseudocodePanel({ definition, steps, index }: PseudocodePanelProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const current = steps[index]?.pseudocodeLineId;
  const executed = new Set(steps.slice(0, index).map((step) => step.pseudocodeLineId));
  const activeLine = definition?.lines.find((line) => line.id === current);

  useEffect(() => {
    const container = viewport.current;
    const line = container?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!container || !line) return;
    const bounds = container.getBoundingClientRect();
    const row = line.getBoundingClientRect();
    // Scroll only this panel; never move the workspace or steal keyboard focus.
    if (row.top < bounds.top) container.scrollTop -= bounds.top - row.top;
    else if (row.bottom > bounds.bottom) container.scrollTop += row.bottom - bounds.bottom;
  }, [current, definition, index]);

  return (
    <section className="pseudocode-panel" aria-label="Operation pseudocode">
      <div className="pseudocode-heading">
        <h2>Pseudocode</h2>
        <p>{definition?.title ?? 'Choose an operation to follow its algorithm.'}</p>
      </div>
      {definition && (
        <>
          <div
            className="pseudocode-scroll"
            ref={viewport}
            tabIndex={0}
            role="region"
            aria-label="Scrollable pseudocode"
          >
            <ol className="pseudocode-lines">
              {definition.lines.map((line, number) => {
                const state =
                  line.id === current ? 'active' : executed.has(line.id) ? 'executed' : 'pending';
                return (
                  <li
                    key={line.id}
                    data-state={state}
                    aria-current={state === 'active' ? 'step' : undefined}
                  >
                    <span className="pseudocode-marker" aria-hidden="true">
                      {state === 'active' ? '→' : state === 'executed' ? '✓' : '·'}
                    </span>
                    <span className="pseudocode-number" aria-hidden="true">
                      {number + 1}
                    </span>
                    <span className="sr-only">{state}: </span>
                    <code style={{ paddingInlineStart: `${line.indent * 2}ch` }}>{line.text}</code>
                  </li>
                );
              })}
            </ol>
          </div>
          <p className="pseudocode-status" role="status" aria-live="polite" aria-atomic="true">
            {activeLine
              ? `Currently executing: ${activeLine.text}`
              : 'Ready to follow this operation.'}
          </p>
          <p className="pseudocode-key">→ Current · ✓ Executed · · Pending</p>
        </>
      )}
    </section>
  );
}
