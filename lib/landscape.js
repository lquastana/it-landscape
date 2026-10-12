// Modèle « paysage métier » construit à partir du plugin NetBox netbox-it-landscape.
//
// L'application est une vitrine en lecture : domaines, processus, applications et
// flux sont saisis dans NetBox, on les consulte ici. Sans NetBox configuré, un jeu
// de démonstration (même format que l'API NetBox) est utilisé.
import fs from 'fs/promises';
import path from 'path';

const PLUGIN = 'plugins/it-landscape';
const PAGE_SIZE = 1000;

export const INTERFACES = [
  { key: 'medicale', label: 'Médicale' },
  { key: 'administrative', label: 'Administrative' },
  { key: 'planification', label: 'Planification' },
  { key: 'facturation', label: 'Facturation' },
  { key: 'autre', label: 'Autre' },
];

// Ordre de lecture des zones d'urbanisation (custom field optionnel `zone_urbanisation`)
const ZONE_ORDER = ['production_soins', 'support', 'pilotage', 'echange', 'referentiel', 'socle'];
// Ordre d'affichage des types d'hébergement (custom field optionnel `hebergement_type`)
const HOSTING_ORDER = ['interne', 'sitec', 'editeur', 'saas', 'tiers'];
const NOT_SET = { key: 'non_renseigne', label: 'Non renseigné' };
const NO_ZONE = { key: 'sans_zone', label: 'Domaines' };

function humanize(value) {
  const text = String(value || '').replace(/[_-]+/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizeKey(value) {
  return slugify(value) || 'sans-nom';
}

function byOrder(order) {
  return (a, b) => {
    const ia = order.indexOf(a.key);
    const ib = order.indexOf(b.key);
    if (ia !== ib) return (ia < 0 ? order.length : ia) - (ib < 0 ? order.length : ib);
    return a.label.localeCompare(b.label, 'fr');
  };
}

function cf(object, name) {
  const value = object?.custom_fields?.[name];
  return value === undefined ? null : value;
}

function isInactiveFlow(flow) {
  if (cf(flow, 'criticite_flux') === 'non_active') return true;
  return (flow.tags || []).some(tag => (tag.slug || tag.name) === 'flux-non-active');
}

/**
 * Construit le modèle à partir des listes brutes de l'API NetBox.
 * Fonction pure : testée sans réseau (test/landscape-model.mjs).
 */
export function buildLandscape({ domains = [], processes = [], applications = [], flows = [], labels = {}, linkBase = null, source = 'netbox' }) {
  const zoneLabels = labels.zone_urbanisation || {};
  const hostingLabels = labels.hebergement_type || {};
  // Si NetBox fournit le champ normalisé `hebergement_type`, le texte libre `hosting` n'est
  // plus utilisé (sinon il crée des catégories parasites) : faute de valeur → « Non renseigné ».
  const normalizedHosting = Object.keys(hostingLabels).length > 0;

  // --- Établissements = sites NetBox portant au moins un domaine métier
  const establishments = new Map();
  for (const d of domains) {
    if (d.site?.id && !establishments.has(d.site.id)) {
      establishments.set(d.site.id, { id: d.site.id, name: d.site.name, slug: d.site.slug || slugify(d.site.name) });
    }
  }

  // --- Domaines fusionnés entre établissements par nom
  const domainById = new Map();
  const domainMap = new Map();
  for (const d of domains) {
    const key = normalizeKey(d.name);
    const zoneValue = cf(d, 'zone_urbanisation');
    const zone = zoneValue ? { key: zoneValue, label: zoneLabels[zoneValue] || humanize(zoneValue) } : NO_ZONE;
    if (!domainMap.has(key)) {
      domainMap.set(key, { key, name: d.name, code: cf(d, 'code') || '', description: d.description || '', zone: zone.key, establishments: [] });
    }
    const merged = domainMap.get(key);
    if (merged.zone === NO_ZONE.key && zone.key !== NO_ZONE.key) merged.zone = zone.key;
    if (!merged.description && d.description) merged.description = d.description;
    if (d.site?.id && !merged.establishments.includes(d.site.id)) merged.establishments.push(d.site.id);
    domainById.set(d.id, { key, site: d.site?.id ?? null, zone });
  }

  const zones = new Map();
  for (const ref of domainById.values()) zones.set(ref.zone.key, ref.zone);
  for (const merged of domainMap.values()) {
    if (!zones.has(merged.zone)) zones.set(merged.zone, { key: merged.zone, label: zoneLabels[merged.zone] || humanize(merged.zone) });
  }

  // --- Processus fusionnés par (domaine, nom)
  const processById = new Map();
  const processMap = new Map();
  for (const p of processes) {
    const domainRef = domainById.get(p.domain?.id);
    if (!domainRef) continue;
    const key = `${domainRef.key}::${normalizeKey(p.name)}`;
    if (!processMap.has(key)) {
      processMap.set(key, {
        key,
        domainKey: domainRef.key,
        name: p.name,
        code: cf(p, 'code') || '',
        description: p.description || '',
        establishments: [],
      });
    }
    const merged = processMap.get(key);
    if (domainRef.site && !merged.establishments.includes(domainRef.site)) merged.establishments.push(domainRef.site);
    processById.set(p.id, { key, site: domainRef.site });
  }

  // --- Flux : échanges actifs agrégés par application
  const flowStats = new Map();
  const statFor = id => {
    if (!flowStats.has(id)) flowStats.set(id, { in: 0, out: 0, partners: new Map() });
    return flowStats.get(id);
  };
  for (const f of flows) {
    if (!f.source?.id || !f.target?.id || isInactiveFlow(f)) continue;
    const src = statFor(f.source.id);
    const dst = statFor(f.target.id);
    src.out += 1;
    dst.in += 1;
    const addPartner = (stat, partner, direction) => {
      const current = stat.partners.get(partner.id) || { id: partner.id, name: partner.name, sends: false, receives: false };
      current[direction] = true;
      stat.partners.set(partner.id, current);
    };
    addPartner(src, f.target, 'sends');
    addPartner(dst, f.source, 'receives');
  }

  // --- Applications
  const hostingTypes = new Map();
  const apps = [];
  for (const a of applications) {
    const status = cf(a, 'statut') || 'actif';
    if (status === 'decommissionne') continue;

    const hostingValue = cf(a, 'hebergement_type');
    let hosting = NOT_SET;
    if (hostingValue) hosting = { key: hostingValue, label: hostingLabels[hostingValue] || humanize(hostingValue) };
    else if (a.hosting && !normalizedHosting) hosting = { key: `libre-${slugify(a.hosting)}`, label: a.hosting };
    hostingTypes.set(hosting.key, hosting);

    const placements = [];
    for (const ref of a.processes || []) {
      const processRef = processById.get(ref.id);
      if (processRef && !placements.some(pl => pl.processKey === processRef.key && pl.site === processRef.site)) {
        placements.push({ processKey: processRef.key, site: processRef.site });
      }
    }
    const establishmentIds = [...new Set(placements.map(pl => pl.site).filter(id => id !== null))];

    const stat = flowStats.get(a.id);
    const interfaces = Object.fromEntries(INTERFACES.map(i => [i.key, Boolean(a[`interface_${i.key}`])]));

    apps.push({
      id: a.id,
      name: a.name,
      description: a.description || '',
      editor: a.editor || cf(a, 'fournisseur')?.name || '',
      referent: a.referent || '',
      criticality: a.criticality === 'critical' ? 'critical' : 'standard',
      status,
      hosting,
      interfaces,
      establishments: establishmentIds,
      shared: establishmentIds.length > 1,
      placements,
      flows: stat
        ? { in: stat.in, out: stat.out, partners: [...stat.partners.values()].sort((x, y) => x.name.localeCompare(y.name, 'fr')) }
        : { in: 0, out: 0, partners: [] },
      link: linkBase ? `${linkBase}/${PLUGIN}/applications/${a.id}/` : null,
    });
  }
  apps.sort((x, y) => x.name.localeCompare(y.name, 'fr'));

  return {
    source,
    generatedAt: new Date().toISOString(),
    netboxUrl: linkBase,
    establishments: [...establishments.values()].sort((x, y) => x.name.localeCompare(y.name, 'fr')),
    zones: [...zones.values()].sort(byOrder(ZONE_ORDER)),
    interfaces: INTERFACES,
    hostingTypes: [...hostingTypes.values()].sort(byOrder([...HOSTING_ORDER, NOT_SET.key])),
    domains: [...domainMap.values()].sort((x, y) => x.name.localeCompare(y.name, 'fr')),
    processes: [...processMap.values()].sort((x, y) => x.name.localeCompare(y.name, 'fr')),
    applications: apps,
  };
}

// ---------------------------------------------------------------------------
// Lecture NetBox
// ---------------------------------------------------------------------------

export function getNetboxSettings(env = process.env) {
  const url = env.NETBOX_URL?.trim().replace(/\/+$/, '') || '';
  const token = env.NETBOX_TOKEN?.trim() || '';
  const publicUrl = env.NETBOX_PUBLIC_URL?.trim().replace(/\/+$/, '') || url;
  const cacheSeconds = Number.parseInt(env.LANDSCAPE_CACHE_SECONDS || '120', 10);
  return { enabled: Boolean(url && token), url, token, publicUrl, cacheSeconds: Number.isFinite(cacheSeconds) ? cacheSeconds : 120 };
}

async function netboxGet(settings, endpoint, params = {}) {
  const url = new URL(`/api/${endpoint.replace(/^\//, '')}`, settings.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    headers: { Authorization: `Token ${settings.token}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const error = new Error(`NetBox ${endpoint} : HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

async function netboxList(settings, endpoint, params = {}) {
  const results = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await netboxGet(settings, endpoint, { ...params, limit: PAGE_SIZE, offset });
    results.push(...(page.results || []));
    if (!page.next || results.length >= (page.count ?? 0)) break;
  }
  return results;
}

// Libellés des choix des custom fields (facultatif : à défaut, valeur « humanisée »)
async function choiceLabels(settings, fieldName) {
  try {
    const fields = await netboxGet(settings, 'extras/custom-fields/', { name: fieldName });
    const setId = fields.results?.[0]?.choice_set?.id;
    if (!setId) return {};
    const choiceSet = await netboxGet(settings, `extras/custom-field-choice-sets/${setId}/`);
    return Object.fromEntries((choiceSet.extra_choices || []).map(([value, label]) => [value, label]));
  } catch {
    return {};
  }
}

async function loadFromNetbox(settings) {
  const [domains, processes, applications, flows, zoneLabels, hostingLabels] = await Promise.all([
    netboxList(settings, `${PLUGIN}/business-domains/`),
    netboxList(settings, `${PLUGIN}/business-processes/`),
    netboxList(settings, `${PLUGIN}/applications/`),
    netboxList(settings, `${PLUGIN}/application-flows/`),
    choiceLabels(settings, 'zone_urbanisation'),
    choiceLabels(settings, 'hebergement_type'),
  ]);
  return buildLandscape({
    domains, processes, applications, flows,
    labels: { zone_urbanisation: zoneLabels, hebergement_type: hostingLabels },
    linkBase: settings.publicUrl,
    source: 'netbox',
  });
}

async function loadDemo() {
  const file = path.join(process.cwd(), 'data', 'demo', 'netbox-landscape.json');
  const raw = JSON.parse(await fs.readFile(file, 'utf-8'));
  return buildLandscape({ ...raw, linkBase: null, source: 'demo' });
}

let cache = { at: 0, value: null };

export async function loadLandscape(env = process.env) {
  const settings = getNetboxSettings(env);
  if (!settings.enabled) return loadDemo();

  const now = Date.now();
  if (cache.value && now - cache.at < settings.cacheSeconds * 1000) return cache.value;
  try {
    const value = await loadFromNetbox(settings);
    cache = { at: now, value };
    return value;
  } catch (error) {
    // NetBox indisponible : on sert la dernière version connue en le signalant.
    if (cache.value) return { ...cache.value, stale: true, staleReason: error.message };
    throw error;
  }
}
