import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { verifyRefreshToken } from '../config/jwt';
import { asyncHandler } from '../utils/asyncHandler';
import { UnauthorizedError } from '../utils/ApiError';

/**
 * Auth Controller
 */
export class AuthController {
  /**
   * Sign up - POST /api/auth/signup
   */
  static signup = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const deviceInfo = req.get('user-agent');
    const ipAddress = req.ip;

    const result = await AuthService.signup(email, password, deviceInfo, ipAddress);

    // Set refresh token in HttpOnly cookie
    const { refreshToken } = await TokenService.generateTokenPair(
      result.user.id,
      result.user.email,
      result.user.role,
      deviceInfo,
      ipAddress
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  /**
   * Sign in - POST /api/auth/signin
   */
  static signin = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const deviceInfo = req.get('user-agent');
    const ipAddress = req.ip;

    const result = await AuthService.signin(email, password, deviceInfo, ipAddress);

    // Set refresh token in HttpOnly cookie
    const { refreshToken } = await TokenService.generateTokenPair(
      result.user.id,
      result.user.email,
      result.user.role,
      deviceInfo,
      ipAddress
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Refresh token - POST /api/auth/refresh
   */
  static refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token not provided');
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Generate new access token
    const accessToken = await AuthService.refreshAccessToken(
      refreshToken,
      payload.userId,
      payload.tokenId
    );

    res.status(200).json({
      success: true,
      data: { accessToken },
    });
  });

  /**
   * Logout - POST /api/auth/logout
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    const accessToken = req.headers.authorization?.substring(7) || '';

    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await AuthService.logout(payload.userId, payload.tokenId, accessToken, 15 * 60); // 15 min TTL
      } catch (error) {
        // Token might be expired, just clear cookie
      }
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  /**
   * Get current user - GET /api/auth/user
   */
  static getUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const user = await AuthService.getCurrentUser(req.user.userId);

    res.status(200).json({
      success: true,
      data: { user },
    });
  });
}
