import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserModel } from '../models/user.model';
import { TokenService } from './token.service';
import { UnauthorizedError, ConflictError } from '../utils/ApiError';
import { BCRYPT_ROUNDS } from '../utils/constants';
import { AuthResponse } from '../types/user.types';

export class AuthService {
  /**
   * Sign up new user
   */
  static async signup(
    email: string,
    password: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const userId = uuidv4();
    const user = await UserModel.create(userId, email, passwordHash);

    // Generate tokens
    const { accessToken } = await TokenService.generateTokenPair(
      user.id,
      user.email,
      user.role,
      deviceInfo,
      ipAddress
    );

    return {
      accessToken,
      user: UserModel.toResponse(user),
    };
  }

  /**
   * Sign in existing user
   */
  static async signin(
    email: string,
    password: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<AuthResponse> {
    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await UserModel.updateLastLogin(user.id);

    // Generate tokens
    const { accessToken } = await TokenService.generateTokenPair(
      user.id,
      user.email,
      user.role,
      deviceInfo,
      ipAddress
    );

    return {
      accessToken,
      user: UserModel.toResponse(user),
    };
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(
    refreshToken: string,
    userId: string,
    tokenId: string
  ): Promise<string> {
    // Validate refresh token
    const isValid = await TokenService.validateRefreshToken(refreshToken, userId, tokenId);
    if (!isValid) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Get user
    const user = await UserModel.findById(userId);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Generate new access token
    const { generateAccessToken } = await import('../config/jwt');
    const accessToken = generateAccessToken(user.id, user.email, user.role);

    return accessToken;
  }

  /**
   * Logout user
   */
  static async logout(
    userId: string,
    tokenId: string,
    accessToken: string,
    accessTokenTtl: number
  ): Promise<void> {
    // Revoke refresh token
    await TokenService.revokeRefreshToken(userId, tokenId);

    // Blacklist access token
    await TokenService.blacklistAccessToken(accessToken, accessTokenTtl);
  }

  /**
   * Get current user
   */
  static async getCurrentUser(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return UserModel.toResponse(user);
  }
}
