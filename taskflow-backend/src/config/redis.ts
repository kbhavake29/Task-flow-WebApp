import { createClient } from 'redis';
import { logger } from '../utils/logger';

// Create Redis client
export const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis reconnection attempts exhausted');
        return new Error('Redis reconnection attempts exhausted');
      }
      const delay = Math.min(retries * 100, 3000);
      logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    },
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: 0,
});

// Event handlers
redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis client connecting...');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis client reconnecting...');
});

redisClient.on('end', () => {
  logger.info('Redis client connection closed');
});

// Connect to Redis
export async function connectRedis(): Promise<boolean> {
  try {
    console.log('Attempting Redis connection...');
    console.log(`   Host: ${process.env.REDIS_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.REDIS_PORT || '6379'}`);
    await redisClient.connect();
    console.log('Redis client connected');
    return true;
  } catch (error) {
    console.error('Redis connection error:', error);
    logger.error('Redis connection failed:', error);
    return false;
  }
}

// Test Redis connection
export async function testRedisConnection(): Promise<boolean> {
  try {
    await redisClient.ping();
    logger.info('Redis connection test successful');
    return true;
  } catch (error) {
    logger.error('Redis connection test failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeRedisConnection(): Promise<void> {
  try {
    await redisClient.quit();
    logger.info('Redis connection closed gracefully');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
}
