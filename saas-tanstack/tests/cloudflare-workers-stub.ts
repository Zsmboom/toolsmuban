/**
 * 单元测试里 `cloudflare:workers` 不存在（那是 Workers 运行时的内置模块）。
 * 这个 stub 让「切到 D1 时」的模块图仍然能被 vitest 解析。
 *
 * 它故意不提供任何 binding —— 单元测试不该真的碰数据库；
 * 需要跑真实 SQL 的场景请用 `wrangler dev` 或对着真库跑集成脚本。
 */
export const env: Record<string, unknown> = {};
