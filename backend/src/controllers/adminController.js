import bcrypt from 'bcrypt';
import { db } from '../config/db.js';

const saltRounds = 10;
const safeUserFields = 'id, username, role, rollnumber, class, created_at';

function parseClassNumber(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  const match = raw.match(/(\d+)/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatPromotedClass(previousClass, nextNumber) {
  const raw = String(previousClass || '').trim();
  if (!raw) {
    return String(nextNumber);
  }

  if (/^class\s*\d+/i.test(raw)) {
    return `Class ${nextNumber}`;
  }

  if (/^\d+$/.test(raw)) {
    return String(nextNumber);
  }

  return raw.replace(/\d+/, String(nextNumber));
}

function rollSortValue(rollnumber) {
  const digits = String(rollnumber || '').trim().match(/\d+/);
  if (!digits) {
    return Number.MAX_SAFE_INTEGER;
  }
  const parsed = Number(digits[0]);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

export async function getDashboard(req, res, next) {
  try {
    const teachers = await db.query(`SELECT ${safeUserFields} FROM users WHERE role='teacher'`);
    const students = await db.query(`SELECT ${safeUserFields} FROM users WHERE role='student'`);
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
    const result = await db.query(`SELECT ${safeUserFields} FROM users WHERE role='teacher' ORDER BY id DESC`);
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
    const result = await db.query(`SELECT ${safeUserFields} FROM users WHERE role='student' ORDER BY class, rollnumber`);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function getUsers(req, res, next) {
  try {
    const result = await db.query(
      `SELECT ${safeUserFields}
       FROM users
       ORDER BY CASE role
         WHEN 'admin' THEN 1
         WHEN 'teacher' THEN 2
         WHEN 'student' THEN 3
         ELSE 9
       END,
       class,
       rollnumber,
       id`
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function updateUserCredentials(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const nextUsername = String(req.body.username || '').trim();
    const nextPassword = String(req.body.password || '');

    if (!nextUsername) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const existing = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (nextPassword) {
      const hashedPassword = await bcrypt.hash(nextPassword, saltRounds);
      const result = await db.query(
        `UPDATE users
         SET username = $1,
             password = $2
         WHERE id = $3
         RETURNING ${safeUserFields}`,
        [nextUsername, hashedPassword, userId]
      );

      return res.json({ message: 'User updated', user: result.rows[0] });
    }

    const result = await db.query(
      `UPDATE users
       SET username = $1
       WHERE id = $2
       RETURNING ${safeUserFields}`,
      [nextUsername, userId]
    );

    return res.json({ message: 'User updated', user: result.rows[0] });
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ message: 'Username already exists' });
    }
    return next(error);
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

export async function runPromotionWorkflow(req, res, next) {
  const rawGraduatingClass = req.body?.graduatingClass;
  const graduationClassNumber = parseClassNumber(rawGraduatingClass ?? '12');

  if (!graduationClassNumber || graduationClassNumber <= 0) {
    return res.status(400).json({ message: 'Valid graduating class is required' });
  }

  const now = new Date();
  const defaultArchiveLabel = `${now.getFullYear()}-${now.getFullYear() + 1}`;
  const archiveLabel = String(req.body?.archiveLabel || defaultArchiveLabel).trim();

  if (!archiveLabel) {
    return res.status(400).json({ message: 'Archive label is required' });
  }

  const batchId = `batch_${Date.now()}`;
  const promotedBy = req.user?.id || null;
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const studentsResult = await client.query(
      `SELECT id, username, class, rollnumber
       FROM users
       WHERE role='student'
       ORDER BY id`
    );

    if (!studentsResult.rows.length) {
      await client.query('COMMIT');
      return res.json({
        message: 'No student records found to promote',
        batchId,
        summary: {
          total: 0,
          promoted: 0,
          graduated: 0,
          skippedInvalidClass: 0,
          skippedAboveGraduation: 0
        }
      });
    }

    const records = studentsResult.rows.map((student) => {
      const currentClassNumber = parseClassNumber(student.class);
      const oldClass = student.class ? String(student.class).trim() : null;
      const oldRollnumber = student.rollnumber ? String(student.rollnumber).trim() : null;

      if (!currentClassNumber) {
        return {
          student,
          oldClass,
          oldRollnumber,
          action: 'skipped_invalid_class',
          newClass: oldClass,
          newRollnumber: oldRollnumber
        };
      }

      if (currentClassNumber === graduationClassNumber) {
        return {
          student,
          oldClass,
          oldRollnumber,
          action: 'graduated',
          newClass: oldClass,
          newRollnumber: oldRollnumber
        };
      }

      if (currentClassNumber > graduationClassNumber) {
        return {
          student,
          oldClass,
          oldRollnumber,
          action: 'skipped_above_graduation',
          newClass: oldClass,
          newRollnumber: oldRollnumber
        };
      }

      const nextClassNumber = currentClassNumber + 1;

      return {
        student,
        oldClass,
        oldRollnumber,
        action: 'promoted',
        newClass: formatPromotedClass(oldClass, nextClassNumber),
        newRollnumber: null
      };
    });

    const promotionsByClass = new Map();
    records
      .filter((record) => record.action === 'promoted')
      .forEach((record) => {
        const key = record.newClass || '';
        if (!promotionsByClass.has(key)) {
          promotionsByClass.set(key, []);
        }
        promotionsByClass.get(key).push(record);
      });

    promotionsByClass.forEach((classRecords) => {
      classRecords.sort((a, b) => {
        const rollDelta = rollSortValue(a.oldRollnumber) - rollSortValue(b.oldRollnumber);
        if (rollDelta !== 0) {
          return rollDelta;
        }

        const nameDelta = String(a.student.username || '').localeCompare(String(b.student.username || ''));
        if (nameDelta !== 0) {
          return nameDelta;
        }

        return Number(a.student.id) - Number(b.student.id);
      });

      classRecords.forEach((record, index) => {
        record.newRollnumber = String(index + 1);
      });
    });

    for (const record of records) {
      await client.query(
        `INSERT INTO promotion_archive
           (batch_id, archive_label, studentid, username, old_class, old_rollnumber, new_class, new_rollnumber, action, promoted_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          batchId,
          archiveLabel,
          record.student.id,
          record.student.username,
          record.oldClass,
          record.oldRollnumber,
          record.newClass,
          record.newRollnumber,
          record.action,
          promotedBy
        ]
      );
    }

    for (const record of records) {
      if (record.action !== 'promoted') {
        continue;
      }

      await client.query(
        `UPDATE users
         SET class = $1,
             rollnumber = $2
         WHERE id = $3`,
        [record.newClass, record.newRollnumber, record.student.id]
      );
    }

    await client.query('COMMIT');

    const promoted = records.filter((record) => record.action === 'promoted').length;
    const graduated = records.filter((record) => record.action === 'graduated').length;
    const skippedInvalidClass = records.filter((record) => record.action === 'skipped_invalid_class').length;
    const skippedAboveGraduation = records.filter((record) => record.action === 'skipped_above_graduation').length;

    return res.json({
      message: `Promotion workflow completed. ${promoted} students promoted.`,
      batchId,
      archiveLabel,
      summary: {
        total: records.length,
        promoted,
        graduated,
        skippedInvalidClass,
        skippedAboveGraduation
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
}
