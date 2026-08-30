import axios, { AxiosInstance } from 'axios';

class Embed111moviesService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = 'https://111movies.net';

    this.api = axios.create({
      baseURL: this.baseURL,
    });
  }

  getMovieStreamUrl(id: string): string {
    return `${this.baseURL}/movie/${id}`;
  }

  getSeriesStreamUrl(id: string): string {
    return `${this.baseURL}/tv/${id}`;
  }

  getSeasonStreamUrl(id: string, season: number): string {
    return `${this.baseURL}/tv/${id}/${season}`;
  }

  getEpisodeStreamUrl(id: string, season: number, episode: number): string {
    return `${this.baseURL}/tv/${id}/${season}/${episode}`;
  }

  async getList(params: {
    category: 'movie' | 'serie' | 'anime';
    type?: 'tmdb' | 'imdb';
    format?: 'json';
    order?: 'asc' | 'desc';
  }): Promise<any> {
    const response = await this.api.get('/lista', { params });
    return response.data;
  }

  async getCalendar(): Promise<any[]> {
    const response = await this.api.get('/calendario.php');
    return response.data.map((item: any) => ({
      ...item,
      poster_path: this.getImageUrl(item.poster_path),
      backdrop_path: this.getImageUrl(item.backdrop_path),
    }));
  }

  private getImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w500${path}`;
  }

  getAnimeStreamUrl(tmdbId: string, season?: number, episode?: number): string {
    let url = `${this.baseURL}/tv/${tmdbId}`;
    if (season) url += `/${season}`;
    if (episode) url += `/${episode}`;
    return url;
  }

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
  }

  buildStreamtapeUrl(videoId: string, options?: {
    sub?: string;
    lang?: string;
    logo?: string;
    logo_link?: string;
    vast?: string;
    image?: string;
  }): string {
    let url = `${this.baseURL}/stape/${videoId}`;

    if (options) {
      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
    }

    return url;
  }
}

const VIDSRC_BASE_URL = 'https://vidsrc.to';
const VIDKING_BASE_URL = 'https://vidking.xyz';

export class VidSrcService {
  getMovieStreamUrl(id: string): string {
    return `${VIDSRC_BASE_URL}/embed/movie/${id}`;
  }

  getEpisodeStreamUrl(id: string, season: number, episode: number): string {
    return `${VIDSRC_BASE_URL}/embed/tv/${id}/${season}/${episode}`;
  }

  buildPlayerUrl(baseUrl: string): string {
    return baseUrl;
  }
}

export class VidKingService {
  getMovieStreamUrl(imdbId: string): string {
    return `${VIDKING_BASE_URL}/embed/movie/${imdbId}`;
  }

  getEpisodeStreamUrl(tmdbId: string, season: number, episode: number): string {
    return `${VIDKING_BASE_URL}/embed/tv/${tmdbId}/${season}/${episode}`;
  }

  buildPlayerUrl(baseUrl: string): string {
    return baseUrl;
  }
}

export const movies111Service = new Embed111moviesService();
export const vidsrcService = new VidSrcService();
export const vidkingService = new VidKingService();

export default movies111Service;
