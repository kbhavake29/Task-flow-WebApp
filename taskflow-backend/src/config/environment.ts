import dotenv from 'dotenv';

// Load environment variables BEFORE importing logger
dotenv.config();

interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  logLevel: string;

  // Database
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  dbName: string;

  // Redis
  redisHost: string;
  redisPort: number;
  redisPassword?: string;

  // JWT
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;

  // CORS
  allowedOrigins: string[];

  // Frontend
  frontendUrl: string;

  // Rate limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

// Validate and parse environment variables
function validateEnvironment(): EnvironmentConfig {
  const errors: string[] = [];

  // Required environment variables
  const requiredVars = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'REDIS_HOST',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'ALLOWED_ORIGINS',
    'FRONTEND_URL',
  ];

  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach((err) => console.error(`  - ${err}`));
    throw new Error('Environment validation failed');
  }

  // Parse and return config
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',

    // Database
    dbHost: process.env.DB_HOST!,
    dbPort: parseInt(process.env.DB_PORT || '3306', 10),
    dbUser: process.env.DB_USER!,
    dbPassword: process.env.DB_PASSWORD!,
    dbName: process.env.DB_NAME!,

    // Redis
    redisHost: process.env.REDIS_HOST!,
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
    redisPassword: process.env.REDIS_PASSWORD || undefined,

    // JWT
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
    jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',

    // CORS
    allowedOrigins: process.env.ALLOWED_ORIGINS!.split(',').map((origin) => origin.trim()),

    // Frontend
    frontendUrl: process.env.FRONTEND_URL!,

    // Rate limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  };
}

export const env = validateEnvironment();
