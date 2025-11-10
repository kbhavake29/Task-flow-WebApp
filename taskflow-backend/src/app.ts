import express, { Request, Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { corsMiddleware } from './middleware/cors';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimiter';
import { testDatabaseConnection } from './config/database';
import { testRedisConnection } from './config/redis';
import routes from './routes';
// Import environment config to validate on startup
import './config/environment';

// Create Express app
const app = express();

// Trust proxy (for correct IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS middleware
app.use(corsMiddleware);

// Compression middleware
app.use(compression());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// Global rate limiter
// app.use(globalLimiter); // Commented out for development

// Health check endpoint (no auth required)
app.get('/health', async (_req: Request, res: Response) => {
  const dbHealthy = await testDatabaseConnection();
  const redisHealthy = await testRedisConnection();

  const status = dbHealthy && redisHealthy ? 'healthy' : 'unhealthy';
  const statusCode = status === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'connected' : 'disconnected',
      redis: redisHealthy ? 'connected' : 'disconnected',
    },
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
