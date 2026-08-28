import axios from 'axios';

const BASE_URL = 'https://superflixapi.beer';

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

export const superflixService = {
  getMovieStreamUrl(imdbId: string): string {
    return `${BASE_URL}/filme/${imdbId}`;
  },

  getSeriesStreamUrl(tmdbId: string): string {
    return `${BASE_URL}/serie/${tmdbId}`;
  },

  getSeasonStreamUrl(tmdbId: string, season: number): string {
    return `${BASE_URL}/serie/${tmdbId}/${season}`;
  },

  getEpisodeStreamUrl(tmdbId: string, season: number, episode: number): string {
    return `${BASE_URL}/serie/${tmdbId}/${season}/${episode}`;
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

function getImageUrl(path: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
}
