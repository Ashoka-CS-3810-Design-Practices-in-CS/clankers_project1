import type { LinkedListSnapshot } from '../structures/linked-list/LinkedListModel';
import type { VisualizationStep } from '../domain/visualization';

interface LinkedListCanvasProps {
  readonly snapshot: LinkedListSnapshot;
  readonly step?: VisualizationStep<LinkedListSnapshot>;
}

const NODE_WIDTH = 104;
const NODE_HEIGHT = 66;
const NODE_GAP = 72;

function nodeState(nodeId: string, step?: VisualizationStep<LinkedListSnapshot>): string {
  if (step?.matchedNodeIds.includes(nodeId)) return 'matched';
  if (step?.activeNodeIds.includes(nodeId)) return 'active';
  if (step?.visitedNodeIds.includes(nodeId)) return 'visited';
  return 'default';
}

export function LinkedListCanvas({ snapshot, step }: LinkedListCanvasProps) {
  if (snapshot.nodes.length === 0) {
    return (
      <div className="empty-canvas">
        <div className="empty-node" aria-hidden="true">
          null
        </div>
        <h2>Your list is empty</h2>
        <p>Enter an integer and insert it at the head or tail to create the first node.</p>
      </div>
    );
  }

  const contentWidth = snapshot.nodes.length * (NODE_WIDTH + NODE_GAP) + 90;

  return (
    <div className="canvas-scroll" tabIndex={0} aria-label="Scrollable linked list visualization">
      <svg
        className="list-svg"
        viewBox={`0 0 ${contentWidth} 210`}
        width={contentWidth}
        height="210"
        role="img"
        aria-labelledby="list-title list-description"
      >
        <title id="list-title">Singly linked list</title>
        <desc id="list-description">
          {snapshot.nodes.map((node) => node.value).join(' followed by ')} followed by null
        </desc>
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <path d="M 0 0 L 10 4 L 0 8 Z" className="arrow-head" />
          </marker>
        </defs>
        {snapshot.nodes.map((node, index) => {
          const x = 38 + index * (NODE_WIDTH + NODE_GAP);
          const state = nodeState(node.id, step);
          const isLast = index === snapshot.nodes.length - 1;
          return (
            <g key={node.id} className={`list-node state-${state}`}>
              {index === 0 && (
                <text x={x + NODE_WIDTH / 2} y="30" textAnchor="middle" className="node-role">
                  head
                </text>
              )}
              <rect x={x} y="62" width={NODE_WIDTH} height={NODE_HEIGHT} rx="12" />
              <line x1={x + 70} y1="62" x2={x + 70} y2="128" className="node-divider" />
              <text x={x + 35} y="102" textAnchor="middle" className="node-value">
                {node.value}
              </text>
              <circle cx={x + 86} cy="95" r="5" className="pointer-port" />
              {!isLast && (
                <line
                  x1={x + NODE_WIDTH}
                  y1="95"
                  x2={x + NODE_WIDTH + NODE_GAP - 12}
                  y2="95"
                  className="link-line"
                  markerEnd="url(#arrow)"
                />
              )}
              {isLast && (
                <>
                  <line
                    x1={x + NODE_WIDTH}
                    y1="95"
                    x2={x + NODE_WIDTH + 38}
                    y2="95"
                    className="link-line"
                  />
                  <text x={x + NODE_WIDTH + 46} y="101" className="null-label">
                    null
                  </text>
                </>
              )}
              <text x={x + NODE_WIDTH / 2} y="157" textAnchor="middle" className="node-id">
                {node.id}
              </text>
            </g>
          );
        })}
      </svg>
      <ol className="sr-only">
        {snapshot.nodes.map((node, index) => (
          <li key={node.id}>
            Node {index + 1}: value {node.value}
          </li>
        ))}
      </ol>
    </div>
  );
}
