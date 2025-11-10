import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';
import { logger } from '../utils/logger';

interface ExportData {
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  };
  projects: Array<{
    id: string;
    name: string;
    description: string | null;
    isArchived: number;
    createdAt: string;
    updatedAt: string;
  }>;
  tasks: Array<{
    id: string;
    projectId: string;
    title: string;
    dueDate: string | null;
    status: string;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

export class ExportService {
  /**
   * Export all user data as JSON
   */
  static async exportAsJSON(userId: string): Promise<ExportData> {
    try {
      // Get user info
      const [userRows] = await pool.query<RowDataPacket[]>(
        'SELECT id, email, name, created_at FROM users WHERE id = ?',
        [userId]
      );

      const user = userRows[0];

      // Get all projects
      const [projectRows] = await pool.query<RowDataPacket[]>(
        'SELECT id, name, description, is_archived, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      // Get all tasks
      const [taskRows] = await pool.query<RowDataPacket[]>(
        'SELECT id, project_id, title, due_date, status, completed_at, created_at, updated_at FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      const exportData: ExportData = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.created_at,
        },
        projects: projectRows.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          isArchived: p.is_archived,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })),
        tasks: taskRows.map((t) => ({
          id: t.id,
          projectId: t.project_id,
          title: t.title,
          dueDate: t.due_date,
          status: t.status,
          completedAt: t.completed_at,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        })),
      };

      logger.info(`Exported JSON data for user ${userId}: ${projectRows.length} projects, ${taskRows.length} tasks`);

      return exportData;
    } catch (error) {
      logger.error('Error exporting JSON:', error);
      throw error;
    }
  }

  /**
   * Export tasks as CSV
   */
  static async exportTasksAsCSV(userId: string): Promise<string> {
    try {
      // Get all tasks with project names
      const [taskRows] = await pool.query<RowDataPacket[]>(
        `SELECT
          t.id,
          p.name as project_name,
          t.title,
          t.status,
          t.due_date,
          t.completed_at,
          t.created_at,
          t.updated_at
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC`,
        [userId]
      );

      // Build CSV
      const headers = ['Task ID', 'Project', 'Title', 'Status', 'Due Date', 'Completed At', 'Created At', 'Updated At'];
      const rows = taskRows.map((task) => [
        task.id,
        task.project_name || 'N/A',
        `"${task.title.replace(/"/g, '""')}"`, // Escape quotes in title
        task.status,
        task.due_date || '',
        task.completed_at || '',
        task.created_at,
        task.updated_at,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      logger.info(`Exported CSV data for user ${userId}: ${taskRows.length} tasks`);

      return csv;
    } catch (error) {
      logger.error('Error exporting CSV:', error);
      throw error;
    }
  }

  /**
   * Export projects as CSV
   */
  static async exportProjectsAsCSV(userId: string): Promise<string> {
    try {
      // Get all projects with task counts
      const [projectRows] = await pool.query<RowDataPacket[]>(
        `SELECT
          p.id,
          p.name,
          p.description,
          p.is_archived,
          p.created_at,
          p.updated_at,
          COUNT(t.id) as task_count,
          SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        WHERE p.user_id = ?
        GROUP BY p.id
        ORDER BY p.created_at DESC`,
        [userId]
      );

      // Build CSV
      const headers = ['Project ID', 'Name', 'Description', 'Status', 'Total Tasks', 'Completed Tasks', 'Created At', 'Updated At'];
      const rows = projectRows.map((project) => [
        project.id,
        `"${project.name.replace(/"/g, '""')}"`,
        project.description ? `"${project.description.replace(/"/g, '""')}"` : '',
        project.is_archived ? 'Archived' : 'Active',
        project.task_count,
        project.completed_tasks,
        project.created_at,
        project.updated_at,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      logger.info(`Exported projects CSV for user ${userId}: ${projectRows.length} projects`);

      return csv;
    } catch (error) {
      logger.error('Error exporting projects CSV:', error);
      throw error;
    }
  }
}
