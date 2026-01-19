import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tmdbService } from '../lib/tmdb';
import { cors, handleOptions, handleError } from '../lib/helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  try {
    const page = parseInt(req.query.page as string) || 1;
    const data = await tmdbService.getTopRated(page);
    return cors(res).status(200).json(data);
  } catch (error) {
    return handleError(res, error, 'Failed to fetch top rated movies');
  }
}
