import { v4 as uuidv4 } from 'uuid';
import { TaskModel } from '../models/task.model';
import { ProjectModel } from '../models/project.model';
import { CacheService } from './cache.service';
import { NotFoundError } from '../utils/ApiError';
import { REDIS_KEYS, CACHE_TTL } from '../utils/constants';
import { TaskResponse } from '../types/task.types';

export class TaskService {
  /**
   * Get all tasks for a user with optional filters
   * If isAdmin is true, return all tasks (not filtered by user)
   */
  static async getTasks(
    userId: string,
    options: {
      projectId?: string;
      status?: 'pending' | 'completed';
      sort?: string;
      order?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
      isAdmin?: boolean;
    } = {}
  ): Promise<{ tasks: TaskResponse[]; pagination: any }> {
    // Try cache first (skip cache for admin to ensure fresh data)
    const cacheKey = `${REDIS_KEYS.TASKS_LIST}${userId}:${JSON.stringify(options)}`;

    if (!options.isAdmin) {
      const cached = await CacheService.get<{ tasks: TaskResponse[]; total: number }>(cacheKey);

      if (cached) {
        return {
          tasks: cached.tasks,
          pagination: {
            total: cached.total,
            limit: options.limit || 100,
            offset: options.offset || 0,
          },
        };
      }
    }

    // Fetch from database
    const { tasks, total } = await TaskModel.findByUserId(userId, options);

    const taskResponses = tasks.map((t) => TaskModel.toResponse(t));

    // Cache results (skip cache for admin queries)
    if (!options.isAdmin) {
      await CacheService.set(cacheKey, { tasks: taskResponses, total }, CACHE_TTL.TASKS_LIST);
    }

    return {
      tasks: taskResponses,
      pagination: {
        total,
        limit: options.limit || 100,
        offset: options.offset || 0,
      },
    };
  }

  /**
   * Get single task by ID
   */
  static async getTaskById(id: string, userId: string): Promise<TaskResponse> {
    const task = await TaskModel.findByIdAndUserId(id, userId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Get project name
    const project = await ProjectModel.findByIdAndUserId(task.project_id, userId);

    return TaskModel.toResponse(task, project?.name);
  }

  /**
   * Create new task
   */
  static async createTask(
    userId: string,
    projectId: string,
    title: string,
    dueDate?: Date
  ): Promise<TaskResponse> {
    // Verify project exists and belongs to user
    const project = await ProjectModel.findByIdAndUserId(projectId, userId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const id = uuidv4();
    const task = await TaskModel.create(id, projectId, userId, title, dueDate);

    // Invalidate caches
    await Promise.all([
      CacheService.deletePattern(`${REDIS_KEYS.TASKS_LIST}${userId}:*`),
      CacheService.delete(`${REDIS_KEYS.DASHBOARD_STATS}${userId}`),
    ]);

    return TaskModel.toResponse(task);
  }

  /**
   * Update task
   */
  static async updateTask(
    id: string,
    userId: string,
    updates: { title?: string; dueDate?: Date | null; status?: 'pending' | 'completed' }
  ): Promise<TaskResponse> {
    const task = await TaskModel.update(id, userId, updates);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Invalidate caches
    await Promise.all([
      CacheService.deletePattern(`${REDIS_KEYS.TASKS_LIST}${userId}:*`),
      CacheService.delete(`${REDIS_KEYS.DASHBOARD_STATS}${userId}`),
    ]);

    return TaskModel.toResponse(task);
  }

  /**
   * Bulk update task status
   */
  static async bulkUpdateTaskStatus(
    taskIds: string[],
    userId: string,
    status: 'pending' | 'completed'
  ): Promise<{ updatedCount: number; tasks: TaskResponse[] }> {
    if (taskIds.length === 0) {
      return { updatedCount: 0, tasks: [] };
    }

    const result = await TaskModel.bulkUpdateStatus(taskIds, userId, status);

    // Invalidate caches
    await Promise.all([
      CacheService.deletePattern(`${REDIS_KEYS.TASKS_LIST}${userId}:*`),
      CacheService.delete(`${REDIS_KEYS.DASHBOARD_STATS}${userId}`),
    ]);

    const taskResponses = result.tasks.map((t) => TaskModel.toResponse(t));

    return {
      updatedCount: result.updatedCount,
      tasks: taskResponses,
    };
  }

  /**
   * Delete task
   * If isAdmin is true, skip ownership check
   */
  static async deleteTask(id: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const deleted = await TaskModel.delete(id, userId, isAdmin);
    if (!deleted) {
      throw new NotFoundError('Task not found');
    }

    // Invalidate caches
    await Promise.all([
      CacheService.deletePattern(`${REDIS_KEYS.TASKS_LIST}${userId}:*`),
      CacheService.delete(`${REDIS_KEYS.DASHBOARD_STATS}${userId}`),
    ]);
  }

  /**
   * Get dashboard statistics
   * If isAdmin is true, return stats for all users
   */
  static async getDashboardStats(userId: string, isAdmin: boolean = false): Promise<any> {
    // Try cache first (skip cache for admin to ensure fresh data)
    const cacheKey = `${REDIS_KEYS.DASHBOARD_STATS}${userId}${isAdmin ? ':admin' : ''}`;

    if (!isAdmin) {
      const cached = await CacheService.get<any>(cacheKey);

      if (cached) {
        return cached;
      }
    }

    // Fetch from database
    const stats = await TaskModel.getDashboardStats(userId, isAdmin);

    // Cache results (skip cache for admin queries)
    if (!isAdmin) {
      await CacheService.set(cacheKey, stats, CACHE_TTL.DASHBOARD_STATS);
    }

    return stats;
  }

  /**
   * Get overdue tasks for a user
   * If isAdmin is true, return all overdue tasks from all users
   */
  static async getOverdueTasks(userId: string, isAdmin: boolean = false): Promise<TaskResponse[]> {
    // Try cache first (skip cache for admin to ensure fresh data)
    const cacheKey = `${REDIS_KEYS.TASKS_LIST}${userId}:overdue${isAdmin ? ':admin' : ''}`;

    if (!isAdmin) {
      const cached = await CacheService.get<TaskResponse[]>(cacheKey);

      if (cached) {
        return cached;
      }
    }

    // Fetch from database
    const tasks = await TaskModel.findOverdueTasks(userId, isAdmin);
    const taskResponses = tasks.map((t: any) => TaskModel.toResponse(t, t.project_name));

    // Cache results (shorter TTL for overdue tasks as they're time-sensitive, skip cache for admin)
    if (!isAdmin) {
      await CacheService.set(cacheKey, taskResponses, 300); // 5 minutes
    }

    return taskResponses;
  }
}
