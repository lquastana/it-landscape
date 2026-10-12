import { formatDateTime } from '../lib/landscapeView';

function SourceNote({ model }) {
  if (model.source === 'demo') return <span className="source-note is-demo">Données de démonstration</span>;
  if (model.stale) return <span className="source-note is-stale">NetBox injoignable — dernière version connue</span>;
  return <span className="source-note">Source NetBox · {formatDateTime(model.generatedAt)}</span>;
}

function pct(part, total) {
  return total ? Math.round((100 * part) / total) : 0;
}

function Kpi({ label, value, unit, sub, meter }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {value}
        {unit && <small>{unit}</small>}
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
      {meter !== undefined && (
        <div className="kpi-meter" aria-hidden="true">
          <span style={{ width: `${Math.min(100, meter)}%` }} />
        </div>
      )}
    </div>
  );
}

export function HostingBar({ items, total, mini = false }) {
  if (!total) return null;
  const label = items.map(h => `${h.label} : ${h.count}`).join(', ');
  return (
    <div className={`stack-bar${mini ? ' is-mini' : ''}`} role="img" aria-label={`Hébergement — ${label}`} title={label}>
      {items.map(h => (
        <span key={h.key} style={{ width: `${(100 * h.count) / total}%`, background: h.color }} />
      ))}
    </div>
  );
}

export default function Summary({ model, scopeLabel, indicators }) {
  const i = indicators;
  return (
    <section className="summary" aria-labelledby="synthese-titre">
      <div className="shell">
        <div className="summary-title">
          <span className="kicker">Synthèse</span>
          <h2 id="synthese-titre">{scopeLabel}</h2>
          <SourceNote model={model} />
        </div>

        <div className="summary-grid">
          <Kpi
            label="Applications"
            value={i.applications}
            sub={i.applications === i.scopeApplications ? 'dans le paysage' : `sur ${i.scopeApplications} au total`}
          />
          <Kpi
            label="Mutualisées"
            value={i.sharedPct}
            unit="%"
            sub={`${i.shared} partagée${i.shared > 1 ? 's' : ''} entre sites`}
            meter={i.sharedPct}
          />
          <Kpi
            label="Processus outillés"
            value={i.coveragePct}
            unit="%"
            sub={`${i.coveredProcesses} sur ${i.processes}`}
            meter={i.coveragePct}
          />
          <Kpi
            label="Critiques"
            value={i.critical}
            sub={`${pct(i.critical, i.applications)} % des applications`}
          />

          <div className="panel panel-hosting">
            <div className="panel-head">
              <h3>Hébergement</h3>
              <span className="mono">{i.applications} applications</span>
            </div>
            <HostingBar items={i.hosting} total={i.applications} />
            <ul className="legend-list">
              {i.hosting.map(h => (
                <li key={h.key}>
                  <span className="swatch" style={{ background: h.color }} aria-hidden="true" />
                  {h.label}
                  <span className="count">{h.count} · {pct(h.count, i.applications)} %</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel panel-interfaces">
            <div className="panel-head">
              <h3>Interfaces</h3>
              <span className="mono">{i.withoutInterface} sans interface</span>
            </div>
            <ul className="interface-tally">
              {i.interfaces.map(x => (
                <li key={x.key}>
                  <span className="tally">
                    <span className="dot dot-lg" style={{ background: x.color }} aria-hidden="true" />
                    {x.label}
                    <strong>{x.count}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
