import { Router } from 'express';
import {
  addStudent,
  addTest,
  getMarksSetup,
  getSingleStudentProfile,
  getStudentsForTeacher,
  getTeacherDashboard,
  getTestsByExam,
  saveMarks
} from '../controllers/teacherController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('teacher', 'admin'));

router.get('/dashboard', getTeacherDashboard);
router.get('/students', getStudentsForTeacher);
router.get('/students/:studentId/profile', getSingleStudentProfile);
router.post('/students', addStudent);
router.get('/tests/:examId', getTestsByExam);
router.post('/tests', addTest);
router.get('/marks/:examId', getMarksSetup);
router.post('/marks', saveMarks);

export default router;
