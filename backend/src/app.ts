import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { logger } from './middleware/logger.middleware';
import { httpCacheMiddleware } from './middleware/cache.middleware';

// Load environment variables
dotenv.config();

/**
 * Express application configuration
 */
class App {
  public app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001');
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize Express middlewares
   */
  private initializeMiddlewares(): void {
    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    }));

    // Compression middleware para gzip
    this.app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6, // Nível de compressão (0-9)
    }));

    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use(logger);
    
    // HTTP Cache headers
    this.app.use(httpCacheMiddleware(300)); // 5 minutos

    // Rate limiting - prevent abuse
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // Aumentado para 200 requisições (era 100)
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api', limiter);
  }

  /**
   * Initialize application routes
   */
  private initializeRoutes(): void {
    this.app.use('/api', routes);
    
    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.json({
        message: 'KKMovies API',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          movies: '/api/movies',
          streaming: '/api/streaming',
        },
      });
    });
  }

  /**
   * Initialize error handling middlewares
   */
  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  /**
   * Start the Express server
   */
  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`
╔═══════════════════════════════════════╗
║     🎬 KKMovies API Server Running    ║
╠═══════════════════════════════════════╣
║  Port: ${this.port}                         ║
║  Environment: ${process.env.NODE_ENV || 'development'}          ║
║  API URL: http://localhost:${this.port}    ║
╚═══════════════════════════════════════╝
      `);
    });
  }
}

export default App;
