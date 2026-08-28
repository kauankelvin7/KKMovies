import axios, { AxiosInstance } from 'axios';

export interface TMDBEmbedStream {
  name: string;
  title: string;
  url: string;
  quality: string;
  provider: string;
  headers?: Record<string, string>;
  subtitles?: Array<{
    url: string;
    lang: string;
  }>;
}

export interface TMDBEmbedProviderStatus {
  name: string;
  enabled: boolean;
  displayName: string;
}

export interface TMDBEmbedStreamsResponse {
  streams: TMDBEmbedStream[];
  providerTimings?: Record<string, number>;
  totalProviders?: number;
  totalStreams?: number;
}

export interface TMDBEmbedHealthResponse {
  status: 'ok' | 'error';
  uptime?: number;
  version?: string;
}

export interface TMDBEmbedMetricsResponse {
  requestCount: number;
  errorCount: number;
  cacheHits: number;
  avgResponseTime: number;
}

export class TMDBEmbedApiService {
  private api: AxiosInstance;
  private baseURL: string;
  private isConfigured: boolean;

  constructor() {
    this.baseURL = process.env.TMDB_EMBED_API_URL || 'http://localhost:8787';
    this.isConfigured = !!process.env.TMDB_EMBED_API_URL;

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  getBaseUrl(): string {
    return this.baseURL;
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }

  async checkHealth(): Promise<TMDBEmbedHealthResponse> {
    if (!this.isConfigured) {
      return { status: 'error' };
    }
    try {
      const response = await this.api.get('/api/health');
      return response.data;
    } catch {
      return { status: 'error' };
    }
  }

  async getMetrics(): Promise<TMDBEmbedMetricsResponse | null> {
    if (!this.isConfigured) return null;
    try {
      const response = await this.api.get('/api/metrics');
      return response.data;
    } catch {
      return null;
    }
  }

  async getProviders(): Promise<TMDBEmbedProviderStatus[]> {
    if (!this.isConfigured) return [];
    try {
      const response = await this.api.get('/api/providers');
      return response.data.providers || [];
    } catch {
      return [];
    }
  }

  async getMovieStreams(
    tmdbId: string | number,
    options?: {
      provider?: string;
      season?: never;
      episode?: never;
    }
  ): Promise<TMDBEmbedStreamsResponse> {
    return this.fetchStreams('movie', String(tmdbId), options);
  }

  async getSeriesStreams(
    tmdbId: string | number,
    options?: {
      provider?: string;
      season?: number;
      episode?: number;
    }
  ): Promise<TMDBEmbedStreamsResponse> {
    return this.fetchStreams('series', String(tmdbId), options);
  }

  private async fetchStreams(
    type: 'movie' | 'series',
    tmdbId: string,
    options?: {
      provider?: string;
      season?: number;
      episode?: number;
    }
  ): Promise<TMDBEmbedStreamsResponse> {
    if (!this.isConfigured) {
      return { streams: [], totalStreams: 0 };
    }

    try {
      const params = new URLSearchParams();
      if (options?.season) params.append('season', String(options.season));
      if (options?.episode) params.append('episode', String(options.episode));

      const queryString = params.toString();
      const endpoint = options?.provider
        ? `/api/streams/${options.provider}/${type}/${tmdbId}`
        : `/api/streams/${type}/${tmdbId}`;

      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      const response = await this.api.get(url);

      const streams: TMDBEmbedStream[] = Array.isArray(response.data)
        ? response.data
        : response.data?.streams || [];

      return {
        streams,
        providerTimings: response.data?.providerTimings,
        totalProviders: response.data?.totalProviders,
        totalStreams: streams.length,
      };
    } catch (error) {
      console.error('[TMDBEmbedApi] Failed to fetch streams:', error);
      return { streams: [], totalStreams: 0 };
    }
  }

  getProxyUrl(streamUrl: string, headers?: Record<string, string>): string {
    if (!this.isConfigured) return streamUrl;

    const encodedUrl = encodeURIComponent(streamUrl);
    const isHls = streamUrl.includes('.m3u8');
    const isSubtitle = streamUrl.match(/\.(srt|vtt|ass)$/i);

    let proxyEndpoint = '/ts-proxy';
    if (isHls) proxyEndpoint = '/m3u8-proxy';
    else if (isSubtitle) proxyEndpoint = '/sub-proxy';

    let url = `${this.baseURL}${proxyEndpoint}?url=${encodedUrl}`;
    if (headers) {
      url += `&headers=${encodeURIComponent(JSON.stringify(headers))}`;
    }
    return url;
  }

  static qualityToNumber(quality: string): number {
    const q = quality.toLowerCase().trim();
    const num = parseInt(q.replace(/\D/g, ''), 10);
    if (!isNaN(num)) return num;

    const map: Record<string, number> = {
      auto: 1080,
      hd: 720,
      sd: 480,
      fhd: 1080,
      uhd: 2160,
      '4k': 2160,
      '2k': 1440,
    };
    return map[q] || 0;
  }

  static sortByQuality(streams: TMDBEmbedStream[]): TMDBEmbedStream[] {
    return [...streams].sort((a, b) => {
      const qa = TMDBEmbedApiService.qualityToNumber(a.quality);
      const qb = TMDBEmbedApiService.qualityToNumber(b.quality);
      return qb - qa;
    });
  }

  static groupByProvider(streams: TMDBEmbedStream[]): Record<string, TMDBEmbedStream[]> {
    return streams.reduce((acc, stream) => {
      const key = stream.provider || 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(stream);
      return acc;
    }, {} as Record<string, TMDBEmbedStream[]>);
  }
}

export default new TMDBEmbedApiService();
