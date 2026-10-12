import cors from 'cors';
import express, { type Express } from 'express';
import { errorHandler, notFoundHandler } from './common/middleware/errorHandler.js';
import { config } from './config/env.js';
import { prisma } from './db/prisma.js';
import { ticketsRouter } from './modules/tickets/index.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  });

  app.use('/tickets', ticketsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
