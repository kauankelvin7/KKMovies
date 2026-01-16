import { Router } from 'express';
import movieRoutes from './movie.routes';
import seriesRoutes from './series.routes';
import streamingRoutes from './streaming.routes';

const router = Router();

// Mount movie routes
router.use('/movies', movieRoutes);

// Mount series routes
router.use('/series', seriesRoutes);

// Mount streaming routes
router.use('/streaming', streamingRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'KKMovies API',
  });
});

export default router;
