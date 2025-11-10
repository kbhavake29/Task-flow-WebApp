import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Database migration runner
 * Executes SQL migrations in order and tracks them in the migrations table
 */

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');

    // Ensure migrations table exists first
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Get list of already executed migrations
    const [executedMigrations] = await pool.query<any[]>(
      'SELECT filename FROM migrations ORDER BY id'
    );
    const executedSet = new Set(executedMigrations.map((row) => row.filename));

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      logger.warn('No migration files found');
      return;
    }

    // Execute pending migrations
    let executed = 0;
    for (const file of files) {
      if (executedSet.has(file)) {
        logger.info(`  ✓ ${file} (already executed)`);
        continue;
      }

      logger.info(`  → Executing ${file}...`);

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Execute migration
      await pool.query(sql);

      // Record migration
      await pool.query('INSERT INTO migrations (filename) VALUES (?)', [file]);

      logger.info(`  ✓ ${file} (completed)`);
      executed++;
    }

    if (executed === 0) {
      logger.info('All migrations are up to date');
    } else {
      logger.info(`Successfully executed ${executed} migration(s)`);
    }
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    logger.info('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration failed:', error);
    process.exit(1);
  });
