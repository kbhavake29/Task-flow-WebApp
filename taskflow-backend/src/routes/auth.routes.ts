import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth.middleware';
import { emailValidation, passwordValidation } from '../utils/validation';

const router = Router();

/**
 * POST /api/auth/signup
 * Sign up new user
 */
router.post(
  '/signup',
  authLimiter,
  [emailValidation(), passwordValidation(), validate],
  AuthController.signup
);

/**
 * POST /api/auth/signin
 * Sign in existing user
 */
router.post(
  '/signin',
  authLimiter,
  [emailValidation(), passwordValidation(), validate],
  AuthController.signin
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', AuthController.refresh);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * GET /api/auth/user
 * Get current user
 */
router.get('/user', authenticate, AuthController.getUser);

export default router;
