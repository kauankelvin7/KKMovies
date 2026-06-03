import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tmdbService } from '../../lib/tmdb';
import { cors, handleOptions, handleError } from '../../lib/helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  try {
    const { id } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    
    if (!id) {
      return cors(res).status(400).json({ error: 'Movie ID is required' });
    }

    const movieId = parseInt(id as string);
    const data = await tmdbService.getSimilarMovies(movieId, page);
    return cors(res).status(200).json(data);
  } catch (error) {
    return handleError(res, error, 'Failed to fetch similar movies');
  }
}
