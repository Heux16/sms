async function initializeTables(db) {
  try {
    // Users table - unified table for all user types
   // Users table
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

// Exams table (main exam event)
await db.query(`
  CREATE TABLE IF NOT EXISTS exams (
    examid SERIAL PRIMARY KEY,
    exam_name VARCHAR(100) NOT NULL,
    class VARCHAR(20),
    testtype VARCHAR(20),
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

// Tests table (individual subjects under an exam)
await db.query(`
  CREATE TABLE IF NOT EXISTS tests (
    testid SERIAL PRIMARY KEY,
    examid INT NOT NULL REFERENCES exams(examid),
    subject VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

// Student scores table
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


    console.log("Database tables initialized");
  } catch (err) {
    console.error("Error initializing tables:", err);
  }
}


export default { initializeTables };