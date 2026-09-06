import type { VercelRequest, VercelResponse } from '@vercel/node';
import { catalogRoute, streamingRoute, CatalogError } from '../../backend/src/services/catalog.service';
import { cors, handleOptions } from './helpers';

export function contentHandler(type: 'movie' | 'tv' | 'streaming') {
  return async (req: VercelRequest, res: VercelResponse) => {
    if (handleOptions(req, res)) return;
    cors(res);
    if (req.method !== 'GET') return res.setHeader('Allow', 'GET, OPTIONS').status(405).json({ error: 'Método não permitido.' });
    try {
      const route = req.query.route;
      const parts = Array.isArray(route) ? route : String(route || '').split('/').filter(Boolean);
      const query = Object.fromEntries(Object.entries(req.query).filter(([, value]) => typeof value === 'string')) as Record<string, string>;
      const data = type === 'streaming' ? await streamingRoute(parts, query) : await catalogRoute(type, parts, query);
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      return res.status(200).json(data);
    } catch (error) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(error instanceof CatalogError ? error.status : 502).json({ error: error instanceof CatalogError ? error.message : 'Catálogo temporariamente indisponível.' });
    }
  };
}
