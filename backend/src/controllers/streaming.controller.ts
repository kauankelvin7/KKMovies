import { Request, Response } from 'express';
import superflixService from '../services/superflix.service';
import { probeStreamUrl } from '../services/streamProbe';

function playerOptions(query: Request['query']) {
  return {
    noEpList: query.noEpList === 'true',
    noLink: query.noLink !== 'false',
    color: query.color as string,
    transparent: query.transparent === 'true',
    noBackground: query.noBackground === 'true',
  };
}

function streamPayload(streamUrl: string, diagnostics: Awaited<ReturnType<typeof probeStreamUrl>>) {
  const mode = diagnostics.captcha
    ? 'iframe-captcha-required'
    : diagnostics.unavailable
      ? 'unavailable'
      : 'iframe-direct';

  return {
    streamUrl,
    directUrl: streamUrl,
    mode,
    diagnostics,
    warning: diagnostics.unavailable
      ? 'Este título não está disponível neste servidor no momento.'
      : diagnostics.captcha
        ? 'O servidor pediu uma verificação de segurança.'
        : undefined,
  };
}

class StreamingController {
  async getMovieStream(req: Request, res: Response): Promise<void> {
    try {
      const { imdbId } = req.params;
      const baseUrl = superflixService.getMovieStreamUrl(imdbId);
      const streamUrl = superflixService.buildPlayerUrl(baseUrl, playerOptions(req.query));
      const diagnostics = await probeStreamUrl(streamUrl);

      res.json(streamPayload(streamUrl, diagnostics));
    } catch (error) {
      console.error('Error getting movie stream:', error);
      res.status(500).json({ error: 'Não foi possível obter o player deste filme.' });
    }
  }

  async getSeriesStream(req: Request, res: Response): Promise<void> {
    try {
      const { tmdbId, season, episode } = req.params;

      let baseUrl: string;

      if (episode) {
        baseUrl = superflixService.getEpisodeStreamUrl(
          tmdbId,
          parseInt(season, 10),
          parseInt(episode, 10),
        );
      } else if (season) {
        baseUrl = superflixService.getSeasonStreamUrl(tmdbId, parseInt(season, 10));
      } else {
        baseUrl = superflixService.getSeriesStreamUrl(tmdbId);
      }

      const streamUrl = superflixService.buildPlayerUrl(baseUrl, playerOptions(req.query));
      const diagnostics = await probeStreamUrl(streamUrl);

      res.json(streamPayload(streamUrl, diagnostics));
    } catch (error) {
      console.error('Error getting series stream:', error);
      res.status(500).json({ error: 'Não foi possível obter o player desta série.' });
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
