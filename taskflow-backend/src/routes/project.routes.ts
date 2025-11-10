import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validator';
import {
  projectNameValidation,
  projectDescriptionValidation,
  projectArchivedValidation,
  uuidValidation,
  paginationValidation,
  sortValidation,
} from '../utils/validation';

const router = Router();

// All project routes require authentication
router.use(authenticate);

/**
 * GET /api/projects
 * Get all projects for authenticated user
 */
router.get(
  '/',
  [
    ...paginationValidation(),
    ...sortValidation(['created_at', 'updated_at', 'name']),
    validate,
  ],
  ProjectController.getProjects
);

/**
 * GET /api/projects/:id
 * Get single project by ID
 */
router.get('/:id', [uuidValidation('id'), validate], ProjectController.getProject);

/**
 * POST /api/projects
 * Create new project
 */
router.post(
  '/',
  [projectNameValidation(), projectDescriptionValidation(), validate],
  ProjectController.createProject
);

/**
 * PATCH /api/projects/:id
 * Update existing project
 */
router.patch(
  '/:id',
  [
    uuidValidation('id'),
    projectNameValidation(true),
    projectDescriptionValidation(),
    projectArchivedValidation(),
    validate,
  ],
  ProjectController.updateProject
);

/**
 * DELETE /api/projects/:id
 * Delete project
 */
router.delete('/:id', [uuidValidation('id'), validate], ProjectController.deleteProject);

export default router;
