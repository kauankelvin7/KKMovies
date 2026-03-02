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

const CACHE_DURATION = 60 * 60 * 1000; // 60 minutos (1 hora)

/**
 * TMDB API Service - Handles all interactions with The Movie Database API
 * Rate-limited with exponential backoff retry on 429
 */
class TMDBService {
  private api: AxiosInstance;
  private apiKey: string;
  private initialized: Promise<void>;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 300; // 300ms entre requisições
  private activeRequests: number = 0;
  private readonly MAX_CONCURRENT = 3; // Máximo de requisições simultâneas
  private requestQueue: Array<() => void> = [];

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY || '';
    
    // Initialize API key from freekeys if not set
    this.initialized = this.initializeApiKey();

    // Create axios instance with TMDB base URL
    this.api = axios.create({
      baseURL: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
      params: {
        api_key: this.apiKey,
        language: 'pt-BR',
        region: 'BR',
      },
    });

    // Add response interceptor with exponential backoff for 429
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 429) {
          const config = error.config as any;
          const retryCount = config?.__retryCount || 0;
          const maxRetries = 3;

          if (retryCount < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 8000); // 1s, 2s, 4s
            console.warn(`⚠️ Rate limit 429 (tentativa ${retryCount + 1}/${maxRetries}), aguardando ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            if (config) {
              config.__retryCount = retryCount + 1;
              return this.api.request(config);
            }
          }

          // After max retries, try cache fallback
          if (config?.url) {
            const cacheKey = `fallback_${config.url}_${JSON.stringify(config.params)}`;
            const cached = this.cache.get(cacheKey);
            if (cached) {
              console.log(`📦 Usando cache fallback para ${cacheKey}`);
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
   * Transform movie data to include full image URLs and media_type
   */
  private transformMovie(movie: Movie, mediaType: string = 'movie'): Movie {
    return {
      ...movie,
      media_type: mediaType,
      poster_path: this.getImageUrl(movie.poster_path),
      backdrop_path: this.getImageUrl(movie.backdrop_path, 'w1280'),
    };
  }

  /**
   * Transform movie response to include full image URLs and media_type
   */
  private transformResponse(response: TMDBResponse<Movie>, mediaType: string = 'movie'): TMDBResponse<Movie> {
    return {
      ...response,
      results: response.results.map(movie => this.transformMovie(movie, mediaType)),
    };
  }

  /**
   * Ensure API is initialized before making requests
   */
  private async ensureInitialized(): Promise<void> {
    await this.initialized;
  }

  /**
   * Delay para respeitar rate limit + concurrency control
   */
  private async waitForRateLimit(): Promise<void> {
    // Wait if too many concurrent requests
    while (this.activeRequests >= this.MAX_CONCURRENT) {
      await new Promise<void>(resolve => {
        this.requestQueue.push(resolve);
      });
    }
    this.activeRequests++;

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const delay = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Release a request slot and process queue
   */
  private releaseRequest(): void {
    this.activeRequests--;
    if (this.requestQueue.length > 0) {
      const next = this.requestQueue.shift();
      if (next) next();
    }
  }

  /**
   * Get data from cache or fetch from API (with concurrency control)
   */
  private async getCached<T>(cacheKey: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📦 Cache hit: ${cacheKey}`);
      return cached.data as T;
    }
    
    console.log(`🌐 Fetching: ${cacheKey}`);
    await this.waitForRateLimit();
    try {
      const data = await fetcher();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } finally {
      this.releaseRequest();
    }
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
   * Get movies by genre (cached)
   */
  async getByGenre(genreId: number, page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    return this.getCached(`genre_${genreId}_${page}`, async () => {
      const response = await this.api.get<TMDBResponse<Movie>>('/discover/movie', {
        params: {
          with_genres: genreId,
          page,
          sort_by: 'popularity.desc',
        },
      });
      return this.transformResponse(response.data, 'movie');
    });
  }

  /**
   * Search movies by query (cached)
   */
  async searchMovies(query: string, page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    return this.getCached(`search_movies_${query}_${page}`, async () => {
      const response = await this.api.get<TMDBResponse<Movie>>('/search/movie', {
        params: { query, page },
      });
      return this.transformResponse(response.data, 'movie');
    });
  }

  /**
   * Multi-search: movies + TV series in a single call
   */
  async searchMulti(query: string, page: number = 1): Promise<any> {
    await this.ensureInitialized();
    return this.getCached(`search_multi_${query}_${page}`, async () => {
      const response = await this.api.get('/search/multi', {
        params: { query, page },
      });
      const data = response.data;
      // Filter only movies and tv, exclude people
      const filtered = (data.results || []).filter(
        (item: any) => item.media_type === 'movie' || item.media_type === 'tv'
      );
      // Normalize fields
      const normalized = filtered.map((item: any) => ({
        id: item.id,
        media_type: item.media_type,
        title: item.title || item.name || 'Sem título',
        original_title: item.original_title || item.original_name,
        overview: item.overview || '',
        poster_path: this.getImageUrl(item.poster_path),
        backdrop_path: this.getImageUrl(item.backdrop_path, 'w1280'),
        release_date: item.release_date || item.first_air_date || '',
        vote_average: item.vote_average || 0,
        vote_count: item.vote_count || 0,
        genre_ids: item.genre_ids || [],
        popularity: item.popularity || 0,
        adult: item.adult || false,
        original_language: item.original_language || '',
      }));
      return {
        results: normalized,
        total_results: data.total_results,
        total_pages: data.total_pages,
        page: data.page,
      };
    });
  }

  /**
   * Discover content (movies or TV) with advanced filters
   */
  async discoverContent(params: {
    type?: string;
    page?: number;
    sort_by?: string;
    with_genres?: string;
    primary_release_year?: number;
    first_air_date_year?: number;
    'vote_average.gte'?: number;
    with_original_language?: string;
  }): Promise<any> {
    await this.ensureInitialized();
    const { type = 'movie', ...rest } = params;
    const endpoint = type === 'tv' ? '/discover/tv' : '/discover/movie';
    const cacheKey = `discover_${type}_${JSON.stringify(rest)}`;
    return this.getCached(cacheKey, async () => {
      const response = await this.api.get(endpoint, {
        params: { 'vote_count.gte': 50, ...rest },
      });
      const data = response.data;
      const results = (data.results || []).map((item: any) => ({
        ...item,
        media_type: type,
        title: item.title || item.name || 'Sem título',
        release_date: item.release_date || item.first_air_date || '',
        poster_path: this.getImageUrl(item.poster_path),
        backdrop_path: this.getImageUrl(item.backdrop_path, 'w1280'),
      }));
      return { results, total_pages: data.total_pages || 1, page: data.page || 1 };
    });
  }

  /**
   * Get movie details by ID (includes IMDB ID)
   */
  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    await this.ensureInitialized();
    
    return this.getCached(`movie_details_${movieId}`, async () => {
      // Adiciona external_ids para obter o imdb_id
      const response = await this.api.get<MovieDetails & { external_ids?: { imdb_id?: string } }>(`/movie/${movieId}`, {
        params: {
          append_to_response: 'external_ids'
        }
      });
      const movie = response.data;
      
      // O imdb_id pode estar na raiz ou dentro de external_ids
      const imdb_id = movie.imdb_id || movie.external_ids?.imdb_id;
      
      return {
        ...movie,
        imdb_id,
        poster_path: this.getImageUrl(movie.poster_path),
        backdrop_path: this.getImageUrl(movie.backdrop_path, 'w1280'),
      };
    });
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
   * Get recommended movies based on a movie (cached)
   */
  async getRecommendations(movieId: number, page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    return this.getCached(`recommendations_${movieId}_${page}`, async () => {
      const response = await this.api.get<TMDBResponse<Movie>>(`/movie/${movieId}/recommendations`, {
        params: { page },
      });
      return this.transformResponse(response.data, 'movie');
    });
  }

  /**
   * Get similar movies (cached)
   */
  async getSimilarMovies(movieId: number, page: number = 1): Promise<TMDBResponse<Movie>> {
    await this.ensureInitialized();
    return this.getCached(`similar_${movieId}_${page}`, async () => {
      const response = await this.api.get<TMDBResponse<Movie>>(`/movie/${movieId}/similar`, {
        params: { page },
      });
      return this.transformResponse(response.data, 'movie');
    });
  }

  // ========== SERIES METHODS ==========

  /**
   * Transform series response to include full image URLs and media_type: 'tv'
   */
  private transformSeriesResponse(response: any): any {
    return {
      ...response,
      results: response.results.map((serie: any) => ({
        ...serie,
        media_type: 'tv',
        title: serie.title || serie.name || 'Sem título',
        release_date: serie.release_date || serie.first_air_date || '',
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
   * Get series details (cached)
   */
  async getSeriesDetails(seriesId: number): Promise<any> {
    await this.ensureInitialized();
    return this.getCached(`series_details_${seriesId}`, async () => {
      const response = await this.api.get(`/tv/${seriesId}`);
      const serie = response.data;
      return {
        ...serie,
        media_type: 'tv',
        poster_path: this.getImageUrl(serie.poster_path),
        backdrop_path: this.getImageUrl(serie.backdrop_path, 'w1280'),
      };
    });
  }

  /**
   * Get season details with episodes (cached)
   */
  async getSeasonDetails(seriesId: number, seasonNumber: number): Promise<any> {
    await this.ensureInitialized();
    return this.getCached(`season_${seriesId}_${seasonNumber}`, async () => {
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
    });
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
   * Discover series by genre (cached)
   */
  async discoverSeriesByGenre(genreId: number, page: number = 1, sortBy: string = 'popularity.desc'): Promise<any> {
    await this.ensureInitialized();
    return this.getCached(`discover_series_${genreId}_${page}_${sortBy}`, async () => {
      const response = await this.api.get('/discover/tv', {
        params: {
          with_genres: genreId,
          page,
          sort_by: sortBy,
        },
      });
      return this.transformSeriesResponse(response.data);
    });
  }

  /**
   * Get movie videos (trailers, teasers, etc.) from TMDB
   */
  async getMovieVideos(movieId: number): Promise<any> {
    await this.ensureInitialized();
    return this.getCached(`movie_videos_${movieId}`, async () => {
      const response = await this.api.get(`/movie/${movieId}/videos`);
      return response.data;
    });
  }

  /**
   * Get series videos (trailers, teasers, etc.) from TMDB
   */
  async getSeriesVideos(seriesId: number): Promise<any> {
    await this.ensureInitialized();
    return this.getCached(`series_videos_${seriesId}`, async () => {
      const response = await this.api.get(`/tv/${seriesId}/videos`);
      return response.data;
    });
  }
}

export default new TMDBService();
