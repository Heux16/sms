import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import { env } from './config/env.js';
import { sessionMiddleware } from './config/session.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv === 'production') {
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
}

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', env: env.nodeEnv, time: new Date().toISOString() });
});

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
