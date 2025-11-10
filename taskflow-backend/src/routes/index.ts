import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import statsRoutes from './stats.routes';
import profileRoutes from './profile.routes';
import exportRoutes from './export.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/stats', statsRoutes);
router.use('/profile', profileRoutes);
router.use('/export', exportRoutes);
router.use('/admin', adminRoutes);

export default router;
