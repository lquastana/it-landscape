import assert from 'node:assert/strict';

// Rôles : toute personne authentifiée lit le paysage ; aucune écriture dans l'application.
const { authorize } = await import('../lib/roles.js');

assert.equal(authorize('read', 'viewer'), true, 'viewer peut lire');
assert.equal(authorize('read', 'editor'), true, 'editor peut lire');
assert.equal(authorize('read', 'admin'), true, 'admin peut lire');
assert.equal(authorize('read', null), false, 'sans rôle : refusé');
assert.equal(authorize('read', 'inconnu'), false, 'rôle inconnu : refusé');

console.log('Rôles : OK');
