import type { Config } from 'drizzle-kit';

export default {
  schema: './app/lib/db/schema.pg.ts',
  out: './drizzle/pg',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
