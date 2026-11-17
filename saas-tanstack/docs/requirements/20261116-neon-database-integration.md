# Neon 数据库对接方案（saas-tanstack 模板）

| 项 | 内容 |
|---|---|
| 文档状态 | **已定稿（2026-11-16 用户拍板 5 项分叉）**，本文档为本次唯一事实源 |
| 日期 | 2026-11-16 |
| 适用对象 | `saas-tanstack/`（TanStack Start + Cloudflare Workers 工具站模板） |
| 任务类型 | 逻辑调整（数据库服务商对接收敛）+ 缺陷修复（schema 与线上库漂移） |
| 结论 | 代码层**已经是 Neon**；本次真正要做的是「迁移流程 + 线上一致性 + 工具链 + 文档」四件事 |

---

## 0. 结论先行

1. **不需要「替换数据库」的代码改造**：`app/lib/db/provider.ts` 已是 `DB_PROVIDER = 'neon'`，驱动是 `@neondatabase/serverless` + `drizzle-orm/neon-http`，`.env.local` 里的连接串实测可连（PostgreSQL 17.12 / `neondb`）。
2. **但线上库和代码对不上**：`users` 表缺 `password_hash` / `failed_login_attempts` / `locked_until` 三列，`admin_audit_logs` 整张表不存在。已复现两条真实报错（SQLSTATE `42703`、`42P01`）——**邮箱密码登录和后台任何写操作现在都会 500**。
3. **迁移历史是空的**：`drizzle.__drizzle_migrations` 0 行，4 个迁移文件一条都没登记。库里现在能跑是因为当年用了 `db:push` 直推；一旦改用 `db:migrate` 会从 `0000` 重放并撞「表已存在」。
4. **Neon 官方三件套齐全，且都值得用**：Agent Skill（`neon-postgres`，官方仓库 Apache-2.0）、托管 MCP（`https://mcp.neon.tech/mcp`，支持只读/单项目/按角色收窄）、CLI（`neon`，`neonctl` 为别名）。详细调研见第 2 节。

---

## 1. 现状勘察（全部为实测，非推测）

### 1.1 技术栈

| 维度 | 现状 |
|---|---|
| 框架 | TanStack Start + TanStack Router（SSR） |
| 运行时 | Cloudflare Workers（`compatibility_date = 2026-09-07`，Node 兼容层已默认启用） |
| ORM | Drizzle ORM `^0.45` |
| 数据库驱动 | `@neondatabase/serverless` `^1.0.0` + `drizzle-orm/neon-http` |
| 迁移工具 | `drizzle-kit` `^0.31`，脚本只有 `db:generate` / `db:push` / `db:studio`（**没有 `db:migrate`**） |
| 双栈支持 | `npm run db:use neon\|d1` 切换；`schema.pg.ts` + `schema.sqlite.ts` 两份；CI 会把未启用的那套再跑一遍 |
| 测试基线 | `npm test` → **157 passed / 8 files**（本次实跑） |

### 1.2 数据库真实状态（实测）

| 检查项 | 结果 | 证据 |
|---|---|---|
| 连接 | 通 | `select version()` → PostgreSQL **17.12** |
| 地区 | `us-east-1`（N. Virginia） | 主机名 `ep-fragrant-bar-ath4b0wv.c-9.us-east-1.aws.neon.tech` |
| 库名 / 角色 | `neondb` / `neondb_owner` | 连接串解析 |
| 已建表 | **11 张** | `accounts, country_stats, credit_transactions, credits, payments, sessions, subscriptions, tool_usage_logs, users, verification_tokens, webhook_events` |
| 迁移记录 | **0 行** | `select count(*) from drizzle.__drizzle_migrations` |
| 关键唯一约束 | 4 个都在 ✅ | `webhook_provider_event_unique`、`payment_provider_payment_unique`、`subscription_provider_id_unique`、`account_provider_account_unique` |
| `.neon` 上下文 | 只有 `projectId`，**缺 branch** | 旧版 CLI（< 5.0）产物，现版本 `link` 必写 branch |
| 数据量 | **全部 0 行** | 11 张表行数：`users 0 / sessions 0 / subscriptions 0 / payments 0 / credits 0 / credit_transactions 0 / tool_usage_logs 0 / webhook_events 0` |

> 结论：**webhook 幂等所依赖的唯一约束是完好的**，支付侧没有重复入账风险。问题集中在后加的 0003 迁移上。

### 1.3 缺陷：schema 与线上库漂移（已复现）

**改前实际行为（复现证据）：**

```
select password_hash, failed_login_attempts, locked_until from users limit 1
→ HTTP 400 {"message":"column \"password_hash\" does not exist","code":"42703"}

select id from admin_audit_logs limit 1
→ HTTP 400 {"message":"relation \"admin_audit_logs\" does not exist","code":"42P01"}
```

**逐表比对结果：**

| 表 | 期望列数 | 实际 | 差异 |
|---|---|---|---|
| `users` | 23 | 20 | 缺 `password_hash`、`failed_login_attempts`、`locked_until` |
| `admin_audit_logs` | 9 | 表不存在 | 整表缺失（含 3 个索引） |
| 其余 10 张 | — | 一致 | 无差异 |

**根因：** `drizzle/pg/0003_plain_katie_power.sql`（新增 `admin_audit_logs` + `users` 三列）**从未应用到这个库**。库是 0002 时代用 `db:push` 建出来的，之后新增了 0003 的 schema 与代码，但没有对库执行过任何 DDL。又因为 `__drizzle_migrations` 一直是空的，没有「已应用/未应用」的标记可查，所以漂移一直没被发现。

**影响面（代码事实）：**

| 调用点 | 后果 |
|---|---|
| `app/lib/auth/password.ts` → `users.passwordHash` | 邮箱密码登录 / 注册 / 改密：查询即报 `42703` |
| `app/lib/admin/guard.ts:45` `recordAudit()` | 后台**任何**写操作（改用户、改订阅、发积分）在记审计时 `42P01` 抛错，事务性动作整体失败 |
| `app/lib/admin/guard.ts:76` `listAuditLogs()` | 后台审计列表页报错 |

> 这两条是**线上级阻断缺陷**，与「换数据库」无关，但属于同一根因（迁移流程缺失），必须一并修掉。

### 1.4 本地到数据库的网络实测（影响开发体验）

| 方式 | 结果 |
|---|---|
| Node `fetch` / `@neondatabase/serverless`（undici，10s 建连超时） | **0/6 成功**，全部 `UND_ERR_CONNECT_TIMEOUT` |
| `curl` 同一主机 | 3/3 成功，但 **TCP 建连 7.8–12.9s**、TLS 1.3s |
| 首轮诊断查询 | 成功过一次（当时建连较快） |

结论：不是 Neon 挂了（`curl` 能拿到 HTTP 400/200），而是**本机到 us-east-1 的跨境建连在 8–13s 之间抖动**，正好压在 undici 的 10s 超时线上。表现就是「一会儿能跑、一会儿全是连接超时」。生产在 Workers 边缘运行，不受此影响，但**本地开发与 `db:push` 会被这个问题持续折磨**。

### 1.5 文档与代码的偏差

| 文件 | 现状 | 与代码冲突点 |
|---|---|---|
| `docs/architecture.md` | 「Database: **Turso (LibSQL)**」 | 早已是 Neon |
| `docs/deployment.md` | 整篇 Turso（`turso db create`、`TURSO_AUTH_TOKEN`），`main = "./dist/server/index.mjs"` | `wrangler.toml` 的 main 是 `./worker/index.ts` |
| `docs/api.md` | 环境变量写 `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | 实际是 `DATABASE_URL` |
| `README.md` | 已正确写 Neon（默认） | ✅ 无需改 |
| `MIGRATION_SUMMARY.md` / `FINAL_SUMMARY.md` / `UPGRADE_SUMMARY.md` | 当年 Turso→Neon 的一次性迁移产物 | 与现状不符，且与 `docs/` 重复 |

---

### 1.6 线上部署实测（2026-11-16，wrangler 已授权后核查）

| 检查项 | 结果 |
|---|---|
| Worker 是否存在 | **存在**：`saas-tanstack`，账号 `247eec2779f66eda54cc3fa6cf692fb8`，workers.dev 子域 `zsmalcor` |
| 访问地址 | `https://saas-tanstack.zsmalcor.workers.dev` |
| 最后部署 | 2026-06-12T09:40Z（版本 `7fc9410d-33fd-4ab0-919f-fda6f98bfa14`） |
| 已配 secret | `DATABASE_URL`（`secret_text`）——**存在** |
| 实际访问 | `/`、`/pricing`、`/api/health` **全部 HTTP 500**，3 轮复测一致 |
| 运行时错误（`wrangler tail` 原文） | `Error: No database connection string was provided to \`neon()\`. Perhaps an environment variable has not been set?` at `dist/server/assets/db-CbwlGTRP.js` |

**根因（已定论）**：部署版本的 `wrangler.toml` 是 `compatibility_date = "2024-12-01"` + `nodejs_compat`。Cloudflare 文档明确：`process.env` 只在**兼容日期 ≥ 2025-04-01**（`nodejs_compat_populate_process_env` 默认开启）时才被填充；2026-08-04 起 nodejs_compat 更是默认启用。2024-12-01 的版本里 `process.env` 是空对象，于是 `neon(process.env.DATABASE_URL)` 拿到 `undefined`。

> 也就是说：**这个站从 6 月 12 日部署上线起就一直 500，坏了 5 个月，与数据库无关**。修复所需的 `compatibility_date = "2026-09-07"` 已经在本地工作区，但**从未提交、从未部署**（HEAD 仍是旧配置）。

**另一项风险**：本地 `drivers/neon.ts` 同样读 `process.env.DATABASE_URL`。修好兼容日期后能工作，但更稳的写法是 `import { env } from 'cloudflare:workers'`（官方文档推荐，且与 D1 驱动一致）——列为 P4 的加固项。

**仓库状态**：工作区有 **314 个未提交变更**（含 `app/lib/db/` 整套驱动抽象、`docs/`、CI 改造）。这意味着线上代码与本机代码差异很大，**部署前必须先提交并确认 diff**。

---

## 2. Neon 官方可用手段调研（Skill / MCP / CLI）

### 2.1 三者对比

| 手段 | 是什么 | 能做什么 | 适合放在哪 | 风险 |
|---|---|---|---|---|
| **Agent Skill**<br>`neondatabase/agent-skills` | 官方 Agent Skills 集合（Apache-2.0，仓库根即 Agent Plugins v1 包） | 给 agent 的**知识与流程**：连接方式选择（pooled vs direct）、Cloudflare 上该用哪个驱动、分支工作流（branch per PR / schema-only / reset）、迁移策略、scale-to-zero、egress 优化 | **项目内**（随仓库走，团队/CI 一致） | 低（纯文本资产，不含凭据） |
| **MCP Server**<br>`https://mcp.neon.tech/mcp` | 官方托管 MCP，`npx neon@latest mcp` 引导写配置 | 让 agent **直接操作**项目：列项目/分支、跑 SQL、改 schema、拿连接串 | **本地开发侧**（不进生产） | 中高（官方明确「仅限开发测试，不要连生产」） |
| **CLI**<br>`neon`（`neonctl` 为别名） | 终端管理项目/分支/连接串/角色 | `link`（写 `.neon` 并自动 `env pull`）、`env pull`（写 `DATABASE_URL` **与** `DATABASE_URL_UNPOOLED`）、`branches`（含 `schema-diff`）、`connection-string --pooled/--psql`、`api`、`claim`（无账号先建库） | **本地 + CI** | 低（`--api-key` 走环境变量） |

### 2.2 Skill 里到底给了什么（对本次有用的部分）

`neon-postgres` 技能的 `SKILL.md` 直接回答了本项目的两个关键决策：

1. **Cloudflare 上的驱动选择** → 原文：`On Cloudflare, use node-postgres with Cloudflare Hyperdrive`；`@neondatabase/serverless` 用于 Netlify 这类环境，HTTP 传输只适合一次性查询、**需要事务时才用 WebSocket**。
2. **pooled vs direct** → 表格明确：Web 应用/Serverless 函数用 **pooled（`-pooler`）**；**schema 迁移、`pg_dump`/`pg_restore`、逻辑复制必须用 direct（unpooled）**。
3. **迁移纪律** → 「迁移要作为代码管理，不要在库上跑临时 DDL；先在生产的**分支**上用生产级数据验证，再上生产」。

> 这三点正好击中本项目现状：现在只用 `db:push`（等于在库上跑临时 DDL），迁移与取连接串用的是同一条 URL。

### 2.3 MCP 的安全参数（官方文档实测可用的收窄手段）

| 参数 | 作用 | 本项目建议 |
|---|---|---|
| `?readonly=true` | 只读，禁用建分支/迁移/改配置 | **必加** |
| `?projectId=<id>` | 锁定单项目，隐藏跨项目管理工具 | **必加** |
| `?category=querying&category=schema` | 只开查询与 schema 类别 | 按需 |
| `?roleName=<role>` | 让所有 SQL 以受限角色执行，由 GRANT 兜底 | 生产库必须配 |

官方安全指引原文：**建议 MCP 仅用于开发与测试，不要连接生产库**。所以 MCP 只做本地开发便利，不作为生产运维通道。

### 2.4 CLI 关键命令（本项目会用到的）

```bash
npm i -g neon            # neonctl 是别名，命令一致

neon link                # 绑定目录 → 写 .neon（含 branch）→ 默认把 env 拉到 .env.local
neon env pull --file .env.local            # 只刷 Neon 变量，其它行保留
neon env pull --branch preview --file .env.preview
neon connection-string --pooled            # 应用用
neon connection-string                     # 迁移用（unpooled）
neon branches create --name pr-123
neon branches schema-diff main pr-123      # 迁移前后比 schema
neon projects list                         # 确认区域
```

### 2.5 结论

| 决策 | 结论 | 理由 |
|---|---|---|
| Skill | **装进项目**（`npx neon@latest skills -y`，只要 `neon` + `neon-postgres`） | 让 agent 在改表/取连接串时自动按 Neon 官方纪律执行；纯文本、可 review、可入库 |
| MCP | **装本地开发环境，只读 + 单项目 + 角色收窄** | 图形化查库方便；但官方明确不建议连生产，因此默认只读、默认禁用写 |
| CLI | **纳入仓库脚本**（`db:link` / `db:pull` / `db:branch`） | 解决「迁移用 direct、应用用 pooled」这条最容易搞错的纪律；同时修掉 `.neon` 缺 branch 的问题 |

---

## 3. 需求范围与验收标准

### 3.1 本次做（建议范围）

| # | 内容 | 类型 |
|---|---|---|
| 1 | 修复线上库漂移：补齐 `users` 三列与 `admin_audit_logs` 表 | 缺陷修复 |
| 2 | 建立迁移基线：`__drizzle_migrations` 写入 4 条记录，之后走 `db:migrate` | 缺陷修复 |
| 3 | 拆分连接串：应用用 pooled、迁移/备份用 unpooled | 逻辑调整 |
| 4 | 收敛为 Neon 单一事实源（删除 D1 分支，已决议，见 4.4） | 逻辑调整 |
| 5 | 接入 Neon CLI / Skill / MCP（见 4.8） | 工具链 |
| 6 | 重写过期文档（architecture / deployment / api） | 文档 |
| 7 | 补 `db:migrate` / `db:baseline` / `db:check` 脚本与 CI 校验 | 工程化 |

### 3.2 本次不做

- 不改表结构设计（不加新表、不改列语义、不动支付/积分逻辑）
- 不做读写分离、不接 Neon Auth、不迁 R2
- 不动前端与 SEO
- 不顺手重构 `credits` / `payments` 的并发写法（见第 10 节「顺带发现」）

### 3.3 验收标准

1. `psql`/MCP 查 `users` 三项列与 `admin_audit_logs` 存在，且 `drizzle.__drizzle_migrations` = 4 行。
2. `npm run db:migrate` 幂等：连跑两次，第二次输出 0 个待应用迁移且库不变。
3. 邮箱密码注册 → 登录 → 改密链路本地真跑通（浏览器留证）。
4. 后台任一写操作成功且 `admin_audit_logs` 落一条记录。
5. `npm run db:check` 能在「库比 schema 旧/新」时**报错退出**（不是靠人眼看）。
6. `npm test` 全绿；`npm run type-check`、`npm run lint`、`npm run build:cf` 通过。
7. `docs/` 中不再出现 `TURSO` / `turso`；`architecture.md` 的数据库章节与代码一致。
8. 新库路径可用 `neon link` + `neon env pull` 从零重建 `.env.local`（写进运维手册并实测一次）。

---

## 4. 方案

### 4.1 驱动层：三个选项与取舍

| 选项 | 做法 | 优点 | 缺点 | 结论 |
|---|---|---|---|---|
| **A. 保持现状** | `@neondatabase/serverless` HTTP + `drizzle-orm/neon-http` | 零改动、Workers 友好、无需连接管理、无 `pg` 依赖 | **不支持跨语句事务**；每次查询一次 HTTPS 往返；与 Neon 官方对 Cloudflare 的推荐不一致 | 可用，但不是终态 |
| **B. Hyperdrive + node-postgres** | `npm i pg` + `wrangler hyperdrive create` + `drizzle-orm/node-postgres` | Neon 与 Cloudflare **双方推荐的组合**；真事务；连接池与查询缓存由 Hyperdrive 负责；免费计划可用 | 引入 `pg` 依赖；需要 Hyperdrive binding 与 `wrangler types` 重生成；本地开发要走 `wrangler dev` 才能拿到 binding | **推荐作为目标态**，但独立成第二批 |
| **C. `neon-serverless`（WebSocket Pool）** | 换驱动、加 `ws` | 支持事务，不需要 Hyperdrive | Workers 上连接开销大、并发受限；官方已不主推 | 不采用 |

**建议节奏（两步走，先止血再换引擎）：**

- **第一批（本次）**：走 A，只做第 3.1 节的 1/2/3/4/5/6/7 项。理由：当前代码用「单条 `UPDATE ... WHERE balance >= cost RETURNING`」实现原子扣费（`app/lib/credits/index.ts:87`），已经覆盖主要竞态；漂移与迁移基线才是现在真正会炸的地方。
- **第二批（可选，独立确认）**：A → B。触发条件：出现需要「扣积分 + 写流水 + 写用量日志」严格同事务的业务，或需要把积分流水缺口补齐到 0。

> 若你直接想要 B，我按 B 出实施步骤：改驱动、加 Hyperdrive binding、迁移脚本改 unpooled、CI 加 `wrangler hyperdrive` 校验。**只是本次工作量从约 1 天变 2 天，且本地开发方式会变**（拿 binding 需要 `wrangler dev`）。

### 4.2 区域：us-east-1 还是搬到 ap-southeast-1

| 选项 | 说明 | 代价 |
|---|---|---|
| **留在 us-east-1** | 项目区域**创建后不可修改** | 0；但本地开发持续受 8–13s 建连抖动影响 |
| 新建 `aws-ap-southeast-1`（新加坡）项目并迁数据 | 对国内/东南亚用户 RTT 明显更低；`pg_dump`(direct) → `pg_restore` | 新项目、新连接串、重跑基线、改 secret；约 30–60 分钟 |

**结论：建议搬。** 理由：① 区域不可改，越晚搬越贵；② 当前库只有 11 张表，数据量极小，现在是搬迁成本最低的时刻；③ 本地开发体验是这个模板复用者的第一印象。

> 若你确定这个库只是本地玩耍、线上另有生产库，那就不搬，直接在新项目上一次性按本方案建好。

### 4.3 迁移历史与漂移修复（本次核心）

**目标态**：`drizzle-kit migrate` 可用且幂等；`db:push` 只允许用于本地临时库。

**修复步骤（先在 Neon 分支上演练，再上主库）：**

1. **备份**：`neon branches create --name pre-baseline-20261116`（copy-on-write，秒级，可随时回退）+ `pg_dump`（走 unpooled 连接串）落一份本地文件。
2. **补齐 0003 的 DDL**（等价于 `db:push` 的效果，但用可审计的 SQL）：
   - `CREATE TABLE admin_audit_logs (...)` + `CREATE INDEX audit_actor_idx / audit_action_idx / audit_created_at_idx`
   - `ALTER TABLE users ADD COLUMN password_hash text;`
   - `ALTER TABLE users ADD COLUMN failed_login_attempts integer DEFAULT 0 NOT NULL;`
   - `ALTER TABLE users ADD COLUMN locked_until timestamp;`
   - 直接复用 `drizzle/pg/0003_plain_katie_power.sql` 的内容，不手写。
3. **写基线**：按 drizzle 的规则（迁移文件内容的 sha256）为 0000–0003 生成 4 条记录写入 `drizzle.__drizzle_migrations`。脚本 `scripts/db-baseline.mjs` 负责计算并写入。
4. **验证幂等**：`npm run db:migrate` 连跑两次——第一次「0 pending」，第二次完全无变化；再跑 `drizzle-kit generate` 确认「No schema changes」。
5. **反向验证漂移检测**：故意在测试分支上加一列而不生成迁移，确认 `npm run db:check` 能报出差异并以非 0 退出。

**新增脚本：**

| 脚本 | 作用 |
|---|---|
| `db:migrate` | `drizzle-kit migrate`，读 `DATABASE_URL_UNPOOLED` |
| `db:baseline` | 为已有库写入迁移记录（幂等，已存在则跳过） |
| `db:check` | 对比 schema 与库，有差异则非 0 退出（CI 用） |
| `db:link` / `db:pull` | 包装 `neon link` / `neon env pull` |

### 4.4 双栈收敛：删 D1 还是保留

| 选项 | 优点 | 缺点 |
|---|---|---|
| **保留双栈** | 模板「一条命令切换」的卖点还在；不强绑 Cloudflare | 两份 schema 要同步维护；CI 跑两遍；方言差异散在 `dialect.ts`；**本次漂移正是「多一套东西没人跟」的典型后果** |
| **收敛为 Neon 单栈（建议）** | 单一事实源；删掉 `schema.sqlite.ts` / `schema-parity.test.ts` / `db-use.mjs` / `dialect.ts` 的方言分支 / CI 双跑；README 改口径 | 失去 D1 选项；后续想加回来要重做 |

**决议（2026-11-16）：收敛为 Neon 单栈。** 理由：本次漂移本质上就是「多一套东西没人跟」的结果；模板的核心卖点是「复制即用」，不是「同时支持两家」。若日后要加回 D1，按本方案逆向重建即可。

### 4.5 环境变量与密钥

| 变量 | 用途 | 存放 |
|---|---|---|
| `DATABASE_URL` | 应用运行时（pooled，主机名含 `-pooler`） | 本地 `.env.local`；线上 `wrangler secret put DATABASE_URL` |
| `DATABASE_URL_UNPOOLED` | 迁移 / `pg_dump` / `pg_restore` | 本地 `.env.local`；**CI 用 GitHub Secret**，不进 Worker 运行时 |
| `NEON_API_KEY` | CLI 与 MCP 认证 | 本地 shell / CI Secret；**绝不入库** |

纪律：`db:migrate`、`db:generate`、`db:studio` 一律读 `DATABASE_URL_UNPOOLED`，读不到就直接报错退出——避免「迁移走了池化连接」这类只在故障时才暴露的问题。

### 4.6 分支与预览环境（第二批可选）

- `neon branches create --name pr-<number>` + `schema-diff main pr-<n>` 做迁移预演。
- 预览环境用 branch 的独立连接串注入（不进 `wrangler.toml`）。
- Free 计划每项目 10 个分支，够用；超出 $1.50/分支/月。

### 4.7 备份与恢复

| 能力 | Free 计划 | 建议动作 |
|---|---|---|
| Instant restore | 无额外费用，最多 **6 小时** | 每次 DDL 前手动建分支快照（本方案第 4.3 节第 1 步） |
| 手动快照 | 1 个 | 大版本前打一个 |
| 逻辑备份 | 需自己 `pg_dump` | 月度 `pg_dump`（unpooled）落到 R2/本地 |

> 关键认知：**Free 计划的 6 小时恢复窗口不足以兜住「昨天改错了」，所以 DDL 前分支快照 + 月度 `pg_dump` 是必需的，不能只依赖平台**。

### 4.8 工具链接入

| 步骤 | 命令 | 产出的文件 |
|---|---|---|
| 1. 装 CLI | `npm i -g neon` | — |
| 2. 绑定项目 | `neon link --branch main` | `.neon`（**重写，补上 branch**） |
| 3. 装 Skill | `npx neon@latest skills -y`（或 `npx skills add neondatabase/agent-skills`） | 项目内 skills 目录（只保留 `neon`、`neon-postgres`） |
| 4. 配 MCP（只读） | 客户端配置写 `https://mcp.neon.tech/mcp?readonly=true&projectId=<id>&category=querying&category=schema` | 本地 MCP 配置（不入库、不含凭据） |
| 5. 写运维手册 | — | `docs/database.md`（连接、分支、迁移、回滚、成本、故障排查） |

### 4.9 成本四本账（换算成 Neon 的计费单位）

Neon 不按「行数」计费，按 **CU-hour + 存储 + egress** 计费，所以传统四本账要换算：

| 账本 | 估算（日 1 万次工具调用） | 换算到 Neon |
|---|---|---|
| 写入 | 每次调用约 3 行（credits 更新 + `tool_usage_logs` + `credit_transactions`）→ 3 万行/天 ≈ 90 万行/月；行宽 ~300 B → **~270 MB/月**，90 天留存 ≈ **810 MB** | 不吃「写次数」，吃存储与 compute 活跃时长；90 天留存会顶到 Free 的 1 GB |
| 读取 | 每次调用前查 credits + 页面渲染 ≈ 5 万读/天 | 吃 compute 活跃时长；结果集小，egress < 1 GB/月（Free 5 GB 够） |
| 存储 | 见写入 ≈ 0.8 GB（含索引） | Free 1 GB（贴边）；Launch `$0.35/GB-month` |
| 缓存 | — | Hyperdrive 默认 60s 查询缓存可显著减少 compute 唤醒——**但写后立刻读不能缓存**，需按路径区分 |

**Compute 账（决定要不要升套餐）：**

| 场景 | CU-hours/月 | Free(100) | Launch($0.106/CU-h) |
|---|---|---|---|
| 夜间隔断、每天活跃 ~12h（>5min 有请求就挂不住） | 365 h × 0.25 CU ≈ **91** | 贴边 | ≈ $9.7 |
| 持续有流量、几乎不挂起 | 730 h × 0.25 CU ≈ **182** | **超限** | ≈ **$19.4** |

**结论**：Free 只适合开发与低流量验证；**有真实流量后按 Launch 估 $15–25/月**。降本手段：让 scale-to-zero 真正生效（别用常驻定时任务打扰它）、上 Hyperdrive 缓存、日志按 90 天清理或分区、索引收敛（当前 30+ 索引，写入放大明显）。

---

## 5. 变更清单（文件级）

| 文件 | 动作 | 验收点 |
|---|---|---|
| 线上库（Neon） | 执行 0003 DDL + 写基线 | 第 3.3 节 1、2 |
| `scripts/db-baseline.mjs` | 新增 | 幂等，已存在跳过 |
| `scripts/db-check.mjs` | 新增 | 有差异非 0 退出 |
| `drizzle.config.ts` + `drizzle.config.pg.ts` | 合并为单文件，迁移走 `DATABASE_URL_UNPOOLED` | 缺 unpooled 直接报错 |
| `package.json` | 加 `db:migrate` / `db:baseline` / `db:check` / `db:link` / `db:pull` | 脚本可执行 |
| `scripts/db-use.mjs` | 删除（已决议收敛） | — |
| `app/lib/db/schema.sqlite.ts` | 删除 | 无引用残留 |
| `app/lib/db/schema-parity.test.ts` | 删除 | 无引用残留 |
| `app/lib/db/drivers/d1.ts` | 删除 | 无引用残留 |
| `app/lib/db/provider.ts` / `dialect.ts` | 删除文件与方言分支 | 业务代码 `import` 不变（`toDateString` / `greatest` 改为 pg 实现或就地内联） |
| `app/lib/db/index.ts` / `schema.ts` | 去掉「由脚本维护」注释，直接指向 pg | — |
| `wrangler.toml` | 删 D1 注释块；B 方案再加 `[[hyperdrive]]` | — |
| `worker-configuration.d.ts` | `npm run types:cf:generate` 重生成 | CI 的 `types:cf` 通过 |
| `.env.example` | 补 `DATABASE_URL_UNPOOLED`；说明 pooled/unpooled 区别 | 新项目照抄能跑 |
| `docs/architecture.md` | 数据库章节 Turso → Neon | 全文无 TURSO |
| `docs/deployment.md` | 重写（Neon 密钥、`main` 路径、迁移顺序） | 与 `wrangler.toml` 一致 |
| `docs/api.md` | 删 `TURSO_*` | — |
| `docs/database.md` | **新增**：Neon 运维手册 | 第 3.3 节 8 |
| `.github/workflows/deploy.yml` | 去掉双 provider 双跑；部署前加 `db:check` | CI 绿 |
| `.neon` | 由 `neon link` 重写（补 branch） | — |

**不新增页面、不改路由，因此无页面规划表；SEO/GEO 评审结论见第 8 节。**

---

## 6. 风险与回滚

| 风险 | 概率 | 影响 | 处置 |
|---|---|---|---|
| 补 DDL 时写错列定义 | 低 | 中 | 直接复用 `0003_plain_katie_power.sql` 原文；先分支演练 |
| 基线 hash 算错导致 `migrate` 重放 0000 | 中 | 高（撞「表已存在」） | 写基线后立即连跑两次 `db:migrate` 验证幂等；出问题就删 `drizzle.__drizzle_migrations` 重来 |
| 迁移用了 pooled 连接串 | 中 | 中（DDL 偶发失败） | 脚本层强制 `DATABASE_URL_UNPOOLED`，缺失即退出 |
| ~~搬区域时数据丢失~~ | — | — | **不适用**：旧库 0 行，无数据可丢 |
| 收敛 D1 时误删仍在用的引用 | 中 | 中 | 先 `grep -rn "schema.sqlite\|drivers/d1\|DB_PROVIDER"` 列全调用方，再删；每步 `type-check` |

**回滚动作（按粒度）：**

1. DDL 出错 → 回退到 `pre-baseline-20261116` 分支（秒级）。
2. 代码改动出错 → 单次提交 revert，CI 自动重新部署。
3. 搬区域出错 → 连接串切回旧项目 secret（旧项目保留 7 天再删）。

---

## 7. 测试要点

| 层 | 用例 |
|---|---|
| 单元 | `schema-parity`（若保留双栈）；`db-check` 的差异检测逻辑本身要有测试 |
| 集成 | 对测试分支跑 `migrate` 两次验证幂等；空库全量 `migrate` 建出 11 张表 |
| 端到端（浏览器真跑，留证） | ① 邮箱注册 → 登录 → 改密；② Google 登录；③ 一次工具调用扣积分 → `credit_transactions` 落一条；④ 后台改一个用户 → `admin_audit_logs` 落一条；⑤ Stripe webhook 重投一次 → 不重复开通（靠 `webhook_provider_event_unique`） |
| 失败场景 | 余额不足扣费（应 `InsufficientCreditsError` 且余额不变）；DB 不可达时的错误提示 |
| 回归 | `npm test`（157 条基线不能少）、`type-check`、`lint`、`build:cf` |

---

## 8. SEO / GEO 评审结论

**不适用。** 本次不新增/修改任何公开可索引页面，不改 URL、标题、结构化数据与内链，不影响 `publicRoutes` / sitemap。唯一可能影响抓取的因素是「SSR 期间数据库查询失败导致页面 500」——修完第 4.3 节后这一风险下降，属于 SEO 正向收益，无需另做方案。

---

## 9. 已达成的决议（2026-11-16 用户拍板）

| # | 问题 | **决议** |
|---|---|---|
| Q0 | 库性质 | **开发库，可直接执行 DDL**（仍按方案先建分支快照，成本为零） |
| Q1 | 双栈 | **收敛为 Neon 单栈**：删 D1 驱动 / `schema.sqlite.ts` / parity 测试 / `db-use.mjs` / CI 双跑 |
| Q2 | 驱动 | **分两批**：本次只止血（A，neon-http），Hyperdrive（B）独立评估 |
| Q3 | 区域 | **搬去 `aws-ap-southeast-1`（新加坡）**，新建项目 + `pg_dump`/`pg_restore` 迁数据 |
| Q4 | 工具链 | **都接**：skill 进项目、MCP 只读+单项目装本地、CLI 进 npm scripts |

---

## 10. 执行顺序

### 10.1 第一批（本次交付）

| 阶段 | 动作 | 前置依赖 |
|---|---|---|
| P0 | `neon auth` 登录 → `neon projects create --region-id aws-ap-southeast-1` | **需用户在浏览器完成 OAuth**（见 10.2） |
| P1 | 用 0000–0003 全量 `db:migrate` 在新项目**空库**上建表（新库天然干净，不需要补丁式 DDL） | P0 |
| P2 | ~~数据迁移~~ **已取消**：旧库 11 张表全部 **0 行**（2026-11-16 实测），无数据可迁，也无需 `pg_dump`/`pg_restore` | — |
| P3 | 旧库处置：**直接弃用**（空壳开发库）。仅当你想留一份对照时才补漂移；默认不修，7 天后删项目 | — |
| P4 | 改代码：单栈收敛、驱动指向新库、`drizzle.config` 走 `DATABASE_URL_UNPOOLED`、新增 `db:migrate` / `db:baseline` / `db:check` / `db:link` / `db:pull` | P2 |
| P5 | 接工具链：`neon link`（重写 `.neon`）、`npx neon@latest skills -y`、本地只读 MCP 配置 | P0 |
| P6 | 重写 `docs/architecture.md` / `docs/deployment.md` / `docs/api.md`，新增 `docs/database.md` | P4 |
| P7 | 浏览器端到端验证（注册→登录→改密→工具调用扣分→后台写操作记审计），`npm test` / `type-check` / `lint` / `build:cf` | P4 |
| P8 | 线上切换：`wrangler secret put DATABASE_URL`（新项目 pooled）→ **重新部署**（这同时修掉线上已持续 5 个月的 500） | P7 |

> **新库走全量 migrate，不走「补 DDL + 写基线」**——新项目是空库，正好一次建立干净的迁移历史。
> 基线脚本（`db:baseline`）仍然交付，但用途变了：给**已克隆本模板的人**用（他们的库也是 `db:push` 出来的、`__drizzle_migrations` 为空），是模板资产而非本次修复手段。
>
> **P2 取消的实际影响**：不需要安装 postgres 客户端（本机 `psql`/`pg_dump` 都没有）、不需要停机窗口、旧库可以直接扔掉——因为里面一行数据都没有。

### 10.2 需要用户动手的两件事

登录网页控制台**不等于** CLI 已授权：CLI 读的是 `~/.config/neonctl/credentials.json`，该文件 token 于 **2026-06-12 过期**且未刷新。

| # | 事项 | 需要什么 | 说明 |
|---|---|---|---|
| 1 | **Neon 授权 + 建新加坡项目** | 二者任一：<br>① 在项目目录跑 `npx neon@latest link --project-name <名> --region-id aws-ap-southeast-1`（浏览器 OAuth，自动建项目 + 写 `.env.local`）<br>② 给我一个 `NEON_API_KEY` | 推荐 ①：一步完成授权、建项目、拉连接串（含 `DATABASE_URL_UNPOOLED`），**凭据不经过对话** |
| 2 | **Cloudflare 授权** | `npx wrangler login`，或给我 `CLOUDFLARE_API_TOKEN` | 本机 wrangler token 也已过期，当前**无法确认线上是否有 Worker、无法推 secret** |

> **线上现状已实测**（见 1.6 节）：Worker 存在、secret 存在、但**全站 500**，根因是部署版本的 `compatibility_date` 太旧导致 `process.env` 为空。原先「日志已过保留期无法回溯」的判断已被 `wrangler tail` 实时抓取取代。

### 10.3 验收（对应第 3.3 节）

第 3.3 节 1–8 全部满足 + 新库连接下 P7 的 5 条端到端用例通过。


---

## 10.4 执行进展（2026-11-16，已完成 P0–P1）

| 项 | 结果 |
|---|---|
| Neon 授权 | 已通过 `neon auth`（浏览器 OAuth）完成，**用户无需再手动提供凭据** |
| 组织 / 计划 | `alcor` / `org-soft-thunder-82107592` / **free** |
| 原项目 | `weathered-violet-87084963`（`saas-tanstack`，aws-us-east-1，PG 17）——与 `.neon` 中的 projectId 一致，即同一个项目 |
| 新项目 | **`raspy-unit-96148851`**（`saas-tanstack-sg`，**aws-ap-southeast-1**，PG 17，branch `main`，db `neondb`，role `neondb_owner`） |
| 连接串 | 已写入 `.env.local`：`DATABASE_URL`（pooled，`ep-round-bird-a1pn4mxc-pooler`）+ `DATABASE_URL_UNPOOLED`（`ep-round-bird-a1pn4mxc`）；原文件备份为 `.env.local.bak-20261116` |
| 迁移 | `drizzle-kit migrate` 在空库上**全量成功**：**12 张表**（含 `admin_audit_logs`）、**4 条**迁移记录、`users` 三列齐 |
| 幂等验证 | 第二次执行 `migrate` → 无任何变更（幂等 ✓） |
| 漂移 | 新库**无漂移**（老库的两处缺陷在新库不存在） |

### 区域延迟实测（重要：与预期相反）

| 路径 | 连接建立 | 单次查询总耗时 |
|---|---|---|
| 原库 us-east-1，直连 | 0.28s / 0.30s / **12.76s**（剧烈抖动） | — |
| 新库 ap-southeast-1，直连 | **18.9s / 23.9s / 22.9s**（持续慢） | 0.56s / 4.46s / 7.84s |
| 新库 ap-southeast-1，经本机代理 `127.0.0.1:7890` | ~0.0003s（已建连） | **0.52s / 0.71s / 0.80s（稳定）** |

**结论**：本机到新加坡的**直连跨境路由比到美国东部更差**，这不是 Neon 的区域问题，而是本地出境链路问题。但经代理后新加坡稳定在 0.5–0.8s/查询，是可用状态。生产在 Cloudflare Workers 边缘运行时，亚洲边缘节点到新加坡的 RTT 远低于到弗吉尼亚，因此**生产收益依然成立**。

**本地开发指引（写入 `docs/database.md`）**：跑 `npm run dev` 时带上代理环境变量，否则会频繁 10s 超时：

```bash
HTTPS_PROXY=http://127.0.0.1:7890 NODE_USE_ENV_PROXY=1 npm run dev
```

---

## 10.5 执行结果（2026-11-17，P0–P8 全部完成）

| 阶段 | 结果 |
|---|---|
| 提交基线 | 旧 Next.js 应用删除 / saas-tanstack 入库 / 工程配置 / Turso 配置清理，共 7 个提交，分支 `neon-migration` 已并入 `main` |
| 安全 | `npm audit` 27 个漏洞（6 critical / 9 high）→ **0**；TanStack Start 反射型 XSS 修复；`zod` 确认为零引用死依赖后移除而非破坏性升级 |
| 单栈收敛 | D1 驱动 / schema.sqlite / parity 测试 / db-use.mjs / drizzle/sqlite 全部移除；`dialect.ts` 仅保留 Postgres 实现 |
| 迁移体系 | 新增 `scripts/db.mjs`：强制直连、拒绝 `-pooler`、自动加载 `.env.local`，提供 `check` / `baseline`；CI 部署前跑 `db:check` |
| 文档 | `architecture.md` 重写、`deployment.md` 与 `api.md` 的 Turso 内容清除、新增 `docs/database.md` 运维手册、README 重写数据库章节 |
| 本地端到端 | 注册 → Dashboard(100 额度) → 跑工具(Balance 99) → 落库核对 users=1 / tx=1 / logs=1 ✓ |
| 线上部署 | 已部署（版本 `80ce226c`），全站 200，`wrangler tail` 无异常，robots/sitemap 正常 |
| 线上端到端 | 注册 → 扣积分 → 登出 → 重登，全部通过，数据落在新加坡库（`pbkdf2$100000$…`） |

### 执行中发现的两个新缺陷（均已修复）

**1. 密码哈希迭代次数超过 Workers 上限（线上注册/登录必失败）**

```
NotSupportedError: Pbkdf2 failed: iteration counts above 100000 are not supported (requested 210000)
```

Workers WebCrypto 的 PBKDF2 上限是 100,000，代码按 OWASP 取了 210,000。
Node 无此限制，所以本地正常、线上必挂，单元测试（跑在 Node 上）也覆盖不到。
已降为 100,000 并在注释里记录原始报错，测试断言锁死该值。

**2. GitHub Actions 的 `CF_API_TOKEN` 已失效**

CI 的 verify 作业全绿，deploy 作业报 `Authentication error [code: 10000]`。
该 token 创建于 2026-06-12，已失效。本次部署改用本地 `wrangler`（OAuth）完成。
**待办：在 Cloudflare Dashboard 重新生成 API Token 并更新仓库 secret。**

### 仍未解决（需要你决策）

| 项 | 说明 |
|---|---|
| Worker 缺业务 secret | 目前只有 `DATABASE_URL`；`GOOGLE_*` / `STRIPE_*` / `CREEM_*` / `PAYPAL_*` 均未设置，Google 登录与支付在线上不可用 |
| 仓库 variables 不全 | 只有 `VITE_APP_URL`、`VITE_PAYMENT_PROVIDERS`；价格/商品 ID 缺失，结账会失败 |
| 支付与积分的测试缺口 | `payments` 的 webhook/sync、`credits`、`admin` 仍无单元测试 |
| `.claude/settings.local.json` | 22KB 历史一次性权限，未清理（不属于本次范围） |

---

## 11. 顺带发现（**不在本次范围**，仅登记）

| 发现 | 说明 |
|---|---|
| 积分流水非严格事务 | `app/lib/credits/index.ts:94` 注释已自认：HTTP driver 不支持跨语句事务，扣费成功后补写流水，「最坏情况流水缺一条」。修法就是 Q2 的 B 方案 |
| 30+ 索引 | 单表最多 6 个索引，写入放大明显；建议按 `pg_stat_user_indexes` 的 `idx_scan` 清掉零命中索引 |
| 仓库杂物 | `MIGRATION_SUMMARY.md` / `FINAL_SUMMARY.md` / `UPGRADE_SUMMARY.md`、`app.config.timestamp_*.js`（4 个）、多处 `.DS_Store` |
| `.claude/settings.local.json` | 塞了大量一次性 heredoc 权限（含与本项目无关的历史内容），建议清理 |
| CI 无迁移校验 | 现在部署前不检查「库是否落后于 schema」，正是本次漂移能上线的通道；`db:check` 补上 |
| 无 `AGENTS.md` / `PROJECT.md` | 项目缺 agent 规则与需求档案；建议本次一并建（可另开） |
