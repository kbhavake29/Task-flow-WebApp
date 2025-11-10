import { Request, Response } from 'express';
import { pool } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';
import { UnauthorizedError } from '../utils/ApiError';
import { RowDataPacket } from 'mysql2';

/**
 * Admin Controller
 * Handles admin-only operations
 */
export class AdminController {
  /**
   * Get all users - GET /api/admin/users
   */
  static getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT id, email, name, role, email_verified, is_active, created_at, last_login_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: { users },
    });
  });

  /**
   * Get all projects (across all users) - GET /api/admin/projects
   */
  static getAllProjects = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const [projects] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, u.email as user_email, u.name as user_name,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
       FROM projects p
       LEFT JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: { projects },
    });
  });

  /**
   * Get all tasks (across all users) - GET /api/admin/tasks
   */
  static getAllTasks = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    const [tasks] = await pool.query<RowDataPacket[]>(
      `SELECT t.*,
              u.email as user_email,
              u.name as user_name,
              p.name as project_name
       FROM tasks t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       ORDER BY t.created_at DESC`
    );

    // Add isOverdue flag for each task
    const tasksWithOverdue = tasks.map((task: any) => ({
      ...task,
      isOverdue:
        task.status === 'pending' &&
        task.due_date !== null &&
        new Date(task.due_date) < new Date(),
    }));

    res.status(200).json({
      success: true,
      data: { tasks: tasksWithOverdue },
    });
  });

  /**
   * Get dashboard stats for admin - GET /api/admin/stats
   */
  static getAdminStats = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('Not authenticated');

    // Total users
    const [totalUsersRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      'SELECT COUNT(*) as count FROM users'
    );

    // Active users (logged in within last 30 days)
    const [activeUsersRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      'SELECT COUNT(*) as count FROM users WHERE last_login_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    // Admin users
    const [adminUsersRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
    );

    // Total projects
    const [totalProjectsRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      'SELECT COUNT(*) as count FROM projects'
    );

    // Total tasks
    const [totalTasksRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      'SELECT COUNT(*) as count FROM tasks'
    );

    // Completed tasks
    const [completedTasksRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      "SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'"
    );

    // Pending tasks
    const [pendingTasksRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      "SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'"
    );

    // Overdue tasks
    const [overdueTasksRows] = await pool.query<(RowDataPacket & { count: number })[]>(
      "SELECT COUNT(*) as count FROM tasks WHERE status = 'pending' AND due_date < NOW()"
    );

    res.status(200).json({
      success: true,
      data: {
        totalUsers: totalUsersRows[0].count,
        activeUsers: activeUsersRows[0].count,
        adminUsers: adminUsersRows[0].count,
        totalProjects: totalProjectsRows[0].count,
        totalTasks: totalTasksRows[0].count,
        completedTasks: completedTasksRows[0].count,
        pendingTasks: pendingTasksRows[0].count,
        overdueTasks: overdueTasksRows[0].count,
      },
    });
  });
}
