import axios, { AxiosInstance, AxiosError } from 'axios';
import { TMDBResponse, Movie, MovieDetails, Genre } from '../types/movie.types';
const freekeys = require('freekeys');

// URL base para imagens do TMDB
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/**
 * TMDB API Service - Handles all interactions with The Movie Database API
 */
class TMDBService {
  private api: AxiosInstance;
  private apiKey: string;
  private initialized: Promise<void>;

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY || '';
    
    // Initialize API key from freekeys if not set
    this.initialized = this.initializeApiKey();

    // Create axios instance with TMDB base URL
    this.api = axios.create({
      baseURL: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
      params: {
        api_key: this.apiKey,
        language: 'pt-BR', // Idioma português
        region: 'BR', // Região Brasil
      },
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('TMDB API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Initialize API key from freekeys if not set in environment
   */
  private async initializeApiKey(): Promise<void> {
    if (!this.apiKey) {
      try {
        console.log('🔑 Obtendo chave gratuita do TMDb via freekeys...');
        const keys = await freekeys();
        this.apiKey = keys.tmdb_key;
        
        // Update axios instance with new API key
        this.api.defaults.params = {
          api_key: this.apiKey,
          language: 'pt-BR',
          region: 'BR',
        };
        
        console.log('✅ Chave TMDb obtida com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao obter chave do freekeys:', error);
        console.warn('⚠️  TMDB_API_KEY não configurada - funcionalidades limitadas');
      }
    } else {
      console.log('✅ Usando TMDB_API_KEY do arquivo .env');
    }
  }

  /**
   * Build full image URL from path
   */
  private getImageUrl(path: string | null, size: string = 'w500'): string | null {
    if (!path) return null;
    return `${IMAGE_BASE_URL}/${size}${path}`;
  }

  /**
   * Transform movie data to include full image URLs
   */
  private transformMovie(movie: Movie): Movie {
    return {
      ...movie,
      poster_path: this.getImageUrl(movie.poster_path),
      backdrop_path: this.getImageUrl(movie.backdrop_path, 'w1280'),
    };
  }

  /**
   * Transform movie response to include full image URLs
   */
  private transformResponse(response: TMDBResponse<Movie>): TMDBResponse<Movie> {
    return {
      ...response,
      results: response.results.map(movie => this.transformMovie(movie)),
    };
  }

  /**
   * Ensure API is initialized before making requests
   */
  private async ensureInitialized(): Promise<void> {
    await this.initialized;
  }

  /**
   * Get trending movies for the week
   */
  async getTrending(page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>('/trending/movie/week', {
      params: { page },
    });
    return this.transformResponse(response.data);
  }

  /**
   * Get popular movies
   */
  async getPopular(page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>('/movie/popular', {
      params: { page },
    });
    return this.transformResponse(response.data);
  }

  /**
   * Get top rated movies
   */
  async getTopRated(page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>('/movie/top_rated', {
      params: { page },
    });
    return this.transformResponse(response.data);
  }

  /**
   * Get now playing / latest releases
   */
  async getLatestReleases(page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>('/movie/now_playing', {
      params: { page },
    });
    return this.transformResponse(response.data);
  }

  /**
   * Get upcoming movies
   */
  async getUpcoming(page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>('/movie/upcoming', {
      params: { page },
    });
    return this.transformResponse(response.data);
  }

  /**
   * Get movies by genre
   */
  async getByGenre(genreId: number, page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>('/discover/movie', {
      params: {
        with_genres: genreId,
        page,
        sort_by: 'popularity.desc',
      },
    });
    return this.transformResponse(response.data);
  }

  /**
   * Search movies by query
   */
  async searchMovies(query: string, page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>('/search/movie', {
      params: {
        query,
        page,
      },
    });
    return this.transformResponse(response.data);
  }

  /**
   * Get movie details by ID
   */
  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    await this.ensureInitialized();
    const response = await this.api.get<MovieDetails>(`/movie/${movieId}`);
    const movie = response.data;
    return {
      ...movie,
      poster_path: this.getImageUrl(movie.poster_path),
      backdrop_path: this.getImageUrl(movie.backdrop_path, 'w1280'),
    };
  }

  /**
   * Get all movie genres
   */
  async getGenres(): Promise<{ genres: Genre[] }> {
    await this.ensureInitialized();
    const response = await this.api.get<{ genres: Genre[] }>('/genre/movie/list');
    return response.data;
  }

  /**
   * Get recommended movies based on a movie
   */
  async getRecommendations(movieId: number, page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>(`/movie/${movieId}/recommendations`, {
      params: { page },
    });
    return this.transformResponse(response.data);
  }

  /**
   * Get similar movies
   */
  async getSimilarMovies(movieId: number, page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>(`/movie/${movieId}/similar`, {
      params: { page },
    });
    return this.transformResponse(response.data);
  }

  // ========== SERIES METHODS ==========

  /**
   * Transform series response to include full image URLs
   */
  private transformSeriesResponse(response: any): any {
    return {
      ...response,
      results: response.results.map((serie: any) => ({
        ...serie,
        poster_path: this.getImageUrl(serie.poster_path),
        backdrop_path: this.getImageUrl(serie.backdrop_path, 'w1280'),
      })),
    };
  }

  /**
   * Get trending series
   */
  async getTrendingSeries(page: number = 1): Promise<any> {
    await this.ensureInitialized();
    const response = await this.api.get('/trending/tv/week', { params: { page } });
    return this.transformSeriesResponse(response.data);
  }

  /**
   * Get popular series
   */
  async getPopularSeries(page: number = 1): Promise<any> {
    await this.ensureInitialized();
    const response = await this.api.get('/tv/popular', { params: { page } });
    return this.transformSeriesResponse(response.data);
  }

  /**
   * Get top rated series
   */
  async getTopRatedSeries(page: number = 1): Promise<any> {
    await this.ensureInitialized();
    const response = await this.api.get('/tv/top_rated', { params: { page } });
    return this.transformSeriesResponse(response.data);
  }

  /**
   * Search series
   */
  async searchSeries(query: string, page: number = 1): Promise<any> {
    await this.ensureInitialized();
    const response = await this.api.get('/search/tv', { params: { query, page } });
    return this.transformSeriesResponse(response.data);
  }

  /**
   * Get series details
   */
  async getSeriesDetails(seriesId: number): Promise<any> {
    await this.ensureInitialized();
    const response = await this.api.get(`/tv/${seriesId}`);
    const serie = response.data;
    return {
      ...serie,
      poster_path: this.getImageUrl(serie.poster_path),
      backdrop_path: this.getImageUrl(serie.backdrop_path, 'w1280'),
    };
  }

  /**
   * Get season details with episodes
   */
  async getSeasonDetails(seriesId: number, seasonNumber: number): Promise<any> {
    await this.ensureInitialized();
    const response = await this.api.get(`/tv/${seriesId}/season/${seasonNumber}`);
    const season = response.data;
    return {
      ...season,
      poster_path: this.getImageUrl(season.poster_path),
      episodes: season.episodes?.map((ep: any) => ({
        ...ep,
        still_path: this.getImageUrl(ep.still_path, 'w300'),
      })) || [],
    };
  }

  /**
   * Get all TV series genres
   */
  async getSeriesGenres(): Promise<{ genres: Genre[] }> {
    await this.ensureInitialized();
    const response = await this.api.get<{ genres: Genre[] }>('/genre/tv/list');
    return response.data;
  }

  /**
   * Discover series by genre
   */
  async discoverSeriesByGenre(genreId: number, page: number = 1, sortBy: string = 'popularity.desc'): Promise<any> {
    await this.ensureInitialized();
    const response = await this.api.get('/discover/tv', {
      params: {
        with_genres: genreId,
        page,
        sort_by: sortBy,
      },
    });
    return this.transformSeriesResponse(response.data);
  }
}

export default new TMDBService();
