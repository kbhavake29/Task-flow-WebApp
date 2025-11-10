import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validator';
import {
  taskTitleValidation,
  taskDueDateValidation,
  taskStatusValidation,
  taskProjectIdValidation,
  uuidValidation,
  paginationValidation,
  sortValidation,
  bulkTaskIdsValidation,
  bulkTaskStatusValidation,
} from '../utils/validation';

const router = Router();

// All task routes require authentication
router.use(authenticate);

/**
 * GET /api/tasks
 * Get all tasks for authenticated user with optional filters
 */
router.get(
  '/',
  [
    ...paginationValidation(),
    ...sortValidation(['created_at', 'due_date', 'title']),
    validate,
  ],
  TaskController.getTasks
);

/**
 * GET /api/tasks/overdue
 * Get all overdue tasks for authenticated user
 */
router.get('/overdue', TaskController.getOverdueTasks);

/**
 * PATCH /api/tasks/bulk-update-status
 * Bulk update task status
 */
router.patch(
  '/bulk-update-status',
  [bulkTaskIdsValidation(), bulkTaskStatusValidation(), validate],
  TaskController.bulkUpdateTaskStatus
);

/**
 * GET /api/tasks/:id
 * Get single task by ID
 */
router.get('/:id', [uuidValidation('id'), validate], TaskController.getTask);

/**
 * POST /api/tasks
 * Create new task
 */
router.post(
  '/',
  [
    taskProjectIdValidation(),
    taskTitleValidation(),
    taskDueDateValidation(),
    validate,
  ],
  TaskController.createTask
);

/**
 * PATCH /api/tasks/:id
 * Update existing task
 */
router.patch(
  '/:id',
  [
    uuidValidation('id'),
    taskTitleValidation(true),
    taskDueDateValidation(),
    taskStatusValidation(),
    validate,
  ],
  TaskController.updateTask
);

/**
 * DELETE /api/tasks/:id
 * Delete task
 */
router.delete('/:id', [uuidValidation('id'), validate], TaskController.deleteTask);

export default router;
