import type { VisualizationStep } from '../domain/visualization';
import type { BstNodeSnapshot, BstSnapshot } from '../structures/bst/BstModel';
import { useKeepInView } from './useKeepInView';

interface BstCanvasProps {
  readonly snapshot: BstSnapshot;
  readonly step?: VisualizationStep<BstSnapshot>;
  readonly zoom?: number;
}

interface PositionedNode {
  readonly node: BstNodeSnapshot;
  readonly x: number;
  readonly y: number;
  readonly depth: number;
}

const NODE_WIDTH = 86;
const NODE_HEIGHT = 54;
const HORIZONTAL_GAP = 86;
const LEVEL_GAP = 94;
const MARGIN_X = 50;
const MARGIN_Y = 44;

function nodeState(nodeId: string, step?: VisualizationStep<BstSnapshot>): string {
  if (step?.matchedNodeIds.includes(nodeId)) return 'matched';
  if (step?.activeNodeIds.includes(nodeId)) return 'active';
  if (step?.visitedNodeIds.includes(nodeId)) return 'visited';
  return 'default';
}

function layoutTree(snapshot: BstSnapshot): readonly PositionedNode[] {
  const byId = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const positioned: PositionedNode[] = [];
  let rank = 0;

  const visit = (nodeId: string | null, depth: number) => {
    if (!nodeId) return;
    const node = byId.get(nodeId);
    if (!node) return;
    visit(node.leftId, depth + 1);
    positioned.push({
      node,
      x: MARGIN_X + rank * HORIZONTAL_GAP,
      y: MARGIN_Y + depth * LEVEL_GAP,
      depth,
    });
    rank += 1;
    visit(node.rightId, depth + 1);
  };

  visit(snapshot.rootId, 0);
  return positioned;
}

function valueFontSize(value: number): number {
  const length = String(value).length;
  if (length <= 5) return 16;
  if (length <= 9) return 12;
  return 9;
}

export function BstCanvas({ snapshot, step, zoom = 1 }: BstCanvasProps) {
  const positioned = snapshot.rootId ? layoutTree(snapshot) : [];
  const focusId = step?.activeNodeIds[0] ?? step?.matchedNodeIds[0] ?? snapshot.rootId;
  const focus = positioned.find((item) => item.node.id === focusId);
  const scrollRef = useKeepInView<HTMLDivElement>(focus ? (focus.x + NODE_WIDTH / 2) * zoom : null);

  if (!snapshot.rootId) {
    return (
      <div className="empty-canvas">
        <div className="empty-tree" aria-hidden="true">
          root
        </div>
        <h2>Your tree is empty</h2>
        <p>Enter an integer and insert it to create the root node.</p>
      </div>
    );
  }

  const byId = new Map(positioned.map((item) => [item.node.id, item]));
  const maxDepth = Math.max(...positioned.map((item) => item.depth));
  const contentWidth = Math.max(
    560,
    (positioned.length - 1) * HORIZONTAL_GAP + MARGIN_X * 2 + NODE_WIDTH,
  );
  const contentHeight = Math.max(300, maxDepth * LEVEL_GAP + MARGIN_Y + NODE_HEIGHT + 48);

  return (
    <div
      ref={scrollRef}
      className="tree-scroll"
      tabIndex={0}
      aria-label="Scrollable binary search tree visualization"
    >
      <svg
        className="tree-svg"
        viewBox={`0 0 ${contentWidth} ${contentHeight}`}
        width={contentWidth * zoom}
        height={contentHeight * zoom}
        role="img"
        aria-labelledby="bst-title bst-description"
      >
        <title id="bst-title">Binary search tree</title>
        <desc id="bst-description">
          {positioned
            .map(
              ({ node }) =>
                `${node.value}${node.count > 1 ? ` repeated ${node.count} times` : ''}${node.leftId ? `, left child ${byId.get(node.leftId)?.node.value}` : ''}${node.rightId ? `, right child ${byId.get(node.rightId)?.node.value}` : ''}`,
            )
            .join('. ')}
        </desc>

        <g className="tree-edges" aria-hidden="true">
          {positioned.flatMap(({ node, x, y }) =>
            [node.leftId, node.rightId]
              .filter((childId): childId is string => Boolean(childId))
              .map((childId) => {
                const child = byId.get(childId);
                return child ? (
                  <line
                    key={`${node.id}-${childId}`}
                    x1={x + NODE_WIDTH / 2}
                    y1={y + NODE_HEIGHT}
                    x2={child.x + NODE_WIDTH / 2}
                    y2={child.y}
                  />
                ) : null;
              }),
          )}
        </g>

        {positioned.map(({ node, x, y, depth }) => {
          const state = nodeState(node.id, step);
          return (
            <g key={node.id} className={`tree-node state-${state}`}>
              {depth === 0 && (
                <text x={x + NODE_WIDTH / 2} y={y - 14} textAnchor="middle" className="node-role">
                  root
                </text>
              )}
              <rect x={x} y={y} width={NODE_WIDTH} height={NODE_HEIGHT} rx="14" />
              <text
                x={x + NODE_WIDTH / 2}
                y={y + 33}
                textAnchor="middle"
                className="tree-value"
                style={{ fontSize: valueFontSize(node.value) }}
              >
                {node.value}
              </text>
              {node.count > 1 && (
                <g className="tree-count">
                  <circle cx={x + NODE_WIDTH - 4} cy={y + 6} r="13" />
                  <text x={x + NODE_WIDTH - 4} y={y + 10} textAnchor="middle">
                    ×{node.count}
                  </text>
                </g>
              )}
              <text
                x={x + NODE_WIDTH / 2}
                y={y + NODE_HEIGHT + 17}
                textAnchor="middle"
                className="node-id"
              >
                {node.id}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="sr-only">
        {positioned.map(({ node }) => (
          <li key={node.id}>
            Value {node.value}, count {node.count}, left child{' '}
            {node.leftId ? byId.get(node.leftId)?.node.value : 'none'}, right child{' '}
            {node.rightId ? byId.get(node.rightId)?.node.value : 'none'}
          </li>
        ))}
      </ul>
    </div>
  );
}
