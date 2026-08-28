import api from './api';
import type {
  TMDBEmbedHealthResponse,
  TMDBEmbedProvider,
  TMDBEmbedStream,
  TMDBEmbedStreamsResponse,
} from '../types/tmdbEmbed';
import { sortByQuality, groupByProvider } from '../types/tmdbEmbed';

const LS_SETTINGS_KEY = 'kf_tmdb_embed_settings';

interface TMDBEmbedSettings {
  baseUrl: string;
  enabled: boolean;
  preferredProvider?: string;
  minQuality?: string;
}

const defaultSettings: TMDBEmbedSettings = {
  baseUrl: import.meta.env.VITE_TMDB_EMBED_API_URL || 'http://localhost:8787',
  enabled: !!import.meta.env.VITE_TMDB_EMBED_API_URL,
};

function getSettings(): TMDBEmbedSettings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS_KEY);
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch {}
  return defaultSettings;
}

function saveSettings(settings: Partial<TMDBEmbedSettings>): TMDBEmbedSettings {
  const current = getSettings();
  const merged = { ...current, ...settings };
  try {
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(merged));
  } catch {}
  return merged;
}

export const tmdbEmbedSettings = {
  get: getSettings,
  set: saveSettings,
  clear(): void {
    try { localStorage.removeItem(LS_SETTINGS_KEY); } catch {}
  },
  isEnabled(): boolean {
    return getSettings().enabled;
  },
};

async function get<T>(path: string, params?: Record<string, unknown>): Promise<T | null> {
  const settings = getSettings();
  if (!settings.enabled) return null;

  try {
    const { data } = await api.get(path, { params, timeout: 30000 });
    return data as T;
  } catch (error) {
    console.warn('[TMDBEmbed] Request failed:', path, error);
    return null;
  }
}

export async function checkHealth(): Promise<TMDBEmbedHealthResponse> {
  const result = await get<TMDBEmbedHealthResponse>('/api/tmdb-embed/health');
  return result || { available: false, baseUrl: getSettings().baseUrl, status: 'error' };
}

export async function getProviders(): Promise<TMDBEmbedProvider[]> {
  const result = await get<{ available: boolean; providers: TMDBEmbedProvider[] }>('/api/tmdb-embed/providers');
  return result?.providers || [];
}

export async function getMovieStreams(
  tmdbId: number | string,
  options?: { provider?: string }
): Promise<TMDBEmbedStreamsResponse> {
  const params: Record<string, unknown> = {};
  if (options?.provider) params.provider = options.provider;

  const result = await get<TMDBEmbedStreamsResponse>(
    `/api/tmdb-embed/movie/${tmdbId}`,
    Object.keys(params).length > 0 ? params : undefined
  );

  if (result && result.streams) {
    result.streams = sortByQuality(result.streams);
  }

  return result || { available: false, streams: [], totalStreams: 0 };
}

export async function getSeriesStreams(
  tmdbId: number | string,
  options?: {
    provider?: string;
    season?: number;
    episode?: number;
  }
): Promise<TMDBEmbedStreamsResponse> {
  const params: Record<string, unknown> = {};
  if (options?.provider) params.provider = options.provider;
  if (options?.season) params.season = options.season;
  if (options?.episode) params.episode = options.episode;

  const result = await get<TMDBEmbedStreamsResponse>(
    `/api/tmdb-embed/series/${tmdbId}`,
    Object.keys(params).length > 0 ? params : undefined
  );

  if (result && result.streams) {
    result.streams = sortByQuality(result.streams);
  }

  return result || { available: false, streams: [], totalStreams: 0 };
}

export function getStreamsGrouped(streams: TMDBEmbedStream[]): Record<string, TMDBEmbedStream[]> {
  return groupByProvider(streams);
}

export async function getProxyUrl(
  streamUrl: string,
  headers?: Record<string, string>
): Promise<string> {
  const params: Record<string, unknown> = { url: streamUrl };
  if (headers) params.headers = JSON.stringify(headers);

  const result = await get<{ proxyUrl: string; available: boolean }>(
    '/api/tmdb-embed/proxy-url',
    params
  );

  return result?.proxyUrl || streamUrl;
}

export function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url);
}

export function isMp4Url(url: string): boolean {
  return /\.mp4(\?|$)/i.test(url);
}

export function detectStreamType(url: string): 'hls' | 'mp4' | 'other' {
  if (isHlsUrl(url)) return 'hls';
  if (isMp4Url(url)) return 'mp4';
  return 'other';
}
