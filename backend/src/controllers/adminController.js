import bcrypt from 'bcrypt';
import { db } from '../config/db.js';

const saltRounds = 10;

export async function getDashboard(req, res, next) {
  try {
    const teachers = await db.query("SELECT * FROM users WHERE role='teacher'");
    const students = await db.query("SELECT * FROM users WHERE role='student'");
    const publishedExams = await db.query('SELECT * FROM exams WHERE is_published = TRUE');
    const unpublishedExams = await db.query('SELECT * FROM exams WHERE is_published = FALSE');

    res.json({
      teachers: teachers.rows,
      students: students.rows,
      publishedExams: publishedExams.rows,
      unpublishedExams: unpublishedExams.rows
    });
  } catch (error) {
    next(error);
  }
}

export async function getTeachers(req, res, next) {
  try {
    const result = await db.query("SELECT * FROM users WHERE role='teacher' ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function addTeacher(req, res, next) {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await db.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
      [username, hashedPassword, 'teacher']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function getStudents(req, res, next) {
  try {
    const result = await db.query("SELECT * FROM users WHERE role='student' ORDER BY class, rollnumber");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function getExams(req, res, next) {
  try {
    const result = await db.query(
      `SELECT *
       FROM exams
       ORDER BY class, created_at, exam_name`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function addExam(req, res, next) {
  try {
    const {
      exam_name: examName,
      class: className,
      testtype,
      max_theory: maxTheory,
      max_practical: maxPractical,
      weightage,
      subjects
    } = req.body;

    const normalizedName = String(examName || '').trim();
    const normalizedClass = String(className || '').trim();
    const normalizedType = String(testtype || '').trim().toLowerCase();

    if (!normalizedName || !normalizedClass) {
      return res.status(400).json({ message: 'Exam name and class are required' });
    }

    if (!['monthly', 'term'].includes(normalizedType)) {
      return res.status(400).json({ message: "testtype must be either 'monthly' or 'term'" });
    }

    const parsedMaxTheory = Number(maxTheory);
    const parsedMaxPractical = Number(maxPractical);
    const parsedWeightage = Number(weightage || 0);

    if (
      Number.isNaN(parsedMaxTheory) ||
      Number.isNaN(parsedMaxPractical) ||
      parsedMaxTheory < 0 ||
      parsedMaxPractical < 0
    ) {
      return res.status(400).json({ message: 'max_theory and max_practical must be non-negative numbers' });
    }

    if (Number.isNaN(parsedWeightage) || parsedWeightage < 0 || parsedWeightage > 100) {
      return res.status(400).json({ message: 'weightage must be between 0 and 100' });
    }

    const examResult = await db.query(
      `INSERT INTO exams (exam_name, class, testtype, is_published, is_predefined, max_theory, max_practical, weightage)
       VALUES ($1, $2, $3, FALSE, FALSE, $4, $5, $6)
       ON CONFLICT (class, exam_name)
       DO UPDATE SET
         testtype = EXCLUDED.testtype,
         max_theory = EXCLUDED.max_theory,
         max_practical = EXCLUDED.max_practical,
         weightage = EXCLUDED.weightage
       RETURNING *`,
      [normalizedName, normalizedClass, normalizedType, parsedMaxTheory, parsedMaxPractical, parsedWeightage]
    );

    const exam = examResult.rows[0];

    if (Array.isArray(subjects) && subjects.length) {
      const normalizedSubjects = [...new Set(
        subjects
          .map((subject) => String(subject || '').trim())
          .filter(Boolean)
      )];

      for (const subject of normalizedSubjects) {
        await db.query(
          `INSERT INTO tests (examid, subject)
           VALUES ($1, $2)
           ON CONFLICT (examid, subject)
           DO NOTHING`,
          [exam.examid, subject]
        );
      }
    }

    return res.status(201).json({ message: 'Exam saved', exam });
  } catch (error) {
    return next(error);
  }
}

export async function publishExam(req, res, next) {
  try {
    const { id } = req.body;
    const examId = Number(id);
    if (!examId) {
      return res.status(400).json({ message: 'Invalid exam id' });
    }

    const result = await db.query(
      'UPDATE exams SET is_published = $1 WHERE examid = $2 RETURNING examid, exam_name, class, is_published',
      [true, examId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json({
      message: 'Exam published',
      exam: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function unpublishExam(req, res, next) {
  try {
    const { id } = req.body;
    const examId = Number(id);
    if (!examId) {
      return res.status(400).json({ message: 'Invalid exam id' });
    }

    const result = await db.query(
      'UPDATE exams SET is_published = $1 WHERE examid = $2 RETURNING examid, exam_name, class, is_published',
      [false, examId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json({
      message: 'Exam unpublished',
      exam: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}
