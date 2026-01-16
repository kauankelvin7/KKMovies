import api from './api';

/**
 * Calendar item from SuperFlix API
 */
export interface CalendarItem {
  title: string;
  episode_title: string;
  episode_number: number;
  air_date: string;
  poster_path: string;
  backdrop_path: string;
  season_number: number;
  tmdb_id: string;
  imdb_id: string;
  status: 'Atualizado' | 'Hoje' | 'Futuro' | 'Atrasado';
}

/**
 * Streaming service for SuperFlix API integration
 */
class StreamingService {
  /**
   * Get movie streaming URL
   */
  async getMovieStreamUrl(imdbId: string, options?: {
    noLink?: boolean;
    color?: string;
    transparent?: boolean;
    noBackground?: boolean;
  }): Promise<string> {
    const params = new URLSearchParams();
    if (options?.noLink) params.append('noLink', 'true');
    if (options?.color) params.append('color', options.color);
    if (options?.transparent) params.append('transparent', 'true');
    if (options?.noBackground) params.append('noBackground', 'true');

    const queryString = params.toString();
    const url = `/streaming/movie/${imdbId}${queryString ? '?' + queryString : ''}`;
    
    const response = await api.get<{ streamUrl: string }>(url);
    return response.data.streamUrl;
  }

  /**
   * Get series/episode streaming URL
   */
  async getSeriesStreamUrl(
    tmdbId: string,
    season?: number,
    episode?: number,
    options?: {
      noEpList?: boolean;
      noLink?: boolean;
      color?: string;
      transparent?: boolean;
      noBackground?: boolean;
    }
  ): Promise<string> {
    const params = new URLSearchParams();
    if (options?.noEpList) params.append('noEpList', 'true');
    if (options?.noLink) params.append('noLink', 'true');
    if (options?.color) params.append('color', options.color);
    if (options?.transparent) params.append('transparent', 'true');
    if (options?.noBackground) params.append('noBackground', 'true');

    let url = `/streaming/series/${tmdbId}`;
    if (season) url += `/${season}`;
    if (episode) url += `/${episode}`;

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await api.get<{ streamUrl: string }>(url);
    return response.data.streamUrl;
  }

  /**
   * Get calendar of releases
   */
  async getCalendar(): Promise<CalendarItem[]> {
    const response = await api.get<CalendarItem[]>('/streaming/calendar');
    return response.data;
  }

  /**
   * Get list of content IDs
   */
  async getList(params: {
    category: 'movie' | 'serie' | 'anime';
    type?: 'tmdb' | 'imdb';
    format?: 'json';
    order?: 'asc' | 'desc';
  }): Promise<any> {
    const response = await api.get('/streaming/list', { params });
    return response.data;
  }

  /**
   * Get Streamtape player URL
   */
  async getStreamtapeUrl(videoId: string, options?: {
    sub?: string;
    lang?: string;
    logo?: string;
    logo_link?: string;
    vast?: string;
    image?: string;
  }): Promise<string> {
    const params = new URLSearchParams();
    if (options?.sub) params.append('sub', options.sub);
    if (options?.lang) params.append('lang', options.lang);
    if (options?.logo) params.append('logo', options.logo);
    if (options?.logo_link) params.append('logo_link', options.logo_link);
    if (options?.vast) params.append('vast', options.vast);
    if (options?.image) params.append('image', options.image);

    const queryString = params.toString();
    const url = `/streaming/streamtape/${videoId}${queryString ? '?' + queryString : ''}`;

    const response = await api.get<{ streamUrl: string }>(url);
    return response.data.streamUrl;
  }
}

export default new StreamingService();
