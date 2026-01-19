import api from './api';
import { MoviesResponse, MovieDetails, Genre, SearchParams } from '@/types/movie';

/**
 * Movie service for handling all movie-related API calls
 * Otimizado com cache e paginação inteligente
 */
class MovieService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Cache helper
   */
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get trending movies com cache
   */
  async getTrending(page: number = 1): Promise<MoviesResponse> {
    const cacheKey = `trending_${page}`;
    const cached = this.getCached<MoviesResponse>(cacheKey);
    if (cached) return cached;

    const response = await api.get<MoviesResponse>('/movies/trending', {
      params: { page },
    });
    this.setCache(cacheKey, response.data);
    return response.data;
  }

  /**
   * Get popular movies com cache
   */
  async getPopular(page: number = 1): Promise<MoviesResponse> {
    const cacheKey = `popular_${page}`;
    const cached = this.getCached<MoviesResponse>(cacheKey);
    if (cached) return cached;

    const response = await api.get<MoviesResponse>('/movies/popular', {
      params: { page },
    });
    this.setCache(cacheKey, response.data);
    return response.data;
  }

  /**
   * Get top rated movies
   */
  async getTopRated(page: number = 1): Promise<MoviesResponse> {
    const response = await api.get<MoviesResponse>('/movies/top-rated', {
      params: { page },
    });
    return response.data;
  }

  /**
   * Get latest releases
   */
  async getLatestReleases(page: number = 1): Promise<MoviesResponse> {
    const response = await api.get<MoviesResponse>('/movies/latest', {
      params: { page },
    });
    return response.data;
  }

  /**
   * Get upcoming movies
   */
  async getUpcoming(page: number = 1): Promise<MoviesResponse> {
    const response = await api.get<MoviesResponse>('/movies/upcoming', {
      params: { page },
    });
    return response.data;
  }

  /**
   * Get movies by genre
   */
  async getByGenre(genreId: number, page: number = 1): Promise<MoviesResponse> {
    const response = await api.get<MoviesResponse>('/movies/genre', {
      params: { genreId, page },
    });
    return response.data;
  }

  /**
   * Search movies by query
   */
  async search(params: SearchParams): Promise<MoviesResponse> {
    const response = await api.get<MoviesResponse>('/movies/search', {
      params,
    });
    return response.data;
  }

  /**
   * Get movie details by ID
   */
  async getDetails(movieId: number): Promise<MovieDetails> {
    const response = await api.get<MovieDetails>(`/movies/${movieId}`);
    return response.data;
  }

  /**
   * Get all available genres
   */
  async getGenres(): Promise<Genre[]> {
    const response = await api.get<{ genres: Genre[] }>('/movies/genres');
    return response.data.genres;
  }

  /**
   * Get recommended movies based on a movie ID
   */
  async getRecommendations(movieId: number, page: number = 1): Promise<MoviesResponse> {
    const response = await api.get<MoviesResponse>(`/movies/${movieId}/recommendations`, {
      params: { page },
    });
    return response.data;
  }

  /**
   * Get similar movies based on a movie ID
   */
  async getSimilar(movieId: number, page: number = 1): Promise<MoviesResponse> {
    const response = await api.get<MoviesResponse>(`/movies/${movieId}/similar`, {
      params: { page },
    });
    return response.data;
  }
}

export default new MovieService();
