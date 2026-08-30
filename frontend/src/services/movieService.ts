/* KauanFlix — TMDB Movie Service
   Centralized service for all TMDB API calls via backend proxy.
   Dual-layer cache: memory (fast) + localStorage (persistent across reloads).
   Configurable TTLs per content type. */

import api from './api';
import type { Movie, Genre, Credits, Video, TMDBResponse } from '../types/movie';
import axios from 'axios';


/* ---- Dual-Layer Cache ---- */
const LS_PREFIX = 'kf_cache_';
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
  const data = await fetcher();
  setCache(key, data);
  return data;
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

export type StreamingEmbedServer = '111movies' | 'vidsrc' | 'vidking';

const BASE_URLS: Record<StreamingEmbedServer, string> = {
  '111movies': import.meta.env.VITE_111movies_BASE || 'https://111movies.net',
  vidsrc: import.meta.env.VITE_VIDSRC_BASE || 'https://vidsrc.to',
  vidking: import.meta.env.VITE_VIDKING_BASE || 'https://vidking.xyz',
};

function isImdbId(id: string | number | undefined | null): boolean {
  if (!id) return false;
  return /^tt\d{7,}$/.test(String(id));
}

export function getStreamingUrl(movieId: number, imdbId?: string, server: StreamingEmbedServer = '111movies'): string {
  const base = BASE_URLS[server];
  const id = isImdbId(imdbId) ? imdbId! : movieId;
  switch (server) {
    case 'vidsrc':
      return `${base}/embed/movie/${id}`;
    case 'vidking':
      return `${base}/embed/movie/${id}`;
    case '111movies':
    default:
      return `${base}/movie/${id}`;
  }
}

export function getSeriesStreamingUrl(tmdbId: number, season: number, episode: number, server: StreamingEmbedServer = '111movies'): string {
  const base = BASE_URLS[server];
  switch (server) {
    case 'vidsrc':
      return `${base}/embed/tv/${tmdbId}/${season}/${episode}`;
    case 'vidking':
      return `${base}/embed/tv/${tmdbId}/${season}/${episode}`;
    case '111movies':
    default:
      return `${base}/tv/${tmdbId}/${season}/${episode}`;
  }
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
  server?: StreamingEmbedServer;
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
  options?: {
    server?: StreamingEmbedServer;
    noLink?: boolean;
    color?: string;
    transparent?: boolean;
    noBackground?: boolean;
  },
): Promise<ResolvedStream> {
  const server = options?.server || '111movies';
  const hasValidImdb = isImdbId(imdbId);
  const id = hasValidImdb ? imdbId! : String(movieId);

  const proxy = await resolveFromProxy(`/api/streaming/movie/${id}`, {
    server,
    noLink: true,
    ...(options || {}),
  });

  if (proxy.streamUrl) {
    if (!hasValidImdb && server === 'vidking') {
      proxy.warning = proxy.warning || '⚠️ VidKing requer IMDB ID — Player pode não carregar. Tente outro servidor.';
    } else if (!hasValidImdb && server !== 'vidsrc') {
      proxy.warning = proxy.warning || '⚠️ Filme sem IMDB ID — Player pode não carregar. Tente abrir em nova aba.';
    }
    return proxy;
  }

  return {
    streamUrl: getStreamingUrl(movieId, imdbId, server),
    directUrl: getStreamingUrl(movieId, imdbId, server),
    mode: 'iframe-direct',
    server,
    warning: hasValidImdb ? undefined : '⚠️ Filme sem IMDB ID — Player pode não carregar.',
  };
}

export async function resolveSeriesStream(
  tmdbId: number,
  season: number,
  episode: number,
  options?: {
    server?: StreamingEmbedServer;
    noEpList?: boolean;
    noLink?: boolean;
    color?: string;
    transparent?: boolean;
    noBackground?: boolean;
  },
): Promise<ResolvedStream> {
  const server = options?.server || '111movies';
  const params: Record<string, unknown> = {
    server,
    noLink: true,
    noEpList: true,
    ...(options || {}),
  };
  const proxy = await resolveFromProxy(
    `/api/streaming/series/${tmdbId}/${season}/${episode}`,
    params,
  );

  if (proxy.streamUrl) return proxy;

  return {
    streamUrl: getSeriesStreamingUrl(tmdbId, season, episode, server),
    directUrl: getSeriesStreamingUrl(tmdbId, season, episode, server),
    mode: 'iframe-direct',
    server,
  };
}

export const EMBED_SERVERS: Array<{
  id: StreamingEmbedServer;
  name: string;
  description: string;
  icon: string;
}> = [
  { id: '111movies', name: '111movies', description: 'Player oficial com anúncios mínimos', icon: '🎬' },
  { id: 'vidsrc', name: 'VidSrc', description: 'Fonte principal do Streambert - estável e rápido', icon: '💎' },
  { id: 'vidking', name: 'VidKing', description: 'Fonte alternativa - grande acervo', icon: '👑' },
];
