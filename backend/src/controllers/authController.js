import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { env } from '../config/env.js';

const saltRounds = 10;

function toSafeUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    class: user.class,
    rollnumber: user.rollnumber
  };
}

function issueToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export async function login(req, res, next) {
  try {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const result = await db.query(
      'SELECT id, username, password, role, class, rollnumber FROM users WHERE username = $1',
      [username]
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = issueToken(user);

    return res.json({
      message: 'Login successful',
      token,
      user: toSafeUser(user)
    });
  } catch (error) {
    return next(error);
  }
}

export function logout(req, res) {
  return res.json({ message: 'Logged out' });
}

export function me(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return res.json({
    user: toSafeUser(req.user)
  });
}

export async function changePassword(req, res, next) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const oldPassword = String(req.body?.oldPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const userResult = await db.query('SELECT id, password, role FROM users WHERE id = $1', [req.user.id]);
    if (!userResult.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];
    if (!['teacher', 'student'].includes(String(user.role || ''))) {
      return res.status(403).json({ message: 'Password change is only enabled for teachers and students' });
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from old password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return next(error);
  }
}
