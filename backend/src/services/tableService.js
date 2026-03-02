export async function initializeTables(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'student',
      rollnumber VARCHAR(20),
      class VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS exams (
      examid SERIAL PRIMARY KEY,
      exam_name VARCHAR(100) NOT NULL,
      class VARCHAR(20),
      testtype VARCHAR(20),
      is_published BOOLEAN DEFAULT false,
      is_predefined BOOLEAN DEFAULT true,
      max_theory INTEGER DEFAULT 0,
      max_practical INTEGER DEFAULT 0,
      weightage NUMERIC(5,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await db.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_predefined BOOLEAN DEFAULT true;`);
  await db.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS max_theory INTEGER DEFAULT 0;`);
  await db.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS max_practical INTEGER DEFAULT 0;`);
  await db.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS weightage NUMERIC(5,2) DEFAULT 0;`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS tests (
      testid SERIAL PRIMARY KEY,
      examid INT NOT NULL REFERENCES exams(examid),
      subject VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS student_scores (
      id SERIAL PRIMARY KEY,
      studentid INT NOT NULL REFERENCES users(id),
      testid INT NOT NULL REFERENCES tests(testid),
      score_theory INTEGER,
      score_practical INTEGER,
      total_score INTEGER,
      graded_by INT REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_student_scores_student_test
    ON student_scores (studentid, testid);
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_users_username
    ON users (username);
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_exams_class_name
    ON exams (class, exam_name);
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_tests_exam_subject
    ON tests (examid, subject);
  `);

}
