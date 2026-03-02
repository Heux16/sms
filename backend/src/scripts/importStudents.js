import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { connectDB, db } from '../config/db.js';

const saltRounds = 10;

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function generatePassword(username, rollNumber, className) {
  const namePart = String(username || '').slice(0, 3);
  const classNum = String(className || '').trim().slice(-1);
  return `${namePart}${rollNumber || ''}${classNum}`;
}

async function importStudents() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const csvPath = process.env.STUDENTS_CSV || path.resolve(__dirname, '../../students.csv');

  try {
    await connectDB();

    const raw = await fs.readFile(csvPath, 'utf-8');
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new Error('CSV appears empty or missing data rows');
    }

    const header = parseCsvLine(lines[0]).map((value) => value.toLowerCase());
    const usernameIndex = header.indexOf('username');
    const rollIndex = header.indexOf('rollnumber');
    const classIndex = header.indexOf('class');

    if (usernameIndex < 0 || rollIndex < 0 || classIndex < 0) {
      throw new Error('CSV header must include username, rollnumber, class');
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
      const row = parseCsvLine(lines[rowIndex]);
      const username = String(row[usernameIndex] || '').trim();
      const rollNumber = String(row[rollIndex] || '').trim();
      const className = String(row[classIndex] || '').trim();

      if (!username || !className) {
        skippedCount += 1;
        continue;
      }

      const generatedPassword = generatePassword(username, rollNumber, className);
      const hashedPassword = await bcrypt.hash(generatedPassword, saltRounds);

      await db.query(
        `INSERT INTO users (username, password, role, rollnumber, class)
         VALUES ($1, $2, 'student', $3, $4)
         ON CONFLICT (username)
         DO UPDATE SET
           password = EXCLUDED.password,
           rollnumber = EXCLUDED.rollnumber,
           class = EXCLUDED.class`,
        [username, hashedPassword, rollNumber || null, className]
      );

      importedCount += 1;
    }

    console.log(`✅ Student import complete from ${csvPath}`);
    console.log(`✅ Imported/updated: ${importedCount}`);
    console.log(`ℹ️ Skipped rows: ${skippedCount}`);
  } catch (error) {
    console.error('❌ Student import failed:', error);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

importStudents();
