console.log('Loading server modules...');
import app from './app';
import { env } from './config/environment';
import { logger } from './utils/logger';
import { connectRedis, closeRedisConnection } from './config/redis';
import { closeDatabaseConnection } from './config/database';

console.log('All modules loaded successfully');
const PORT = env.port;

// Start server
async function startServer() {
  try {
    console.log('Starting TaskFlow Backend Server...');
    console.log(`Environment: ${env.nodeEnv}`);
    console.log(`Port: ${PORT}`);

    // Connect to Redis
    console.log('Step 1: Connecting to Redis...');
    logger.info('Connecting to Redis...');
    const redisConnected = await connectRedis();
    console.log(`Redis connection result: ${redisConnected}`);

    if (!redisConnected) {
      console.error('Redis connection failed!');
      throw new Error('Failed to connect to Redis');
    }
    console.log('Redis connected successfully');

    // Start Express server
    console.log('Step 2: Starting Express server...');
    const server = app.listen(PORT, () => {
      console.log('Express server started');
      logger.info('='.repeat(50));
      logger.info('TaskFlow Backend Server');
      logger.info('='.repeat(50));
      logger.info(`Environment: ${env.nodeEnv}`);
      logger.info(`Port: ${PORT}`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
      logger.info(`API: http://localhost:${PORT}/api`);
      logger.info('='.repeat(50));
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database connection
          await closeDatabaseConnection();

          // Close Redis connection
          await closeRedisConnection();

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    console.error('FATAL ERROR starting server:', error);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
console.log('Initializing server startup...');
startServer()
  .then(() => {
    console.log('Server startup completed successfully');
  })
  .catch((error) => {
    console.error('Server startup failed:', error);
    process.exit(1);
  });
