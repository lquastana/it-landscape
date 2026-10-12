import Dots from './Dots';
import { HostingBar } from './Summary';
import { INTERFACE_COLORS, hostingColor } from '../lib/landscapeView';

export function AppChip({ app, model, selected, onSelect }) {
  const hostingIndex = model.hostingTypes.findIndex(h => h.key === app.hosting.key);
  const facts = [
    app.criticality === 'critical' ? 'critique' : null,
    app.shared ? `utilisée par ${app.establishments.length} établissements` : null,
    `hébergement ${app.hosting.label}`,
    app.status === 'projet' ? 'en projet' : null,
  ].filter(Boolean).join(', ');
  return (
    <button
      type="button"
      className={`app-chip${app.status === 'projet' ? ' is-project' : ''}${selected ? ' is-selected' : ''}`}
      style={{ '--host': hostingColor(app.hosting.key, hostingIndex) }}
      onClick={() => onSelect(app.id)}
      aria-label={`${app.name} — ${facts}`}
      title={`${app.name} — ${facts}`}
    >
      <span className="app-chip-name">{app.name}</span>
      <Dots app={app} interfaces={model.interfaces} />
      {app.criticality === 'critical' && <span className="badge-crit" aria-hidden="true">C</span>}
      {app.shared && <span className="badge-count" aria-hidden="true">{app.establishments.length}</span>}
    </button>
  );
}

export function LegendStrip({ model }) {
  return (
    <div className="legend-strip" aria-label="Légende">
      <span className="filter-group-label">Lecture</span>
      <span>
        <span className="app-chip-dots" aria-hidden="true">
          {model.interfaces.slice(0, 3).map(i => <span key={i.key} className="dot" style={{ background: INTERFACE_COLORS[i.key] }} />)}
        </span>
        Pastilles : interfaces
      </span>
      <span><span className="badge-crit" aria-hidden="true">C</span> Critique</span>
      <span><span className="badge-count" aria-hidden="true">3</span> Nombre d&apos;établissements utilisateurs</span>
      <span>Trait de gauche : hébergement</span>
      <span>Bordure en pointillés : en projet</span>
    </div>
  );
}

function Domain({ domain, model, selectedId, onSelect }) {
  const s = domain.stats;
  return (
    <article className="domain" aria-labelledby={`dom-${domain.key}`}>
      <div className="domain-head">
        <div className="domain-title">
          <h3 id={`dom-${domain.key}`}>{domain.name}</h3>
          {domain.code && <span className="mono">{domain.code}</span>}
        </div>
        <div className="domain-stats">
          {s.applications} application{s.applications > 1 ? 's' : ''}
          {s.shared > 0 && ` · ${s.shared} mutualisée${s.shared > 1 ? 's' : ''}`}
          {s.critical > 0 && ` · ${s.critical} critique${s.critical > 1 ? 's' : ''}`}
        </div>
        <HostingBar items={s.hosting} total={s.applications} mini />
      </div>
      {domain.processes.map(p => (
        <div className="process" key={p.key}>
          <p className="process-name">
            <span>{p.name}</span>
            {p.apps.length > 0 && <span className="mono">{p.apps.length}</span>}
          </p>
          {p.apps.length ? (
            <div className="chips">
              {p.apps.map(app => (
                <AppChip key={app.id} app={app} model={model} selected={selectedId === app.id} onSelect={onSelect} />
              ))}
            </div>
          ) : (
            <span className="process-empty">Aucune application</span>
          )}
        </div>
      ))}
    </article>
  );
}

export default function LandscapeMap({ view, model, selectedId, onSelect }) {
  if (!view.zones.length) {
    return (
      <div className="empty-state">
        <h2>Aucune application ne correspond</h2>
        <p>Modifiez la recherche ou les filtres pour élargir l&apos;affichage.</p>
      </div>
    );
  }
  return (
    <>
      {view.zones.map(zone => (
        <section className="zone" key={zone.key} aria-labelledby={`zone-${zone.key}`}>
          <div className="zone-head">
            <h2 id={`zone-${zone.key}`}>{zone.label}</h2>
            <span className="mono">
              {zone.domains.length} domaine{zone.domains.length > 1 ? 's' : ''} · {zone.applications} application{zone.applications > 1 ? 's' : ''}
            </span>
          </div>
          <div className="domains">
            {zone.domains.map(domain => (
              <Domain key={domain.key} domain={domain} model={model} selectedId={selectedId} onSelect={onSelect} />
            ))}
          </div>
        </section>
      ))}

      {view.outsideLandscape.length > 0 && (
        <section className="zone outside" aria-labelledby="hors-paysage">
          <div className="zone-head">
            <h2 id="hors-paysage">Hors paysage</h2>
            <span className="mono">applications non rattachées à un processus — à compléter dans NetBox</span>
          </div>
          <div className="chips">
            {view.outsideLandscape.map(app => (
              <AppChip key={app.id} app={app} model={model} selected={selectedId === app.id} onSelect={onSelect} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
