import type { VisualizationStep } from '../domain/visualization';
import {
  parentIndex,
  type PriorityQueueSnapshot,
} from '../structures/priority-queue/PriorityQueueModel';

interface PriorityQueueCanvasProps {
  readonly snapshot: PriorityQueueSnapshot;
  readonly step?: VisualizationStep<PriorityQueueSnapshot>;
}

const SLOT_WIDTH = 64;
const MIN_WIDTH = 440;
const NODE_RADIUS = 22;
const TOP = 46;
const LEVEL_HEIGHT = 78;
const CELL_WIDTH = 46;
const CELL_HEIGHT = 40;

function itemState(itemId: string, step?: VisualizationStep<PriorityQueueSnapshot>): string {
  if (step?.matchedNodeIds.includes(itemId)) return 'matched';
  if (step?.activeNodeIds.includes(itemId)) return 'active';
  if (step?.visitedNodeIds.includes(itemId)) return 'visited';
  return 'default';
}

function levelOf(index: number): number {
  return Math.floor(Math.log2(index + 1));
}

export function PriorityQueueCanvas({ snapshot, step }: PriorityQueueCanvasProps) {
  const { items } = snapshot;

  if (items.length === 0) {
    return (
      <div className="empty-canvas">
        <div className="empty-heap" aria-hidden="true">
          root
        </div>
        <h2>Your priority queue is empty</h2>
        <p>Enter an integer and insert it. Smaller values have higher priority.</p>
      </div>
    );
  }

  const levels = levelOf(items.length - 1) + 1;
  const treeWidth = Math.max(MIN_WIDTH, 2 ** (levels - 1) * SLOT_WIDTH);
  const arrayWidth = items.length * CELL_WIDTH + 80;
  const contentWidth = Math.max(treeWidth, arrayWidth);
  const treeOffset = (contentWidth - treeWidth) / 2;
  const treeBottom = TOP + (levels - 1) * LEVEL_HEIGHT + NODE_RADIUS;
  const arrayTop = treeBottom + 74;
  const contentHeight = arrayTop + CELL_HEIGHT + 34;
  const arrayLeft = (contentWidth - items.length * CELL_WIDTH) / 2;

  const position = (index: number) => {
    const level = levelOf(index);
    const offsetInLevel = index - (2 ** level - 1);
    const slots = 2 ** level;
    return {
      x: treeOffset + ((offsetInLevel + 0.5) * treeWidth) / slots,
      y: TOP + level * LEVEL_HEIGHT,
    };
  };

  return (
    <div
      className="canvas-scroll heap-scroll"
      tabIndex={0}
      aria-label="Scrollable heap visualization"
    >
      <svg
        className="heap-svg"
        viewBox={`0 0 ${contentWidth} ${contentHeight}`}
        width={contentWidth}
        height={contentHeight}
        role="img"
        aria-labelledby="heap-title heap-description"
      >
        <title id="heap-title">Binary min-heap as a tree and as an array</title>
        <desc id="heap-description">
          Heap array in index order: {items.map((item) => item.value).join(', ')}. The root is{' '}
          {items[0].value}.
        </desc>

        {items.map((item, index) => {
          if (index === 0) return null;
          const child = position(index);
          const parent = position(parentIndex(index));
          return (
            <line
              key={`edge-${item.id}`}
              x1={parent.x}
              y1={parent.y}
              x2={child.x}
              y2={child.y}
              className="heap-edge"
            />
          );
        })}

        {items.map((item, index) => {
          const { x, y } = position(index);
          return (
            <g key={item.id} className={`heap-node state-${itemState(item.id, step)}`}>
              {index === 0 && (
                <text x={x} y={y - NODE_RADIUS - 10} textAnchor="middle" className="node-role">
                  min
                </text>
              )}
              <circle cx={x} cy={y} r={NODE_RADIUS} />
              <text x={x} y={y + 5} textAnchor="middle" className="heap-value">
                {item.value}
              </text>
            </g>
          );
        })}

        <text x={arrayLeft} y={arrayTop - 26} className="node-role">
          heap array
        </text>
        {items.map((item, index) => {
          const x = arrayLeft + index * CELL_WIDTH;
          return (
            <g key={`cell-${item.id}`} className={`heap-cell state-${itemState(item.id, step)}`}>
              <text x={x + CELL_WIDTH / 2} y={arrayTop - 8} textAnchor="middle" className="node-id">
                {index}
              </text>
              <rect x={x} y={arrayTop} width={CELL_WIDTH} height={CELL_HEIGHT} />
              <text
                x={x + CELL_WIDTH / 2}
                y={arrayTop + 25}
                textAnchor="middle"
                className="heap-value"
              >
                {item.value}
              </text>
            </g>
          );
        })}
      </svg>
      <ol className="sr-only">
        {items.map((item, index) => (
          <li key={item.id}>
            Index {index}: value {item.value}
            {index === 0 ? ', the minimum' : `, child of index ${parentIndex(index)}`}
          </li>
        ))}
      </ol>
    </div>
  );
}
