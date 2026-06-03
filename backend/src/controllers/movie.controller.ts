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
      const query = (req.query.query || req.query.q) as string;
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
   * Multi-search (movies + series)
   */
  async searchMulti(req: Request, res: Response): Promise<void> {
    try {
      const query = (req.query.query || req.query.q) as string;
      const page = parseInt(req.query.page as string) || 1;

      if (!query) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const data = await tmdbService.searchMulti(query, page);
      res.json(data);
    } catch (error) {
      console.error('Error in multi-search:', error);
      res.status(500).json({ error: 'Failed to search' });
    }
  }

  /**
   * Discover movies/series with filters
   */
  async discover(req: Request, res: Response): Promise<void> {
    try {
      const params: any = {};
      if (req.query.type) params.type = req.query.type;
      if (req.query.page) params.page = parseInt(req.query.page as string) || 1;
      if (req.query.sort_by) params.sort_by = req.query.sort_by;
      if (req.query.with_genres) params.with_genres = req.query.with_genres;
      if (req.query.primary_release_year) params.primary_release_year = parseInt(req.query.primary_release_year as string);
      if (req.query.first_air_date_year) params.first_air_date_year = parseInt(req.query.first_air_date_year as string);
      if (req.query['vote_average.gte']) params['vote_average.gte'] = parseFloat(req.query['vote_average.gte'] as string);
      if (req.query.with_original_language) params.with_original_language = req.query.with_original_language;

      const data = await tmdbService.discoverContent(params);
      res.json(data);
    } catch (error) {
      console.error('Error in discover:', error);
      res.status(500).json({ error: 'Failed to discover content' });
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
   * Get movie credits
   */
  async getCredits(req: Request, res: Response): Promise<void> {
    try {
      const movieId = parseInt(req.params.id);

      if (!movieId) {
        res.status(400).json({ error: 'Movie ID is required' });
        return;
      }

      const data = await tmdbService.getMovieCredits(movieId);
      res.json(data);
    } catch (error) {
      console.error('Error fetching movie credits:', error);
      res.status(500).json({ error: 'Failed to fetch movie credits' });
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

  /**
   * Get movie videos (trailers, teasers)
   */
  async getVideos(req: Request, res: Response): Promise<void> {
    try {
      const movieId = parseInt(req.params.id);

      if (!movieId) {
        res.status(400).json({ error: 'Movie ID is required' });
        return;
      }

      const data = await tmdbService.getMovieVideos(movieId);
      res.json(data);
    } catch (error) {
      console.error('Error fetching movie videos:', error);
      res.status(500).json({ error: 'Failed to fetch movie videos' });
    }
  }
}

export default new MovieController();
