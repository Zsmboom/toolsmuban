/**
 * 数据库入口。
 *
 * 延迟建立连接：Workers 不允许在模块顶层做 I/O，而任何 import 到这条链路的
 * 模块（包括单元测试）都不应该因为加载就炸。
 */
import { createDb, type Database } from './drivers/neon';

let instance: Database | null = null;

function getDb(): Database {
  if (!instance) instance = createDb();
  return instance;
}

export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
  has(_target, prop) {
    return Reflect.has(getDb() as object, prop);
  },
});

export type { Database };
