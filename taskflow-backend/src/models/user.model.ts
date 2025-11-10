import { pool } from '../config/database';
import { User, UserResponse } from '../types/user.types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class UserModel {
  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query<(User & RowDataPacket)[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    return rows[0] || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const [rows] = await pool.query<(User & RowDataPacket)[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    return rows[0] || null;
  }

  /**
   * Create new user
   */
  static async create(id: string, email: string, passwordHash: string): Promise<User> {
    await pool.query<ResultSetHeader>(
      'INSERT INTO users (id, email, password_hash, email_verified) VALUES (?, ?, ?, ?)',
      [id, email, passwordHash, false]
    );

    const user = await this.findById(id);
    if (!user) {
      throw new Error('Failed to create user');
    }

    return user;
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(id: string): Promise<void> {
    await pool.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }

  /**
   * Convert database user to response format
   */
  static toResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      role: user.role,
    };
  }
}
