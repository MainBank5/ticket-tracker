import cors from 'cors';
import express from 'express';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './common/middleware/errorHandler.js';
import { pool } from './db/pool.js';
import { ticketsRouter } from './modules/tickets/index.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', async (_req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  });

  app.use('/tickets', ticketsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
