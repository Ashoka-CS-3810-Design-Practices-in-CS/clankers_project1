import { COMPLEXITY_TABLE } from '../registry/complexities';
import type { AvailableStructureId } from '../App';

interface ComplexityPageProps {
  readonly active: boolean;
  readonly onOpenStructure: (id: AvailableStructureId) => void;
}

export function ComplexityPage({ active, onOpenStructure }: ComplexityPageProps) {
  return (
    <main
      className="workspace complexity-page"
      id={active ? 'main-content' : undefined}
      hidden={!active}
    >
      <header className="workspace-header">
        <div>
          <h1>Complexities</h1>
          <p>
            Worst-case time and auxiliary space for every operation in the visualizer. These are the
            same values each operation shows in its complexity panel while it plays.
          </p>
        </div>
      </header>

      <div className="complexity-sections">
        {COMPLEXITY_TABLE.map((structure) => {
          const headingId = `complexity-${structure.id}`;
          return (
            <section key={structure.id} className="complexity-section" aria-labelledby={headingId}>
              <div className="complexity-section-head">
                <div>
                  <h2 id={headingId}>{structure.label}</h2>
                  <p>{structure.sizeNote}</p>
                </div>
                <button
                  type="button"
                  className="quiet-button"
                  onClick={() => onOpenStructure(structure.id)}
                >
                  Open <span className="sr-only">{structure.label}</span> workspace
                </button>
              </div>
              <div
                className="complexity-table-scroll"
                tabIndex={0}
                role="region"
                aria-label={`${structure.label} complexity table, scrollable`}
              >
                <table className="complexity-table">
                  <thead>
                    <tr>
                      <th scope="col">Operation</th>
                      <th scope="col">Time</th>
                      <th scope="col">Space</th>
                      <th scope="col">Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structure.rows.map((row) => (
                      <tr key={row.operation}>
                        <th scope="row">{row.operation}</th>
                        <td className="complexity-value">{row.complexity.time}</td>
                        <td className="complexity-value">{row.complexity.space}</td>
                        <td>{row.complexity.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      <p className="complexity-footnote">
        Space is the extra memory an operation needs, not the structure itself. Traversals and
        Inspect all are O(n) space because they keep their output for display.
      </p>
    </main>
  );
}
