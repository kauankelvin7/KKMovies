import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { 111moviesService, vidsrcService, vidkingService, BROWSER_HEADERS } from '../lib/111movies';
import { cors, handleOptions, handleError } from '../lib/helpers';

export const config = {
  runtime: '@vercel/node@5',
  maxDuration: 30,
};

export type StreamingServer = '111movies' | 'vidsrc' | 'vidking';

function resolveServer(req: VercelRequest): StreamingServer {
  const server = (req.query.server as string) || '111movies';
  if (server === 'vidsrc' || server === 'vidking') return server;
  return '111movies';
}

function getMovieUrl(server: StreamingServer, id: string): string {
  switch (server) {
    case 'vidsrc':
      return vidsrcService.getMovieStreamUrl(id);
    case 'vidking':
      return vidkingService.getMovieStreamUrl(id);
    case '111movies':
    default:
      return 111moviesService.getMovieStreamUrl(id);
  }
}

function getSeriesUrl(server: StreamingServer, id: string, season?: number, episode?: number): string {
  switch (server) {
    case 'vidsrc':
      if (season && episode) return vidsrcService.getEpisodeStreamUrl(id, season, episode);
      return vidsrcService.getMovieStreamUrl(id);
    case 'vidking':
      if (season && episode) return vidkingService.getEpisodeStreamUrl(id, season, episode);
      return vidkingService.getMovieStreamUrl(id);
    case '111movies':
    default:
      if (season && episode) return 111moviesService.getEpisodeStreamUrl(id, season, episode);
      if (season) return 111moviesService.getSeasonStreamUrl(id, season);
      return 111moviesService.getSeriesStreamUrl(id);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  const parts = ([] as string[]).concat((req.query.route as string[]) || []);
  const [type, id, season, episode] = parts;

  try {
    switch (type) {
      case 'movie': {
        if (!id) return cors(res).status(400).json({ error: 'IMDB or TMDB id is required' });
        const server = resolveServer(req);
        const noLink = req.query.noLink === 'true';
        const color = req.query.color as string;
        const transparent = req.query.transparent === 'true';
        const noBackground = req.query.noBackground === 'true';

        const resolvedId = /^tt\d+/.test(String(id)) ? id : id;
        const baseUrl = getMovieUrl(server, String(resolvedId));
        const streamUrl = server === '111movies'
          ? 111moviesService.buildPlayerUrl(baseUrl, {
            noLink,
            color,
            transparent,
            noBackground,
          })
          : baseUrl;

        const diagnostics = await checkCloudflare(streamUrl);
        return cors(res).status(200).json(streamPayload(streamUrl, diagnostics, server));
      }

      case 'series': {
        if (!id) return cors(res).status(400).json({ error: 'TMDB id is required' });
        const server = resolveServer(req);
        const noEpList = req.query.noEpList === 'true';
        const noLink = req.query.noLink === 'true';
        const color = req.query.color as string;
        const transparent = req.query.transparent === 'true';
        const noBackground = req.query.noBackground === 'true';

        const baseUrl = getSeriesUrl(
          server,
          id,
          season ? parseInt(season) : undefined,
          episode ? parseInt(episode) : undefined,
        );

        const streamUrl = server === '111movies'
          ? 111moviesService.buildPlayerUrl(baseUrl, {
            noEpList,
            noLink,
            color,
            transparent,
            noBackground,
          })
          : baseUrl;

        const diagnostics = await checkCloudflare(streamUrl);
        return cors(res).status(200).json(streamPayload(streamUrl, diagnostics, server));
      }

      case 'calendar': {
        const calendar = await 111moviesService.getCalendar();
        return cors(res).status(200).json(calendar);
      }

      case 'servers': {
        return cors(res).status(200).json({
          servers: [
            { id: '111movies', name: '111movies', description: 'Player oficial com anúncios mínimos', supportsImdb: true, supportsTmdb: true },
            { id: 'vidsrc', name: 'VidSrc', description: 'Fonte principal do Streambert - estável e rápido', supportsImdb: true, supportsTmdb: true },
            { id: 'vidking', name: 'VidKing', description: 'Fonte alternativa - grande acervo', supportsImdb: true, supportsTmdb: true },
          ],
        });
      }

      case 'proxy': {
        const targetUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
        if (!targetUrl || typeof targetUrl !== 'string') {
          return cors(res).status(400).json({ error: 'url query param is required' });
        }
        try {
          const response = await axios.get(targetUrl, {
            headers: {
              ...BROWSER_HEADERS,
              Referer: 'https://www.google.com/',
            },
            timeout: 25000,
            responseType: 'text',
            validateStatus: () => true,
          });

          const hasCaptcha = /captcha|challenge|cf-turnstile|cloudflare/i.test(response.data.slice(0, 20000));

          return cors(res)
            .status(response.status)
            .setHeader('X-111movies-Captcha', hasCaptcha ? 'required' : 'none')
            .setHeader('Content-Type', 'text/html; charset=utf-8')
            .send(response.data);
        } catch (proxyErr: any) {
          return handleError(res, proxyErr, 'Proxy request failed');
        }
      }

      default:
        return cors(res).status(404).json({
          error: 'Route not found',
          availableRoutes: [
            '/api/streaming/movie/:imdbId?server=111movies|vidsrc|vidking',
            '/api/streaming/series/:tmdbId[/:season/:episode]?server=111movies|vidsrc|vidking',
            '/api/streaming/calendar',
            '/api/streaming/servers',
            '/api/streaming/proxy?url=...',
          ],
        });
    }
  } catch (error) {
    return handleError(res, error, 'Failed to process streaming request');
  }
}

function streamPayload(
  streamUrl: string,
  diagnostics: Awaited<ReturnType<typeof checkCloudflare>>,
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

async function checkCloudflare(url: string): Promise<{
  status: number;
  captcha: boolean;
  unavailable: boolean;
  server: string;
  cloudflare: boolean;
  ray?: string;
}> {
  try {
    const resp = await axios.get(url.split('#')[0], {
      headers: { ...BROWSER_HEADERS, Referer: 'https://www.google.com/' },
      timeout: 8000,
      responseType: 'text',
      maxRedirects: 5,
      validateStatus: () => true,
    });

    const server = String(resp.headers['server'] || '');
    const cfRay = resp.headers['cf-ray'] as string | undefined;
    const bodySlice = String(resp.data || '').slice(0, 24000);

    const captcha =
      resp.status === 403 ||
      /cf-turnstile|challenge-platform|cdn-cgi\/challenge|just a moment/i.test(bodySlice);

    const unavailable =
      !captcha &&
      (resp.status >= 400 ||
        /internal server error|error code:\s*500|unable to complete your request|oops!\s*something went wrong/i.test(
          bodySlice,
        ));

    return {
      status: resp.status,
      captcha,
      unavailable,
      server,
      cloudflare: server.toLowerCase().includes('cloudflare') || !!cfRay,
      ray: cfRay,
    };
  } catch (e: any) {
    return {
      status: 0,
      captcha: false,
      unavailable: true,
      server: e.message || 'unreachable',
      cloudflare: false,
    };
  }
}
