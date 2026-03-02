import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { connectDB, db } from '../config/db.js';

const saltRounds = 10;

function generatePassword(username, rollNumber, className) {
  const namePart = String(username || '').slice(0, 3);
  const classNum = String(className || '').trim().slice(-1);
  return `${namePart}${rollNumber || ''}${classNum}`;
}

function csvEscape(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

async function exportStudentPasswords() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outputDir = process.env.EXPORT_DIR || path.resolve(__dirname, '../../exports');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = process.env.EXPORT_FILE || path.join(outputDir, `student-passwords-${timestamp}.csv`);
  const syncPasswords = String(process.env.SYNC_PASSWORDS || '').toLowerCase() === 'true';

  try {
    await connectDB();

    const students = await db.query(
      `SELECT id, username, class, rollnumber, password
       FROM users
       WHERE role = 'student'
       ORDER BY class, rollnumber, username`
    );

    if (!students.rows.length) {
      console.log('ℹ️ No students found. No CSV created.');
      return;
    }

    const rows = [];
    let syncedCount = 0;

    for (const student of students.rows) {
      const generatedPassword = generatePassword(student.username, student.rollnumber, student.class);
      const passwordMatchesGenerated = await bcrypt.compare(generatedPassword, String(student.password || ''));
      let synced = false;

      if (syncPasswords && !passwordMatchesGenerated) {
        const hashedPassword = await bcrypt.hash(generatedPassword, saltRounds);
        await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, student.id]);
        synced = true;
        syncedCount += 1;
      }

      rows.push([
        student.id,
        student.username,
        student.class || '',
        student.rollnumber || '',
        generatedPassword,
        passwordMatchesGenerated ? 'yes' : 'no',
        synced ? 'yes' : 'no'
      ]);
    }

    await fs.mkdir(path.dirname(outputFile), { recursive: true });

    const header = [
      'id',
      'username',
      'class',
      'rollnumber',
      'password',
      'matches_generated_password',
      'password_synced_to_generated'
    ];

    const csvLines = [header, ...rows].map((line) => line.map(csvEscape).join(','));
    await fs.writeFile(outputFile, `${csvLines.join('\n')}\n`, 'utf-8');

    console.log(`✅ Exported ${rows.length} student password rows to:`);
    console.log(outputFile);
    if (syncPasswords) {
      console.log(`✅ Passwords synced to generated value for ${syncedCount} students`);
    } else {
      console.log('ℹ️ Passwords were not modified.');
      console.log('ℹ️ To sync DB passwords to generated values, rerun with SYNC_PASSWORDS=true');
    }
  } catch (error) {
    console.error('❌ Student password export failed:', error);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

exportStudentPasswords();
