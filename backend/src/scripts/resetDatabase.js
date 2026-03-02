import bcrypt from 'bcrypt';
import { connectDB, db } from '../config/db.js';
import { initializeTables } from '../services/tableService.js';

const saltRounds = 10;

async function resetDatabase() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  try {
    await connectDB();

    await db.query('BEGIN');

    await db.query('DROP TABLE IF EXISTS promotion_archive CASCADE');
    await db.query('DROP TABLE IF EXISTS student_scores CASCADE');
    await db.query('DROP TABLE IF EXISTS tests CASCADE');
    await db.query('DROP TABLE IF EXISTS exams CASCADE');
    await db.query('DROP TABLE IF EXISTS users CASCADE');

    await initializeTables(db);

    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    await db.query(
      `INSERT INTO users (username, password, role)
       VALUES ($1, $2, $3)`,
      [adminUsername, hashedPassword, 'admin']
    );

    await db.query('COMMIT');

    console.log('✅ Database reset complete');
    console.log(`✅ Seeded admin user: ${adminUsername}`);
  } catch (error) {
    try {
      await db.query('ROLLBACK');
    } catch {
      // ignore rollback failure
    }
    console.error('❌ Database reset failed:', error);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

resetDatabase();
