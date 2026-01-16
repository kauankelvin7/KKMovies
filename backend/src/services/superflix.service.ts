import axios, { AxiosInstance } from 'axios';

/**
 * SuperFlix API Service - Handles streaming integration
 */
class SuperFlixService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = 'https://superflixapi.bond';
    
    this.api = axios.create({
      baseURL: this.baseURL,
    });
  }

  /**
   * Get movie streaming URL
   */
  getMovieStreamUrl(imdbId: string): string {
    return `${this.baseURL}/filme/${imdbId}`;
  }

  /**
   * Get series streaming URL
   */
  getSeriesStreamUrl(tmdbId: string): string {
    return `${this.baseURL}/serie/${tmdbId}`;
  }

  /**
   * Get specific season streaming URL
   */
  getSeasonStreamUrl(tmdbId: string, season: number): string {
    return `${this.baseURL}/serie/${tmdbId}/${season}`;
  }

  /**
   * Get specific episode streaming URL
   */
  getEpisodeStreamUrl(tmdbId: string, season: number, episode: number): string {
    return `${this.baseURL}/serie/${tmdbId}/${season}/${episode}`;
  }

  /**
   * Get list of IDs by category
   */
  async getList(params: {
    category: 'movie' | 'serie' | 'anime';
    type?: 'tmdb' | 'imdb';
    format?: 'json';
    order?: 'asc' | 'desc';
  }): Promise<any> {
    const response = await this.api.get('/lista', { params });
    return response.data;
  }

  /**
   * Get calendar of releases
   */
  async getCalendar(): Promise<any[]> {
    const response = await this.api.get('/calendario.php');
    // Garantir URLs completas para as imagens
    return response.data.map((item: any) => ({
      ...item,
      poster_path: this.getImageUrl(item.poster_path),
      backdrop_path: this.getImageUrl(item.backdrop_path),
    }));
  }

  /**
   * Get complete image URL
   */
  private getImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // TMDb image base URL
    return `https://image.tmdb.org/t/p/w500${path}`;
  }

  /**
   * Get anime streaming URL
   */
  getAnimeStreamUrl(tmdbId: string, season?: number, episode?: number): string {
    let url = `${this.baseURL}/serie/${tmdbId}`;
    if (season) url += `/${season}`;
    if (episode) url += `/${episode}`;
    return url;
  }

  /**
   * Build player URL with customization options
   */
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

  /**
   * Build Streamtape player URL
   */
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

export default new SuperFlixService();
