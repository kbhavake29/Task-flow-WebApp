import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { generateAccessToken, generateRefreshToken } from '../config/jwt';
import { CacheService } from './cache.service';
import { REDIS_KEYS, CACHE_TTL } from '../utils/constants';

interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
  device_info: string | null;
  ip_address: string | null;
}

export class TokenService {
  /**
   * Generate both access and refresh tokens
   */
  static async generateTokenPair(
    userId: string,
    email: string,
    role: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Generate access token
    const accessToken = generateAccessToken(userId, email, role as any);

    // Generate refresh token
    const tokenId = uuidv4();
    const refreshToken = generateRefreshToken(userId, tokenId);

    // Hash refresh token for storage
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Calculate expiry (7 days from now)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Store refresh token in database
    await pool.query<ResultSetHeader>(
      `INSERT INTO refresh_tokens
       (id, user_id, token_hash, expires_at, device_info, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tokenId, userId, tokenHash, expiresAt, deviceInfo || null, ipAddress || null]
    );

    // Store refresh token in Redis whitelist
    const redisKey = `${REDIS_KEYS.REFRESH_TOKEN}${userId}:${tokenId}`;
    await CacheService.set(redisKey, tokenHash, CACHE_TTL.REFRESH_TOKEN);

    return { accessToken, refreshToken };
  }

  /**
   * Verify and validate refresh token
   */
  static async validateRefreshToken(
    token: string,
    userId: string,
    tokenId: string
  ): Promise<boolean> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Check Redis whitelist first (fast)
      const redisKey = `${REDIS_KEYS.REFRESH_TOKEN}${userId}:${tokenId}`;
      const cachedHash = await CacheService.get<string>(redisKey);

      if (cachedHash && cachedHash === tokenHash) {
        return true;
      }

      // Fallback to database
      const [rows] = await pool.query<(RefreshToken & RowDataPacket)[]>(
        `SELECT * FROM refresh_tokens
         WHERE id = ? AND user_id = ? AND token_hash = ?
         AND expires_at > NOW() AND revoked_at IS NULL`,
        [tokenId, userId, tokenHash]
      );

      if (rows.length === 0) {
        return false;
      }

      // Update Redis cache
      await CacheService.set(redisKey, tokenHash, CACHE_TTL.REFRESH_TOKEN);

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Revoke refresh token (logout)
   */
  static async revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
    // Revoke in database
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [tokenId, userId]
    );

    // Remove from Redis whitelist
    const redisKey = `${REDIS_KEYS.REFRESH_TOKEN}${userId}:${tokenId}`;
    await CacheService.delete(redisKey);
  }

  /**
   * Revoke all refresh tokens for a user
   */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    // Revoke in database
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL',
      [userId]
    );

    // Remove from Redis
    const pattern = `${REDIS_KEYS.REFRESH_TOKEN}${userId}:*`;
    await CacheService.deletePattern(pattern);
  }

  /**
   * Blacklist access token (for logout)
   */
  static async blacklistAccessToken(token: string, ttl: number): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const redisKey = `${REDIS_KEYS.ACCESS_BLACKLIST}${tokenHash}`;
    await CacheService.set(redisKey, '1', ttl);
  }

  /**
   * Check if access token is blacklisted
   */
  static async isAccessTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const redisKey = `${REDIS_KEYS.ACCESS_BLACKLIST}${tokenHash}`;
    return await CacheService.exists(redisKey);
  }

  /**
   * Clean up expired tokens (run periodically)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
    );

    return result.affectedRows;
  }
}
