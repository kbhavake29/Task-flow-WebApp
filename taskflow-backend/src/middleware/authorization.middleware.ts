import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { UserRole } from '../types/user.types';

/**
 * Authorization middleware for role-based access control
 */

/**
 * Require specific role(s)
 * Usage: requireRole('admin') or requireRole(['admin', 'moderator'])
 */
export const requireRole = (allowedRoles: UserRole | UserRole[]) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  });
};

/**
 * Require admin role
 * Shorthand for requireRole('admin')
 */
export const requireAdmin = requireRole('admin');

/**
 * Check if user is admin
 * Utility function to check admin status
 */
export function isAdmin(req: Request): boolean {
  return req.user?.role === 'admin';
}

/**
 * Check if user owns the resource or is admin
 * Usage: requireOwnershipOrAdmin('userId') where 'userId' is the param name
 */
export const requireOwnershipOrAdmin = (userIdParam: string = 'userId') => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    const currentUserId = req.user.userId;
    const userRole = req.user.role;

    // Allow if admin or if user owns the resource
    if (userRole === 'admin' || resourceUserId === currentUserId) {
      next();
    } else {
      throw new ForbiddenError('You do not have permission to access this resource');
    }
  });
};

/**
 * Attach whether user is admin to request for later use
 * Does not block request, just adds isAdminUser flag
 */
export const attachAdminStatus = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (req.user) {
      (req as any).isAdminUser = req.user.role === 'admin';
    } else {
      (req as any).isAdminUser = false;
    }
    next();
  }
);
