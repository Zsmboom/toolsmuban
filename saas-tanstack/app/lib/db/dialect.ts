import { sql, type SQL, type AnyColumn } from 'drizzle-orm';

/**
 * SQL 方言辅助。
 *
 * 模板只支持 Neon（PostgreSQL），这里不再有方言分支。
 * 之所以保留成函数、而不是让业务代码直接写 `to_char(...)` / `GREATEST(...)`，
 * 是为了让数据库专有语法集中在一处：将来真要换库，只改这两个函数即可。
 */

/** 把时间列格式化成 'YYYY-MM-DD'，用于按天聚合 */
export function toDateString(column: AnyColumn): SQL<string> {
  return sql<string>`to_char(${column}, 'YYYY-MM-DD')`;
}

/** 取两者较大值（退款时把用量减到 0 为止，不要变负数） */
export function greatest(a: SQL | AnyColumn, b: number): SQL<number> {
  return sql<number>`GREATEST(${a}, ${b})`;
}
