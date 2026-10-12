import { useEffect, useRef } from 'react';
import { INTERFACE_COLORS, hostingColor } from '../lib/landscapeView';

const STATUS_LABELS = { actif: 'En service', projet: 'En projet', en_retrait: 'En retrait' };

export default function AppDrawer({ app, model, onClose, onSelect }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!app) return undefined;
    closeRef.current?.focus();
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [app, onClose]);

  if (!app) return null;

  const siteName = id => model.establishments.find(e => e.id === id)?.name || 'Sans établissement';
  const processByKey = new Map(model.processes.map(p => [p.key, p]));
  const domainByKey = new Map(model.domains.map(d => [d.key, d]));
  const hostingIndex = model.hostingTypes.findIndex(h => h.key === app.hosting.key);
  const activeInterfaces = model.interfaces.filter(i => app.interfaces[i.key]);
  const known = new Set(model.applications.map(a => a.id));

  // Usages : « Domaine : processus, processus » ; les établissements au même usage sont regroupés
  const bySite = new Map();
  for (const pl of app.placements) {
    const process = processByKey.get(pl.processKey);
    if (!process) continue;
    const domain = domainByKey.get(process.domainKey)?.name || '';
    if (!bySite.has(pl.site)) bySite.set(pl.site, new Map());
    const domains = bySite.get(pl.site);
    if (!domains.has(domain)) domains.set(domain, new Set());
    domains.get(domain).add(process.name);
  }
  const usages = new Map();
  for (const [site, domains] of bySite) {
    const lines = [...domains.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'fr'))
      .map(([domain, procs]) => `${domain} : ${[...procs].sort((a, b) => a.localeCompare(b, 'fr')).join(', ')}`);
    const signature = lines.join(' | ');
    if (!usages.has(signature)) usages.set(signature, { sites: [], lines });
    usages.get(signature).sites.push(siteName(site));
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="fiche-titre">
        <div className="drawer-head">
          <div>
            <span className="kicker">Application</span>
            <h2 id="fiche-titre">{app.name}</h2>
          </div>
          <button ref={closeRef} type="button" className="btn btn-ghost btn-small drawer-close" onClick={onClose}>
            Fermer
          </button>
        </div>

        <div className="drawer-body">
          <div className="badges">
            <span className={`pill ${app.criticality === 'critical' ? 'is-danger' : ''}`}>
              {app.criticality === 'critical' ? 'Critique' : 'Standard'}
            </span>
            <span className="pill">
              <span className="dot" style={{ background: hostingColor(app.hosting.key, hostingIndex) }} aria-hidden="true" />
              {app.hosting.label}
            </span>
            <span className={`pill ${app.status === 'actif' ? 'is-success' : 'is-warning'}`}>
              {STATUS_LABELS[app.status] || app.status}
            </span>
            {app.shared && <span className="pill is-teal">Mutualisée · {app.establishments.length} établissements</span>}
          </div>

          {app.description && <p className="description">{app.description}</p>}

          <dl className="facts">
            <dt>Éditeur</dt>
            <dd>{app.editor || 'Non renseigné'}</dd>
            <dt>Référent</dt>
            <dd>{app.referent || 'Non renseigné'}</dd>
          </dl>

          <div className="section">
            <h3>Interfaces</h3>
            {activeInterfaces.length ? (
              <div className="badges">
                {activeInterfaces.map(i => (
                  <span className="pill" key={i.key}>
                    <span className="dot" style={{ background: INTERFACE_COLORS[i.key] }} aria-hidden="true" />
                    {i.label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="process-empty">Aucune interface déclarée</p>
            )}
          </div>

          <div className="section">
            <h3>Utilisation</h3>
            {usages.size ? (
              <ul className="plain-list">
                {[...usages.entries()].map(([signature, usage]) => (
                  <li key={signature} className="usage">
                    <strong>{usage.sites.sort((a, b) => a.localeCompare(b, 'fr')).join(', ')}</strong>
                    {usage.lines.map(line => <div key={line} className="muted">{line}</div>)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="process-empty">Rattachée à aucun processus</p>
            )}
          </div>

          <div className="section">
            <h3>Échanges</h3>
            {app.flows.partners.length ? (
              <>
                <p className="muted" style={{ margin: '0 0 6px', fontSize: 13 }}>
                  {app.flows.in} flux entrant{app.flows.in > 1 ? 's' : ''} · {app.flows.out} flux sortant{app.flows.out > 1 ? 's' : ''}
                </p>
                <ul className="plain-list">
                  {app.flows.partners.map(p => (
                    <li key={p.id}>
                      <button type="button" className="partner" disabled={!known.has(p.id)} onClick={() => onSelect(p.id)}>
                        {p.name}
                      </button>
                      <span className="muted">
                        {p.sends && p.receives ? 'dans les deux sens' : p.sends ? 'destinataire' : 'émetteur'}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="process-empty">Aucun échange déclaré</p>
            )}
          </div>
        </div>

        {app.link && (
          <div className="drawer-foot">
            <a className="btn btn-primary" href={app.link} target="_blank" rel="noopener noreferrer">
              Ouvrir la fiche dans NetBox
            </a>
          </div>
        )}
      </aside>
    </>
  );
}
