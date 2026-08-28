import { Router, Response } from 'express';

import movieRoutes from './movie.routes';
import seriesRoutes from './series.routes';
import streamingRoutes from './streaming.routes';
import tmdbEmbedApiRoutes from './tmdbEmbedApi.routes';

const router = Router();

router.use('/movies', movieRoutes);
router.use('/series', seriesRoutes);
router.use('/streaming', streamingRoutes);
router.use('/tmdb-embed', tmdbEmbedApiRoutes);

router.get('/health', (_req, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'KKMovies API',
  });
});

export default router;
