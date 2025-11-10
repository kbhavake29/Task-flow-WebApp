import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validator';
import {
  profileNameValidation,
  profileEmailValidation,
  currentPasswordValidation,
  newPasswordValidation,
} from '../utils/validation';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

/**
 * GET /api/profile
 * Get current user profile
 */
router.get('/', ProfileController.getProfile);

/**
 * PATCH /api/profile
 * Update user profile (name, email)
 */
router.patch(
  '/',
  [profileNameValidation(), profileEmailValidation(), validate],
  ProfileController.updateProfile
);

/**
 * PATCH /api/profile/password
 * Change user password
 */
router.patch(
  '/password',
  [currentPasswordValidation(), newPasswordValidation(), validate],
  ProfileController.changePassword
);

/**
 * DELETE /api/profile
 * Delete user account and all data
 */
router.delete('/', ProfileController.deleteAccount);

export default router;
