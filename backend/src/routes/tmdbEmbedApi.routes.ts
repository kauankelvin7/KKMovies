import { Router } from 'express';


import {
  getHealth,
  getProviders,
  getMovieStreams,
  getSeriesStreams,
  getStreamUrl,
} from '../controllers/tmdbEmbedApi.controller';

const router = Router();

router.get('/health', getHealth);
router.get('/providers', getProviders);
router.get('/movie/:tmdbId', getMovieStreams);
router.get('/series/:tmdbId', getSeriesStreams);
router.get('/proxy-url', getStreamUrl);

export default router;
