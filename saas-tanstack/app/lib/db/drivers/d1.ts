import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../schema.sqlite';

export type Database = ReturnType<typeof createDb>;

/**
 * Cloudflare D1 驱动。
 *
 * D1 是 Worker binding 而不是连接串。`cloudflare:workers` 的 env 可以在任意
 * 位置导入，但 Workers 不允许在模块顶层做 I/O —— 所以真正建库必须发生在
 * 请求上下文里，`../index.ts` 的惰性 Proxy 已经保证了这一点。
 */
export function createDb() {
  const binding = (env as { DB?: D1Database }).DB;
  if (!binding) {
    throw new Error(
      'D1 binding "DB" 未配置。\n' +
        '  1. wrangler d1 create <name>\n' +
        '  2. 把 database_id 填进 wrangler.toml 的 [[d1_databases]]（binding = "DB"）\n' +
        '注意：D1 只能在 Workers 运行时里用，本地开发请跑 `npm run dev:cf`（wrangler dev），\n' +
        '普通的 `npm run dev` 拿不到 binding。想用 Postgres 就切回去：`npm run db:use neon`。'
    );
  }
  return drizzle(binding, { schema });
}
