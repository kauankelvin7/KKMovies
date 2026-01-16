import api from './api';
import { MoviesResponse, MovieDetails, Genre, SearchParams } from '@/types/movie';

/**
 * Movie service for handling all movie-related API calls
 */
class MovieService {
  /**
   * Get trending movies
   */
  async getTrending(page: number = 1): Promise<MoviesResponse> {
    const response = await api.get<MoviesResponse>('/movies/trending', {
      params: { page },
    });
    return response.data;
  }

  /**
   * Get popular movies
   */
  async getPopular(page: number = 1): Promise<MoviesResponse> {
    const response = await api.get<MoviesResponse>('/movies/popular', {
      params: { page },
    });
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
