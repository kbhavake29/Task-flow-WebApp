import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All export routes require authentication
router.use(authenticate);

/**
 * GET /api/export/json
 * Export all user data as JSON
 */
router.get('/json', ExportController.exportJSON);

/**
 * GET /api/export/tasks-csv
 * Export all tasks as CSV
 */
router.get('/tasks-csv', ExportController.exportTasksCSV);

/**
 * GET /api/export/projects-csv
 * Export all projects as CSV
 */
router.get('/projects-csv', ExportController.exportProjectsCSV);

export default router;
