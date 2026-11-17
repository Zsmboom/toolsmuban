/**
 * Cloudflare Workers 入口。
 *
 * 为什么需要这一层：TanStack Start 产出的 dist/server/server.js 除了 default
 * 之外还会导出一批内部符号（createServerFn、TSS_SERVER_FUNCTION 等）。
 * Workers 会把入口模块的**每一个具名导出**都当成 Durable Object 类或
 * WorkerEntrypoint 去校验，遇到不是函数的就直接启动失败：
 *
 *   Uncaught TypeError: Incorrect type for map entry 'n':
 *   the provided value is not of type 'function or ExportedHandler'
 *
 * 这层 wrapper 只透出 default，把内部符号挡在外面。
 * wrangler 会自己把它和 server.js 一起打包。
 */
// Vite 在构建阶段生成这个模块，源码树中没有可供 tsc 读取的声明文件。
// @ts-expect-error -- 产物入口会由紧随其后的 Vite/Workers dry-run 校验。
import handler from '../dist/server/server.js';

export default handler;
