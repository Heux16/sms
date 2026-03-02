import { Router } from 'express';
import { getStudentDashboard } from '../controllers/studentController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('student'));

router.get('/dashboard', getStudentDashboard);

export default router;
