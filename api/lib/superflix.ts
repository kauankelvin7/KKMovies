import axios from 'axios';

const BASE_URL = 'https://111movies.net';
const VIDSRC_BASE_URL = 'https://vidsrc.to';
const VIDKING_BASE_URL = 'https://vidking.xyz';

export const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Ch-Ua': '"Chromium";v="128", "Not:A-Brand";v="99", "Google Chrome";v="128"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'iframe',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'cross-site',
  'Upgrade-Insecure-Requests': '1',
};

export const movies111Service = {
  getMovieStreamUrl(id: string): string {
    return `${BASE_URL}/movie/${id}`;
  },

  getSeriesStreamUrl(id: string): string {
    return `${BASE_URL}/tv/${id}`;
  },

  getSeasonStreamUrl(id: string, season: number): string {
    return `${BASE_URL}/tv/${id}/${season}`;
  },

  getEpisodeStreamUrl(id: string, season: number, episode: number): string {
    return `${BASE_URL}/tv/${id}/${season}/${episode}`;
  },

  async getCalendar(): Promise<any[]> {
    const response = await axios.get(`${BASE_URL}/calendario.php`, {
      headers: BROWSER_HEADERS,
      timeout: 15000,
    });
    return response.data.map((item: any) => ({
      ...item,
      poster_path: getImageUrl(item.poster_path),
      backdrop_path: getImageUrl(item.backdrop_path),
    }));
  },

  buildPlayerUrl(baseUrl: string, options?: {
    noEpList?: boolean;
    color?: string;
    noLink?: boolean;
    transparent?: boolean;
    noBackground?: boolean;
  }): string {
    let url = baseUrl;
    const params: string[] = [];

    if (options?.noEpList) params.push('noEpList');
    if (options?.color) params.push(`color:${options.color.replace('#', '')}`);
    if (options?.noLink) params.push('noLink');
    if (options?.transparent) params.push('transparent');
    if (options?.noBackground) params.push('noBackground');

    if (params.length > 0) {
      url += '#' + params.join('#');
    }

    return url;
  },

  isImdbId(id: string | number | undefined | null): boolean {
    if (!id) return false;
    return /^tt\d{7,}$/.test(String(id));
  },
};

export const vidsrcService = {
  getMovieStreamUrl(id: string): string {
    return `${VIDSRC_BASE_URL}/embed/movie/${id}`;
  },

  getEpisodeStreamUrl(id: string, season: number, episode: number): string {
    return `${VIDSRC_BASE_URL}/embed/tv/${id}/${season}/${episode}`;
  },

  buildPlayerUrl(baseUrl: string): string {
    return baseUrl;
  },

  isImdbId(id: string | number | undefined | null): boolean {
    if (!id) return false;
    return /^tt\d{7,}$/.test(String(id));
  },
};

export const vidkingService = {
  getMovieStreamUrl(imdbId: string): string {
    return `${VIDKING_BASE_URL}/embed/movie/${imdbId}`;
  },

  getEpisodeStreamUrl(tmdbId: string, season: number, episode: number): string {
    return `${VIDKING_BASE_URL}/embed/tv/${tmdbId}/${season}/${episode}`;
  },

  buildPlayerUrl(baseUrl: string): string {
    return baseUrl;
  },

  isImdbId(id: string | number | undefined | null): boolean {
    if (!id) return false;
    return /^tt\d{7,}$/.test(String(id));
  },
};

function getImageUrl(path: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
}
