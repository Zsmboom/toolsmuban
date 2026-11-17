#!/usr/bin/env node
/**
 * 切换数据库服务商：`npm run db:use neon` 或 `npm run db:use d1`
 *
 * 只改三处「切换点」，业务代码一行都不动：
 *   app/lib/db/index.ts    驱动 import
 *   app/lib/db/schema.ts   方言 schema re-export
 *   app/lib/db/provider.ts 方言标记（dialect.ts 用）
 *
 * 切换后记得重新生成/应用迁移：npm run db:generate && npm run db:push
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const PROVIDERS = {
  neon: {
    driver: './drivers/neon',
    schema: './schema.pg',
    drizzleConfig: './drizzle.config.pg',
    label: 'Neon (PostgreSQL)',
  },
  d1: {
    driver: './drivers/d1',
    schema: './schema.sqlite',
    drizzleConfig: './drizzle.config.sqlite',
    label: 'Cloudflare D1 (SQLite)',
  },
};

const target = process.argv[2];
if (!target || !(target in PROVIDERS)) {
  console.error(`用法: npm run db:use <${Object.keys(PROVIDERS).join('|')}>`);
  process.exit(1);
}
const { driver, schema, drizzleConfig, label } = PROVIDERS[target];

function patch(relPath, pattern, replacement) {
  const file = join(root, relPath);
  const before = readFileSync(file, 'utf8');
  const after = before.replace(pattern, replacement);
  if (after === before && !pattern.test(before)) {
    console.error(`✗ ${relPath} 里没找到切换点，可能被手工改过`);
    process.exit(1);
  }
  writeFileSync(file, after);
  console.log(`  ✓ ${relPath}`);
}

patch(
  'app/lib/db/index.ts',
  /from '\.\/drivers\/(neon|d1)'/,
  `from '${driver}'`
);
patch(
  'app/lib/db/schema.ts',
  /export \* from '\.\/schema\.(pg|sqlite)';/,
  `export * from '${schema}';`
);
patch(
  'app/lib/db/provider.ts',
  /export const DB_PROVIDER: 'neon' \| 'd1' = '(neon|d1)';/,
  `export const DB_PROVIDER: 'neon' | 'd1' = '${target}';`
);
patch(
  'drizzle.config.ts',
  /export \{ default \} from '\.\/drizzle\.config\.(pg|sqlite)';/,
  `export { default } from '${drizzleConfig}';`
);

console.log(`\n已切换到 ${label}\n`);
console.log('接下来：');
if (target === 'd1') {
  console.log('  1. wrangler d1 create <db-name>');
  console.log('  2. 把返回的 database_id 填进 wrangler.toml 的 [[d1_databases]]');
  console.log('  3. npm run db:generate && npm run db:push');
} else {
  console.log('  1. 在 .env.local / wrangler secret 里配好 DATABASE_URL');
  console.log('  2. npm run db:generate && npm run db:push');
}
