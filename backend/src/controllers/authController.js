import bcrypt from 'bcrypt';
import passport from '../config/passport.js';
import { db } from '../config/db.js';

const saltRounds = 10;

export function login(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info?.message || 'Invalid credentials' });
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }
      return res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          class: user.class,
          rollnumber: user.rollnumber
        }
      });
    });
  })(req, res, next);
}

export function logout(req, res, next) {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {
      res.clearCookie('sms.sid');
      res.json({ message: 'Logged out' });
    });
  });
}

export function me(req, res) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      class: req.user.class,
      rollnumber: req.user.rollnumber
    }
  });
}

export async function changePassword(req, res, next) {
  try {
    if (!req.isAuthenticated() || !req.user?.id) {
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
