export type EmbedServer = '111movies' | 'vidsrc' | 'vidking';
export type StreamingServer = EmbedServer | 'tmdb-embed';

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
  vidsrc: 'VidSrc',
  vidking: 'VidKing',
  unknown: 'Desconhecido',
};

export const SERVER_INFO: Record<StreamingServer, {
  name: string;
  description: string;
  icon: string;
  type: 'iframe' | 'native';
}> = {
  '111movies': {
    name: '111movies',
    description: 'Player oficial com anuncios minimos',
    icon: 'icon',
    type: 'iframe',
  },
  vidsrc: {
    name: 'VidSrc',
    description: 'Fonte principal do Streambert - estavel e rapido',
    icon: 'icon',
    type: 'iframe',
  },
  vidking: {
    name: 'VidKing',
    description: 'Fonte alternativa - grande acervo',
    icon: 'icon',
    type: 'iframe',
  },
  'tmdb-embed': {
    name: 'Fontes nativas',
    description: 'Reproducao direta, sem iframe de terceiros',
    icon: 'icon',
    type: 'native',
  },
};

export function qualityToNumber(quality: string): number {
  const q = quality.toLowerCase().trim();

  const aliasMap: Record<string, number> = {
    auto: 1080,
    hd: 720,
    sd: 480,
    fhd: 1080,
    uhd: 2160,
    '4k': 2160,
    '2k': 1440,
  };

  if (q in aliasMap) return aliasMap[q];

  const match = q.match(/\d+/);
  if (!match) return 0;

  return parseInt(match[0], 10);
}

export function sortByQuality(streams: TMDBEmbedStream[]): TMDBEmbedStream[] {
  return [...streams].sort((a, b) => qualityToNumber(b.quality) - qualityToNumber(a.quality));
}

export function groupByProvider(streams: TMDBEmbedStream[]): Record<string, TMDBEmbedStream[]> {
  return streams.reduce<Record<string, TMDBEmbedStream[]>>((acc, stream) => {
    const key = stream.provider || 'unknown';
    (acc[key] ??= []).push(stream);
    return acc;
  }, {});
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

export function getProviderDisplayName(provider: string): string {
  return PROVIDER_DISPLAY_NAMES[provider] ?? PROVIDER_DISPLAY_NAMES.unknown;
}
