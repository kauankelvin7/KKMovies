import { Router } from 'express';
import movieController from '../controllers/movie.controller';

const router = Router();

// Movie routes
router.get('/trending', movieController.getTrending.bind(movieController));
router.get('/popular', movieController.getPopular.bind(movieController));
router.get('/top-rated', movieController.getTopRated.bind(movieController));
router.get('/latest', movieController.getLatestReleases.bind(movieController));
router.get('/upcoming', movieController.getUpcoming.bind(movieController));
router.get('/genre', movieController.getByGenre.bind(movieController));
router.get('/search', movieController.search.bind(movieController));
router.get('/genres', movieController.getGenres.bind(movieController));
router.get('/:id', movieController.getDetails.bind(movieController));
router.get('/:id/recommendations', movieController.getRecommendations.bind(movieController));
router.get('/:id/similar', movieController.getSimilar.bind(movieController));

export default router;
