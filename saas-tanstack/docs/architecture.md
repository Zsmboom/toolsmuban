# Architecture

`saas-tanstack` 是一个可直接复制的工具站底座：登录、积分计费、三家支付渠道、
后台与 SEO 全部就位，替换文案与工具实现即可上线。

## Technology Stack

| 层 | 选型 |
|---|---|
| 框架 | TanStack Start + TanStack Router（SSR，`createServerFn` 做服务端调用） |
| UI | React 19 + Tailwind CSS v4 |
| 数据库 | **Neon (PostgreSQL)** + Drizzle ORM，迁移文件在 `drizzle/pg/` |
| 存储 | Cloudflare R2（工具产物，可选） |
| 支付 | Stripe / Creem / PayPal（按需启用） |
| 邮件 | console / Cloudflare Email Service / Resend |
| 部署 | Cloudflare Workers（`worker/index.ts` 为入口） |

数据库相关的操作口径见 [database.md](./database.md)。

## 目录结构

```
app/
├── components/        # 展示组件（marketing / dashboard / admin / ui）
├── lib/
│   ├── auth/          # 登录、会话、密码、OAuth
│   ├── credits/       # 积分账户、扣减、退款、流水
│   ├── db/            # 驱动、schema、方言、惰性入口
│   ├── payments/      # 三家渠道的 api / server-fns / webhooks / sync
│   ├── admin/         # 后台鉴权与审计
│   ├── mail/          # 邮件服务商适配
│   ├── storage/       # R2
│   └── tools/         # 工具注册表与执行入口
├── routes/            # 路由（含 sitemap.xml、robots.txt）
└── messages/          # 中英文案（键必须对齐）
worker/index.ts        # Workers 入口（只透出 default handler）
scripts/db.mjs         # 数据库命令统一入口
```

## 服务端调用

TanStack Start 用 `createServerFn` 代替传统 API 路由：类型安全的 RPC、
自动序列化、统一错误处理。所有需要鉴权或访问数据库的逻辑都必须放在
`handle` 里，**不要**在路由 loader 顶层 import 数据库——loader 是同构的，
顶层 import 会把 Neon 驱动打进浏览器 bundle。

## 鉴权

### Google OAuth

1. 客户端调 `googleLoginRedirectFn` 拿到授权 URL（含 state + PKCE）
2. 跳转 Google → 回调 `/auth-callback`（中划线）
3. 服务端换 token，校验邮箱已验证，`accounts.provider_account_id` 唯一约束防止重复行
4. 建 session，写 `httpOnly + sameSite=lax + secure` cookie

### 邮箱密码

`password_hash`（scrypt）+ 失败锁定：连续 5 次失败锁 15 分钟
（`failed_login_attempts` / `locked_until`）。

### 后台

**谁是管理员由部署配置决定，不由数据库字段决定。** `requireAdmin()` 双校验：
数据库 `role = 'admin'` **且** 邮箱在 `ADMIN_EMAILS` 里。把某人从名单删掉后，
即使他仍持有有效 session，下一个请求就会被挡住。

后台每个写操作都写 `admin_audit_logs`。

## 计费

### 支付

1. 客户端只传 `priceId`，**金额与套餐由服务端决定**（`assertKnownProductId`）
2. 服务端创建 Checkout，metadata 带 `userId` / `plan`
3. 用户在渠道完成支付
4. 渠道回调 `/api/webhook/<provider>`，**验签后才处理**
5. 处理前先往 `webhook_events` 插一条，`(provider, event_id)` 唯一约束冲突即视为重复事件
6. 更新 `subscriptions` / `payments` / `credits`

**开通与入账只由验签后的 webhook 触发**，success 页面不发货。

### 积分

扣减用单条 SQL 保证原子性：

```sql
UPDATE credits SET balance = balance - :cost ...
WHERE user_id = :id AND balance >= :cost
RETURNING balance
```

影响行数为 0 即余额不足，避免「先读后写」的竞态。工具执行失败会退款并记流水。

**已知限制**：neon-http 驱动不支持跨语句事务，扣减成功后的流水与用量日志是
补写的，极端情况下可能缺一条流水（余额本身不会错）。需要严格一致时改用
Cloudflare Hyperdrive + `node-postgres`。

## 数据模型

| 表 | 用途 |
|---|---|
| `users` | 账号、角色、UTM/来源追踪、登录锁定 |
| `accounts` | OAuth 账号（`provider + provider_account_id` 唯一） |
| `sessions` | 会话 |
| `verification_tokens` | 邮箱验证等一次性令牌 |
| `subscriptions` | 订阅（`provider_id` 唯一，供 upsert） |
| `payments` | 支付记录（`provider + provider_id` 唯一） |
| `credits` | 积分余额与月度额度 |
| `credit_transactions` | 积分流水（余额快照 `balance_after`） |
| `tool_usage_logs` | 工具调用日志 |
| `country_stats` | 国家维度聚合 |
| `webhook_events` | webhook 幂等去重 |
| `admin_audit_logs` | 后台操作留痕 |

## 部署

- 构建：`npm run build:cf`（先 `tsc --noEmit` 再 `vite build`）
- 入口：[`worker/index.ts`](../worker/index.ts) 只透出 default，避免 TanStack Start
  的内部具名导出被 Workers 当作 Durable Object 校验
- `compatibility_date` 必须 ≥ 2025-04-01（本项目 2026-09-07）：更早的日期下
  `process.env` 是空对象，Neon 驱动会拿不到连接串
- CI：`.github/workflows/deploy.yml`，verify 通过才部署，部署前跑 `db:check`

## 安全要点

| 面 | 做法 |
|---|---|
| 输入校验 | Zod / `validator`，边界处全部校验 |
| SQL 注入 | 全量走 Drizzle 参数化 |
| XSS | React 默认转义；不渲染用户提供的 HTML |
| 密钥 | 只在 `.env.local` 与 Worker secret，从不入库；`.gitignore` 已挡 `.env*.bak*` |
| webhook | 验签 + 数据库唯一约束幂等 |
| 金额 | 服务端计算，前端传的只当意图 |
| 会话 | httpOnly + sameSite=lax + secure |

## 已知限制

- 生产必须把 `MAIL_PROVIDER` 从 `console` 换成真实服务商
- Google OAuth 的真实往返尚未端到端验证（代码里 state + PKCE + 邮箱校验齐备）
- Stripe SDK 锁在 v14（API 版本 `2023-10-16`）
- 隐私政策与服务条款是占位文本
- `credits` / `admin` / `payments` 的 webhook 与 sync 链路目前没有单元测试
