import type { VisualizationStep } from '../domain/visualization';
import type { GraphSnapshot } from '../structures/graph/GraphModel';

interface GraphCanvasProps {
  readonly snapshot: GraphSnapshot;
  readonly step?: VisualizationStep<GraphSnapshot>;
  readonly zoom?: number;
}

const VERTEX_RADIUS = 24;
const MARGIN = 18;

function stateOf(id: string, step?: VisualizationStep<GraphSnapshot>): string {
  if (step?.activeNodeIds.includes(id)) return 'active';
  if (step?.matchedNodeIds.includes(id)) return 'matched';
  if (step?.visitedNodeIds.includes(id)) return 'visited';
  return 'default';
}

function layoutRadius(count: number): number {
  return count <= 1 ? 0 : Math.min(160, 70 + count * 9);
}

/**
 * Places vertices evenly on a circle, starting at the top and moving clockwise. The circle
 * grows with the vertex count so neighbouring vertices never overlap at the 12-vertex limit.
 */
function circularLayout(count: number, center: number): readonly { x: number; y: number }[] {
  const radius = layoutRadius(count);
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / count;
    return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
  });
}

export function GraphCanvas({ snapshot, step, zoom = 1 }: GraphCanvasProps) {
  const { vertices, edges, frontier } = snapshot;

  if (vertices.length === 0) {
    return (
      <div className="empty-canvas">
        <div className="empty-graph" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <h2>Your graph is empty</h2>
        <p>Add a few vertices, connect them with edges, or load the sample graph.</p>
      </div>
    );
  }

  const size = 2 * (layoutRadius(vertices.length) + VERTEX_RADIUS + MARGIN);
  const positions = circularLayout(vertices.length, size / 2);
  const positionById = new Map(vertices.map((vertex, index) => [vertex.id, positions[index]]));
  const labelById = new Map(vertices.map((vertex) => [vertex.id, vertex.value]));

  return (
    <div className="graph-wrap">
      <div className="graph-zoom-scroll" tabIndex={0} aria-label="Scrollable graph visualization">
        <svg
          className="graph-svg"
          viewBox={`0 0 ${size} ${size}`}
          style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
          role="img"
          aria-labelledby="graph-title graph-description"
        >
          <title id="graph-title">Undirected graph</title>
          <desc id="graph-description">
            {vertices.length} {vertices.length === 1 ? 'vertex' : 'vertices'} and {edges.length}{' '}
            {edges.length === 1 ? 'edge' : 'edges'}.{' '}
            {edges.length > 0
              ? `Edges: ${edges.map((edge) => `${labelById.get(edge.from)}–${labelById.get(edge.to)}`).join(', ')}.`
              : 'No edges yet.'}
          </desc>

          {edges.map((edge) => {
            const from = positionById.get(edge.from);
            const to = positionById.get(edge.to);
            if (!from || !to) return null;
            return (
              <line
                key={edge.id}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={`graph-edge state-${stateOf(edge.id, step)}`}
              />
            );
          })}

          {vertices.map((vertex) => {
            const { x, y } = positionById.get(vertex.id) as { x: number; y: number };
            return (
              <g key={vertex.id} className={`graph-vertex state-${stateOf(vertex.id, step)}`}>
                <circle cx={x} cy={y} r={VERTEX_RADIUS} />
                <text x={x} y={y + 5} textAnchor="middle" className="graph-value">
                  {vertex.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {frontier && (
        <div className="graph-frontier" aria-live="off">
          <span className="graph-frontier-label">
            {frontier.kind === 'queue' ? 'Queue · front → rear' : 'Call stack · bottom → top'}
          </span>
          <ol aria-label={frontier.kind === 'queue' ? 'BFS queue' : 'DFS call stack'}>
            {frontier.values.length === 0 ? (
              <li className="is-empty">empty</li>
            ) : (
              frontier.values.map((value, index) => <li key={`${value}-${index}`}>{value}</li>)
            )}
          </ol>
        </div>
      )}

      <ul className="sr-only">
        {vertices.map((vertex) => {
          const neighbours = edges
            .filter((edge) => edge.from === vertex.id || edge.to === vertex.id)
            .map((edge) => labelById.get(edge.from === vertex.id ? edge.to : edge.from))
            .sort((a, b) => (a as number) - (b as number));
          return (
            <li key={vertex.id}>
              Vertex {vertex.value}:{' '}
              {neighbours.length ? `connected to ${neighbours.join(', ')}` : 'no edges'}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
