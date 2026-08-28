import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { superflixService, BROWSER_HEADERS } from '../lib/superflix';
import { cors, handleOptions, handleError } from '../lib/helpers';

export const config = {
  runtime: '@vercel/node@5',
  maxDuration: 30,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  const parts = ([] as string[]).concat((req.query.route as string[]) || []);
  const [type, id, season, episode] = parts;

  try {
    switch (type) {
      case 'movie': {
        if (!id) return cors(res).status(400).json({ error: 'IMDB or TMDB id is required' });
        const noLink = req.query.noLink === 'true';
        const color = req.query.color as string;
        const transparent = req.query.transparent === 'true';
        const noBackground = req.query.noBackground === 'true';

        const resolvedId = /^tt\d+/.test(String(id)) ? id : id;
        const baseUrl = superflixService.getMovieStreamUrl(String(resolvedId));
        const streamUrl = superflixService.buildPlayerUrl(baseUrl, {
          noLink,
          color,
          transparent,
          noBackground,
        });

        const diagnostics = await checkCloudflare(streamUrl);
        return cors(res).status(200).json(streamPayload(streamUrl, diagnostics));
      }

      case 'series': {
        if (!id) return cors(res).status(400).json({ error: 'TMDB id is required' });
        const noEpList = req.query.noEpList === 'true';
        const noLink = req.query.noLink === 'true';
        const color = req.query.color as string;
        const transparent = req.query.transparent === 'true';
        const noBackground = req.query.noBackground === 'true';

        let baseUrl: string;
        if (season && episode) {
          baseUrl = superflixService.getEpisodeStreamUrl(id, parseInt(season), parseInt(episode));
        } else if (season) {
          baseUrl = superflixService.getSeasonStreamUrl(id, parseInt(season));
        } else {
          baseUrl = superflixService.getSeriesStreamUrl(id);
        }

        const streamUrl = superflixService.buildPlayerUrl(baseUrl, {
          noEpList,
          noLink,
          color,
          transparent,
          noBackground,
        });

        const diagnostics = await checkCloudflare(streamUrl);
        return cors(res).status(200).json(streamPayload(streamUrl, diagnostics));
      }

      case 'calendar': {
        const calendar = await superflixService.getCalendar();
        return cors(res).status(200).json(calendar);
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
            .setHeader('X-Superflix-Captcha', hasCaptcha ? 'required' : 'none')
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
            '/api/streaming/movie/:imdbId',
            '/api/streaming/series/:tmdbId[/:season/:episode]',
            '/api/streaming/calendar',
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
    diagnostics,
    warning: diagnostics.unavailable
      ? 'Este título não está disponível neste servidor no momento.'
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
