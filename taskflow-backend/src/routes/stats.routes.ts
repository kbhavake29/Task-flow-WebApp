import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All stats routes require authentication
router.use(authenticate);

/**
 * GET /api/stats/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', StatsController.getDashboardStats);

/**
 * GET /api/stats/account
 * Get account statistics
 */
router.get('/account', StatsController.getAccountStats);

export default router;
