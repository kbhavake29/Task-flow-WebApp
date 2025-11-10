import { v4 as uuidv4 } from 'uuid';
import { ProjectModel } from '../models/project.model';
import { CacheService } from './cache.service';
import { NotFoundError } from '../utils/ApiError';
import { REDIS_KEYS, CACHE_TTL } from '../utils/constants';
import { ProjectResponse } from '../types/project.types';

export class ProjectService {
  /**
   * Get all projects for a user
   * If isAdmin is true, return all projects (not filtered by user)
   */
  static async getProjects(
    userId: string,
    options: {
      archived?: boolean;
      sort?: string;
      order?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
      isAdmin?: boolean;
    } = {}
  ): Promise<{ projects: ProjectResponse[]; pagination: any }> {
    // Try cache first (skip cache for admin to ensure fresh data)
    const cacheKey = `${REDIS_KEYS.PROJECTS_LIST}${userId}:${JSON.stringify(options)}`;

    if (!options.isAdmin) {
      const cached = await CacheService.get<{ projects: ProjectResponse[]; total: number }>(
        cacheKey
      );

      if (cached) {
        return {
          projects: cached.projects,
          pagination: {
            total: cached.total,
            limit: options.limit || 50,
            offset: options.offset || 0,
          },
        };
      }
    }

    // Fetch from database
    const { projects, total } = await ProjectModel.findByUserId(userId, options);

    const projectResponses = projects.map((p) => ProjectModel.toResponse(p));

    // Cache results (skip cache for admin queries)
    if (!options.isAdmin) {
      await CacheService.set(
        cacheKey,
        { projects: projectResponses, total },
        CACHE_TTL.PROJECTS_LIST
      );
    }

    return {
      projects: projectResponses,
      pagination: {
        total,
        limit: options.limit || 50,
        offset: options.offset || 0,
      },
    };
  }

  /**
   * Get single project by ID
   */
  static async getProjectById(id: string, userId: string): Promise<ProjectResponse> {
    // Try cache first
    const cacheKey = `${REDIS_KEYS.PROJECT}${id}`;
    const cached = await CacheService.get<ProjectResponse>(cacheKey);

    if (cached && cached.userId === userId) {
      return cached;
    }

    // Fetch from database
    const project = await ProjectModel.findByIdAndUserId(id, userId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get task count
    const taskCount = await ProjectModel.getTaskCount(id);

    const projectResponse = ProjectModel.toResponse(project, taskCount);

    // Cache result
    await CacheService.set(cacheKey, projectResponse, CACHE_TTL.PROJECT);

    return projectResponse;
  }

  /**
   * Create new project
   */
  static async createProject(
    userId: string,
    name: string,
    description?: string
  ): Promise<ProjectResponse> {
    const id = uuidv4();
    const project = await ProjectModel.create(id, userId, name, description);

    // Invalidate projects list cache
    await CacheService.deletePattern(`${REDIS_KEYS.PROJECTS_LIST}${userId}:*`);

    return ProjectModel.toResponse(project);
  }

  /**
   * Update project
   */
  static async updateProject(
    id: string,
    userId: string,
    updates: { name?: string; description?: string; isArchived?: boolean }
  ): Promise<ProjectResponse> {
    const project = await ProjectModel.update(id, userId, updates);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Invalidate caches
    await Promise.all([
      CacheService.delete(`${REDIS_KEYS.PROJECT}${id}`),
      CacheService.deletePattern(`${REDIS_KEYS.PROJECTS_LIST}${userId}:*`),
      CacheService.delete(`${REDIS_KEYS.DASHBOARD_STATS}${userId}`),
    ]);

    return ProjectModel.toResponse(project);
  }

  /**
   * Delete project
   * If isAdmin is true, skip ownership check
   */
  static async deleteProject(id: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const deleted = await ProjectModel.delete(id, userId, isAdmin);
    if (!deleted) {
      throw new NotFoundError('Project not found');
    }

    // Invalidate caches
    await Promise.all([
      CacheService.delete(`${REDIS_KEYS.PROJECT}${id}`),
      CacheService.deletePattern(`${REDIS_KEYS.PROJECTS_LIST}${userId}:*`),
      CacheService.deletePattern(`${REDIS_KEYS.TASKS_LIST}${userId}:*`),
      CacheService.delete(`${REDIS_KEYS.DASHBOARD_STATS}${userId}`),
    ]);
  }
}
