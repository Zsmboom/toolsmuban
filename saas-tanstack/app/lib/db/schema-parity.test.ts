import { describe, it, expect } from 'vitest';
import { getTableConfig as getPgTableConfig } from 'drizzle-orm/pg-core';
import { getTableConfig as getSqliteTableConfig } from 'drizzle-orm/sqlite-core';
import { is } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import * as pgSchema from './schema.pg';
import * as sqliteSchema from './schema.sqlite';

/**
 * 模板同时支持 Neon(Postgres) 和 D1(SQLite)，两份 schema 必须严格对齐。
 *
 * 这是维护两份定义的安全网 —— 改了一边忘了另一边，这里会直接失败，
 * 而不是等到切换服务商上线后才发现某张表少了一列。
 */

const isString = (v: string | undefined): v is string => typeof v === 'string';

interface TableShape {
  name: string;
  columns: Array<{ name: string; notNull: boolean; primaryKey: boolean; hasDefault: boolean }>;
  indexes: string[];
  uniques: string[];
  foreignKeys: number;
}

function pgShapes(): Map<string, TableShape> {
  const out = new Map<string, TableShape>();
  for (const value of Object.values(pgSchema)) {
    if (!is(value, PgTable)) continue;
    const cfg = getPgTableConfig(value);
    out.set(cfg.name, {
      name: cfg.name,
      columns: cfg.columns.map((c) => ({
        name: c.name,
        notNull: c.notNull,
        primaryKey: c.primary,
        hasDefault: c.hasDefault,
      })),
      indexes: cfg.indexes.map((i) => i.config.name).filter(isString),
      uniques: cfg.indexes
        .filter((i) => i.config.unique)
        .map((i) => i.config.name)
        .filter(isString),
      foreignKeys: cfg.foreignKeys.length,
    });
  }
  return out;
}

function sqliteShapes(): Map<string, TableShape> {
  const out = new Map<string, TableShape>();
  for (const value of Object.values(sqliteSchema)) {
    if (!is(value, SQLiteTable)) continue;
    const cfg = getSqliteTableConfig(value);
    out.set(cfg.name, {
      name: cfg.name,
      columns: cfg.columns.map((c) => ({
        name: c.name,
        notNull: c.notNull,
        primaryKey: c.primary,
        hasDefault: c.hasDefault,
      })),
      indexes: cfg.indexes.map((i) => i.config.name).filter(isString),
      uniques: cfg.indexes
        .filter((i) => i.config.unique)
        .map((i) => i.config.name)
        .filter(isString),
      foreignKeys: cfg.foreignKeys.length,
    });
  }
  return out;
}

const pg = pgShapes();
const sqlite = sqliteShapes();
const sortBy = <T>(arr: T[], key: (t: T) => string) =>
  [...arr].sort((a, b) => key(a).localeCompare(key(b)));

describe('schema parity: Postgres ↔ SQLite', () => {
  it('两份 schema 都不为空', () => {
    expect(pg.size).toBeGreaterThan(0);
    expect(sqlite.size).toBeGreaterThan(0);
  });

  it('表集合完全一致', () => {
    expect([...sqlite.keys()].sort()).toEqual([...pg.keys()].sort());
  });

  for (const [tableName, pgTable] of pg) {
    describe(`表 ${tableName}`, () => {
      const sqliteTable = sqlite.get(tableName);

      it('在 SQLite 侧存在', () => {
        expect(sqliteTable, `SQLite schema 缺少表 ${tableName}`).toBeDefined();
      });

      it('列名集合一致', () => {
        const a = pgTable.columns.map((c) => c.name).sort();
        const b = (sqliteTable?.columns ?? []).map((c) => c.name).sort();
        expect(b).toEqual(a);
      });

      it('每列的 notNull / 主键 / 默认值一致', () => {
        const a = sortBy(pgTable.columns, (c) => c.name);
        const b = sortBy(sqliteTable?.columns ?? [], (c) => c.name);
        expect(b).toEqual(a);
      });

      it('索引集合一致', () => {
        expect((sqliteTable?.indexes ?? []).sort()).toEqual(pgTable.indexes.sort());
      });

      it('唯一约束一致（幂等与并发保证依赖它们）', () => {
        expect((sqliteTable?.uniques ?? []).sort()).toEqual(pgTable.uniques.sort());
      });

      it('外键数量一致', () => {
        expect(sqliteTable?.foreignKeys).toBe(pgTable.foreignKeys);
      });
    });
  }
});
