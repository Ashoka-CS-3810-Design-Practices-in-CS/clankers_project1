import type { VisualizationStep } from '../domain/visualization';
import type { QueueSnapshot } from '../structures/queue/QueueModel';

interface QueueCanvasProps {
  readonly snapshot: QueueSnapshot;
  readonly step?: VisualizationStep<QueueSnapshot>;
  readonly zoom?: number;
}

const ITEM_WIDTH = 96;
const ITEM_HEIGHT = 58;
const ITEM_GAP = 14;
const EDGE = 104;
const ITEM_Y = 66;
const FLOW_Y = ITEM_Y + ITEM_HEIGHT / 2;
const SVG_HEIGHT = 180;

function itemState(itemId: string, step?: VisualizationStep<QueueSnapshot>): string {
  if (step?.matchedNodeIds.includes(itemId)) return 'matched';
  if (step?.activeNodeIds.includes(itemId)) return 'active';
  if (step?.visitedNodeIds.includes(itemId)) return 'visited';
  return 'default';
}

function roleLabel(index: number, count: number): string | null {
  if (count === 1) return 'front · rear';
  if (index === 0) return 'front';
  if (index === count - 1) return 'rear';
  return null;
}

export function QueueCanvas({ snapshot, step, zoom = 1 }: QueueCanvasProps) {
  const { items } = snapshot;

  if (items.length === 0) {
    return (
      <div className="empty-canvas">
        <div className="empty-queue" aria-hidden="true">
          front · rear
        </div>
        <h2>Your queue is empty</h2>
        <p>Enter an integer and enqueue it to create the first item.</p>
      </div>
    );
  }

  const lastX = EDGE + (items.length - 1) * (ITEM_WIDTH + ITEM_GAP);
  const contentWidth = lastX + ITEM_WIDTH + EDGE;

  return (
    <div className="canvas-scroll" tabIndex={0} aria-label="Scrollable queue visualization">
      <svg
        className="queue-svg"
        viewBox={`0 0 ${contentWidth} ${SVG_HEIGHT}`}
        width={contentWidth * zoom}
        height={SVG_HEIGHT * zoom}
        role="img"
        aria-labelledby="queue-title queue-description"
      >
        <title id="queue-title">Queue from front to rear</title>
        <desc id="queue-description">
          Front {items.map((item) => item.value).join(', then ')} at the rear
        </desc>
        <defs>
          <marker
            id="queue-arrow"
            markerWidth="10"
            markerHeight="8"
            refX="9"
            refY="4"
            orient="auto"
          >
            <path d="M 0 0 L 10 4 L 0 8 Z" className="arrow-head" />
          </marker>
        </defs>

        <line
          x1={EDGE - 12}
          y1={FLOW_Y}
          x2="22"
          y2={FLOW_Y}
          className="queue-flow"
          markerEnd="url(#queue-arrow)"
        />
        <text x={(EDGE - 12 + 22) / 2} y={FLOW_Y + 24} textAnchor="middle" className="node-role">
          dequeue
        </text>

        <line
          x1={contentWidth - 22}
          y1={FLOW_Y}
          x2={lastX + ITEM_WIDTH + 12}
          y2={FLOW_Y}
          className="queue-flow"
          markerEnd="url(#queue-arrow)"
        />
        <text
          x={(contentWidth - 22 + lastX + ITEM_WIDTH + 12) / 2}
          y={FLOW_Y + 24}
          textAnchor="middle"
          className="node-role"
        >
          enqueue
        </text>

        {items.map((item, index) => {
          const x = EDGE + index * (ITEM_WIDTH + ITEM_GAP);
          const state = itemState(item.id, step);
          const role = roleLabel(index, items.length);
          return (
            <g key={item.id} className={`queue-item state-${state}`}>
              {role && (
                <text
                  x={x + ITEM_WIDTH / 2}
                  y={ITEM_Y - 18}
                  textAnchor="middle"
                  className="node-role"
                >
                  {role}
                </text>
              )}
              <rect x={x} y={ITEM_Y} width={ITEM_WIDTH} height={ITEM_HEIGHT} rx="10" />
              <text
                x={x + ITEM_WIDTH / 2}
                y={ITEM_Y + 35}
                textAnchor="middle"
                className="node-value"
              >
                {item.value}
              </text>
              <text
                x={x + ITEM_WIDTH / 2}
                y={ITEM_Y + ITEM_HEIGHT + 24}
                textAnchor="middle"
                className="node-id"
              >
                {item.id}
              </text>
            </g>
          );
        })}
      </svg>
      <ol className="sr-only">
        {items.map((item, index) => (
          <li key={item.id}>
            Queue position {index + 1} from the front: value {item.value}
          </li>
        ))}
      </ol>
    </div>
  );
}
