import session from 'express-session';
import { env } from './env.js';

export const sessionMiddleware = session({
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 100,
    secure: env.nodeEnv === 'production',
    httpOnly: true,
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax'
  },
  name: 'sms.sid'
});
