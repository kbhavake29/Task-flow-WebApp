import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'taskflow_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'taskflow_db',

  // Connection pool settings
  connectionLimit: 10,
  queueLimit: 0,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,

  // Character set
  charset: 'utf8mb4',

  // Timezone
  timezone: 'Z', // UTC

  // Security - prevent SQL injection
  multipleStatements: false,

  // Performance
  namedPlaceholders: true,
  decimalNumbers: true,
  dateStrings: false,

  // Debugging (only in development)
  debug: process.env.NODE_ENV === 'development' ? false : false,
};

// Create connection pool
export const pool = mysql.createPool(dbConfig);

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    logger.info('✓ MySQL database connection successful');
    return true;
  } catch (error) {
    logger.error('✗ MySQL database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pool.end();
    logger.info('MySQL connection pool closed');
  } catch (error) {
    logger.error('Error closing MySQL connection pool:', error);
  }
}
