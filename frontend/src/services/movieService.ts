/* KKMovies — TMDB Movie Service
   Centralized service for all TMDB API calls via backend proxy.
   Dual-layer cache: memory (fast) + localStorage (persistent across reloads).
   Configurable TTLs per content type. */

import api from './api';
import type { Movie, Genre, Credits, Video, TMDBResponse } from '../types/movie';
import axios from 'axios';


/* ---- Dual-Layer Cache ---- */
const LS_PREFIX = 'kk_catalog_v2_';
const DEFAULT_TTL = 5 * 60 * 1000;

const TTL_MAP: Record<string, number> = {
  trending: 10 * 60 * 1000,
  popular: 10 * 60 * 1000,
  'top-rated': 30 * 60 * 1000,
  genres: 60 * 60 * 1000,
  movie: 30 * 60 * 1000,
  series: 30 * 60 * 1000,
  credits: 30 * 60 * 1000,
  search: 5 * 60 * 1000,
  discover: 10 * 60 * 1000,
};

function getTTL(key: string): number {
  for (const prefix of Object.keys(TTL_MAP)) {
    if (key.startsWith(prefix)) return TTL_MAP[prefix];
  }
  return DEFAULT_TTL;
}


const memCache = new Map<string, { data: unknown; timestamp: number }>();
const inFlight = new Map<string, Promise<unknown>>();


function isRetryableError(err: unknown): boolean {
  if (axios.isAxiosError(err)) {
    if (!err.response) return true;
    return err.response.status >= 500 || err.response.status === 429;
  }
  return false;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  { retries = 2, baseDelayMs = 700 }: { retries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries || !isRetryableError(err)) break;
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
    }
  }
  throw lastError;
}

function getCached<T>(key: string): T | null {
  const mem = memCache.get(key);
  const ttl = getTTL(key);
  if (mem && Date.now() - mem.timestamp < ttl) {
    return mem.data as T;
  }
  memCache.delete(key);

  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw) {
      const entry = JSON.parse(raw) as { data: T; timestamp: number };
      if (Date.now() - entry.timestamp < ttl) {
        memCache.set(key, entry);
        return entry.data;
      }
      localStorage.removeItem(LS_PREFIX + key);
    }
  } catch {}

  return null;
}

function setCache(key: string, data: unknown) {
  const entry = { data, timestamp: Date.now() };
  memCache.set(key, entry);

  try {
    const json = JSON.stringify(entry);
    if (json.length < 500_000) {
      localStorage.setItem(LS_PREFIX + key, json);
    }
  } catch {}

  if (memCache.size > 200) {
    const oldest = [...memCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 50; i++) {
      memCache.delete(oldest[i][0]);
      try { localStorage.removeItem(LS_PREFIX + oldest[i][0]); } catch {}
    }
  }
}

async function fetchCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = getCached<T>(key);
  if (cached) return cached;
  if (inFlight.has(key)) return inFlight.get(key) as Promise<T>;
  const task = retryWithBackoff(fetcher, { retries: 0 }).then(data => { setCache(key, data); return data; });
  inFlight.set(key, task);
  try { return await task; } finally { inFlight.delete(key); }
}

export function clearApiCache() {
  memCache.clear();
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(LS_PREFIX));
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export function getImageUrl(path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'): string {
  if (!path) return '';
  if (path.startsWith('https://image.tmdb.org/t/p/')) return path.replace(/\/t\/p\/[^/]+\//, `/t/p/${size}/`);
  if (/^https?:\/\//.test(path)) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path: string | null): string {
  return getImageUrl(path, 'w1280');
}

/* ---- Movie Endpoints ---- */

export async function getTrending(page = 1): Promise<TMDBResponse<Movie>> {
  return fetchCached(`trending-${page}`, async () => {
    const { data } = await api.get('/api/movies/trending', { params: { page } });
    return data.results ? data : { page: 1, results: data, total_pages: 1, total_results: data.length };
  });
}

export async function getPopular(page = 1): Promise<TMDBResponse<Movie>> {
  return fetchCached(`popular-${page}`, async () => {
    const { data } = await api.get('/api/movies/popular', { params: { page } });
    return data.results ? data : { page: 1, results: data, total_pages: 1, total_results: data.length };
  });
}

export async function getTopRated(page = 1): Promise<TMDBResponse<Movie>> {
  return fetchCached(`top-rated-${page}`, async () => {
    const { data } = await api.get('/api/movies/top-rated', { params: { page } });
    return data.results ? data : { page: 1, results: data, total_pages: 1, total_results: data.length };
  });
}

export async function getNowPlaying(page = 1): Promise<TMDBResponse<Movie>> {
  return fetchCached(`now-playing-${page}`, async () => {
    const { data } = await api.get('/api/movies/now-playing', { params: { page } });
    return data.results ? data : { page: 1, results: data, total_pages: 1, total_results: data.length };
  });
}

export async function getUpcoming(page = 1): Promise<TMDBResponse<Movie>> {
  return fetchCached(`upcoming-${page}`, async () => {
    const { data } = await api.get('/api/movies/upcoming', { params: { page } });
    return data.results ? data : { page: 1, results: data, total_pages: 1, total_results: data.length };
  });
}

export async function getMoviesByGenre(genreId: number, page = 1): Promise<TMDBResponse<Movie>> {
  return fetchCached(`genre-${genreId}-${page}`, async () => {
    const { data } = await api.get('/api/movies/genre', { params: { genreId, page } });
    return data.results ? data : { page: 1, results: data, total_pages: 1, total_results: data.length };
  });
}


export async function searchMovies(query: string, page = 1): Promise<TMDBResponse<Movie>> {
  const key = `search-${query}-${page}`;
  return fetchCached(key, async () => {
    const { data } = await api.get('/api/movies/search', { params: { query, page } });
    return data.results ? data : { page: 1, results: data, total_pages: 1, total_results: data.length };
  });
}

export async function searchMulti(query: string, page = 1): Promise<TMDBResponse<Movie>> {
  const key = `search-multi-${query}-${page}`;
  return fetchCached(key, async () => {
    const { data } = await api.get('/api/movies/search-multi', { params: { query, page } });
    return data.results ? data : { page: 1, results: data, total_pages: 1, total_results: data.length };
  });
}

export async function getMovieDetails(id: number): Promise<Movie> {
  return fetchCached(`movie-${id}`, async () => {
    const { data } = await api.get(`/api/movies/${id}`);
    return data;
  });
}

export async function getMovieCredits(id: number): Promise<Credits> {
  return fetchCached(`credits-${id}`, async () => {
    const { data } = await api.get(`/api/movies/${id}/credits`);
    return data;
  });
}

export async function getSimilarMovies(id: number): Promise<Movie[]> {
  return fetchCached(`similar-${id}`, async () => {
    const { data } = await api.get(`/api/movies/${id}/similar`);
    return Array.isArray(data) ? data : data.results || [];
  });
}

export async function getRecommendedMovies(id: number): Promise<Movie[]> {
  return fetchCached(`recommended-${id}`, async () => {
    const { data } = await api.get(`/api/movies/${id}/recommendations`);
    return Array.isArray(data) ? data : data.results || [];
  });
}

export async function getMovieVideos(id: number): Promise<Video[]> {
  return fetchCached(`videos-movie-${id}`, async () => {
    const { data } = await api.get(`/api/movies/${id}/videos`);
    return Array.isArray(data) ? data : data.results || [];
  });
}

export async function getSeriesVideos(id: number): Promise<Video[]> {
  return fetchCached(`videos-series-${id}`, async () => {
    const { data } = await api.get(`/api/series/${id}/videos`);
    return Array.isArray(data) ? data : data.results || [];
  });
}

export async function getSeriesCredits(id: number): Promise<Credits> {
  return fetchCached(`credits-series-${id}`, async () => {
    const { data } = await api.get(`/api/series/${id}/credits`);
    return data;
  });
}

export async function getGenres(type: 'movie' | 'tv' = 'movie'): Promise<Genre[]> {
  return fetchCached(`genres-${type}`, async () => {
    const { data } = await api.get(`/api/${type === 'tv' ? 'series' : 'movies'}/genres`);
    return Array.isArray(data) ? data : data.genres || [];
  });
}

export async function discoverMovies(params: {
  page?: number;
  type?: string;
  with_genres?: string;
  sort_by?: string;
  'vote_average.gte'?: number;
  primary_release_year?: number;
  first_air_date_year?: number;
  with_original_language?: string;
  language?: string;
}): Promise<TMDBResponse<Movie>> {
  const key = `discover-${JSON.stringify(params)}`;
  return fetchCached(key, async () => {
    const { data } = await api.get('/api/movies/discover', { params });
    return data.results ? data : { page: 1, results: data, total_pages: 1, total_results: data.length };
  });
}

/* ---- Series Endpoints ---- */

export async function getTrendingSeries(page = 1) {
  return fetchCached(`series-trending-${page}`, async () => {
    const { data } = await api.get('/api/series/trending', { params: { page } });
    return data;
  });
}

export async function getPopularSeries(page = 1) {
  return fetchCached(`series-popular-${page}`, async () => {
    const { data } = await api.get('/api/series/popular', { params: { page } });
    return data;
  });
}

export async function getSeriesDetails(id: number) {
  return fetchCached(`series-${id}`, async () => {
    const { data } = await api.get(`/api/series/${id}`);
    return data;
  });
}

export async function getSeriesSeasonDetails(seriesId: number, seasonNumber: number) {
  return fetchCached(`series-${seriesId}-season-${seasonNumber}`, async () => {
    const { data } = await api.get(`/api/series/${seriesId}/season/${seasonNumber}`);
    return data;
  });
}

export async function searchSeries(query: string, page = 1) {
  return fetchCached(`series-search-${query}-${page}`, async () => {
    const { data } = await api.get('/api/series/search', { params: { query, page } });
    return data;
  });
}

/* ---- Streaming URLs ---- */
export type StreamingEmbedServer = 'warezcdn';
const PLAYER_BASE = (import.meta.env.VITE_WAREZCDN_BASE_URL || 'https://warezcdn.sbs').replace(/\/+$/, '');

export function getStreamingUrl(movieId: number, imdbId?: string): string {
  const id = imdbId && /^tt\d{7,}$/.test(imdbId) ? imdbId : String(movieId);
  if (!/^(?:tt\d{7,}|[1-9]\d*)$/.test(id)) throw new Error('ID de filme inválido');
  return `${PLAYER_BASE}/filme/${id}#color:a78bfa`;
}

export function getSeriesStreamingUrl(id: number, season?: number, episode?: number): string {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('ID de série inválido');
  if (season !== undefined && (!Number.isInteger(season) || season < 0)) throw new Error('Temporada inválida');
  if (episode !== undefined && (season === undefined || !Number.isInteger(episode) || episode < 1)) throw new Error('Episódio inválido');
  return `${PLAYER_BASE}/serie/${id}${season !== undefined ? `/${season}${episode !== undefined ? `/${episode}` : ''}` : ''}#color:a78bfa`;
}
