import { sql, type SQL, type AnyColumn } from 'drizzle-orm';
import { DB_PROVIDER } from './provider';

/**
 * 方言差异集中在这里。
 *
 * 业务代码不要直接写 Postgres 或 SQLite 专有函数 —— 那样切换数据库时
 * 会散落一地。目前只有两处差异。
 */

/** 把时间列格式化成 'YYYY-MM-DD'，用于按天聚合 */
export function toDateString(column: AnyColumn): SQL<string> {
  return DB_PROVIDER === 'd1'
    ? sql<string>`strftime('%Y-%m-%d', ${column}, 'unixepoch')`
    : sql<string>`to_char(${column}, 'YYYY-MM-DD')`;
}

/** 取两者较大值（退款时把用量减到 0 为止，不要变负数） */
export function greatest(a: SQL | AnyColumn, b: number): SQL<number> {
  return DB_PROVIDER === 'd1'
    ? sql<number>`MAX(${a}, ${b})`
    : sql<number>`GREATEST(${a}, ${b})`;
}
