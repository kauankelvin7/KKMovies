import { Router } from 'express';
import { catalogRoute, streamingRoute, CatalogError } from '../services/catalog.service';

export function contentRouter(type: 'movie' | 'tv' | 'streaming') {
  const router = Router();
  router.use(async (req, res) => {
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); res.status(405).json({ error: 'Método não permitido.' }); return; }
    try {
      const parts = req.path.split('/').filter(Boolean);
      const query = Object.fromEntries(Object.entries(req.query).filter(([, value]) => typeof value === 'string')) as Record<string, string>;
      const data = type === 'streaming' ? await streamingRoute(parts, query) : await catalogRoute(type, parts, query);
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json(data);
    } catch (error) {
      res.setHeader('Cache-Control', 'no-store');
      res.status(error instanceof CatalogError ? error.status : 502).json({ error: error instanceof CatalogError ? error.message : 'Catálogo temporariamente indisponível.' });
    }
  });
  return router;
}
