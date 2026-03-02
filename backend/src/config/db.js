import pg from 'pg';
import { env } from './env.js';

const dbConfig = env.databaseUrl
  ? {
      connectionString: env.databaseUrl,
      ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
    }
  : {
      user: env.dbUser,
      host: env.dbHost,
      database: env.dbName,
      password: env.dbPassword,
      port: env.dbPort
    };

export const db = new pg.Client(dbConfig);

export async function connectDB() {
  await db.connect();
  console.log('✅ Backend database connected');
}
