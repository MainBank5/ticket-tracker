import { createApp } from './app.js';
import { config } from './config/env.js';
import { prisma } from './db/prisma.js';

const server = createApp().listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (${config.env})`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down...`);
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref(); // don't hang forever
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
