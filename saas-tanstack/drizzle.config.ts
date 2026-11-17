import type { Config } from 'drizzle-kit';

/**
 * 迁移与生成一律走**直连**（unpooled）连接串。
 *
 * 应用运行时用池化连接（主机名含 `-pooler`），两者不能混：
 * DDL / 事务在池化代理下会出各种奇怪问题。
 * 命令统一从 `npm run db:*`（→ scripts/db.mjs）进来，由它校验连接串类型。
 */
export default {
  schema: './app/lib/db/schema.pg.ts',
  out: './drizzle/pg',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? '',
  },
} satisfies Config;
