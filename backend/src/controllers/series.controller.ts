import { Request, Response } from 'express';
import tmdbService from '../services/tmdb.service';

/**
 * Series controller - Handles all series-related HTTP requests
 */
class SeriesController {
  /**
   * Get trending series
   */
  async getTrending(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const data = await tmdbService.getTrendingSeries(page);
      res.json(data);
    } catch (error) {
      console.error('Error fetching trending series:', error);
      res.status(500).json({ error: 'Failed to fetch trending series' });
    }
  }

  /**
   * Get popular series
   */
  async getPopular(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const data = await tmdbService.getPopularSeries(page);
      res.json(data);
    } catch (error) {
      console.error('Error fetching popular series:', error);
      res.status(500).json({ error: 'Failed to fetch popular series' });
    }
  }

  /**
   * Get top rated series
   */
  async getTopRated(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const data = await tmdbService.getTopRatedSeries(page);
      res.json(data);
    } catch (error) {
      console.error('Error fetching top rated series:', error);
      res.status(500).json({ error: 'Failed to fetch top rated series' });
    }
  }

  /**
   * Search series
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.query as string;
      const page = parseInt(req.query.page as string) || 1;

      if (!query) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const data = await tmdbService.searchSeries(query, page);
      res.json(data);
    } catch (error) {
      console.error('Error searching series:', error);
      res.status(500).json({ error: 'Failed to search series' });
    }
  }

  /**
   * Get series details
   */
  async getDetails(req: Request, res: Response): Promise<void> {
    try {
      const seriesId = parseInt(req.params.id);

      if (!seriesId) {
        res.status(400).json({ error: 'Series ID is required' });
        return;
      }

      const data = await tmdbService.getSeriesDetails(seriesId);
      res.json(data);
    } catch (error) {
      console.error('Error fetching series details:', error);
      res.status(500).json({ error: 'Failed to fetch series details' });
    }
  }

  /**
   * Get season details with episodes
   */
  async getSeason(req: Request, res: Response): Promise<void> {
    try {
      const seriesId = parseInt(req.params.id);
      const seasonNumber = parseInt(req.params.seasonNumber);

      if (!seriesId || isNaN(seasonNumber)) {
        res.status(400).json({ error: 'Series ID and season number are required' });
        return;
      }

      const data = await tmdbService.getSeasonDetails(seriesId, seasonNumber);
      res.json(data);
    } catch (error) {
      console.error('Error fetching season details:', error);
      res.status(500).json({ error: 'Failed to fetch season details' });
    }
  }

  /**
   * Get all series genres
   */
  async getGenres(req: Request, res: Response): Promise<void> {
    try {
      const data = await tmdbService.getSeriesGenres();
      res.json(data);
    } catch (error) {
      console.error('Error fetching series genres:', error);
      res.status(500).json({ error: 'Failed to fetch series genres' });
    }
  }

  /**
   * Discover series by genre
   */
  async discoverByGenre(req: Request, res: Response): Promise<void> {
    try {
      const genreId = parseInt(req.query.genreId as string);
      const page = parseInt(req.query.page as string) || 1;
      const sortBy = (req.query.sortBy as string) || 'popularity.desc';

      if (!genreId) {
        res.status(400).json({ error: 'Genre ID is required' });
        return;
      }

      const data = await tmdbService.discoverSeriesByGenre(genreId, page, sortBy);
      res.json(data);
    } catch (error) {
      console.error('Error discovering series by genre:', error);
      res.status(500).json({ error: 'Failed to discover series by genre' });
    }
  }
}

export default new SeriesController();
