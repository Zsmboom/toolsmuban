import type { Config } from 'drizzle-kit';

/**
 * D1 的迁移由 wrangler 应用：
 *   npm run db:generate         生成 SQL 到 drizzle/sqlite
 *   wrangler d1 migrations apply <db-name> --remote
 */
export default {
  schema: './app/lib/db/schema.sqlite.ts',
  out: './drizzle/sqlite',
  dialect: 'sqlite',
  driver: 'd1-http',
} satisfies Config;
