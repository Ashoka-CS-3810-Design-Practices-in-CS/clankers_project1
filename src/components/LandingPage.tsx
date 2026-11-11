import { COMPLEXITY_TABLE } from '../registry/complexities';
import { STRUCTURES } from '../registry/structures';
import type { AvailableStructureId } from '../App';

interface LandingPageProps {
  readonly onSelect: (id: AvailableStructureId) => void;
  readonly onOpenComplexities: () => void;
}

const STRUCTURE_ICONS: Record<string, string> = {
  'linked-list': '🔗',
  stack: '📚',
  queue: '🚶‍♂️',
  bst: '🌳',
  'priority-queue': '⚡',
  graph: '🕸️',
};

const STRUCTURE_HIGHLIGHTS: Record<string, string[]> = {
  'linked-list': ['Insert at head & tail', 'Search & delete', 'Step-by-step traversal'],
  stack: ['Push, Pop & Peek', 'LIFO ordering', 'Underflow detection'],
  queue: ['Enqueue & Dequeue', 'FIFO ordering', 'O(1) operations'],
  bst: ['Ordered insert & delete', 'Inorder / Preorder / Postorder', 'Duplicate counting'],
  'priority-queue': [
    'Min-heap sift-up & sift-down',
    'Tree + array view',
    'O(log n) insert & extract',
  ],
  graph: ['BFS & DFS', 'Add vertices & edges', 'Traversal visualization'],
};

export function LandingPage({ onSelect, onOpenComplexities }: LandingPageProps) {
  return (
    <main className="landing" id="main-content">
      <section className="landing-hero">
        <img
          className="landing-logo"
          src="/clankers-logo.png"
          alt="Clankers logo: Are you afraid?"
        />
        <div className="landing-hero-badge">Interactive Algorithm Lab</div>
        <h1 className="landing-title">
          Learn Data Structures
          <span className="landing-title-accent"> One Operation at a Time</span>
        </h1>
        <p className="landing-subtitle">
          Build each structure from scratch, watch every pointer change step by step, and connect
          each transition to its time and space complexity.
        </p>

        <div className="landing-stats">
          <div className="landing-stat">
            <strong>{STRUCTURES.filter((s) => s.availability === 'available').length}</strong>
            <span>Structures</span>
          </div>
          <div className="landing-stat-divider" />
          <div className="landing-stat">
            <strong>Step-by-step</strong>
            <span>Playback</span>
          </div>
          <div className="landing-stat-divider" />
          <div className="landing-stat">
            <strong>Big-O</strong>
            <span>Complexity</span>
          </div>
        </div>
      </section>

      <section className="landing-structures" aria-label="Available data structures">
        <h2 className="landing-section-heading">Choose a structure to explore</h2>
        <div className="landing-card-grid">
          {STRUCTURES.filter((s) => s.availability === 'available').map((structure) => (
            <button
              key={structure.id}
              className="landing-card"
              type="button"
              onClick={() => onSelect(structure.id as AvailableStructureId)}
              aria-label={`Open ${structure.label} workspace`}
            >
              <span className="landing-card-icon" aria-hidden="true">
                {STRUCTURE_ICONS[structure.id] ?? '📦'}
              </span>
              <div className="landing-card-body">
                <h3>{structure.label}</h3>
                <p>{structure.description}</p>
                <ul className="landing-card-features">
                  {(STRUCTURE_HIGHLIGHTS[structure.id] ?? []).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
              <span className="landing-card-arrow" aria-hidden="true">
                →
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="landing-complexities" aria-labelledby="landing-complexities-heading">
        <h2 className="landing-section-heading" id="landing-complexities-heading">
          Compare every operation
        </h2>
        <button
          className="landing-card landing-card-wide"
          type="button"
          onClick={onOpenComplexities}
          aria-label="Open the complexity table"
        >
          <span className="landing-card-icon" aria-hidden="true">
            📊
          </span>
          <div className="landing-card-body">
            <h3>Complexity table</h3>
            <p>
              Worst-case time and space for all {COMPLEXITY_TABLE.length} structures and{' '}
              {COMPLEXITY_TABLE.reduce((total, structure) => total + structure.rows.length, 0)}{' '}
              operations on one page, with the reason for each.
            </p>
          </div>
          <span className="landing-card-arrow" aria-hidden="true">
            →
          </span>
        </button>
      </section>

      <section className="landing-how" aria-label="How it works">
        <h2 className="landing-section-heading">How it works</h2>
        <ol className="landing-steps">
          <li>
            <span className="landing-step-num">1</span>
            <div>
              <strong>Pick a structure</strong>
              <p>Select from linked lists, stacks, queues, trees, heaps, or graphs.</p>
            </div>
          </li>
          <li>
            <span className="landing-step-num">2</span>
            <div>
              <strong>Run an operation</strong>
              <p>Enter a value and choose insert, delete, search, or traverse.</p>
            </div>
          </li>
          <li>
            <span className="landing-step-num">3</span>
            <div>
              <strong>Watch every step</strong>
              <p>Use playback controls to step forward, back, pause, or adjust speed.</p>
            </div>
          </li>
          <li>
            <span className="landing-step-num">4</span>
            <div>
              <strong>Understand complexity</strong>
              <p>Each operation shows its time and space complexity with an explanation.</p>
            </div>
          </li>
        </ol>
      </section>
    </main>
  );
}
