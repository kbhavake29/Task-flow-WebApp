/**
 * Application constants
 */

// Task status
export const TASK_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

// Token types
export const TOKEN_TYPE = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

export type TokenType = (typeof TOKEN_TYPE)[keyof typeof TOKEN_TYPE];

// Redis key prefixes
export const REDIS_KEYS = {
  // Token blacklist/whitelist
  ACCESS_BLACKLIST: 'blacklist:access:',
  REFRESH_TOKEN: 'refresh:',

  // Rate limiting
  RATE_LIMIT_AUTH: 'ratelimit:auth:',
  RATE_LIMIT_API: 'ratelimit:api:',

  // Caching
  USER: 'user:',
  PROJECT: 'project:',
  PROJECTS_LIST: 'projects:user:',
  TASKS_LIST: 'tasks:user:',
  DASHBOARD_STATS: 'stats:dashboard:',

  // Sessions
  SESSION: 'session:',
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  USER: 30 * 60, // 30 minutes
  PROJECT: 10 * 60, // 10 minutes
  PROJECTS_LIST: 5 * 60, // 5 minutes
  TASKS_LIST: 2 * 60, // 2 minutes
  DASHBOARD_STATS: 5 * 60, // 5 minutes
  ACCESS_TOKEN: 15 * 60, // 15 minutes
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 days
  SESSION: 7 * 24 * 60 * 60, // 7 days
} as const;

// Bcrypt configuration
export const BCRYPT_ROUNDS = 12;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
} as const;

// Password validation
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// Email validation
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_MAX_LENGTH = 255;

// Common passwords (sample - in production, load from file)
export const COMMON_PASSWORDS = new Set([
  '123456',
  'password',
  '12345678',
  'qwerty',
  '123456789',
  '12345',
  '1234',
  '111111',
  '1234567',
  'dragon',
  '123123',
  'baseball',
  'iloveyou',
  'trustno1',
  '1234567890',
  'sunshine',
  'master',
  'welcome',
  'shadow',
  'ashley',
  'football',
  'jesus',
  'michael',
  'ninja',
  'mustang',
  'password1',
]);
