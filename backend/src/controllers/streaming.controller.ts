import { Request, Response } from 'express';
import movies111Service, { vidsrcService, vidkingService } from '../services/superflix.service';
import { probeStreamUrl } from '../services/streamProbe';

export type StreamingServer = '111movies' | 'vidsrc' | 'vidking';

function playerOptions(query: Request['query']) {
  return {
    noEpList: query.noEpList === 'true',
    noLink: query.noLink !== 'false',
    color: query.color as string,
    transparent: query.transparent === 'true',
    noBackground: query.noBackground === 'true',
  };
}

function resolveServer(query: Request['query']): StreamingServer {
  const server = (query.server as string) || '111movies';
  if (server === 'vidsrc' || server === 'vidking') return server;
  return '111movies';
}

function streamPayload(
  streamUrl: string,
  diagnostics: Awaited<ReturnType<typeof probeStreamUrl>>,
  server: StreamingServer,
) {
  const mode = diagnostics.captcha
    ? 'iframe-captcha-required'
    : diagnostics.unavailable
      ? 'unavailable'
      : 'iframe-direct';

  return {
    streamUrl,
    directUrl: streamUrl,
    mode,
    server,
    diagnostics,
    warning: diagnostics.unavailable
      ? `Este título não está disponível no servidor ${server} no momento. Tente outra fonte.`
      : diagnostics.captcha
        ? 'O servidor pediu uma verificação de segurança.'
        : undefined,
  };
}

class StreamingController {
  async getMovieStream(req: Request, res: Response): Promise<void> {
    try {
      const { imdbId } = req.params;
      const server = resolveServer(req.query);

      let baseUrl: string;
      switch (server) {
        case 'vidsrc':
          baseUrl = vidsrcService.getMovieStreamUrl(imdbId);
          break;
        case 'vidking':
          baseUrl = vidkingService.getMovieStreamUrl(imdbId);
          break;
        case '111movies':
        default:
          baseUrl = movies111Service.getMovieStreamUrl(imdbId);
      }

      const streamUrl = server === '111movies'
        ? movies111Service.buildPlayerUrl(baseUrl, playerOptions(req.query))
        : baseUrl;
      const diagnostics = await probeStreamUrl(streamUrl);

      res.json(streamPayload(streamUrl, diagnostics, server));
    } catch (error) {
      console.error('Error getting movie stream:', error);
      res.status(500).json({ error: 'Não foi possível obter o player deste filme.' });
    }
  }

  async getSeriesStream(req: Request, res: Response): Promise<void> {
    try {
      const { tmdbId, season, episode } = req.params;
      const server = resolveServer(req.query);

      let baseUrl: string;
      const s = season ? parseInt(season, 10) : undefined;
      const e = episode ? parseInt(episode, 10) : undefined;

      switch (server) {
        case 'vidsrc':
          baseUrl = s && e
            ? vidsrcService.getEpisodeStreamUrl(tmdbId, s, e)
            : vidsrcService.getMovieStreamUrl(tmdbId);
          break;
        case 'vidking':
          baseUrl = s && e
            ? vidkingService.getEpisodeStreamUrl(tmdbId, s, e)
            : vidkingService.getMovieStreamUrl(tmdbId);
          break;
        case '111movies':
        default:
          if (s && e) {
            baseUrl = movies111Service.getEpisodeStreamUrl(tmdbId, s, e);
          } else if (s) {
            baseUrl = movies111Service.getSeasonStreamUrl(tmdbId, s);
          } else {
            baseUrl = movies111Service.getSeriesStreamUrl(tmdbId);
          }
      }

      const streamUrl = server === '111movies'
        ? movies111Service.buildPlayerUrl(baseUrl, playerOptions(req.query))
        : baseUrl;
      const diagnostics = await probeStreamUrl(streamUrl);

      res.json(streamPayload(streamUrl, diagnostics, server));
    } catch (error) {
      console.error('Error getting series stream:', error);
      res.status(500).json({ error: 'Não foi possível obter o player desta série.' });
    }
  }

  async getCalendar(_req: Request, res: Response): Promise<void> {
    try {
      const calendar = await movies111Service.getCalendar();
      res.json(calendar);
    } catch (error) {
      console.error('Error fetching calendar:', error);
      res.status(500).json({ error: 'Failed to fetch calendar' });
    }
  }

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

      const list = await movies111Service.getList({
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

      const streamUrl = movies111Service.buildStreamtapeUrl(videoId, options);
      res.json({ streamUrl });
    } catch (error) {
      console.error('Error getting streamtape player:', error);
      res.status(500).json({ error: 'Failed to get streamtape player' });
    }
  }

  getServers(_req: Request, res: Response): void {
    res.json({
      servers: [
        { id: '111movies', name: '111movies', description: 'Player oficial com anúncios mínimos', supportsImdb: true, supportsTmdb: true },
        { id: 'vidsrc', name: 'VidSrc', description: 'Fonte principal do Streambert - estável e rápido', supportsImdb: true, supportsTmdb: true },
        { id: 'vidking', name: 'VidKing', description: 'Fonte alternativa - grande acervo', supportsImdb: true, supportsTmdb: true },
      ],
    });
  }
}

export default new StreamingController();
