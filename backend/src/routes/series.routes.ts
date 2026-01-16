import { Router } from 'express';
import seriesController from '../controllers/series.controller';

const router = Router();

// Series routes
router.get('/trending', seriesController.getTrending.bind(seriesController));
router.get('/popular', seriesController.getPopular.bind(seriesController));
router.get('/top-rated', seriesController.getTopRated.bind(seriesController));
router.get('/genres', seriesController.getGenres.bind(seriesController));
router.get('/discover', seriesController.discoverByGenre.bind(seriesController));
router.get('/search', seriesController.search.bind(seriesController));
router.get('/:id', seriesController.getDetails.bind(seriesController));
router.get('/:id/season/:seasonNumber', seriesController.getSeason.bind(seriesController));

export default router;
