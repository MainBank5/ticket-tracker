import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().optional(),
  TEST_DATABASE_URL: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;

// Tests must never touch the dev database (they truncate tables).
const databaseUrl = env.NODE_ENV === 'test' ? env.TEST_DATABASE_URL : env.DATABASE_URL;
if (!databaseUrl) {
  const name = env.NODE_ENV === 'test' ? 'TEST_DATABASE_URL' : 'DATABASE_URL';
  console.error(`Missing required environment variable: ${name}`);
  process.exit(1);
}

export const config = {
  env: env.NODE_ENV,
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,
  corsOrigin: env.CORS_ORIGIN,
  databaseUrl,
};
