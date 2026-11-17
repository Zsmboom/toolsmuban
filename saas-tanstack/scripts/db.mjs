#!/usr/bin/env node
/**
 * 数据库命令统一入口：`npm run db:<cmd>`。
 *
 * 为什么需要这一层而不是直接调 drizzle-kit：
 *
 *  1. **连接串必须分开**。应用运行时走池化连接（主机名含 `-pooler`），
 *     迁移/生成/备份走直连。走错了不会立刻报错，而是偶发失败——这类问题
 *     只在生产出事时才暴露。这里把直连写死并校验。
 *  2. drizzle-kit 不读 `.env.local`，本模板的约定是把本地机密放在那里。
 *  3. 提供两个 drizzle-kit 没有、但运维必须有的命令：
 *       check     库是否落后于迁移文件（CI 用，防止 0003 那种「迁移没应用」）
 *       baseline  给「用 db:push 建出来的老库」补迁移记录，之后才能用 migrate
 */
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { neon } from '@neondatabase/serverless';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS_DIR = join(root, 'drizzle', 'pg');
const JOURNAL = join(MIGRATIONS_DIR, 'meta', '_journal.json');

/** 按 .env.local → .env 顺序补齐环境变量；进程里已有的值优先，不覆盖 */
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const path = join(root, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      const [, key, raw] = m;
      if (process.env[key] !== undefined) continue;
      process.env[key] = raw.replace(/^['"]|['"]$/g, '');
    }
  }
}

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

/** 迁移一律用直连；池化连接上做 DDL 会出问题 */
function requireDirectUrl() {
  const url = process.env.DATABASE_URL_UNPOOLED;
  if (!url) {
    fail(
      '缺少 DATABASE_URL_UNPOOLED。\n' +
        '  本地：写进 saas-tanstack/.env.local（`neon env pull` 会同时写 DATABASE_URL 与 DATABASE_URL_UNPOOLED）\n' +
        '  CI：配成 GitHub Secret；不要注入 Worker 运行时'
    );
  }
  if (url.includes('-pooler.')) {
    fail(
      'DATABASE_URL_UNPOOLED 指向了池化端点（主机名含 -pooler）。\n' +
        '  迁移必须走直连：把主机名里的 `-pooler` 去掉。'
    );
  }
  return url;
}

/** 读出迁移文件清单，hash 与 drizzle 迁移器保持一致（sha256 of 文件原文） */
function readMigrations() {
  if (!existsSync(JOURNAL)) fail(`找不到 ${JOURNAL}`);
  const journal = JSON.parse(readFileSync(JOURNAL, 'utf8'));
  return journal.entries.map((entry) => {
    const file = join(MIGRATIONS_DIR, `${entry.tag}.sql`);
    if (!existsSync(file)) fail(`迁移文件缺失：${file}`);
    const sql = readFileSync(file, 'utf8');
    return {
      tag: entry.tag,
      createdAt: entry.when,
      hash: createHash('sha256').update(sql).digest('hex'),
    };
  });
}

async function appliedHashes(sql) {
  try {
    const rows = await sql`select hash from drizzle.__drizzle_migrations`;
    return new Set(rows.map((r) => r.hash));
  } catch (error) {
    // 迁移表不存在（全新库）时视为全部未应用
    if (String(error?.message ?? error).includes('does not exist')) return new Set();
    throw error;
  }
}

async function cmdCheck() {
  const url = requireDirectUrl();
  const sql = neon(url);
  const migrations = readMigrations();
  const applied = await appliedHashes(sql);
  const pending = migrations.filter((m) => !applied.has(m.hash));

  if (pending.length === 0) {
    console.log(`✓ 库与迁移文件一致（已应用 ${applied.size}/${migrations.length}）`);
    return;
  }
  console.error(`✗ 有 ${pending.length} 个迁移未应用：`);
  for (const m of pending) console.error(`    ${m.tag}`);
  console.error('\n  应用它们：npm run db:migrate');
  process.exit(1);
}

async function cmdBaseline() {
  const url = requireDirectUrl();
  const sql = neon(url);
  const migrations = readMigrations();

  await sql`create schema if not exists drizzle`;
  await sql`create table if not exists drizzle.__drizzle_migrations (
    id serial primary key,
    hash text not null,
    created_at bigint
  )`;

  const applied = await appliedHashes(sql);
  const missing = migrations.filter((m) => !applied.has(m.hash));
  if (missing.length === 0) {
    console.log('✓ 迁移记录已是最新，无需 baseline');
    return;
  }

  for (const m of missing) {
    await sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${m.hash}, ${m.createdAt})`;
    console.log(`  + 登记 ${m.tag}`);
  }
  console.log(`\n✓ 已登记 ${missing.length} 条迁移记录。请再跑一次 npm run db:check 确认。`);
}

const delegate = {
  generate: ['generate'],
  migrate: ['migrate'],
  push: ['push'],
  studio: ['studio'],
};

async function main() {
  loadEnv();
  const cmd = process.argv[2];

  if (cmd === 'check') return cmdCheck();
  if (cmd === 'baseline') return cmdBaseline();

  const args = delegate[cmd];
  if (!args) {
    fail(`未知命令 "${cmd}"。可用：${[...Object.keys(delegate), 'check', 'baseline'].join(' / ')}`);
  }

  // generate 只读 schema、不连库，所以允许在没配连接串的环境里跑
  if (cmd !== 'generate') requireDirectUrl();
  const bin = join(root, 'node_modules', '.bin', 'drizzle-kit');
  const result = spawnSync(bin, args, { stdio: 'inherit', cwd: root, env: process.env });
  process.exit(result.status ?? 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
