import { Router, Response } from 'express';

import { contentRouter } from './catalog.routes';



const router = Router();

router.use('/movies', contentRouter('movie'));
router.use('/series', contentRouter('tv'));
router.use('/streaming', contentRouter('streaming'));

router.get('/health', (_req, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'KKMovies API',
  });
});

export default router;
