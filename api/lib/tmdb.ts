import axios, { AxiosInstance, AxiosError } from 'axios';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
let freekeys: any;

// Dynamic import for freekeys
async function getFreekeys() {
  if (!freekeys) {
    freekeys = require('freekeys');
  }
  return freekeys;
}

export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  video: boolean;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}

class TMDBService {
  private api: AxiosInstance;
  private apiKey: string = '';
  private initialized: Promise<void> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.themoviedb.org/3',
      params: {
        language: 'pt-BR',
        region: 'BR',
      },
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('TMDB API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  private async initializeApiKey(): Promise<void> {
    if (this.apiKey) return;
    
    try {
      const freekeysModule = await getFreekeys();
      const keys = await freekeysModule();
      this.apiKey = keys.tmdb_key;
      this.api.defaults.params = {
        ...this.api.defaults.params,
        api_key: this.apiKey,
      };
    } catch (error) {
      console.error('Failed to get API key:', error);
      throw new Error('Failed to initialize TMDB API');
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      this.initialized = this.initializeApiKey();
    }
    await this.initialized;
  }

  private getImageUrl(path: string | null, size: string = 'w500'): string | null {
    if (!path) return null;
    return `${IMAGE_BASE_URL}/${size}${path}`;
  }

  private transformMovie(movie: Movie): Movie {
    return {
      ...movie,
      poster_path: this.getImageUrl(movie.poster_path),
      backdrop_path: this.getImageUrl(movie.backdrop_path, 'w1280'),
    };
  }

  private transformResponse(response: TMDBResponse<Movie>): TMDBResponse<Movie> {
    return {
      ...response,
      results: response.results.map(movie => this.transformMovie(movie)),
    };
  }

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

  // Movies
  async getTrending(page: number = 1) {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>('/trending/movie/week', { params: { page } });
    return this.transformResponse(response.data);
  }

  async getPopular(page: number = 1) {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>('/movie/popular', { params: { page } });
    return this.transformResponse(response.data);
  }

  async getTopRated(page: number = 1) {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>('/movie/top_rated', { params: { page } });
    return this.transformResponse(response.data);
  }

  async getLatestReleases(page: number = 1) {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>('/movie/now_playing', { params: { page } });
    return this.transformResponse(response.data);
  }

  async getUpcoming(page: number = 1) {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>('/movie/upcoming', { params: { page } });
    return this.transformResponse(response.data);
  }

  async getByGenre(genreId: number, page: number = 1) {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>('/discover/movie', {
      params: { with_genres: genreId, page, sort_by: 'popularity.desc' },
    });
    return this.transformResponse(response.data);
  }

  async searchMovies(query: string, page: number = 1) {
    await this.ensureInitialized();
    const response = await this.api.get<TMDBResponse<Movie>>('/search/movie', { params: { query, page } });
    return this.transformResponse(response.data);
  }

  async getMovieDetails(movieId: number) {
    await this.ensureInitialized();
    const response = await this.api.get(`/movie/${movieId}`);
    const movie = response.data;
    return {
      ...movie,
      poster_path: this.getImageUrl(movie.poster_path),
      backdrop_path: this.getImageUrl(movie.backdrop_path, 'w1280'),
    };
  }

  async getGenres() {
    await this.ensureInitialized();
    const response = await this.api.get<{ genres: Genre[] }>('/genre/movie/list');
    return response.data;
  }

  async getRecommendations(movieId: number, page: number = 1) {
    await this.ensureInitialized();
    const response = await this.api.get(`/movie/${movieId}/recommendations`, { params: { page } });
    return this.transformResponse(response.data);
  }

  async getSimilarMovies(movieId: number, page: number = 1) {
    await this.ensureInitialized();
    const response = await this.api.get(`/movie/${movieId}/similar`, { params: { page } });
    return this.transformResponse(response.data);
  }

  // Series
  async getTrendingSeries(page: number = 1) {
    await this.ensureInitialized();
    const response = await this.api.get('/trending/tv/week', { params: { page } });
    return this.transformSeriesResponse(response.data);
  }

  async getPopularSeries(page: number = 1) {
    await this.ensureInitialized();
    const response = await this.api.get('/tv/popular', { params: { page } });
    return this.transformSeriesResponse(response.data);
  }

  async getTopRatedSeries(page: number = 1) {
    await this.ensureInitialized();
    const response = await this.api.get('/tv/top_rated', { params: { page } });
    return this.transformSeriesResponse(response.data);
  }

  async searchSeries(query: string, page: number = 1) {
    await this.ensureInitialized();
    const response = await this.api.get('/search/tv', { params: { query, page } });
    return this.transformSeriesResponse(response.data);
  }

  async getSeriesDetails(seriesId: number) {
    await this.ensureInitialized();
    const response = await this.api.get(`/tv/${seriesId}`);
    const serie = response.data;
    return {
      ...serie,
      poster_path: this.getImageUrl(serie.poster_path),
      backdrop_path: this.getImageUrl(serie.backdrop_path, 'w1280'),
    };
  }

  async getSeasonDetails(seriesId: number, seasonNumber: number) {
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

  async getSeriesGenres() {
    await this.ensureInitialized();
    const response = await this.api.get<{ genres: Genre[] }>('/genre/tv/list');
    return response.data;
  }

  async discoverSeriesByGenre(genreId: number, page: number = 1, sortBy: string = 'popularity.desc') {
    await this.ensureInitialized();
    const response = await this.api.get('/discover/tv', {
      params: { with_genres: genreId, page, sort_by: sortBy },
    });
    return this.transformSeriesResponse(response.data);
  }
}

export const tmdbService = new TMDBService();
