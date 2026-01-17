import axios, { AxiosInstance, AxiosError } from 'axios';
import { TMDBResponse, Movie, MovieDetails, Genre } from '../types/movie.types';
const freekeys = require('freekeys');

// URL base para imagens do TMDB
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Cache simples em memória
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 60 * 60 * 1000; // 60 minutos (1 hora) - aumentado drasticamente para evitar 429

/**
 * TMDB API Service - Handles all interactions with The Movie Database API
 */
class TMDBService {
  private api: AxiosInstance;
  private apiKey: string;
  private initialized: Promise<void>;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 250; // 250ms entre requisições

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
      async (error: AxiosError) => {
        // Se for erro 429, esperar e tentar novamente
        if (error.response?.status === 429) {
          console.warn('⚠️ Rate limit atingido (429), aguardando 2 segundos...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          // Retornar dados em cache se disponível
          const config = error.config;
          if (config?.url) {
            const cacheKey = `fallback_${config.url}_${JSON.stringify(config.params)}`;
            const cached = this.cache.get(cacheKey);
            if (cached) {
              console.log(`📦 Usando cache antigo para ${cacheKey}`);
              return { data: cached.data };
            }
          }
        }
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
   * Delay para respeitar rate limit
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const delay = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Get data from cache or fetch from API
   */
  private async getCached<T>(cacheKey: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📦 Cache hit: ${cacheKey}`);
      return cached.data as T;
    }
    
    console.log(`🌐 Fetching: ${cacheKey}`);
    await this.waitForRateLimit(); // Aguardar rate limit antes de fazer requisição
    const data = await fetcher();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  /**
   * Get trending movies for the week
   */
  async getTrending(page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    return this.getCached(`trending_${page}`, async () => {
      const response = await this.api.get<TMDBResponse<Movie>>('/trending/movie/week', {
        params: { page },
      });
      return this.transformResponse(response.data);
    });
  }

  /**
   * Get popular movies
   */
  async getPopular(page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    return this.getCached(`popular_${page}`, async () => {
      const response = await this.api.get<TMDBResponse<Movie>>('/movie/popular', {
        params: { page },
      });
      return this.transformResponse(response.data);
    });
  }

  /**
   * Get top rated movies
   */
  async getTopRated(page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    return this.getCached(`top_rated_${page}`, async () => {
      const response = await this.api.get<TMDBResponse<Movie>>('/movie/top_rated', {
        params: { page },
      });
      return this.transformResponse(response.data);
    });
  }

  /**
   * Get now playing / latest releases
   */
  async getLatestReleases(page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    return this.getCached(`now_playing_${page}`, async () => {
      const response = await this.api.get<TMDBResponse<Movie>>('/movie/now_playing', {
        params: { page },
      });
      return this.transformResponse(response.data);
    });
  }

  /**
   * Get upcoming movies (apenas filmes futuros)
   */
  async getUpcoming(page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    
    return this.getCached(`upcoming_${page}`, async () => {
      // Data atual + 1 dia (para evitar filmes de hoje) e data futura (6 meses)
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const sixMonthsLater = new Date(today);
      sixMonthsLater.setMonth(today.getMonth() + 6);
      
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const futureStr = sixMonthsLater.toISOString().split('T')[0];
      
      const response = await this.api.get<TMDBResponse<Movie>>('/discover/movie', {
        params: { 
          page,
          'primary_release_date.gte': tomorrowStr,
          'primary_release_date.lte': futureStr,
          sort_by: 'primary_release_date.asc',
          with_release_type: '2|3', // Theatrical release
        },
      });
      return this.transformResponse(response.data);
    });
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
    return this.getCached('movie_genres', async () => {
      const response = await this.api.get<{ genres: Genre[] }>('/genre/movie/list');
      return response.data;
    });
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
    return this.getCached(`trending_series_${page}`, async () => {
      const response = await this.api.get('/trending/tv/week', { params: { page } });
      return this.transformSeriesResponse(response.data);
    });
  }

  /**
   * Get popular series
   */
  async getPopularSeries(page: number = 1): Promise<any> {
    await this.ensureInitialized();
    return this.getCached(`popular_series_${page}`, async () => {
      const response = await this.api.get('/tv/popular', { params: { page } });
      return this.transformSeriesResponse(response.data);
    });
  }

  /**
   * Get top rated series
   */
  async getTopRatedSeries(page: number = 1): Promise<any> {
    await this.ensureInitialized();
    return this.getCached(`top_rated_series_${page}`, async () => {
      const response = await this.api.get('/tv/top_rated', { params: { page } });
      return this.transformSeriesResponse(response.data);
    });
  }

  /**
   * Search series
   */
  async searchSeries(query: string, page: number = 1): Promise<any> {
    await this.ensureInitialized();
    return this.getCached(`search_series_${query}_${page}`, async () => {
      const response = await this.api.get('/search/tv', { params: { query, page } });
      return this.transformSeriesResponse(response.data);
    });
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
    return this.getCached('series_genres', async () => {
      const response = await this.api.get<{ genres: Genre[] }>('/genre/tv/list');
      return response.data;
    });
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
