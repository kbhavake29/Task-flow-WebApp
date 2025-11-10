import { pool } from '../config/database';
import { Project, ProjectResponse } from '../types/project.types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class ProjectModel {
  /**
   * Find all projects for a user
   * If isAdmin is true, return all projects (not filtered by user)
   */
  static async findByUserId(
    userId: string,
    options: {
      archived?: boolean;
      sort?: string;
      order?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
      isAdmin?: boolean;
    } = {}
  ): Promise<{ projects: Project[]; total: number }> {
    const { archived, sort = 'created_at', order = 'desc', limit = 50, offset = 0, isAdmin = false } = options;

    let query = `
      SELECT
        p.*,
        u.email as user_email,
        u.name as user_name
      FROM projects p
      LEFT JOIN users u ON p.user_id = u.id
    `;
    const params: any[] = [];

    // Build WHERE clause
    const conditions: string[] = [];

    if (!isAdmin) {
      conditions.push('p.user_id = ?');
      params.push(userId);
    }

    if (archived !== undefined) {
      conditions.push('p.is_archived = ?');
      params.push(archived);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Get total count
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as count FROM');
    const [countRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      countQuery,
      params
    );
    const total = countRows[0].count;

    // Add sorting and pagination (need to prefix with p. for table alias)
    const sortColumn = sort === 'created_at' || sort === 'updated_at' || sort === 'name' ? `p.${sort}` : 'p.created_at';
    query += ` ORDER BY ${sortColumn} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [projects] = await pool.query<(Project & RowDataPacket)[]>(query, params);

    return { projects, total };
  }

  /**
   * Find project by ID and user ID
   */
  static async findByIdAndUserId(id: string, userId: string): Promise<Project | null> {
    const [rows] = await pool.query<(Project & RowDataPacket)[]>(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    return rows[0] || null;
  }

  /**
   * Create new project
   */
  static async create(
    id: string,
    userId: string,
    name: string,
    description?: string
  ): Promise<Project> {
    await pool.query<ResultSetHeader>(
      'INSERT INTO projects (id, user_id, name, description) VALUES (?, ?, ?, ?)',
      [id, userId, name, description || null]
    );

    const project = await this.findByIdAndUserId(id, userId);
    if (!project) {
      throw new Error('Failed to create project');
    }

    return project;
  }

  /**
   * Update project
   */
  static async update(
    id: string,
    userId: string,
    updates: { name?: string; description?: string; isArchived?: boolean }
  ): Promise<Project | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.isArchived !== undefined) {
      fields.push('is_archived = ?');
      values.push(updates.isArchived);
    }

    if (fields.length === 0) {
      return this.findByIdAndUserId(id, userId);
    }

    values.push(id, userId);

    await pool.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    return this.findByIdAndUserId(id, userId);
  }

  /**
   * Delete project
   * If isAdmin is true, skip ownership check
   */
  static async delete(id: string, userId: string, isAdmin: boolean = false): Promise<boolean> {
    let query: string;
    let params: any[];

    if (isAdmin) {
      // Admin can delete any project
      query = 'DELETE FROM projects WHERE id = ?';
      params = [id];
    } else {
      // Regular user can only delete own projects
      query = 'DELETE FROM projects WHERE id = ? AND user_id = ?';
      params = [id, userId];
    }

    const [result] = await pool.query<ResultSetHeader>(query, params);

    return result.affectedRows > 0;
  }

  /**
   * Get project task count
   */
  static async getTaskCount(projectId: string): Promise<number> {
    const [rows] = await pool.query<(RowDataPacket & { count: number })[]>(
      'SELECT COUNT(*) as count FROM tasks WHERE project_id = ?',
      [projectId]
    );

    return rows[0].count;
  }

  /**
   * Convert database project to response format
   */
  static toResponse(project: Project, taskCount?: number): ProjectResponse {
    return {
      id: project.id,
      userId: project.user_id,
      name: project.name,
      description: project.description,
      isArchived: project.is_archived,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      ...(taskCount !== undefined && { taskCount }),
      ...(project.user_email && { userEmail: project.user_email }),
      ...(project.user_name !== undefined && { userName: project.user_name }),
    };
  }
}
