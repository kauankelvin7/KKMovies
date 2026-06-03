import axios from 'axios';

const BASE_URL = 'https://superflixapi.bond';

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
    const response = await axios.get(`${BASE_URL}/calendario.php`);
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
};

function getImageUrl(path: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
}
