import { INTERFACE_COLORS, hostingColor, hasActiveFilters } from '../lib/landscapeView';

function toggleIn(list, value) {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}

export default function Toolbar({ model, filters, onChange, visibleCount }) {
  const set = patch => onChange({ ...filters, ...patch });
  return (
    <div className="toolbar">
      <div className="shell">
        <label className="search">
          <span className="sr-only">Rechercher une application</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="Application, éditeur, mot-clé…"
            value={filters.q}
            onChange={e => set({ q: e.target.value })}
          />
        </label>

        <div className="filter-group" role="group" aria-label="Hébergement">
          <span className="filter-group-label">Hébergement</span>
          {model.hostingTypes.map((h, index) => (
            <button
              key={h.key}
              type="button"
              className="toggle"
              aria-pressed={filters.hosting.includes(h.key)}
              onClick={() => set({ hosting: toggleIn(filters.hosting, h.key) })}
            >
              <span className="swatch" style={{ background: hostingColor(h.key, index) }} aria-hidden="true" />
              {h.label}
            </button>
          ))}
        </div>

        <div className="filter-group" role="group" aria-label="Interfaces">
          <span className="filter-group-label">Interfaces</span>
          {model.interfaces.map(i => (
            <button
              key={i.key}
              type="button"
              className="toggle"
              aria-pressed={filters.interfaces.includes(i.key)}
              onClick={() => set({ interfaces: toggleIn(filters.interfaces, i.key) })}
            >
              <span className="dot" style={{ background: INTERFACE_COLORS[i.key] }} aria-hidden="true" />
              {i.label}
            </button>
          ))}
        </div>

        <div className="filter-group" role="group" aria-label="Autres filtres">
          <button type="button" className="toggle" aria-pressed={filters.shared} onClick={() => set({ shared: !filters.shared })}>
            Mutualisées
          </button>
          <button type="button" className="toggle" aria-pressed={filters.critical} onClick={() => set({ critical: !filters.critical })}>
            Critiques
          </button>
          {hasActiveFilters(filters) && (
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => set({ q: '', hosting: [], interfaces: [], shared: false, critical: false })}
            >
              Réinitialiser
            </button>
          )}
        </div>

        <span className="result-count" aria-live="polite">
          {visibleCount} application{visibleCount > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
