/* KauanFlix — My List Service
   Manages the user's personal watchlist using localStorage. */

import type { MyListItem, Movie } from '../types/movie';

const STORAGE_KEY = 'kauanflix_my_list';

function getAll(): MyListItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(items: MyListItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const myListService = {
  getAll,

  isInList(movieId: number): boolean {
    return getAll().some((item) => item.movieId === movieId);
  },

  add(movie: Movie) {
    const items = getAll();
    if (items.some((item) => item.movieId === movie.id)) return;
    items.push({
      movieId: movie.id,
      title: movie.title,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      voteAverage: movie.vote_average,
      releaseDate: movie.release_date,
      addedAt: Date.now(),
      genres: movie.genres,
    });
    saveAll(items);
  },

  remove(movieId: number) {
    saveAll(getAll().filter((item) => item.movieId !== movieId));
  },

  toggle(movie: Movie): boolean {
    if (myListService.isInList(movie.id)) {
      myListService.remove(movie.id);
      return false;
    }
    myListService.add(movie);
    return true;
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
