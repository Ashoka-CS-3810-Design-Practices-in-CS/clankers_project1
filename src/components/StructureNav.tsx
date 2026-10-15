import { STRUCTURES } from '../registry/structures';
import type { AvailableStructureId } from '../App';

interface StructureNavProps {
  readonly activeId: AvailableStructureId;
  readonly onSelect: (id: AvailableStructureId) => void;
  readonly onGoHome?: () => void;
}

export function StructureNav({ activeId, onSelect, onGoHome }: StructureNavProps) {
  return (
    <nav className="structure-nav" aria-label="Data structures">
      <button
        className="nav-heading nav-home-button"
        type="button"
        onClick={onGoHome}
        aria-label="Return to home page"
      >
        <img className="brand-logo" src="/clankers-logo.png" alt="" aria-hidden="true" />
        <div>
          <strong>Clankers</strong>
          <span>DSA Visualizer</span>
        </div>
      </button>
      <div className="structure-list">
        {STRUCTURES.map((structure) => (
          <button
            className={`structure-item ${structure.id === activeId ? 'is-active' : ''}`}
            type="button"
            key={structure.id}
            disabled={structure.availability === 'planned'}
            onClick={() => onSelect(structure.id as AvailableStructureId)}
            aria-label={`${structure.label}, ${structure.id === activeId ? 'active' : structure.availability === 'available' ? 'ready' : 'planned'}`}
            aria-current={structure.id === activeId ? 'page' : undefined}
          >
            <span>{structure.label}</span>
            <small>
              {structure.id === activeId
                ? 'Active'
                : structure.availability === 'available'
                  ? 'Ready'
                  : 'Planned'}
            </small>
          </button>
        ))}
      </div>
      <p className="nav-note">
        Build the structure, then inspect each pointer change at your own pace.
      </p>
    </nav>
  );
}
