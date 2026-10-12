import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppHeader from '../components/AppHeader';
import Summary from '../components/Summary';
import Toolbar from '../components/Toolbar';
import LandscapeMap, { LegendStrip } from '../components/LandscapeMap';
import AppDrawer from '../components/AppDrawer';
import { APP_TITLE } from '../lib/branding';
import { EMPTY_FILTERS, buildView } from '../lib/landscapeView';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '';

function listParam(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? raw.split(',').filter(Boolean) : [];
}

// Filtres <-> URL (lien partageable)
function filtersFromQuery(query, model) {
  const etabSlug = Array.isArray(query.etab) ? query.etab[0] : query.etab;
  const etab = model?.establishments.find(e => e.slug === etabSlug)?.id ?? null;
  return {
    etab,
    q: typeof query.q === 'string' ? query.q : '',
    hosting: listParam(query.hebergement),
    interfaces: listParam(query.interfaces),
    critical: query.critiques === '1',
    shared: query.mutualisees === '1',
  };
}

function queryFromState(filters, appId, model) {
  const query = {};
  const etab = model?.establishments.find(e => e.id === filters.etab);
  if (etab) query.etab = etab.slug;
  if (filters.q) query.q = filters.q;
  if (filters.hosting.length) query.hebergement = filters.hosting.join(',');
  if (filters.interfaces.length) query.interfaces = filters.interfaces.join(',');
  if (filters.critical) query.critiques = '1';
  if (filters.shared) query.mutualisees = '1';
  if (appId) query.app = String(appId);
  return query;
}

export default function Paysage() {
  const router = useRouter();
  const [model, setModel] = useState(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/landscape')
      .then(async r => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error || `Erreur ${r.status}`);
        return body;
      })
      .then(data => { if (!cancelled) setModel(data); })
      .catch(e => { if (!cancelled) setError(e.message); });
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => { if (!cancelled) setUser(data?.user || null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // État initial lu dans l'URL une fois les données chargées
  useEffect(() => {
    if (!model || !router.isReady || ready) return;
    setFilters(filtersFromQuery(router.query, model));
    const appId = Number.parseInt(router.query.app, 10);
    if (model.applications.some(a => a.id === appId)) setSelectedId(appId);
    setReady(true);
  }, [model, router.isReady, router.query, ready]);

  useEffect(() => {
    if (!ready) return;
    router.replace({ pathname: '/', query: queryFromState(filters, selectedId, model) }, undefined, { shallow: true, scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, selectedId, ready]);

  const view = useMemo(() => (model ? buildView(model, filters) : null), [model, filters]);
  const selectedApp = useMemo(() => model?.applications.find(a => a.id === selectedId) || null, [model, selectedId]);
  const closeDrawer = useCallback(() => setSelectedId(null), []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout');
    window.location.href = '/login';
  };

  const scopeLabel = filters.etab === null
    ? 'Tous les établissements'
    : model?.establishments.find(e => e.id === filters.etab)?.name || '';

  return (
    <>
      <Head>
        <title>{`Paysage applicatif — ${APP_TITLE}`}</title>
      </Head>

      <AppHeader
        model={model}
        etab={filters.etab}
        onEtabChange={etab => setFilters(f => ({ ...f, etab }))}
        user={user}
        onLogout={handleLogout}
      />

      {error && (
        <div className="shell">
          <p className="notice is-error" role="alert">{error}</p>
        </div>
      )}

      {!model && !error && <p className="loading">Chargement du paysage applicatif…</p>}

      {model && view && (
        <>
          <Summary model={model} scopeLabel={scopeLabel} indicators={view.indicators} />
          <Toolbar model={model} filters={filters} onChange={setFilters} visibleCount={view.indicators.applications} />
          <main className="landscape">
            <div className="shell">
              <LegendStrip model={model} />
              <LandscapeMap view={view} model={model} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
          </main>
          <AppDrawer app={selectedApp} model={model} onClose={closeDrawer} onSelect={setSelectedId} />
        </>
      )}

      <footer className="app-footer">
        <div className="shell">
          <span>it-landscape{APP_VERSION ? ` ${APP_VERSION}` : ''} · vue métier</span>
          <span>Infrastructure, réseau et données techniques : NetBox</span>
        </div>
      </footer>
    </>
  );
}
