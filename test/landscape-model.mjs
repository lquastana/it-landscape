// Construction du modèle « paysage » à partir de données au format de l'API NetBox.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildLandscape, getNetboxSettings } from '../lib/landscape.js';

const raw = JSON.parse(fs.readFileSync(new URL('../data/demo/netbox-landscape.json', import.meta.url), 'utf-8'));
const m = buildLandscape({ ...raw, linkBase: 'https://netbox.example', source: 'demo' });

// Établissements = sites portant des domaines
assert.deepEqual(m.establishments.map(e => e.name), ['Centre de rééducation', 'Hôpital Nord', 'Hôpital Sud']);

// Domaines et processus fusionnés entre établissements
assert.equal(m.domains.length, 9, '9 domaines fusionnés');
const imagerie = m.processes.find(p => p.name === 'Imagerie');
assert.deepEqual(imagerie.establishments.sort(), [1, 2], 'Imagerie absente du centre de rééducation');

// Zones dans l'ordre d'urbanisation, libellés issus du choice set
assert.deepEqual(m.zones.map(z => z.key), ['production_soins', 'support', 'pilotage', 'echange', 'socle']);
assert.equal(m.zones[0].label, 'Production de soins');

// Applications décommissionnées exclues
assert.equal(m.applications.length, 29);
assert.ok(!m.applications.some(a => a.name === 'Ancien Labo'));

// Mutualisation, hébergement, interfaces, lien NetBox
const dpi = m.applications.find(a => a.name === 'Dossier Patient Clinique');
assert.deepEqual(dpi.establishments.sort(), [1, 2, 3]);
assert.equal(dpi.shared, true);
assert.equal(dpi.hosting.label, 'Hébergeur régional');
assert.equal(dpi.interfaces.medicale, true);
assert.equal(dpi.interfaces.autre, false);
assert.equal(dpi.link, 'https://netbox.example/plugins/it-landscape/applications/1/');
const restauration = m.applications.find(a => a.name === 'Restauration');
assert.equal(restauration.shared, false);

// Flux : le flux marqué inactif (tag flux-non-active) est ignoré
assert.equal(dpi.flows.in, 1, 'un seul flux entrant actif (Hub Interop)');
assert.equal(dpi.flows.out, 3);
assert.ok(!dpi.flows.partners.some(p => p.name === 'Ancien Labo'));

// Statut projet conservé
assert.equal(m.applications.find(a => a.name === 'Téléconsultation').status, 'projet');

// Repli sans custom fields : hébergement libre, zone par défaut
const bare = buildLandscape({
  domains: [{ id: 1, name: 'Soins', site: { id: 9, name: 'Site A', slug: 'site-a' } }],
  processes: [{ id: 2, name: 'Consultation', domain: { id: 1 } }],
  applications: [{ id: 3, name: 'Appli', hosting: 'Cloud éditeur', criticality: 'critical', processes: [{ id: 2 }] }],
  flows: [],
});
assert.equal(bare.zones[0].key, 'sans_zone');
assert.equal(bare.applications[0].hosting.label, 'Cloud éditeur');
assert.equal(bare.applications[0].criticality, 'critical');
assert.equal(bare.applications[0].link, null);

// Réglages NetBox
assert.equal(getNetboxSettings({}).enabled, false);
const s = getNetboxSettings({ NETBOX_URL: 'http://nb:8000/', NETBOX_TOKEN: 'x', NETBOX_PUBLIC_URL: 'https://netbox.example/' });
assert.equal(s.enabled, true);
assert.equal(s.url, 'http://nb:8000');
assert.equal(s.publicUrl, 'https://netbox.example');

console.log('Modèle paysage : OK');
