import { pool } from '../config/database';
import { Task, TaskResponse } from '../types/task.types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class TaskModel {
  /**
   * Find all tasks for a user with optional filters
   * If isAdmin is true, return all tasks (not filtered by user)
   */
  static async findByUserId(
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
  ): Promise<{ tasks: Task[]; total: number }> {
    const {
      projectId,
      status,
      sort = 'created_at',
      order = 'desc',
      limit = 100,
      offset = 0,
      isAdmin = false,
    } = options;

    let query = 'SELECT * FROM tasks';
    const params: any[] = [];
    const conditions: string[] = [];

    if (!isAdmin) {
      conditions.push('user_id = ?');
      params.push(userId);
    }

    if (projectId) {
      conditions.push('project_id = ?');
      params.push(projectId);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const [countRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      countQuery,
      params
    );
    const total = countRows[0].count;

    // Add sorting and pagination
    query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [tasks] = await pool.query<(Task & RowDataPacket)[]>(query, params);

    return { tasks, total };
  }

  /**
   * Find task by ID and user ID
   */
  static async findByIdAndUserId(id: string, userId: string): Promise<Task | null> {
    const [rows] = await pool.query<(Task & RowDataPacket)[]>(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    return rows[0] || null;
  }

  /**
   * Create new task
   */
  static async create(
    id: string,
    projectId: string,
    userId: string,
    title: string,
    dueDate?: Date
  ): Promise<Task> {
    await pool.query<ResultSetHeader>(
      'INSERT INTO tasks (id, project_id, user_id, title, due_date) VALUES (?, ?, ?, ?, ?)',
      [id, projectId, userId, title, dueDate || null]
    );

    const task = await this.findByIdAndUserId(id, userId);
    if (!task) {
      throw new Error('Failed to create task');
    }

    return task;
  }

  /**
   * Update task
   */
  static async update(
    id: string,
    userId: string,
    updates: { title?: string; dueDate?: Date | null; status?: 'pending' | 'completed' }
  ): Promise<Task | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.dueDate !== undefined) {
      fields.push('due_date = ?');
      values.push(updates.dueDate);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);

      // Update completed_at based on status change
      if (updates.status === 'completed') {
        fields.push('completed_at = CURRENT_TIMESTAMP');
      } else {
        fields.push('completed_at = NULL');
      }
    }

    if (fields.length === 0) {
      return this.findByIdAndUserId(id, userId);
    }

    values.push(id, userId);

    await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);

    return this.findByIdAndUserId(id, userId);
  }

  /**
   * Bulk update task status
   */
  static async bulkUpdateStatus(
    taskIds: string[],
    userId: string,
    status: 'pending' | 'completed'
  ): Promise<{ updatedCount: number; tasks: Task[] }> {
    if (taskIds.length === 0) {
      return { updatedCount: 0, tasks: [] };
    }

    // Build query with placeholders for task IDs
    const placeholders = taskIds.map(() => '?').join(',');

    // Build update query
    let updateQuery = `UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP`;

    // Update completed_at based on status
    if (status === 'completed') {
      updateQuery += ', completed_at = CURRENT_TIMESTAMP';
    } else {
      updateQuery += ', completed_at = NULL';
    }

    updateQuery += ` WHERE user_id = ? AND id IN (${placeholders})`;

    // Execute update
    const [result] = await pool.query<ResultSetHeader>(
      updateQuery,
      [status, userId, ...taskIds]
    );

    // Fetch updated tasks
    const [tasks] = await pool.query<(Task & RowDataPacket)[]>(
      `SELECT * FROM tasks WHERE user_id = ? AND id IN (${placeholders})`,
      [userId, ...taskIds]
    );

    return {
      updatedCount: result.affectedRows,
      tasks,
    };
  }

  /**
   * Delete task
   * If isAdmin is true, skip ownership check
   */
  static async delete(id: string, userId: string, isAdmin: boolean = false): Promise<boolean> {
    let query: string;
    let params: any[];

    if (isAdmin) {
      // Admin can delete any task
      query = 'DELETE FROM tasks WHERE id = ?';
      params = [id];
    } else {
      // Regular user can only delete own tasks
      query = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';
      params = [id, userId];
    }

    const [result] = await pool.query<ResultSetHeader>(query, params);

    return result.affectedRows > 0;
  }

  /**
   * Find all overdue tasks for a user
   * If isAdmin is true, return all overdue tasks from all users
   */
  static async findOverdueTasks(userId: string, isAdmin: boolean = false): Promise<Task[]> {
    const whereClause = isAdmin ? '' : 'WHERE t.user_id = ? AND';
    const params = isAdmin ? [] : [userId];

    const [tasks] = await pool.query<(Task & RowDataPacket)[]>(
      `SELECT t.*, p.name as project_name, u.email as user_email, u.name as user_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.user_id = u.id
       ${whereClause} t.status = 'pending'
       AND t.due_date < NOW()
       ORDER BY t.due_date ASC`,
      params
    );

    return tasks;
  }

  /**
   * Get dashboard statistics for a user
   * If isAdmin is true, return stats for all users
   */
  static async getDashboardStats(userId: string, isAdmin: boolean = false): Promise<any> {
    const whereClause = isAdmin ? '' : 'WHERE user_id = ?';
    const whereClauseAnd = isAdmin ? 'WHERE' : 'AND';
    const params = isAdmin ? [] : [userId];

    // Total tasks
    const [totalRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      `SELECT COUNT(*) as count FROM tasks ${whereClause}`,
      params
    );

    // Completed tasks
    const [completedRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      `SELECT COUNT(*) as count FROM tasks ${whereClause} ${whereClauseAnd} status = 'completed'`,
      params
    );

    // Pending tasks
    const [pendingRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      `SELECT COUNT(*) as count FROM tasks ${whereClause} ${whereClauseAnd} status = 'pending'`,
      params
    );

    // Tasks completed today
    const [completedTodayRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      `SELECT COUNT(*) as count FROM tasks ${whereClause} ${whereClauseAnd} status = 'completed' AND DATE(completed_at) = CURDATE()`,
      params
    );

    // Tasks due today
    const [dueTodayRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      `SELECT COUNT(*) as count FROM tasks ${whereClause} ${whereClauseAnd} DATE(due_date) = CURDATE()`,
      params
    );

    // Tasks due this week
    const [dueThisWeekRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      `SELECT COUNT(*) as count FROM tasks ${whereClause} ${whereClauseAnd} YEARWEEK(due_date) = YEARWEEK(CURDATE())`,
      params
    );

    // Overdue tasks
    const [overdueRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      `SELECT COUNT(*) as count FROM tasks ${whereClause} ${whereClauseAnd} status = 'pending' AND due_date < NOW()`,
      params
    );

    // Total projects
    const [totalProjectsRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      `SELECT COUNT(*) as count FROM projects ${whereClause}`,
      params
    );

    // Active projects
    const [activeProjectsRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      `SELECT COUNT(*) as count FROM projects ${whereClause} ${whereClauseAnd} is_archived = false`,
      params
    );

    // Archived projects
    const [archivedProjectsRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      `SELECT COUNT(*) as count FROM projects ${whereClause} ${whereClauseAnd} is_archived = true`,
      params
    );

    const totalTasks = totalRows[0].count;
    const completedTasks = completedRows[0].count;

    return {
      totalProjects: totalProjectsRows[0].count,
      activeProjects: activeProjectsRows[0].count,
      archivedProjects: archivedProjectsRows[0].count,
      totalTasks,
      completedTasks,
      pendingTasks: pendingRows[0].count,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      tasksCompletedToday: completedTodayRows[0].count,
      tasksDueToday: dueTodayRows[0].count,
      tasksDueThisWeek: dueThisWeekRows[0].count,
      tasksOverdue: overdueRows[0].count,
    };
  }

  /**
   * Convert database task to response format
   */
  static toResponse(task: Task, projectName?: string): TaskResponse {
    // Check if task is overdue: pending status AND due date is in the past
    const isOverdue =
      task.status === 'pending' &&
      task.due_date !== null &&
      new Date(task.due_date) < new Date();

    return {
      id: task.id,
      projectId: task.project_id,
      userId: task.user_id,
      title: task.title,
      dueDate: task.due_date,
      status: task.status,
      isOverdue,
      completedAt: task.completed_at,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      ...(projectName && { projectName }),
    };
  }
}
