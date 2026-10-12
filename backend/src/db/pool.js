import pg from 'pg';
import { config } from '../config/env.js';

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

pool.on('error', (err) => {
  // Errors on idle clients (e.g. DB restart) must not crash the process.
  console.error('Unexpected PostgreSQL pool error:', err.message);
});
