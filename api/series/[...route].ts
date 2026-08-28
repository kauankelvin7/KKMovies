import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tmdbService } from '../lib/tmdb';
import { cors, handleOptions, handleError } from '../lib/helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

    const parts = ([] as string[]).concat((req.query.route as string[]) || []);
      const [first] = parts;
        const page = parseInt(req.query.page as string) || 1;

          try {
              switch (first) {
                    case 'trending': return cors(res).status(200).json(await tmdbService.getTrendingSeries(page));
                          case 'popular': return cors(res).status(200).json(await tmdbService.getPopularSeries(page));
                                case 'top-rated': return cors(res).status(200).json(await tmdbService.getTopRatedSeries(page));
                                      default:
                                              return cors(res).status(404).json({ error: 'Route not found' });
                                                  }
                                                    } catch (error) {
                                                        return handleError(res, error, 'Failed to fetch series data');
                                                          }
                                                          }