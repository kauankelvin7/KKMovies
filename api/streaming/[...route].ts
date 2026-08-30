import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { movies111Service, vidsrcService, vidkingService, BROWSER_HEADERS } from '../lib/superflix';
import {
  cors,
  handleOptions,
  handleError,
  logDebug,
  validateRequiredParams,
  safeParseInt,
  getQueryParam,
} from '../lib/helpers';

export const config = {
  runtime: '@vercel/node@5',
  maxDuration: 30,
};

export type StreamingServer = '111movies' | 'vidsrc' | 'vidking';

const VALID_SERVERS: StreamingServer[] = ['111movies', 'vidsrc', 'vidking'];

function resolveServer(req: VercelRequest): StreamingServer {
  const server = (getQueryParam(req, 'server') || '111movies').toLowerCase() as StreamingServer;
  const resolved = VALID_SERVERS.includes(server) ? server : '111movies';
  logDebug('resolveServer', { requested: server, resolved });
  return resolved;
}

function getMovieUrl(server: StreamingServer, id: string): string {
  const url = (() => {
    switch (server) {
      case 'vidsrc':
        return vidsrcService.getMovieStreamUrl(id);
      case 'vidking':
        return vidkingService.getMovieStreamUrl(id);
      case '111movies':
      default:
        return movies111Service.getMovieStreamUrl(id);
    }
  })();
  logDebug('getMovieUrl', { server, id, url });
  return url;
}

function getSeriesUrl(
  server: StreamingServer,
  id: string,
  season?: number,
  episode?: number,
): string {
  const url = (() => {
    switch (server) {
      case 'vidsrc':
        if (season && episode) return vidsrcService.getEpisodeStreamUrl(id, season, episode);
        return vidsrcService.getMovieStreamUrl(id);
      case 'vidking':
        if (season && episode) return vidkingService.getEpisodeStreamUrl(id, season, episode);
        return vidkingService.getMovieStreamUrl(id);
      case '111movies':
      default:
        if (season && episode) return movies111Service.getEpisodeStreamUrl(id, season, episode);
        if (season) return movies111Service.getSeasonStreamUrl(id, season);
        return movies111Service.getSeriesStreamUrl(id);
    }
  })();
  logDebug('getSeriesUrl', { server, id, season, episode, url });
  return url;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  const parts = ([] as string[]).concat((req.query.route as string[]) || []);
  const [type, id, season, episode] = parts;

  logDebug('incoming_request', {
    method: req.method,
    type,
    id: id || 'N/A',
    season,
    episode,
    query: { ...req.query, route: undefined },
    parts,
  });

  try {
    switch (type) {
      case 'movie': {
        const missing = validateRequiredParams({ id }, ['id']);
        if (missing) {
          return cors(res).status(400).json({ error: missing });
        }

        const server = resolveServer(req);
        const noLink = getQueryParam(req, 'noLink') === 'true';
        const color = getQueryParam(req, 'color');
        const transparent = getQueryParam(req, 'transparent') === 'true';
        const noBackground = getQueryParam(req, 'noBackground') === 'true';

        const resolvedId = /^tt\d+/.test(String(id)) ? id : String(id);
        logDebug('movie_request_params', { server, resolvedId, noLink, color, transparent, noBackground });

        const baseUrl = getMovieUrl(server, resolvedId);
        const streamUrl =
          server === '111movies'
            ? movies111Service.buildPlayerUrl(baseUrl, { noLink, color, transparent, noBackground })
            : baseUrl;

        logDebug('movie_stream_url', { streamUrl });

        const diagnostics = await checkCloudflare(streamUrl);
        logDebug('movie_diagnostics', { server, status: diagnostics.status, captcha: diagnostics.captcha, unavailable: diagnostics.unavailable });

        return cors(res).status(200).json(streamPayload(streamUrl, diagnostics, server));
      }

      case 'series': {
        const missing = validateRequiredParams({ id }, ['id']);
        if (missing) {
          return cors(res).status(400).json({ error: missing });
        }

        const server = resolveServer(req);
        const noEpList = getQueryParam(req, 'noEpList') === 'true';
        const noLink = getQueryParam(req, 'noLink') === 'true';
        const color = getQueryParam(req, 'color');
        const transparent = getQueryParam(req, 'transparent') === 'true';
        const noBackground = getQueryParam(req, 'noBackground') === 'true';
        const seasonNum = season ? safeParseInt(season, 0) : undefined;
        const episodeNum = episode ? safeParseInt(episode, 0) : undefined;

        logDebug('series_request_params', { server, id, noEpList, noLink, color, transparent, noBackground, seasonNum, episodeNum });

        const baseUrl = getSeriesUrl(server, id, seasonNum, episodeNum);
        const streamUrl =
          server === '111movies'
            ? movies111Service.buildPlayerUrl(baseUrl, { noEpList, noLink, color, transparent, noBackground })
            : baseUrl;

        logDebug('series_stream_url', { streamUrl });

        const diagnostics = await checkCloudflare(streamUrl);
        logDebug('series_diagnostics', { server, status: diagnostics.status, captcha: diagnostics.captcha, unavailable: diagnostics.unavailable });

        return cors(res).status(200).json(streamPayload(streamUrl, diagnostics, server));
      }

      case 'calendar': {
        logDebug('calendar_request');
        try {
          const calendar = await movies111Service.getCalendar();
          logDebug('calendar_success', { count: Array.isArray(calendar) ? calendar.length : 0 });
          return cors(res).status(200).json(calendar);
        } catch (calErr) {
          logDebug('calendar_failed', calErr);
          return cors(res).status(200).json([]);
        }
      }

      case 'servers': {
        logDebug('servers_list_request');
        return cors(res).status(200).json({
          servers: [
            { id: '111movies', name: '111movies', description: 'Player oficial com anuncios minimos', supportsImdb: true, supportsTmdb: true },
            { id: 'vidsrc', name: 'VidSrc', description: 'Fonte principal do Streambert - estavel e rapido', supportsImdb: true, supportsTmdb: true },
            { id: 'vidking', name: 'VidKing', description: 'Fonte alternativa - grande acervo', supportsImdb: true, supportsTmdb: true },
          ],
          timestamp: new Date().toISOString(),
        });
      }

      case 'proxy': {
        const targetUrl = Array.isArray(req.query.url) ? req.query.url[0] : (req.query.url as string);
        if (!targetUrl || typeof targetUrl !== 'string') {
          return cors(res).status(400).json({ error: 'url query param is required' });
        }

        logDebug('proxy_request', { targetUrl: targetUrl.substring(0, 120) });

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

          const bodySlice = String(response.data || '').slice(0, 20000);
          const hasCaptcha = /captcha|challenge|cf-turnstile|cloudflare/i.test(bodySlice);

          logDebug('proxy_response', {
            status: response.status,
            contentLength: (response.data as string)?.length || 0,
            hasCaptcha,
          });

          return cors(res)
            .status(response.status)
            .setHeader('X-111movies-Captcha', hasCaptcha ? 'required' : 'none')
            .setHeader('Content-Type', 'text/html; charset=utf-8')
            .send(response.data);
        } catch (proxyErr: unknown) {
          logDebug('proxy_error', proxyErr);
          return handleError(res, proxyErr, 'Proxy request failed', 502);
        }
      }

      case 'health': {
        logDebug('health_check');
        return cors(res).status(200).json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          servers: VALID_SERVERS,
          uptime: process.uptime(),
        });
      }

      default:
        logDebug('route_not_found', { type });
        return cors(res).status(404).json({
          error: 'Route not found',
          requestedType: type,
          availableRoutes: [
            '/api/streaming/movie/:imdbId?server=111movies|vidsrc|vidking',
            '/api/streaming/series/:tmdbId[/:season/:episode]?server=111movies|vidsrc|vidking',
            '/api/streaming/calendar',
            '/api/streaming/servers',
            '/api/streaming/proxy?url=...',
            '/api/streaming/health',
          ],
        });
    }
  } catch (error: unknown) {
    logDebug('unhandled_error', error);
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
    generatedAt: new Date().toISOString(),
    warning: diagnostics.unavailable
      ? `Este titulo nao esta disponivel no servidor ${server} no momento. Tente outra fonte.`
      : diagnostics.captcha
        ? 'O servidor pediu uma verificacao de seguranca.'
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
  responseTimeMs?: number;
}> {
  const startTime = Date.now();
  try {
    const resp = await axios.get(url.split('#')[0], {
      headers: { ...BROWSER_HEADERS, Referer: 'https://www.google.com/' },
      timeout: 8000,
      responseType: 'text',
      maxRedirects: 5,
      validateStatus: () => true,
    });

    const responseTimeMs = Date.now() - startTime;
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

    logDebug('checkCloudflare', {
      url: url.substring(0, 100),
      status: resp.status,
      captcha,
      unavailable,
      server,
      responseTimeMs,
      hasCfRay: !!cfRay,
    });

    return {
      status: resp.status,
      captcha,
      unavailable,
      server,
      cloudflare: server.toLowerCase().includes('cloudflare') || !!cfRay,
      ray: cfRay,
      responseTimeMs,
    };
  } catch (e: unknown) {
    const responseTimeMs = Date.now() - startTime;
    const err = e as Error;
    logDebug('checkCloudflare_error', {
      url: url.substring(0, 100),
      message: err?.message,
      responseTimeMs,
    });
    return {
      status: 0,
      captcha: false,
      unavailable: true,
      server: err?.message || 'unreachable',
      cloudflare: false,
      responseTimeMs,
    };
  }
}
