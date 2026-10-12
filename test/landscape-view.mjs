// Vue paysage : périmètre par établissement, filtres, indicateurs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildLandscape } from '../lib/landscape.js';
import { EMPTY_FILTERS, buildView, matchesFilters, normalizeText } from '../lib/landscapeView.js';

const raw = JSON.parse(fs.readFileSync(new URL('../data/demo/netbox-landscape.json', import.meta.url), 'utf-8'));
const m = buildLandscape({ ...raw, source: 'demo' });

// Tous les établissements
const all = buildView(m, EMPTY_FILTERS);
assert.equal(all.indicators.applications, 29);
assert.equal(all.indicators.processes, 25);
assert.ok(all.indicators.coveragePct > 90, 'quasi tous les processus sont outillés');
assert.equal(all.indicators.hosting.reduce((n, h) => n + h.count, 0), 29, 'hébergement : total cohérent');
assert.equal(all.zones[0].key, 'production_soins');
assert.equal(all.outsideLandscape.length, 0);

// Un établissement : périmètre restreint
const centre = m.establishments.find(e => e.name === 'Centre de rééducation').id;
const vCentre = buildView(m, { ...EMPTY_FILTERS, etab: centre });
assert.ok(vCentre.indicators.applications < all.indicators.applications);
const domainesCentre = vCentre.zones.flatMap(z => z.domains);
const medTech = domainesCentre.find(d => d.key === 'medico-technique');
assert.ok(!medTech.processes.some(p => p.name === 'Imagerie'), "pas d'imagerie au centre de rééducation");
assert.ok(vCentre.zones.flatMap(z => z.domains).flatMap(d => d.processes).flatMap(p => p.apps).every(a => a.establishments.includes(centre)));

// Filtres : recherche insensible aux accents, hébergement, interfaces, critiques, mutualisées
assert.equal(normalizeText('Rééducation'), 'reeducation');
const dpi = m.applications.find(a => a.name === 'Dossier Patient Clinique');
assert.ok(matchesFilters(dpi, { ...EMPTY_FILTERS, q: 'patient clin' }));
assert.ok(matchesFilters(dpi, { ...EMPTY_FILTERS, q: 'EDITEUR alpha' }), 'recherche sur éditeur');
assert.ok(!matchesFilters(dpi, { ...EMPTY_FILTERS, hosting: ['saas'] }));
assert.ok(matchesFilters(dpi, { ...EMPTY_FILTERS, interfaces: ['autre', 'medicale'] }), 'au moins une interface');

const saas = buildView(m, { ...EMPTY_FILTERS, hosting: ['saas'] });
assert.ok(saas.filtering);
assert.ok(saas.indicators.applications > 0);
assert.ok(saas.zones.flatMap(z => z.domains).flatMap(d => d.processes).every(p => p.apps.length > 0), 'processus vides masqués en filtrage');

const critShared = buildView(m, { ...EMPTY_FILTERS, critical: true, shared: true });
assert.ok(critShared.zones.flatMap(z => z.domains).flatMap(d => d.processes).flatMap(p => p.apps).every(a => a.criticality === 'critical' && a.shared));

const none = buildView(m, { ...EMPTY_FILTERS, q: 'aucune-application-ne-porte-ce-nom' });
assert.equal(none.zones.length, 0);
assert.equal(none.indicators.applications, 0);
assert.equal(none.indicators.sharedPct, 0);

console.log('Vue paysage : OK');
