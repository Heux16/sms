import app from './app.js';
import { env } from './config/env.js';
import { connectDB, db } from './config/db.js';
import { initializeTables } from './services/tableService.js';

let server;

async function start() {
  try {
    await connectDB();
   // await initializeTables(db);
    console.log('✅ Backend tables initialized');

    server = app.listen(env.port, '0.0.0.0', () => {
      console.log(`🚀 Backend API running at http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('❌ Backend startup failed:', error);
    process.exit(1);
  }
}

function gracefulShutdown(signal) {
  console.log(`👋 ${signal} received, shutting down backend`);
  if (server) {
    server.close(async () => {
      await db.end();
      process.exit(0);
    });
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

start();
