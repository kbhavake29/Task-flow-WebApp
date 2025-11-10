import { pool } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import bcrypt from 'bcrypt';
import { BadRequestError, NotFoundError } from '../utils/ApiError';
import { logger } from '../utils/logger';

import { UserRole } from '../types/user.types';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  role: UserRole;
}

export class ProfileService {
  /**
   * Update user profile (name/email)
   */
  static async updateProfile(
    userId: string,
    updates: { name?: string; email?: string }
  ): Promise<UserProfile> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        values.push(updates.name);
      }

      if (updates.email !== undefined) {
        // Check if email is already taken by another user
        const [existingUsers] = await pool.query<RowDataPacket[]>(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [updates.email, userId]
        );

        if (existingUsers.length > 0) {
          throw new BadRequestError('Email is already in use');
        }

        updateFields.push('email = ?');
        values.push(updates.email);
      }

      if (updateFields.length === 0) {
        throw new BadRequestError('No fields to update');
      }

      values.push(userId);

      await pool.query<ResultSetHeader>(
        `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
        values
      );

      // Fetch and return updated profile
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT id, email, name, created_at, email_verified, last_login_at, role FROM users WHERE id = ?',
        [userId]
      );

      if (rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      const user = rows[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        emailVerified: user.email_verified,
        lastLoginAt: user.last_login_at,
        role: user.role,
      };
    } catch (error) {
      logger.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Get current password hash
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );

      if (rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      const user = rows[0];

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValid) {
        throw new BadRequestError('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await pool.query<ResultSetHeader>(
        'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
        [newPasswordHash, userId]
      );

      logger.info(`Password changed for user ${userId}`);
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(userId: string): Promise<UserProfile> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT id, email, name, created_at, email_verified, last_login_at, role FROM users WHERE id = ?',
        [userId]
      );

      if (rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      const user = rows[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        emailVerified: user.email_verified,
        lastLoginAt: user.last_login_at,
        role: user.role,
      };
    } catch (error) {
      logger.error('Error getting profile:', error);
      throw error;
    }
  }

  /**
   * Delete user account and all associated data
   */
  static async deleteAccount(userId: string): Promise<void> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Delete user's tasks
      await connection.query('DELETE FROM tasks WHERE user_id = ?', [userId]);
      logger.info(`Deleted tasks for user ${userId}`);

      // Delete user's projects
      await connection.query('DELETE FROM projects WHERE user_id = ?', [userId]);
      logger.info(`Deleted projects for user ${userId}`);

      // Delete user's refresh tokens
      await connection.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
      logger.info(`Deleted refresh tokens for user ${userId}`);

      // Delete user account
      await connection.query('DELETE FROM users WHERE id = ?', [userId]);
      logger.info(`Deleted user account ${userId}`);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      logger.error('Error deleting account:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}
