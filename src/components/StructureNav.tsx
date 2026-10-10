import { STRUCTURES } from '../registry/structures';

export function StructureNav() {
  return (
    <nav className="structure-nav" aria-label="Data structures">
      <div className="nav-heading">
        <span className="brand-mark" aria-hidden="true">
          C
        </span>
        <div>
          <strong>Clankers</strong>
          <span>DSA Visualizer</span>
        </div>
      </div>
      <div className="structure-list">
        {STRUCTURES.map((structure) => (
          <button
            className={`structure-item ${structure.availability === 'available' ? 'is-active' : ''}`}
            type="button"
            key={structure.id}
            disabled={structure.availability === 'planned'}
            aria-current={structure.availability === 'available' ? 'page' : undefined}
          >
            <span>{structure.label}</span>
            <small>{structure.availability === 'available' ? 'Active' : 'Planned'}</small>
          </button>
        ))}
      </div>
      <p className="nav-note">
        Build the structure, then inspect each pointer change at your own pace.
      </p>
    </nav>
  );
}
