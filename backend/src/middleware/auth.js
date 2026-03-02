import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { env } from '../config/env.js';

function parseBearerToken(headerValue) {
  const raw = String(headerValue || '').trim();
  if (!raw.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  return raw.slice(7).trim() || null;
}

export function requireAuth(req, res, next) {
  const token = parseBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  db.query(
    'SELECT id, username, role, class, rollnumber FROM users WHERE id = $1',
    [payload.sub]
  )
    .then((result) => {
      if (!result.rows.length) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      req.user = result.rows[0];
      return next();
    })
    .catch((error) => next(error));
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}
