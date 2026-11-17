import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../schema.pg';

export type Database = ReturnType<typeof createDb>;

/**
 * Neon (PostgreSQL) 驱动。
 * 连接串从 process.env.DATABASE_URL 读，Workers 上通过 secret 注入。
 */
export function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. 本地开发写进 .env.local；线上用 `wrangler secret put DATABASE_URL`。'
    );
  }
  return drizzle(neon(connectionString), { schema });
}
