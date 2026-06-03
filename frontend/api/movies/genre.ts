import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tmdbService } from '../lib/tmdb';
import { cors, handleOptions, handleError } from '../lib/helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  try {
    const { genreId, page } = req.query;
    
    if (!genreId) {
      return cors(res).status(400).json({ error: 'Genre ID is required' });
    }

    const genreIdNum = parseInt(genreId as string);
    const pageNum = parseInt(page as string) || 1;
    const data = await tmdbService.getByGenre(genreIdNum, pageNum);
    return cors(res).status(200).json(data);
  } catch (error) {
    return handleError(res, error, 'Failed to fetch movies by genre');
  }
}
