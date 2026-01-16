import { Request, Response } from 'express';
import tmdbService from '../services/tmdb.service';

/**
 * Movie controller - Handles all movie-related HTTP requests
 */
class MovieController {
  /**
   * Get trending movies
   */
  async getTrending(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const data = await tmdbService.getTrending(page);
      res.json(data);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      res.status(500).json({ error: 'Failed to fetch trending movies' });
    }
  }

  /**
   * Get popular movies
   */
  async getPopular(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const data = await tmdbService.getPopular(page);
      res.json(data);
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      res.status(500).json({ error: 'Failed to fetch popular movies' });
    }
  }

  /**
   * Get top rated movies
   */
  async getTopRated(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const data = await tmdbService.getTopRated(page);
      res.json(data);
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      res.status(500).json({ error: 'Failed to fetch top rated movies' });
    }
  }

  /**
   * Get latest releases
   */
  async getLatestReleases(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const data = await tmdbService.getLatestReleases(page);
      res.json(data);
    } catch (error) {
      console.error('Error fetching latest releases:', error);
      res.status(500).json({ error: 'Failed to fetch latest releases' });
    }
  }

  /**
   * Get upcoming movies
   */
  async getUpcoming(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const data = await tmdbService.getUpcoming(page);
      res.json(data);
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
      res.status(500).json({ error: 'Failed to fetch upcoming movies' });
    }
  }

  /**
   * Get movies by genre
   */
  async getByGenre(req: Request, res: Response): Promise<void> {
    try {
      const genreId = parseInt(req.query.genreId as string);
      const page = parseInt(req.query.page as string) || 1;

      if (!genreId) {
        res.status(400).json({ error: 'Genre ID is required' });
        return;
      }

      const data = await tmdbService.getByGenre(genreId, page);
      res.json(data);
    } catch (error) {
      console.error('Error fetching movies by genre:', error);
      res.status(500).json({ error: 'Failed to fetch movies by genre' });
    }
  }

  /**
   * Search movies
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.query as string;
      const page = parseInt(req.query.page as string) || 1;

      if (!query) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const data = await tmdbService.searchMovies(query, page);
      res.json(data);
    } catch (error) {
      console.error('Error searching movies:', error);
      res.status(500).json({ error: 'Failed to search movies' });
    }
  }

  /**
   * Get movie details
   */
  async getDetails(req: Request, res: Response): Promise<void> {
    try {
      const movieId = parseInt(req.params.id);

      if (!movieId) {
        res.status(400).json({ error: 'Movie ID is required' });
        return;
      }

      const data = await tmdbService.getMovieDetails(movieId);
      res.json(data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      res.status(500).json({ error: 'Failed to fetch movie details' });
    }
  }

  /**
   * Get all genres
   */
  async getGenres(_req: Request, res: Response): Promise<void> {
    try {
      const data = await tmdbService.getGenres();
      res.json(data);
    } catch (error) {
      console.error('Error fetching genres:', error);
      res.status(500).json({ error: 'Failed to fetch genres' });
    }
  }

  /**
   * Get movie recommendations
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const movieId = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;

      if (!movieId) {
        res.status(400).json({ error: 'Movie ID is required' });
        return;
      }

      const data = await tmdbService.getRecommendations(movieId, page);
      res.json(data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  }

  /**
   * Get similar movies
   */
  async getSimilar(req: Request, res: Response): Promise<void> {
    try {
      const movieId = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;

      if (!movieId) {
        res.status(400).json({ error: 'Movie ID is required' });
        return;
      }

      const data = await tmdbService.getSimilarMovies(movieId, page);
      res.json(data);
    } catch (error) {
      console.error('Error fetching similar movies:', error);
      res.status(500).json({ error: 'Failed to fetch similar movies' });
    }
  }
}

export default new MovieController();
