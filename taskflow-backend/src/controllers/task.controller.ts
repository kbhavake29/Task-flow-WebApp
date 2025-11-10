import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { asyncHandler } from '../utils/asyncHandler';
import { UnauthorizedError } from '../utils/ApiError';

/**
 * Task Controller
 */
export class TaskController {
  /**
   * Get all tasks - GET /api/tasks
   * For admins, returns all tasks from all users
   */
  static getTasks = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const { projectId, status, sort, order, limit, offset } = req.query;
    const isAdmin = req.user.role === 'admin';

    const options = {
      projectId: projectId as string,
      status: status as 'pending' | 'completed',
      sort: sort as string,
      order: order as 'asc' | 'desc',
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      isAdmin,
    };

    const result = await TaskService.getTasks(req.user.userId, options);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get single task - GET /api/tasks/:id
   */
  static getTask = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const { id } = req.params;

    const task = await TaskService.getTaskById(id, req.user.userId);

    res.status(200).json({
      success: true,
      data: { task },
    });
  });

  /**
   * Create task - POST /api/tasks
   */
  static createTask = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const { projectId, title, dueDate } = req.body;

    const task = await TaskService.createTask(
      req.user.userId,
      projectId,
      title,
      dueDate ? new Date(dueDate) : undefined
    );

    res.status(201).json({
      success: true,
      data: { task },
    });
  });

  /**
   * Update task - PATCH /api/tasks/:id
   */
  static updateTask = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const { id } = req.params;
    const { title, dueDate, status } = req.body;

    const task = await TaskService.updateTask(id, req.user.userId, {
      title,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      status,
    });

    res.status(200).json({
      success: true,
      data: { task },
    });
  });

  /**
   * Bulk update task status - PATCH /api/tasks/bulk-update-status
   */
  static bulkUpdateTaskStatus = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const { taskIds, status } = req.body;

    const result = await TaskService.bulkUpdateTaskStatus(
      taskIds,
      req.user.userId,
      status
    );

    res.status(200).json({
      success: true,
      data: result,
      message: `${result.updatedCount} task(s) updated successfully`,
    });
  });

  /**
   * Delete task - DELETE /api/tasks/:id
   */
  static deleteTask = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    await TaskService.deleteTask(id, req.user.userId, isAdmin);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  });

  /**
   * Get overdue tasks - GET /api/tasks/overdue
   * For admins, returns all overdue tasks from all users
   */
  static getOverdueTasks = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const isAdmin = req.user.role === 'admin';
    const tasks = await TaskService.getOverdueTasks(req.user.userId, isAdmin);

    res.status(200).json({
      success: true,
      data: { tasks },
    });
  });
}
