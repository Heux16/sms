import { calculateExamGrade, calculateGrade } from '../constants/academics.js';

export async function buildStudentReportCard(db, studentId, options = {}) {
  const { includeUnpublished = false } = options;

  const studentResult = await db.query(
    `SELECT id, username, role, rollnumber, class
     FROM users
     WHERE id = $1 AND role = 'student'`,
    [studentId]
  );

  if (!studentResult.rows.length) {
    return null;
  }

  const student = studentResult.rows[0];

  const examPublishClause = includeUnpublished ? '' : ' AND is_published = TRUE';
  const scorePublishClause = includeUnpublished ? '' : ' AND e.is_published = TRUE';

  const exams = await db.query(
    `SELECT
       examid,
       exam_name,
       class,
       testtype,
       is_published,
       is_predefined,
       max_theory,
       max_practical,
       weightage
     FROM exams
    WHERE class = $1${examPublishClause}
     ORDER BY created_at, exam_name`,
    [student.class]
  );

  const scores = await db.query(
    `SELECT ss.*, t.subject, t.examid, e.exam_name
     FROM student_scores ss
     INNER JOIN tests t ON ss.testid = t.testid
     INNER JOIN exams e ON e.examid = t.examid
     WHERE ss.studentid = $1
       ${scorePublishClause}
       AND e.class = $2
     ORDER BY ss.created_at DESC`,
    [student.id, student.class]
  );

  const examByName = new Map(exams.rows.map((exam) => [exam.exam_name, exam]));
  const examNames = exams.rows.map((exam) => exam.exam_name);
  const weightedExams = exams.rows
    .filter((exam) => Number(exam.weightage || 0) > 0)
    .map((exam) => exam.exam_name);

  const classTests = await db.query(
    `SELECT DISTINCT t.subject
     FROM tests t
     INNER JOIN exams e ON e.examid = t.examid
     WHERE e.class = $1
     ORDER BY t.subject ASC`,
    [student.class]
  );

  const subjects = classTests.rows.map((row) => row.subject);

  const subjectProfiles = subjects.map((subject) => {
    const marksByExam = {};
    for (const examName of examNames) {
      marksByExam[examName] = null;
    }

    const subjectScores = scores.rows.filter((row) => row.subject === subject);
    for (const row of subjectScores) {
      marksByExam[row.exam_name] = {
        theory: row.score_theory,
        practical: row.score_practical,
        total: row.total_score,
        grade: calculateExamGrade(examByName.get(row.exam_name)?.testtype, row.total_score)
      };
    }

    const weightedScore = exams.rows.reduce((sum, exam) => {
      const examTotal = Number(marksByExam[exam.exam_name]?.total || 0);
      const examWeightage = Number(exam.weightage || 0);
      return sum + (examTotal * examWeightage) / 100;
    }, 0);

    return {
      subject,
      marksByExam,
      weightedScore: Number(weightedScore.toFixed(2)),
      grade: calculateGrade(weightedScore)
    };
  });

  const overallWeightedScore =
    subjectProfiles.reduce((sum, subject) => sum + subject.weightedScore, 0) /
    (subjectProfiles.length || 1);

  return {
    student,
    exams: exams.rows,
    scores: scores.rows,
    weightedExams,
    subjectProfiles,
    overall: {
      weightedScore: Number(overallWeightedScore.toFixed(2)),
      grade: calculateGrade(overallWeightedScore)
    }
  };
}
