import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tmdbService } from '../lib/tmdb';
import { cors, handleOptions, handleError } from '../lib/helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

    const parts = ([] as string[]).concat((req.query.route as string[]) || []);
      const [first, second] = parts;
        const page = parseInt(req.query.page as string) || 1;

          try {
              if (first && /^\d+$/.test(first)) {
                    const movieId = parseInt(first, 10);
                          if (!second) return cors(res).status(200).json(await tmdbService.getMovieDetails(movieId));
                                if (second === 'similar') return cors(res).status(200).json(await tmdbService.getSimilarMovies(movieId, page));
                                      if (second === 'recommendations') return cors(res).status(200).json(await tmdbService.getRecommendations(movieId, page));
                                            if (second === 'credits') return cors(res).status(200).json(await tmdbService.getMovieCredits(movieId));
                                                  return cors(res).status(404).json({ error: 'Not found' });
                                                      }

                                                          switch (first) {
                                                                case 'trending': return cors(res).status(200).json(await tmdbService.getTrending(page));
                                                                      case 'popular': return cors(res).status(200).json(await tmdbService.getPopular(page));
                                                                            case 'top-rated': return cors(res).status(200).json(await tmdbService.getTopRated(page));
                                                                                  case 'latest': return cors(res).status(200).json(await tmdbService.getLatestReleases(page));
                                                                                        case 'upcoming': return cors(res).status(200).json(await tmdbService.getUpcoming(page));
                                                                                              case 'genres': return cors(res).status(200).json(await tmdbService.getGenres());
                                                                                                    case 'genre': {
                                                                                                            const genreIdNum = parseInt(req.query.genreId as string, 10);
                                                                                                                    if (isNaN(genreIdNum)) return cors(res).status(400).json({ error: 'Genre ID must be a number' });
                                                                                                                            return cors(res).status(200).json(await tmdbService.getByGenre(genreIdNum, page));
                                                                                                                                  }
                                                                                                                                        case 'search': {
                                                                                                                                                const query = req.query.query as string;
                                                                                                                                                        if (!query) return cors(res).status(400).json({ error: 'Query parameter is required' });
                                                                                                                                                                return cors(res).status(200).json(await tmdbService.searchMovies(query, page));
                                                                                                                                                                      }
                                                                                                                                                                            default:
                                                                                                                                                                                    return cors(res).status(404).json({ error: 'Route not found' });
                                                                                                                                                                                        }
                                                                                                                                                                                          } catch (error) {
                                                                                                                                                                                              return handleError(res, error, 'Failed to fetch movies data');
                                                                                                                                                                                                }
                                                                                                                                                                                                }