import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { AccountStatsService } from '../services/accountStats.service';
import { asyncHandler } from '../utils/asyncHandler';
import { UnauthorizedError } from '../utils/ApiError';

/**
 * Stats Controller
 */
export class StatsController {
  /**
   * Get dashboard statistics - GET /api/stats/dashboard
   * For admins, returns system-wide statistics
   */
  static getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const isAdmin = req.user.role === 'admin';
    const stats = await TaskService.getDashboardStats(req.user.userId, isAdmin);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  });

  /**
   * Get account statistics - GET /api/stats/account
   */
  static getAccountStats = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const stats = await AccountStatsService.getAccountStats(req.user.userId);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  });
}
