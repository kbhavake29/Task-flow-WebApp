import { Request, Response } from 'express';
import { ExportService } from '../services/export.service';
import { asyncHandler } from '../utils/asyncHandler';

export class ExportController {
  /**
   * Export all data as JSON - GET /api/export/json
   */
  static exportJSON = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const data = await ExportService.exportAsJSON(userId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="taskflow-export-${Date.now()}.json"`);

    res.status(200).json(data);
  });

  /**
   * Export tasks as CSV - GET /api/export/tasks-csv
   */
  static exportTasksCSV = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const csv = await ExportService.exportTasksAsCSV(userId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="taskflow-tasks-${Date.now()}.csv"`);

    res.status(200).send(csv);
  });

  /**
   * Export projects as CSV - GET /api/export/projects-csv
   */
  static exportProjectsCSV = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const csv = await ExportService.exportProjectsAsCSV(userId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="taskflow-projects-${Date.now()}.csv"`);

    res.status(200).send(csv);
  });
}
