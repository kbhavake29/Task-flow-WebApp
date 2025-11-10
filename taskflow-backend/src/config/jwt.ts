import jwt from 'jsonwebtoken';
import { UserRole } from '../types/user.types';

// JWT configuration
export const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || '',
  refreshSecret: process.env.JWT_REFRESH_SECRET || '',
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
};

// Validate JWT secrets are set
if (!jwtConfig.accessSecret || !jwtConfig.refreshSecret) {
  throw new Error('JWT secrets must be set in environment variables');
}

if (jwtConfig.accessSecret.length < 32 || jwtConfig.refreshSecret.length < 32) {
  throw new Error('JWT secrets must be at least 32 characters long');
}

// Token payload interfaces
export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  type: 'refresh';
}

// Generate access token
export function generateAccessToken(userId: string, email: string, role: UserRole): string {
  const payload: AccessTokenPayload = {
    userId,
    email,
    role,
    type: 'access',
  };

  return jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiry as string,
    issuer: 'taskflow-api',
    audience: 'taskflow-client',
  } as jwt.SignOptions);
}

// Generate refresh token
export function generateRefreshToken(userId: string, tokenId: string): string {
  const payload: RefreshTokenPayload = {
    userId,
    tokenId,
    type: 'refresh',
  };

  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiry as string,
    issuer: 'taskflow-api',
    audience: 'taskflow-client',
  } as jwt.SignOptions);
}

// Verify access token
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, jwtConfig.accessSecret, {
      issuer: 'taskflow-api',
      audience: 'taskflow-client',
    }) as AccessTokenPayload;

    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, jwtConfig.refreshSecret, {
      issuer: 'taskflow-api',
      audience: 'taskflow-client',
    }) as RefreshTokenPayload;

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}
