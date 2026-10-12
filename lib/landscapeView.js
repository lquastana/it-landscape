// Calculs côté navigateur : périmètre (établissement), filtres et indicateurs.
// Fonctions pures, testées dans test/landscape-view.mjs.

export const INTERFACE_COLORS = {
  medicale: '#2E8F5B',
  administrative: '#1E7F9C',
  planification: '#6B5BA8',
  facturation: '#B57F10',
  autre: '#8894A0',
};

const HOSTING_COLORS = {
  interne: '#14324A',
  sitec: '#1E7F9C',
  editeur: '#7FB0C4',
  saas: '#4E6E8E',
  tiers: '#B4C3CF',
  non_renseigne: '#E3E9EE',
};
const FALLBACK_COLORS = ['#A9C9D6', '#5C7F99', '#C9D6DF', '#7895AB'];

export function hostingColor(key, index = 0) {
  return HOSTING_COLORS[key] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export const EMPTY_FILTERS = { etab: null, q: '', hosting: [], interfaces: [], critical: false, shared: false };

export function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function hasActiveFilters(filters) {
  return Boolean(filters.q?.trim() || filters.hosting?.length || filters.interfaces?.length || filters.critical || filters.shared);
}

function inScope(app, etab) {
  return etab === null || etab === undefined || app.establishments.includes(etab);
}

export function matchesFilters(app, filters) {
  const q = normalizeText(filters.q).trim();
  if (q && !normalizeText(`${app.name} ${app.editor} ${app.description}`).includes(q)) return false;
  if (filters.hosting?.length && !filters.hosting.includes(app.hosting.key)) return false;
  if (filters.interfaces?.length && !filters.interfaces.some(key => app.interfaces[key])) return false;
  if (filters.critical && app.criticality !== 'critical') return false;
  if (filters.shared && !app.shared) return false;
  return true;
}

function countBy(apps, keyOf) {
  const counts = new Map();
  for (const app of apps) {
    const key = keyOf(app);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function hostingBreakdown(model, apps) {
  const counts = countBy(apps, app => app.hosting.key);
  return model.hostingTypes
    .map((h, index) => ({ ...h, color: hostingColor(h.key, index), count: counts.get(h.key) || 0 }))
    .filter(h => h.count > 0);
}

/**
 * Vue paysage pour un jeu de filtres : zones > domaines > processus > applications,
 * avec les indicateurs de synthèse.
 */
export function buildView(model, filters = EMPTY_FILTERS) {
  const etab = filters.etab ?? null;
  const filtering = hasActiveFilters(filters);

  const scopeApps = model.applications.filter(app => inScope(app, etab));
  const visibleApps = scopeApps.filter(app => matchesFilters(app, filters));
  const visibleIds = new Set(visibleApps.map(app => app.id));
  const appById = new Map(model.applications.map(app => [app.id, app]));

  // Applications de chaque processus (dans le périmètre de l'établissement)
  const appsByProcess = new Map();
  const scopeAppsByProcess = new Map();
  for (const app of scopeApps) {
    const keys = new Set(
      app.placements
        .filter(pl => etab === null || pl.site === etab)
        .map(pl => pl.processKey)
    );
    for (const key of keys) {
      if (!scopeAppsByProcess.has(key)) scopeAppsByProcess.set(key, []);
      scopeAppsByProcess.get(key).push(app.id);
      if (visibleIds.has(app.id)) {
        if (!appsByProcess.has(key)) appsByProcess.set(key, []);
        appsByProcess.get(key).push(app.id);
      }
    }
  }

  const scopeProcesses = model.processes.filter(p => etab === null || p.establishments.includes(etab));
  const coveredProcesses = scopeProcesses.filter(p => scopeAppsByProcess.has(p.key)).length;

  const zones = [];
  for (const zone of model.zones) {
    const domains = [];
    for (const domain of model.domains.filter(d => d.zone === zone.key)) {
      if (etab !== null && !domain.establishments.includes(etab)) continue;
      const processes = scopeProcesses
        .filter(p => p.domainKey === domain.key)
        .map(p => ({
          ...p,
          apps: (appsByProcess.get(p.key) || []).map(id => appById.get(id)).sort((a, b) => a.name.localeCompare(b.name, 'fr')),
        }))
        .filter(p => !filtering || p.apps.length > 0);
      if (filtering && processes.length === 0) continue;
      const domainApps = [...new Map(processes.flatMap(p => p.apps).map(app => [app.id, app])).values()];
      domains.push({
        ...domain,
        processes,
        stats: {
          applications: domainApps.length,
          shared: domainApps.filter(app => app.shared).length,
          critical: domainApps.filter(app => app.criticality === 'critical').length,
          hosting: hostingBreakdown(model, domainApps),
        },
      });
    }
    if (domains.length) zones.push({ ...zone, domains, applications: new Set(domains.flatMap(d => d.processes.flatMap(p => p.apps.map(app => app.id)))).size });
  }

  const outsideLandscape = visibleApps.filter(app => !app.placements.some(pl => etab === null || pl.site === etab));
  const interfaceCounts = model.interfaces.map(i => ({ ...i, color: INTERFACE_COLORS[i.key], count: visibleApps.filter(app => app.interfaces[i.key]).length }));

  return {
    zones,
    outsideLandscape,
    filtering,
    indicators: {
      applications: visibleApps.length,
      scopeApplications: scopeApps.length,
      critical: visibleApps.filter(app => app.criticality === 'critical').length,
      shared: visibleApps.filter(app => app.shared).length,
      sharedPct: visibleApps.length ? Math.round((100 * visibleApps.filter(app => app.shared).length) / visibleApps.length) : 0,
      processes: scopeProcesses.length,
      coveredProcesses,
      coveragePct: scopeProcesses.length ? Math.round((100 * coveredProcesses) / scopeProcesses.length) : 0,
      hosting: hostingBreakdown(model, visibleApps),
      interfaces: interfaceCounts,
      withoutInterface: visibleApps.filter(app => !Object.values(app.interfaces).some(Boolean)).length,
    },
  };
}

export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} à ${pad(d.getHours())}h${pad(d.getMinutes())}`;
}
