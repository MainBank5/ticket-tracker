import { PrismaPg } from '@prisma/adapter-pg';
import { config } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

// Prisma 7 talks to Postgres through the `pg` driver adapter. One client (and
// therefore one connection pool) is shared by the whole process.
const adapter = new PrismaPg({ connectionString: config.databaseUrl });

export const prisma = new PrismaClient({ adapter });
