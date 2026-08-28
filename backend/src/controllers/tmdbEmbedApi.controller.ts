import { Request, Response } from 'express';
import tmdbEmbedApiService from '../services/tmdbEmbedApi.service';

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    const health = await tmdbEmbedApiService.checkHealth();
    res.json({
      available: tmdbEmbedApiService.isAvailable(),
      baseUrl: tmdbEmbedApiService.getBaseUrl(),
      ...health,
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      status: 'error',
      message: (error as Error).message,
    });
  }
};

export const getProviders = async (_req: Request, res: Response): Promise<void> => {
  try {
    const providers = await tmdbEmbedApiService.getProviders();
    res.json({
      available: tmdbEmbedApiService.isAvailable(),
      providers,
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      providers: [],
      message: (error as Error).message,
    });
  }
};

export const getMovieStreams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tmdbId } = req.params;
    const { provider } = req.query;

    if (!tmdbId) {
      res.status(400).json({ error: 'tmdbId is required' });
      return;
    }

    const result = await tmdbEmbedApiService.getMovieStreams(tmdbId, {
      provider: provider as string | undefined,
    });

    res.json({
      available: tmdbEmbedApiService.isAvailable(),
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      streams: [],
      message: (error as Error).message,
    });
  }
};

export const getSeriesStreams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tmdbId } = req.params;
    const { provider, season, episode } = req.query;

    if (!tmdbId) {
      res.status(400).json({ error: 'tmdbId is required' });
      return;
    }

    const result = await tmdbEmbedApiService.getSeriesStreams(tmdbId, {
      provider: provider as string | undefined,
      season: season ? parseInt(season as string, 10) : undefined,
      episode: episode ? parseInt(episode as string, 10) : undefined,
    });

    res.json({
      available: tmdbEmbedApiService.isAvailable(),
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      streams: [],
      message: (error as Error).message,
    });
  }
};

export const getStreamUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.query;
    const { headers } = req.query;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'url query param is required' });
      return;
    }

    const parsedHeaders = headers && typeof headers === 'string'
      ? JSON.parse(headers)
      : undefined;

    const proxyUrl = tmdbEmbedApiService.getProxyUrl(url, parsedHeaders);

    res.json({
      available: tmdbEmbedApiService.isAvailable(),
      proxyUrl,
      originalUrl: url,
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      message: (error as Error).message,
    });
  }
};
