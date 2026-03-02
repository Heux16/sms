import { connectDB, db } from '../config/db.js';
import { initializeTables } from '../services/tableService.js';

async function initDatabase() {
  try {
    await connectDB();
    await initializeTables(db);
    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Database init failed:', error);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

initDatabase();
