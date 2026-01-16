import { Request, Response } from 'express';
import superflixService from '../services/superflix.service';

/**
 * Streaming controller - Handles streaming-related requests
 */
class StreamingController {
  /**
   * Get movie stream URL
   */
  getMovieStream(req: Request, res: Response): void {
    try {
      const { imdbId } = req.params;
      const options = {
        noLink: req.query.noLink === 'true',
        color: req.query.color as string,
        transparent: req.query.transparent === 'true',
        noBackground: req.query.noBackground === 'true',
      };

      const baseUrl = superflixService.getMovieStreamUrl(imdbId);
      const streamUrl = superflixService.buildPlayerUrl(baseUrl, options);

      res.json({ streamUrl });
    } catch (error) {
      console.error('Error getting movie stream:', error);
      res.status(500).json({ error: 'Failed to get movie stream' });
    }
  }

  /**
   * Get series/episode stream URL
   */
  getSeriesStream(req: Request, res: Response): void {
    try {
      const { tmdbId, season, episode } = req.params;
      const options = {
        noEpList: req.query.noEpList === 'true',
        noLink: req.query.noLink === 'true',
        color: req.query.color as string,
        transparent: req.query.transparent === 'true',
        noBackground: req.query.noBackground === 'true',
      };

      let baseUrl: string;

      if (episode) {
        baseUrl = superflixService.getEpisodeStreamUrl(
          tmdbId,
          parseInt(season),
          parseInt(episode)
        );
      } else if (season) {
        baseUrl = superflixService.getSeasonStreamUrl(tmdbId, parseInt(season));
      } else {
        baseUrl = superflixService.getSeriesStreamUrl(tmdbId);
      }

      const streamUrl = superflixService.buildPlayerUrl(baseUrl, options);

      res.json({ streamUrl });
    } catch (error) {
      console.error('Error getting series stream:', error);
      res.status(500).json({ error: 'Failed to get series stream' });
    }
  }

  /**
   * Get calendar of releases
   */
  async getCalendar(_req: Request, res: Response): Promise<void> {
    try {
      const calendar = await superflixService.getCalendar();
      res.json(calendar);
    } catch (error) {
      console.error('Error fetching calendar:', error);
      res.status(500).json({ error: 'Failed to fetch calendar' });
    }
  }

  /**
   * Get list of IDs
   */
  async getList(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as 'movie' | 'serie' | 'anime';
      const type = req.query.type as 'tmdb' | 'imdb' | undefined;
      const format = req.query.format as 'json' | undefined;
      const order = req.query.order as 'asc' | 'desc' | undefined;

      if (!category) {
        res.status(400).json({ error: 'Category parameter is required' });
        return;
      }

      const list = await superflixService.getList({
        category,
        type,
        format,
        order,
      });

      res.json(list);
    } catch (error) {
      console.error('Error fetching list:', error);
      res.status(500).json({ error: 'Failed to fetch list' });
    }
  }

  /**
   * Get Streamtape player URL
   */
  getStreamtapePlayer(req: Request, res: Response): void {
    try {
      const { videoId } = req.params;
      const options = {
        sub: req.query.sub as string,
        lang: req.query.lang as string,
        logo: req.query.logo as string,
        logo_link: req.query.logo_link as string,
        vast: req.query.vast as string,
        image: req.query.image as string,
      };

      const streamUrl = superflixService.buildStreamtapeUrl(videoId, options);

      res.json({ streamUrl });
    } catch (error) {
      console.error('Error getting streamtape player:', error);
      res.status(500).json({ error: 'Failed to get streamtape player' });
    }
  }
}

export default new StreamingController();
