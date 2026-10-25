import type { VisualizationStep } from '../domain/visualization';
import type { StackSnapshot } from '../structures/stack/StackModel';

interface StackCanvasProps {
  readonly snapshot: StackSnapshot;
  readonly step?: VisualizationStep<StackSnapshot>;
  readonly zoom?: number;
}

const ITEM_WIDTH = 230;
const ITEM_HEIGHT = 52;
const ITEM_GAP = 10;

function itemState(itemId: string, step?: VisualizationStep<StackSnapshot>): string {
  if (step?.matchedNodeIds.includes(itemId)) return 'matched';
  if (step?.activeNodeIds.includes(itemId)) return 'active';
  if (step?.visitedNodeIds.includes(itemId)) return 'visited';
  return 'default';
}

export function StackCanvas({ snapshot, step, zoom = 1 }: StackCanvasProps) {
  if (snapshot.items.length === 0) {
    return (
      <div className="empty-canvas">
        <div className="empty-stack" aria-hidden="true">
          top
        </div>
        <h2>Your stack is empty</h2>
        <p>Enter an integer and push it to create the first item.</p>
      </div>
    );
  }

  const topFirstItems = [...snapshot.items].reverse();
  const contentHeight = topFirstItems.length * (ITEM_HEIGHT + ITEM_GAP) + 72;

  return (
    <div className="stack-scroll" tabIndex={0} aria-label="Scrollable stack visualization">
      <svg
        className="stack-svg"
        viewBox={`0 0 420 ${contentHeight}`}
        width={420 * zoom}
        height={contentHeight * zoom}
        role="img"
        aria-labelledby="stack-title stack-description"
      >
        <title id="stack-title">Stack from top to bottom</title>
        <desc id="stack-description">
          {topFirstItems.map((item) => item.value).join(' above ')}
        </desc>
        {topFirstItems.map((item, index) => {
          const x = (420 - ITEM_WIDTH) / 2;
          const y = 42 + index * (ITEM_HEIGHT + ITEM_GAP);
          const state = itemState(item.id, step);
          return (
            <g key={item.id} className={`stack-item state-${state}`}>
              {index === 0 && (
                <>
                  <line x1="42" y1={y + 26} x2={x - 12} y2={y + 26} className="top-line" />
                  <text x="36" y={y + 30} textAnchor="end" className="node-role">
                    top
                  </text>
                </>
              )}
              <rect x={x} y={y} width={ITEM_WIDTH} height={ITEM_HEIGHT} rx="10" />
              <text x="210" y={y + 32} textAnchor="middle" className="node-value">
                {item.value}
              </text>
              <text x={x + ITEM_WIDTH + 14} y={y + 31} className="node-id">
                {item.id}
              </text>
            </g>
          );
        })}
        <line
          x1="82"
          y1={contentHeight - 14}
          x2="338"
          y2={contentHeight - 14}
          className="stack-base"
        />
      </svg>
      <ol className="sr-only">
        {topFirstItems.map((item, index) => (
          <li key={item.id}>
            Stack position {index + 1} from the top: value {item.value}
          </li>
        ))}
      </ol>
    </div>
  );
}
