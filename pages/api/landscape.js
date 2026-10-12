import { loadLandscape } from '../../lib/landscape.js';

// Vue publique en lecture seule : aucune authentification. Le jeton NetBox reste côté serveur.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  try {
    const landscape = await loadLandscape();
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json(landscape);
  } catch (error) {
    console.error('[landscape]', error.message);
    return res.status(502).json({ error: 'La source NetBox est indisponible pour le moment.' });
  }
}
