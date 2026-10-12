import { withAuthz } from '../../lib/authz.js';
import { loadLandscape } from '../../lib/landscape.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  try {
    const landscape = await loadLandscape();
    res.setHeader('Cache-Control', 'private, max-age=60');
    return res.status(200).json(landscape);
  } catch (error) {
    console.error('[landscape]', error.message);
    return res.status(502).json({ error: 'La source NetBox est indisponible pour le moment.' });
  }
}

export default withAuthz('read', handler);
