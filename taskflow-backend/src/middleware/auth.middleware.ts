import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { TokenService } from '../services/token.service';
import { UnauthorizedError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is blacklisted
    const isBlacklisted = await TokenService.isAccessTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }

    // Verify token
    try {
      const payload = verifyAccessToken(token);

      // Attach user to request
      req.user = payload;

      next();
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
);

/**
 * Optional authentication middleware
 * Does not throw error if no token, just skips
 */
export const optionalAuthenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const isBlacklisted = await TokenService.isAccessTokenBlacklisted(token);
        if (!isBlacklisted) {
          const payload = verifyAccessToken(token);
          req.user = payload;
        }
      } catch (error) {
        // Silently fail for optional auth
      }
    }

    next();
  }
);
