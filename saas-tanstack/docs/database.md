# 数据库运维手册（Neon PostgreSQL）

> 本文是 `saas-tanstack` 数据库相关的唯一操作口径。
> 决策背景见 `docs/requirements/20261116-neon-database-integration.md`。

## 1. 结构

| 关注点 | 位置 |
|---|---|
| 表结构定义 | `app/lib/db/schema.pg.ts` |
| 迁移 SQL | `drizzle/pg/*.sql` + `meta/_journal.json` |
| 连接与驱动 | `app/lib/db/drivers/neon.ts`（`@neondatabase/serverless` HTTP 驱动） |
| 业务入口 | `app/lib/db/index.ts`（惰性 Proxy，避免模块顶层做 I/O） |
| 方言语法 | `app/lib/db/dialect.ts`（仅 `toDateString` / `greatest`） |
| 命令入口 | `scripts/db.mjs` |

业务代码一律 `import { db } from '~/lib/db'` 和 `import { users } from '~/lib/db/schema'`，
不要直接引 `schema.pg.ts` 或驱动文件。

## 2. 两条连接串

| 变量 | 用途 | 端点特征 | 存在哪 |
|---|---|---|---|
| `DATABASE_URL` | 应用运行时 | 主机名含 `-pooler`（池化） | 本地 `.env.local`；线上 `wrangler secret` |
| `DATABASE_URL_UNPOOLED` | 迁移 / 生成 / 备份 | 直连 | 本地 `.env.local`；CI GitHub Secret |

**为什么必须分开**：池化连接是给高并发短查询用的代理，做 DDL、长事务、
`pg_dump` 时会出现难以定位的偶发失败。反过来，应用用直连会在高并发下耗尽
连接数。

`npm run db:*` 全部经过 `scripts/db.mjs`，它会在执行前校验：
- 变量存在
- 主机名不含 `-pooler`（否则直接报错退出）

不要绕过这层直接调 `drizzle-kit`。

## 3. 日常命令

```bash
npm run db:generate    # 改完 schema.pg.ts → 生成新迁移文件（不连库）
npm run db:migrate     # 应用所有未应用的迁移（走直连）
npm run db:check       # 库是否落后于迁移文件；落后则非 0 退出
npm run db:baseline    # 给「db:push 建出来的老库」补迁移记录
npm run db:studio      # 可视化浏览
```

### 改表的标准流程

```bash
# 1. 改 app/lib/db/schema.pg.ts
# 2. 生成迁移
npm run db:generate
# 3. 先在生产的分支上试（见第 6 节）
npm run db:check         # 应报「有 N 个迁移未应用」
npm run db:migrate
npm run db:check         # 应报「一致」
# 4. 提交 drizzle/pg 下的新文件
```

**不要用 `db:push` 改线上的库。** 它直接改结构、不留迁移记录，
之后 `db:migrate` 会从 0000 重放并撞「表已存在」。

## 4. `db:push` 与 `db:baseline` 的区别

| 场景 | 用哪个 | 说明 |
|---|---|---|
| 一次性本地实验 | `db:push` | 快，但库与迁移记录脱节 |
| 已有库、迁移记录为空 | `db:baseline` | 按 `sha256(迁移文件内容)` 补登记，之后 `db:migrate` 才能正常工作 |
| 正常演进 | `db:generate` + `db:migrate` | 唯一推荐路径 |

`db:baseline` 的 hash 算法与 drizzle 迁移器一致（`sha256` 作用在迁移文件原文上），
所以登记过的迁移不会被重放。它是幂等的：已登记的会跳过。

## 5. 排障

| 现象 | 原因 | 处置 |
|---|---|---|
| `column "xxx" does not exist` / `relation "yyy" does not exist` | 代码 schema 比库新，迁移没应用 | `npm run db:check` → `npm run db:migrate` |
| `npm run db:migrate` 报「relation already exists」 | 库是 `db:push` 建的，迁移记录为空 | `npm run db:baseline` 后再 migrate |
| 本地频繁 `UND_ERR_CONNECT_TIMEOUT` | 本机到 Neon 区域的跨境建连抖动，undici 默认 10s 超时 | 走代理跑：`HTTPS_PROXY=... NODE_USE_ENV_PROXY=1 npm run dev` |
| 线上 500，日志是 `No database connection string was provided to neon()` | Worker 的 `process.env` 没被填充 | 检查 `wrangler.toml` 的 `compatibility_date` 必须 ≥ 2025-04-01（本项目用 2026-09-07），并确认 `DATABASE_URL` secret 已设 |

## 6. 迁移前先在分支上验证

Neon 的分支是写时复制的克隆，秒级创建、可随时丢弃：

```bash
neon branches create --name pre-migrate-<date>
neon connection-string pre-migrate-<date>        # 拿到直连串
DATABASE_URL_UNPOOLED=<该直连串> npm run db:migrate
neon branches schema-diff main pre-migrate-<date> # 比结构差异
```

确认无误再对 `main` 执行。Neon Free 计划每项目 10 个分支。

## 7. 备份与恢复

| 能力 | Free 计划 | 本项目的做法 |
|---|---|---|
| 即时恢复 | 6 小时窗口 | DDL 前手动建分支快照 |
| 手动快照 | 1 个 | 大版本前打一个 |
| 逻辑备份 | 无 | 需要时自行 `pg_dump`（走直连） |

**别只依赖平台**：Free 计划的 6 小时恢复窗口兜不住「昨天改错了」。

## 8. 成本

计费按 **CU-hour + 存储 + egress**，不按行数。

- Free：100 CU-hours/项目/月、1 GB 存储、5 GB egress、5 分钟空闲挂起
- Launch：$0.106/CU-hour、$0.35/GB-month

估算（0.25 CU 最小实例）：持续有流量 ≈ 730h × 0.25 = **182 CU-hours/月**，
会超 Free 的 100；折合 Launch 约 **$19/月**。若夜间能挂起，可压到 90 CU-hours 左右。

降低开销的手段：让 scale-to-zero 真正生效（别用常驻定时任务打扰它）、
读多的路径加缓存、日志按保留期清理、按 `idx_scan` 清理零命中索引。

## 9. 区域

区域在项目创建时固定、**无法修改**。本项目在 `aws-ap-southeast-1`（新加坡），
同时满足 Neon 目前对 Object Storage / Functions / AI Gateway / Realtime 的区域要求。

换区域 = 新建项目 + 迁移数据，成本最低的时机永远是现在。

## 10. Agent 工具链

- 已安装官方 agent skills：`neon`、`neon-postgres`（见 `.claude/skills`、`.agents/skills`）
- MCP：`.mcp.json` 指向 `https://mcp.neon.tech/mcp?readonly=true`，OAuth、只读、不含密钥
- CLI：`neon`（`neonctl` 为别名），凭据在 `~/.config/neonctl/credentials.json`

Neon 官方明确不建议把 MCP 连生产库，因此本项目 MCP 固定只读。
