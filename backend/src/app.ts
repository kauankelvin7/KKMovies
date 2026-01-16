import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { logger } from './middleware/logger.middleware';

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

    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use(logger);

    // Rate limiting - prevent abuse
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
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
