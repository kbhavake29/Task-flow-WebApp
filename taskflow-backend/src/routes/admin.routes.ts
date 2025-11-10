import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/authorization.middleware';

const router = Router();

/**
 * Admin Routes
 * All routes require authentication and admin role
 */

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (admin only)
 * @access  Admin
 */
router.get('/users', AdminController.getAllUsers);

/**
 * @route   GET /api/admin/projects
 * @desc    Get all projects across all users (admin only)
 * @access  Admin
 */
router.get('/projects', AdminController.getAllProjects);

/**
 * @route   GET /api/admin/tasks
 * @desc    Get all tasks across all users (admin only)
 * @access  Admin
 */
router.get('/tasks', AdminController.getAllTasks);

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics (admin only)
 * @access  Admin
 */
router.get('/stats', AdminController.getAdminStats);

export default router;
