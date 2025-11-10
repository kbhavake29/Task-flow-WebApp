import { Request, Response } from 'express';
import { ProfileService } from '../services/profile.service';
import { asyncHandler } from '../utils/asyncHandler';

export class ProfileController {
  /**
   * Get user profile - GET /api/profile
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const profile = await ProfileService.getProfile(userId);

    res.status(200).json({
      success: true,
      data: { profile },
    });
  });

  /**
   * Update user profile - PATCH /api/profile
   */
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { name, email } = req.body;

    const profile = await ProfileService.updateProfile(userId, { name, email });

    res.status(200).json({
      success: true,
      data: { profile },
      message: 'Profile updated successfully',
    });
  });

  /**
   * Change password - PATCH /api/profile/password
   */
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    await ProfileService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  });

  /**
   * Delete account - DELETE /api/profile
   */
  static deleteAccount = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    await ProfileService.deleteAccount(userId);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  });
}
