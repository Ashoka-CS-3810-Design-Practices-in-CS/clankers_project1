import type { LinkedListSnapshot } from '../structures/linked-list/LinkedListModel';
import type { VisualizationStep } from '../domain/visualization';

interface LinkedListCanvasProps {
  readonly snapshot: LinkedListSnapshot;
  readonly step?: VisualizationStep<LinkedListSnapshot>;
  readonly zoom?: number;
}

const MIN_VALUE_WIDTH = 70;
const POINTER_WIDTH = 34;
const VALUE_CHARACTER_WIDTH = 11;
const VALUE_PADDING = 24;
const NODE_HEIGHT = 66;
const NODE_GAP = 72;

function nodeState(nodeId: string, step?: VisualizationStep<LinkedListSnapshot>): string {
  if (step?.matchedNodeIds.includes(nodeId)) return 'matched';
  if (step?.activeNodeIds.includes(nodeId)) return 'active';
  if (step?.visitedNodeIds.includes(nodeId)) return 'visited';
  return 'default';
}

export function LinkedListCanvas({ snapshot, step, zoom = 1 }: LinkedListCanvasProps) {
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

  let nextX = 38;
  const positionedNodes = [];
  for (const node of snapshot.nodes) {
    // Reserve room for every digit and the sign at the existing 17px monospace size.
    const valueWidth = Math.max(
      MIN_VALUE_WIDTH,
      String(node.value).length * VALUE_CHARACTER_WIDTH + VALUE_PADDING,
    );
    const width = valueWidth + POINTER_WIDTH;
    positionedNodes.push({ node, x: nextX, valueWidth, width });
    nextX += width + NODE_GAP;
  }
  const contentWidth = nextX + 52;

  return (
    <div className="canvas-scroll" tabIndex={0} aria-label="Scrollable linked list visualization">
      <svg
        className="list-svg"
        viewBox={`0 0 ${contentWidth} 210`}
        width={contentWidth * zoom}
        height={210 * zoom}
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
        {positionedNodes.map(({ node, x, valueWidth, width }, index) => {
          const state = nodeState(node.id, step);
          const isLast = index === snapshot.nodes.length - 1;
          return (
            <g key={node.id} className={`list-node state-${state}`}>
              {index === 0 && (
                <text x={x + width / 2} y="30" textAnchor="middle" className="node-role">
                  head
                </text>
              )}
              <rect x={x} y="62" width={width} height={NODE_HEIGHT} rx="12" />
              <line
                x1={x + valueWidth}
                y1="62"
                x2={x + valueWidth}
                y2="128"
                className="node-divider"
              />
              <text x={x + valueWidth / 2} y="102" textAnchor="middle" className="node-value">
                {node.value}
              </text>
              <circle
                cx={x + valueWidth + POINTER_WIDTH / 2}
                cy="95"
                r="5"
                className="pointer-port"
              />
              {!isLast && (
                <line
                  x1={x + width}
                  y1="95"
                  x2={x + width + NODE_GAP - 12}
                  y2="95"
                  className="link-line"
                  markerEnd="url(#arrow)"
                />
              )}
              {isLast && (
                <>
                  <line x1={x + width} y1="95" x2={x + width + 38} y2="95" className="link-line" />
                  <text x={x + width + 46} y="101" className="null-label">
                    null
                  </text>
                </>
              )}
              <text x={x + width / 2} y="157" textAnchor="middle" className="node-id">
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
