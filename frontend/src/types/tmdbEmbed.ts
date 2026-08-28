export type StreamingServer = 'superflix' | 'tmdb-embed';

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

export interface TMDBEmbedProvider {
  name: string;
  enabled: boolean;
  displayName: string;
}

export interface TMDBEmbedStreamsResponse {
  available: boolean;
  streams: TMDBEmbedStream[];
  providerTimings?: Record<string, number>;
  totalProviders?: number;
  totalStreams?: number;
}

export interface TMDBEmbedHealthResponse {
  available: boolean;
  baseUrl: string;
  status: 'ok' | 'error';
  uptime?: number;
  version?: string;
}

export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  showbox: 'Showbox',
  '4khdhub': '4KHDHub',
  vixsrc: 'VixSrc',
  videasy: 'Videasy',
  vidlink: 'Vidlink',
  dahmermovies: 'DahmerMovies',
  streamflix: 'StreamFlix',
  vaplayer: 'VaPlayer',
  castletv: 'CastleTV',
  hdghartv: 'HDGharTV',
  netmirror: 'NetMirror',
  onetouchtv: 'OneTouchTV',
  zxcstreams: 'ZXCStreams',
  unknown: 'Desconhecido',
};

export const SERVER_INFO: Record<StreamingServer, {
  name: string;
  description: string;
  icon: string;
  type: 'iframe' | 'native';
}> = {
  superflix: {
    name: 'SuperFlix',
    description: 'Player incorporado com proteção contra pop-ups',
    icon: '📺',
    type: 'iframe',
  },
  'tmdb-embed': {
    name: 'Fontes nativas',
    description: 'Reprodução direta, sem iframe de terceiros',
    icon: '⚡',
    type: 'native',
  },
};

export function qualityToNumber(quality: string): number {
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

export function sortByQuality(streams: TMDBEmbedStream[]): TMDBEmbedStream[] {
  return [...streams].sort((a, b) => {
    const qa = qualityToNumber(a.quality);
    const qb = qualityToNumber(b.quality);
    return qb - qa;
  });
}

export function groupByProvider(streams: TMDBEmbedStream[]): Record<string, TMDBEmbedStream[]> {
  return streams.reduce((acc, stream) => {
    const key = stream.provider || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(stream);
    return acc;
  }, {} as Record<string, TMDBEmbedStream[]>);
}

export function formatQualityLabel(quality: string): string {
  const num = qualityToNumber(quality);
  if (num >= 2160) return '4K';
  if (num >= 1440) return '2K';
  if (num >= 1080) return 'Full HD';
  if (num >= 720) return 'HD';
  if (num >= 480) return 'SD';
  return quality || 'Auto';
}
