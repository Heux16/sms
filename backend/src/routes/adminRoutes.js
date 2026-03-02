import { Router } from 'express';
import {
  addExam,
  addTeacher,
  getDashboard,
  getExams,
  getStudents,
  getTeachers,
  publishExam,
  unpublishExam
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/dashboard', getDashboard);
router.get('/teachers', getTeachers);
router.post('/teachers', addTeacher);
router.get('/students', getStudents);
router.get('/exams', getExams);
router.post('/exams', addExam);
router.post('/exams/publish', publishExam);
router.post('/exams/unpublish', unpublishExam);

export default router;
