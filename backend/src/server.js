import { createApp } from './app.js';
import { config } from './config/env.js';
import { pool } from './db/pool.js';

const server = createApp().listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (${config.env})`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref(); // don't hang forever
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
