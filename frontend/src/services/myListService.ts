import type { Movie } from '../types/movie';
import { watchlistService } from './storageService';

/** All entry points share the same watchlist. */
export const myListService = {
  getAll: () => watchlistService.getAll().map(item => ({ ...item, movieId: item.id })),
  isInList: (id: number, type: 'movie' | 'tv' = 'movie') => watchlistService.isInList(id, type),
  add: (movie: Movie) => watchlistService.add({ id: movie.id, type: movie.media_type === 'tv' ? 'tv' : 'movie', title: movie.title || movie.name || '', posterPath: movie.poster_path, backdropPath: movie.backdrop_path, voteAverage: movie.vote_average, releaseDate: movie.release_date }),
  remove: (id: number, type: 'movie' | 'tv' = 'movie') => watchlistService.remove(id, type),
  toggle(movie: Movie) {
    const type = movie.media_type === 'tv' ? 'tv' : 'movie';
    if (watchlistService.isInList(movie.id, type)) { watchlistService.remove(movie.id, type); return false; }
    this.add(movie); return true;
  },
  clear() { for (const item of watchlistService.getAll()) watchlistService.remove(item.id, item.type); },
};
