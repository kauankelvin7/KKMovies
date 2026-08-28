/* KauanFlix — TMDB Movie Service
   Centralized service for all TMDB API calls via backend proxy.
   Dual-layer cache: memory (fast) + localStorage (persistent across reloads).
   Configurable TTLs per content type. */

import api from './api';
import type { Movie, Genre, Credits, Video, TMDBResponse } from '../types/movie';

/* ---- Dual-Layer Cache ---- */
const LS_PREFIX = 'kf_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const TTL_MAP: Record<string, number> = {
  trending: 10 * 60 * 1000,   // 10 min
  popular: 10 * 60 * 1000,    // 10 min
  'top-rated': 30 * 60 * 1000, // 30 min
  genres: 60 * 60 * 1000,     // 1 hour
  movie: 30 * 60 * 1000,      // 30 min (details)
  series: 30 * 60 * 1000,     // 30 min
  credits: 30 * 60 * 1000,    // 30 min
  search: 5 * 60 * 1000,      // 5 min
  discover: 10 * 60 * 1000,   // 10 min
};

function getTTL(key: string): number {
  for (const prefix of Object.keys(TTL_MAP)) {
    if (key.startsWith(prefix)) return TTL_MAP[prefix];
  }
  return DEFAULT_TTL;
}

// Memory layer (fast)
const memCache = new Map<string, { data: unknown; timestamp: number }>();

function getCached<T>(key: string): T | null {
  // 1) Check memory
  const mem = memCache.get(key);
  const ttl = getTTL(key);
  if (mem && Date.now() - mem.timestamp < ttl) {
    return mem.data as T;
  }
  memCache.delete(key);

  // 2) Check localStorage
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw) {
      const entry = JSON.parse(raw) as { data: T; timestamp: number };
      if (Date.now() - entry.timestamp < ttl) {
        // Promote to memory
        memCache.set(key, entry);
        return entry.data;
      }
      localStorage.removeItem(LS_PREFIX + key);
    }
  } catch { /* ignore parse errors */ }

  return null;
}

function setCache(key: string, data: unknown) {
  const entry = { data, timestamp: Date.now() };
  memCache.set(key, entry);

  // Persist to localStorage (skip very large payloads)
  try {
    const json = JSON.stringify(entry);
    if (json.length < 500_000) { // < 500KB
      localStorage.setItem(LS_PREFIX + key, json);
    }
  } catch { /* quota exceeded — silently skip */ }

  // Auto-prune memory if too large
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
  const data = await fetcher();
  setCache(key, data);
  return data;
}

/** Clear all API cache (memory + localStorage) */
export function clearApiCache() {
  memCache.clear();
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(LS_PREFIX));
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

/* Helper to ensure image URLs are full */
export function getImageUrl(path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
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

/* Multi-search: returns both movies and TV series */
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

export async function getGenres(): Promise<Genre[]> {
  return fetchCached('genres', async () => {
    const { data } = await api.get('/api/movies/genres');
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

const SUPERFLIX_BASE = import.meta.env.VITE_SUPERFLIX_BASE || 'https://superflixapi.beer';

function isImdbId(id: string | number | undefined | null): boolean {
  if (!id) return false;
  return /^tt\d{7,}$/.test(String(id));
}

export function getStreamingUrl(movieId: number, imdbId?: string): string {
  const id = isImdbId(imdbId) ? imdbId! : movieId;
  return `${SUPERFLIX_BASE}/filme/${id}`;
}

export function getSeriesStreamingUrl(tmdbId: number, season: number, episode: number): string {
  return `${SUPERFLIX_BASE}/serie/${tmdbId}/${season}/${episode}`;
}

export interface StreamDiagnostics {
  status?: number;
  captcha?: boolean;
  unavailable?: boolean;
  server?: string;
  cloudflare?: boolean;
  ray?: string;
}

export interface ResolvedStream {
  streamUrl: string;
  directUrl: string;
  mode: 'iframe-direct' | 'iframe-captcha-required' | 'unavailable';
  diagnostics?: StreamDiagnostics;
  warning?: string;
}

async function resolveFromProxy(
  path: string,
  params?: Record<string, unknown>,
): Promise<ResolvedStream> {
  try {
    const { data } = await api.get(path, { params, timeout: 15000 });
    return data as ResolvedStream;
  } catch {
    return {
      streamUrl: '',
      directUrl: '',
      mode: 'iframe-direct',
      warning: 'Proxy indisponível, tentando conexão direta',
    };
  }
}

export async function resolveMovieStream(
  movieId: number,
  imdbId?: string,
  options?: { noLink?: boolean; color?: string; transparent?: boolean; noBackground?: boolean },
): Promise<ResolvedStream> {
  const hasValidImdb = isImdbId(imdbId);
  const id = hasValidImdb ? imdbId! : String(movieId);

  const proxy = await resolveFromProxy(`/api/streaming/movie/${id}`, {
    noLink: true,
    ...options,
  });

  if (proxy.streamUrl) {
    if (!hasValidImdb) {
      proxy.warning = proxy.warning || '⚠️ Filme sem IMDB ID — Player pode não carregar. Tente abrir em nova aba.';
    }
    return proxy;
  }

  return {
    streamUrl: getStreamingUrl(movieId, imdbId),
    directUrl: getStreamingUrl(movieId, imdbId),
    mode: 'iframe-direct',
    warning: hasValidImdb ? undefined : '⚠️ Filme sem IMDB ID — Player pode não carregar.',
  };
}

export async function resolveSeriesStream(
  tmdbId: number,
  season: number,
  episode: number,
  options?: { noEpList?: boolean; noLink?: boolean; color?: string; transparent?: boolean; noBackground?: boolean },
): Promise<ResolvedStream> {
  const params: Record<string, unknown> = { noLink: true, noEpList: true, ...(options || {}) };
  const proxy = await resolveFromProxy(`/api/streaming/series/${tmdbId}/${season}/${episode}`, params);

  if (proxy.streamUrl) return proxy;

  return {
    streamUrl: getSeriesStreamingUrl(tmdbId, season, episode),
    directUrl: getSeriesStreamingUrl(tmdbId, season, episode),
    mode: 'iframe-direct',
  };
}
