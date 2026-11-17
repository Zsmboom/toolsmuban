/**
 * 当前生效的表结构。
 *
 * 业务代码一律 `import { users } from '~/lib/db/schema'`，
 * 不要直接引 schema.pg.ts（文件级 re-export 是为了将来换库时只改这一行）。
 */
export * from './schema.pg';
