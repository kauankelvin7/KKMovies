import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from '../src/routes';
import { errorHandler, notFoundHandler } from '../src/middleware/error.middleware';
import { logger } from '../src/middleware/logger.middleware';

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight
app.options('*', cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(logger);

// Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'KKMovies API',
    version: '1.0.0',
    status: 'online',
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Vercel serverless handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
