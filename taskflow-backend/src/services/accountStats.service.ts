import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';
import { logger } from '../utils/logger';

interface AccountStats {
  totalProjects: number;
  activeProjects: number;
  archivedProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  tasksCreatedThisWeek: number;
  tasksCompletedThisWeek: number;
  tasksCreatedThisMonth: number;
  tasksCompletedThisMonth: number;
  accountAge: {
    days: number;
    months: number;
    years: number;
  };
  mostProductiveDay: string | null;
  averageTasksPerProject: number;
}

export class AccountStatsService {
  /**
   * Get comprehensive account statistics
   */
  static async getAccountStats(userId: string): Promise<AccountStats> {
    try {
      // Get project stats
      const [projectStats] = await pool.query<RowDataPacket[]>(
        `SELECT
          COUNT(*) as total_projects,
          SUM(CASE WHEN is_archived = 0 THEN 1 ELSE 0 END) as active_projects,
          SUM(CASE WHEN is_archived = 1 THEN 1 ELSE 0 END) as archived_projects
        FROM projects
        WHERE user_id = ?`,
        [userId]
      );

      // Get task stats
      const [taskStats] = await pool.query<RowDataPacket[]>(
        `SELECT
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks
        FROM tasks
        WHERE user_id = ?`,
        [userId]
      );

      // Get weekly stats
      const [weeklyStats] = await pool.query<RowDataPacket[]>(
        `SELECT
          COUNT(*) as tasks_created,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as tasks_completed
        FROM tasks
        WHERE user_id = ?
          AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [userId]
      );

      // Get monthly stats
      const [monthlyStats] = await pool.query<RowDataPacket[]>(
        `SELECT
          COUNT(*) as tasks_created,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as tasks_completed
        FROM tasks
        WHERE user_id = ?
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [userId]
      );

      // Get account age
      const [userInfo] = await pool.query<RowDataPacket[]>(
        'SELECT created_at FROM users WHERE id = ?',
        [userId]
      );

      const accountCreatedAt = new Date(userInfo[0].created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - accountCreatedAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      // Get most productive day (day with most completed tasks)
      const [productiveDay] = await pool.query<RowDataPacket[]>(
        `SELECT
          DAYNAME(completed_at) as day_name,
          COUNT(*) as completed_count
        FROM tasks
        WHERE user_id = ?
          AND status = 'completed'
          AND completed_at IS NOT NULL
        GROUP BY DAYNAME(completed_at)
        ORDER BY completed_count DESC
        LIMIT 1`,
        [userId]
      );

      const totalTasks = taskStats[0].total_tasks || 0;
      const completedTasks = taskStats[0].completed_tasks || 0;
      const totalProjects = projectStats[0].total_projects || 0;

      const stats: AccountStats = {
        totalProjects: totalProjects,
        activeProjects: projectStats[0].active_projects || 0,
        archivedProjects: projectStats[0].archived_projects || 0,
        totalTasks: totalTasks,
        completedTasks: completedTasks,
        pendingTasks: taskStats[0].pending_tasks || 0,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        tasksCreatedThisWeek: weeklyStats[0]?.tasks_created || 0,
        tasksCompletedThisWeek: weeklyStats[0]?.tasks_completed || 0,
        tasksCreatedThisMonth: monthlyStats[0]?.tasks_created || 0,
        tasksCompletedThisMonth: monthlyStats[0]?.tasks_completed || 0,
        accountAge: {
          days: diffDays,
          months: diffMonths,
          years: diffYears,
        },
        mostProductiveDay: productiveDay[0]?.day_name || null,
        averageTasksPerProject: totalProjects > 0 ? Math.round((totalTasks / totalProjects) * 10) / 10 : 0,
      };

      logger.info(`Retrieved account stats for user ${userId}`);

      return stats;
    } catch (error) {
      logger.error('Error getting account stats:', error);
      throw error;
    }
  }
}
