import { db } from '../config/db.js';
import { buildStudentReportCard } from '../services/reportCardService.js';

export async function getStudentDashboard(req, res, next) {
  try {
    const report = await buildStudentReportCard(db, req.user.id);
    if (!report) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
}
