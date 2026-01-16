import { Router } from 'express';
import streamingController from '../controllers/streaming.controller';

const router = Router();

// Movie streaming
router.get('/movie/:imdbId', streamingController.getMovieStream.bind(streamingController));

// Series/Episode streaming
router.get('/series/:tmdbId', streamingController.getSeriesStream.bind(streamingController));
router.get('/series/:tmdbId/:season', streamingController.getSeriesStream.bind(streamingController));
router.get('/series/:tmdbId/:season/:episode', streamingController.getSeriesStream.bind(streamingController));

// Calendar
router.get('/calendar', streamingController.getCalendar.bind(streamingController));

// Lists
router.get('/list', streamingController.getList.bind(streamingController));

// Streamtape player
router.get('/streamtape/:videoId', streamingController.getStreamtapePlayer.bind(streamingController));

export default router;
