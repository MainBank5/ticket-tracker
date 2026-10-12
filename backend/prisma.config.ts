import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Mirrors src/config/env.ts: under NODE_ENV=test the Prisma CLI only ever sees
// TEST_DATABASE_URL, so `prisma migrate` can't be pointed at the dev database by a test run.
const url = process.env.NODE_ENV === 'test' ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url },
});
