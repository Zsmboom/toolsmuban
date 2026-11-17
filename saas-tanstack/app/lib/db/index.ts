/**
 * 数据库入口。
 *
 * ⚠️ 下面这行 import 由 `npm run db:use <neon|d1>` 维护，不要手改。
 */
import { createDb, type Database } from './drivers/neon';

let instance: Database | null = null;

function getDb(): Database {
  if (!instance) instance = createDb();
  return instance;
}

/**
 * 延迟建立连接。
 *
 * 两个驱动都需要这层惰性：
 *  - Neon：Workers 的 process.env 是首次访问 process 时才填充的；
 *  - D1：Workers 不允许在模块顶层做 I/O，binding 必须在请求上下文里用。
 * 另外，任何 import 到这条链路的模块（包括单元测试）都不会因为加载而炸。
 */
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
  has(_target, prop) {
    return Reflect.has(getDb() as object, prop);
  },
});

export type { Database };
