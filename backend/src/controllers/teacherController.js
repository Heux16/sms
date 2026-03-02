import bcrypt from 'bcrypt';
import { db } from '../config/db.js';
import { buildStudentReportCard } from '../services/reportCardService.js';

const saltRounds = 10;

export async function getTeacherDashboard(req, res, next) {
  try {
    const exams = await db.query(
      `SELECT *
       FROM exams
       ORDER BY class, created_at, exam_name`
    );
    res.json(exams.rows);
  } catch (error) {
    next(error);
  }
}

export async function getStudentsForTeacher(req, res, next) {
  try {
    const result = await db.query(
      "SELECT * FROM users WHERE role='student' ORDER BY class, rollnumber, username"
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function getSingleStudentProfile(req, res, next) {
  try {
    const studentId = Number(req.params.studentId);
    if (!studentId) {
      return res.status(400).json({ message: 'Invalid student id' });
    }

    const report = await buildStudentReportCard(db, studentId, { includeUnpublished: true });
    if (!report) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    return res.json(report);
  } catch (error) {
    return next(error);
  }
}

export async function addStudent(req, res, next) {
  try {
    const { username, rollNumber, clas } = req.body;
    const normalizedClass = String(clas || '').trim();
    if (!normalizedClass) {
      return res.status(400).json({ message: 'Class is required' });
    }

    const classNum = normalizedClass.slice(-1);
    const namePart = (username || '').slice(0, 3);
    const generatedPassword = `${namePart}${rollNumber || ''}${classNum}`;
    const hashedPassword = await bcrypt.hash(generatedPassword, saltRounds);

    const result = await db.query(
      'INSERT INTO users (username, password, role, rollnumber, class) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, rollnumber, class, created_at',
      [username, hashedPassword, 'student', rollNumber, normalizedClass]
    );

    res.status(201).json({ student: result.rows[0], generatedPassword });
  } catch (error) {
    next(error);
  }
}

export async function getTestsByExam(req, res, next) {
  try {
    const examId = req.params.examId;
    const tests = await db.query('SELECT * FROM tests WHERE examid = $1 ORDER BY subject ASC, testid ASC', [examId]);
    const exam = await db.query('SELECT * FROM exams WHERE examid = $1', [examId]);

    res.json({ exam: exam.rows[0] || null, tests: tests.rows });
  } catch (error) {
    next(error);
  }
}

export async function addTest(req, res, next) {
  try {
    const { examid, subject } = req.body;
    const parsedExamId = Number(examid);
    const normalizedSubject = String(subject || '').trim();

    if (!parsedExamId || parsedExamId <= 0) {
      return res.status(400).json({ message: 'Valid examid is required' });
    }

    if (!normalizedSubject) {
      return res.status(400).json({ message: 'Subject is required' });
    }

    const examResult = await db.query('SELECT examid FROM exams WHERE examid = $1', [parsedExamId]);
    if (!examResult.rows.length) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const result = await db.query(
      `INSERT INTO tests (examid, subject)
       VALUES ($1, $2)
       ON CONFLICT (examid, subject)
       DO UPDATE SET subject = EXCLUDED.subject
       RETURNING *`,
      [parsedExamId, normalizedSubject]
    );

    return res.status(201).json({ message: 'Test saved', test: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function getMarksSetup(req, res, next) {
  try {
    const examId = req.params.examId;

    const examResult = await db.query('SELECT * FROM exams WHERE examid = $1', [examId]);
    if (!examResult.rows.length) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const exam = examResult.rows[0];
    const tests = await db.query('SELECT * FROM tests WHERE examid = $1', [examId]);
    const students = await db.query(
      `SELECT *
       FROM users
       WHERE role = 'student'
         AND LOWER(REGEXP_REPLACE(TRIM(class), '^class\\s*', '', 'i')) =
             LOWER(REGEXP_REPLACE(TRIM($1), '^class\\s*', '', 'i'))`,
      [exam.class]
    );
    const marks = await db.query(
      `SELECT ss.studentid, ss.testid, ss.score_theory, ss.score_practical, ss.total_score
       FROM student_scores ss
       INNER JOIN tests t ON ss.testid = t.testid
       WHERE t.examid = $1`,
      [examId]
    );

    const scoresMap = {};
    for (const mark of marks.rows) {
      if (!scoresMap[mark.studentid]) {
        scoresMap[mark.studentid] = {};
      }
      scoresMap[mark.studentid][mark.testid] = {
        score_theory: mark.score_theory,
        score_practical: mark.score_practical,
        total_score: mark.total_score
      };
    }

    const studentsWithScores = students.rows.map((student) => ({
      ...student,
      scoresMap: scoresMap[student.id] || {}
    }));

    return res.json({ exam, tests: tests.rows, students: studentsWithScores });
  } catch (error) {
    return next(error);
  }
}

export async function saveMarks(req, res, next) {
  try {
    const { testId, scores } = req.body;

    const parsedTestId = Number(testId);
    if (!parsedTestId || parsedTestId <= 0) {
      return res.status(400).json({ message: 'Invalid test selected' });
    }

    const testMeta = await db.query(
      `SELECT t.testid, t.subject, e.examid, e.exam_name, e.class, e.max_theory, e.max_practical
       FROM tests t
       INNER JOIN exams e ON e.examid = t.examid
       WHERE t.testid = $1`,
      [parsedTestId]
    );

    if (!testMeta.rows.length) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const meta = testMeta.rows[0];
    const maxTheory = Number(meta.max_theory || 0);
    const maxPractical = Number(meta.max_practical || 0);

    for (const studentId in scores) {
      if (!Object.prototype.hasOwnProperty.call(scores, studentId)) {
        continue;
      }

      const scoreObj = scores[studentId] || {};
      const theory = Number(scoreObj.score_theory || 0);
      const practical = Number(scoreObj.score_practical || 0);

      if (theory < 0 || practical < 0 || theory > maxTheory || practical > maxPractical) {
        return res.status(400).json({
          message: `Invalid marks for student ${studentId}. Max allowed is Theory ${maxTheory}, Practical ${maxPractical}`
        });
      }

      const total = theory + practical;
      const actualStudentId = scoreObj.id || studentId;

      await db.query(
        `INSERT INTO student_scores (studentid, testid, score_theory, score_practical, total_score, graded_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (studentid, testid)
         DO UPDATE SET
           score_theory = EXCLUDED.score_theory,
           score_practical = EXCLUDED.score_practical,
           total_score = EXCLUDED.total_score,
           graded_by = EXCLUDED.graded_by,
           created_at = NOW()`,
        [actualStudentId, parsedTestId, theory || null, practical || null, total, req.user.id]
      );
    }

    res.json({ message: 'Marks saved', maxTheory, maxPractical, examName: meta.exam_name, subject: meta.subject });
  } catch (error) {
    next(error);
  }
}
