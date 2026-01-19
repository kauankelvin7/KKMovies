import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tmdbService } from '../lib/tmdb';
import { cors, handleOptions, handleError } from '../lib/helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  try {
    const { query, page } = req.query;
    
    if (!query || typeof query !== 'string') {
      return cors(res).status(400).json({ error: 'Query parameter is required' });
    }

    const pageNum = parseInt(page as string) || 1;
    const data = await tmdbService.searchMovies(query, pageNum);
    return cors(res).status(200).json(data);
  } catch (error) {
    return handleError(res, error, 'Failed to search movies');
  }
}
