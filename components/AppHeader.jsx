import { LOGO_URL, ORG_NAME, APP_TITLE } from '../lib/branding';

export default function AppHeader({ model, etab, onEtabChange }) {
  const establishments = model?.establishments || [];
  return (
    <header className="app-header">
      <div className="shell">
        <div className="brand">
          {/* Logo configurable, éventuellement hors domaine : <img> volontaire */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {LOGO_URL && <img src={LOGO_URL} alt={ORG_NAME || 'Logo'} />}
          <div className="brand-text">
            {ORG_NAME && <span className="brand-org">{ORG_NAME}</span>}
            <h1 className="brand-title">{APP_TITLE}</h1>
          </div>
        </div>

        {establishments.length > 1 && (
          <nav className="segmented" aria-label="Établissement">
            <button type="button" aria-pressed={etab === null} onClick={() => onEtabChange(null)}>
              Tous les établissements
            </button>
            {establishments.map(e => (
              <button key={e.id} type="button" aria-pressed={etab === e.id} onClick={() => onEtabChange(e.id)}>
                {e.name}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
