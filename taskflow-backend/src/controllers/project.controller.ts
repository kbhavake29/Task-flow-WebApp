import { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { asyncHandler } from '../utils/asyncHandler';
import { UnauthorizedError } from '../utils/ApiError';

/**
 * Project Controller
 */
export class ProjectController {
  /**
   * Get all projects - GET /api/projects
   * For admins, returns all projects. For regular users, returns only their projects.
   */
  static getProjects = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const { archived, sort, order, limit, offset } = req.query;
    const isAdmin = req.user.role === 'admin';

    const options = {
      archived: archived === 'true' ? true : archived === 'false' ? false : undefined,
      sort: sort as string,
      order: order as 'asc' | 'desc',
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      isAdmin,
    };

    const result = await ProjectService.getProjects(req.user.userId, options);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get single project - GET /api/projects/:id
   */
  static getProject = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const { id } = req.params;

    const project = await ProjectService.getProjectById(id, req.user.userId);

    res.status(200).json({
      success: true,
      data: { project },
    });
  });

  /**
   * Create project - POST /api/projects
   */
  static createProject = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const { name, description } = req.body;

    const project = await ProjectService.createProject(req.user.userId, name, description);

    res.status(201).json({
      success: true,
      data: { project },
    });
  });

  /**
   * Update project - PATCH /api/projects/:id
   */
  static updateProject = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const { id } = req.params;
    const { name, description, isArchived } = req.body;

    const project = await ProjectService.updateProject(id, req.user.userId, {
      name,
      description,
      isArchived,
    });

    res.status(200).json({
      success: true,
      data: { project },
    });
  });

  /**
   * Delete project - DELETE /api/projects/:id
   */
  static deleteProject = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    await ProjectService.deleteProject(id, req.user.userId, isAdmin);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  });
}
