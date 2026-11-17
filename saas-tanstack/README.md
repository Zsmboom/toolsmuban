# 工具站模板 (TanStack Start + Cloudflare Workers)

一套可直接复制的工具站底座：登录、积分计费、三家支付、后台、SEO 全部就位。
搭新站时你只需要替换文案配置、写自己的工具逻辑。

## 技术栈

- **框架**：TanStack Start + TanStack Router（SSR）
- **UI**：React 19 + Tailwind CSS v4
- **数据库**：Neon (PostgreSQL) 或 Cloudflare D1 (SQLite)，一条命令切换
- **存储**：Cloudflare R2（工具产物）
- **支付**：Stripe / Creem / PayPal（可任选启用）
- **部署**：Cloudflare Workers

## 快速开始

需要 Node.js 24 和 npm 11。项目根目录的 `.nvmrc` 可用于切换版本。

```bash
nvm use
npm install
cp .env.example .env.local   # 填好 DATABASE_URL 等
npm run db:push              # 建表
npm run dev                  # http://localhost:3000
```

改动 `wrangler.toml` 或 `.env.example` 的变量/binding 后，执行
`npm run types:cf:generate`，并提交更新后的 `worker-configuration.d.ts`；
CI 会用无密钥的示例环境检查它是否同步。

## 搭一个新工具站要改哪些地方

按这个顺序改，改完就是一个完整的站：

| 要改的东西 | 文件 |
|---|---|
| 站名、slogan、描述、OG、联系邮箱 | `app/lib/site-config.ts` |
| 套餐价格、额度、各渠道商品 ID | `app/lib/payments/plans.ts` |
| 工具清单与每次消耗的积分 | `app/lib/tools/registry.ts` |
| **工具的实际实现** | `app/lib/tools/server-fns.ts` 里的 `handlers` |
| 数据库服务商 | `npm run db:use neon\|d1` |
| 全站文案（中英） | `app/messages/en.json`、`zh.json` |
| 启用哪些语言 | `app/lib/i18n.ts` 的 `ENABLED_LOCALES` |
| 首页各区块内容 | `app/components/marketing/*` |
| 文章 | `app/lib/blog.ts` |
| 收录范围 | `site-config.ts` 的 `publicRoutes`（sitemap 自动生成） |
| 隐私政策 / 服务条款正文 | `app/components/marketing/legal-page.tsx` |
| 邮件服务商 | `.env` 的 `MAIL_PROVIDER` |
| 管理员名单 | `.env` / secret 的 `ADMIN_EMAILS` |
| OG 图 | `public/og-image.png`（1200×630，源文件 `og-image.svg`） |
| favicon | `public/favicon.svg` |

### 接入自己的工具能力

计费链路（鉴权 → 扣积分 → 执行 → 失败退款 → 写流水）已经封装好，
换成图片生成之类的能力时，只动 handler 本身：

```ts
// app/lib/tools/server-fns.ts
const handlers: Record<ToolId, (input: string) => Promise<string>> = {
  demo: async (input) => {
    const res = await fetch('https://your-model-api/generate', { ... });
    return (await res.json()).url;
  },
};
```

在 `registry.ts` 里加一条就是加一个工具：

```ts
export const TOOLS = {
  imageGen: { id: 'imageGen', nameKey: 'imageGenName', descriptionKey: 'imageGenDesc', cost: 10, requiresAuth: true },
} satisfies Record<string, ToolDefinition>;
```

## 数据库：Neon 还是 D1

模板同时支持两家，**建站时选一个**：

```bash
npm run db:use d1      # Cloudflare D1 (SQLite)
npm run db:use neon    # Neon (PostgreSQL)   ← 默认
```

这条命令只改四个「切换点」（驱动 import、schema re-export、方言标记、drizzle 配置），
业务代码一行都不动。切换后重新生成迁移即可。

### 怎么选

|  | D1 | Neon |
|---|---|---|
| 免费存储 | 5 GB | 0.5 GB |
| 免费读/写 | 500 万行/天 · 10 万行/天 | 按计算时长 |
| 冷启动 | 无 | 有（空闲自动挂起） |
| 出口流量 | 免费 | 有限制 |
| 本地开发 | `npm run dev:cf`（wrangler） | `npm run dev` |
| 可移植性 | 绑定 Cloudflare | 换服务商即可 |

**部署在 Cloudflare、想省事 → D1。** 没有冷启动、不用管第二个服务商、
免费额度大十倍。按当前 schema 算，每次工具调用约写入 14 行（含索引写放大），
10 万行/天≈**7,100 次调用/天**；不够用就上 Workers Paid（$5/月，账号下所有站共享，
写入提到 5000 万/月）。

**需要 pgvector / 全文检索 / 复杂分析 SQL，或不想绑定 Cloudflare → Neon。**

### 维护两份 schema

方言绑定的关系，表结构必须写两份：`schema.pg.ts` 和 `schema.sqlite.ts`。
**改了一边一定要改另一边** —— `schema-parity.test.ts` 会逐表比对表名、列名、
notNull、主键、默认值、索引、唯一约束、外键数量，漏改直接测试失败。
CI 还会把没启用的那个服务商也跑一遍类型检查和测试。

方言差异的 SQL 统一收在 `app/lib/db/dialect.ts`（目前只有日期格式化和 `MAX/GREATEST`
两处），业务代码里不要直接写某一家的专有函数。

## 管理员

**谁是管理员由部署配置决定，不由数据库字段决定。**

```bash
wrangler secret put ADMIN_EMAILS
# 输入：you@example.com,partner@example.com
```

本地开发写进 `.env.local`。登录时会按这份名单同步 `users.role`，
后台的每个接口再做**双重校验**：`role === 'admin'` **且**邮箱仍在名单里。

这样设计的原因：就算有人通过某种途径把数据库里的 role 改成了 admin，
只要邮箱不在你配置的名单里照样进不去；把某人从名单移除后，他即使还持有
有效 session，下一次请求也会被立刻挡住。

> 没配 `ADMIN_EMAILS` 时后台对所有人关闭（`NO_ADMINS_CONFIGURED`）。
> 这是故意的 —— 宁可锁死也不默认放行。

后台页面：概览 / 用户 / 订阅 / 支付 / 日志 / 分析。**每一个写操作都会写入
`admin_audit_logs`**（谁、什么时候、对谁、做了什么、IP），可在「Logs」页查看。

## 工具产物存储（R2）

图片、文件类工具的产物存 R2：免费 10 GB + **出口流量全免**。

```ts
import { putObject } from '~/lib/storage';

const { url } = await putObject({
  userId, toolId: 'imageGen', body: pngBytes, contentType: 'image/png', ext: 'png',
});
```

对象 key 带 userId 前缀，删号时可以按前缀批量清理。建议给桶绑自定义域名并设置
`R2_PUBLIC_BASE_URL`，这样文件由 R2 直接返回，不经过 Worker；没配的话回落到
`/api/files/<key>` 由 Worker 代理。

## 邮件

发信做成了可替换的适配层，业务只调 `~/lib/mail`：

```bash
MAIL_PROVIDER=console     # 不真发信，把链接打到控制台（默认）
MAIL_PROVIDER=cloudflare  # Cloudflare Email Service
MAIL_PROVIDER=resend      # Resend
```

**默认是 `console`** —— 克隆下来不配任何邮件服务，「找回密码」和「验证邮箱」
两条流程就能完整跑通，链接直接从终端复制。接真实服务商只是加一个几十行的
`providers/*.ts`。

### 各家怎么选

| | 说明 |
|---|---|
| **Cloudflare Email Service** | 不用引第三方。**但发信功能仅 Workers Paid 计划**（公测中）。你若本来就为 D1 额度上了付费计划，这是最省事的。 |
| **Resend** | 纯 HTTP API，Workers 上零兼容问题。 |
| 其他（Brevo / SES / MailerSend…） | 加个 provider 文件即可。 |

> 挑服务商时，**免费额度多半按账号算而不是按站点算** —— 用这个模板开 10 个站
> 时要除以 10。另外确认免费版能绑几个发信域名，有些只给 1 个。
> Workers 跑不了 Node 的 SMTP 库，**必须选有 HTTP API 的**。

### 两条流程

- **找回密码**：`/forgot-password` → 邮件 → `/reset-password?token=` → 改密后
  **踢掉该用户所有旧会话**
- **验证邮箱**：注册后自动发信 → `/verify-email?token=`

令牌**在数据库里存的是 sha256 哈希，原文只在邮件里**。即使库被读取也无法用来
重置任何人的密码。令牌一次性、重置 1 小时过期、验证 24 小时过期。
找回密码接口无论邮箱是否存在都返回同一句话，避免被当成账号枚举器。

## 架构上几个要留意的约定

**别在路由 loader 里直接 import `~/lib/db`。**
loader 是同构的，顶层 import 数据库会把 Neon 驱动和整套表结构打进浏览器 bundle。
数据一律走 `createServerFn`（见 `app/lib/account/server-fns.ts`）。

**`*-server-fns.ts` 只放 `createServerFn`。**
这类模块在客户端构建时会被整体替换成 RPC 存根；一旦混入普通导出函数，
整个模块（含 `db`）就会进入前端产物。普通的 Request handler 放在
`*-webhooks.ts`，由 api 路由动态 `import()`。

**积分扣减必须是单条带条件的 UPDATE。**
`UPDATE ... WHERE balance >= cost RETURNING` 的原子性在两家都成立
（Postgres 靠行锁，SQLite/D1 写操作本身串行）。先 SELECT 再 UPDATE
在并发下会把余额扣成负数。
注意 neon-http 和 D1 都不支持跨语句事务，需要严格一致时 Neon 可换 WebSocket 驱动。

**webhook 必须去重。**
三家渠道都会重投，`webhook_events` 表的 `(provider, event_id)` 唯一约束是闸门，
少了它一次付款会被开通多次。

## 支付配置

三家渠道通过 `VITE_PAYMENT_PROVIDERS=stripe,creem,paypal` 控制启用哪些。
每家都要在后台把 webhook 指到对应端点：

| 渠道 | webhook 端点 |
|---|---|
| Stripe | `/api/webhook/stripe` |
| Creem | `/api/webhook/creem` |
| PayPal | `/api/webhook/paypal` |

Google OAuth 的「已授权重定向 URI」填 `<VITE_APP_URL>/auth-callback`。

## 部署到 Cloudflare Workers

```bash
npm run build:cf
npm run deploy:cf
```

机密用 `wrangler secret put <NAME>` 设置（清单见 `wrangler.toml` 注释）；
非机密的商品 ID / 站点地址通过 CI 的 repository variables 注入，见
`.github/workflows/deploy.yml`。

> `compatibility_date` 必须 ≥ `2025-04-01`。早于这个日期时 `nodejs_compat`
> 不会自动填充 `process.env`，而全站配置都从 `process.env` 读，会导致线上全挂。

## 配色

全站颜色都走 `app/styles/globals.css` 里的 `@theme` 语义 token
（`primary` / `success` / `warning` / `destructive` / `info` / `muted` /
`border` / `overlay` …）。**换配色只改这一个文件。**

ESLint 里有一条规则禁止硬编码 Tailwind 调色板颜色（`bg-blue-500` 这类），
写了会直接报错 —— 保证换肤时不会有漏网之鱼。

## 命令

```bash
npm run dev          # 开发
npm run build:cf     # 类型检查 + 构建
npm run type-check   # 仅类型检查
npm run lint
npm test
npm run dev:cf       # 用 wrangler 跑真实 workerd（D1 / R2 本地开发必须走这个）
npm run db:use d1    # 切换数据库服务商
npm run db:generate  # 改完 schema 生成迁移
npm run db:push
```

## 多语言

URL 结构是**默认语言不带前缀，其他语言带前缀**：

```
/pricing        → en（默认语言）
/zh/pricing     → zh
```

实现靠 TanStack Router 的可选路径段 `{-$locale}`：公开页面都在
`app/routes/{-$locale}/` 下，同一份路由同时匹配两种 URL，不用维护两套路由树。

**第一版只启用了英语。** 要开中文，改一行：

```ts
// app/lib/i18n.ts
export const ENABLED_LOCALES: readonly Locale[] = ['en', 'zh'];
```

改完即刻生效，不需要动任何路由或链接 —— 导航链接会自动带上当前语言前缀，
canonical / hreflang / sitemap 也会自动补齐多语言版本。翻译文件
（`app/messages/*.json`）本身已经是完整的中英双份。

只启用一种语言时：带前缀的 URL 返回 404、语言切换器不渲染、
sitemap 只输出默认语言、页面不输出 alternate 标签。

写链接时注意用路由 id 而不是字面路径：

```tsx
<Link to="/{-$locale}/pricing">Pricing</Link>   // ✓ 自动带前缀
<Link to="/pricing">Pricing</Link>              // ✗ 类型报错
```

私有页面（`/login` `/dashboard` `/tools` `/admin`）不做多语言 URL，它们是
noindex 的，没有 SEO 价值。

## 已知限制

- 生产环境需要把 `MAIL_PROVIDER` 从 `console` 换成真实服务商，否则不会真的发信。
- **Google OAuth 的真实往返尚未端到端验证过**（需要你自己的 client id/secret）。
  代码里 state + PKCE + 邮箱已验证校验都在，但没跑过真实授权。
- 只有切换到 D1 时，才取消 `wrangler.toml` 中 `[[d1_databases]]` 的注释，
  并把 `database_id` 换成 `wrangler d1 create` 返回的真值。
  注意本地 D1 状态是按 database_id 存的，改完之后本地库会变空，重跑一次
  `wrangler d1 migrations apply saas-db --local` 即可。
- Stripe SDK 锁在 v14（对应 API 版本 `2023-10-16`）。
- 使用 R2 存储工具产物前，先创建桶，再取消 `wrangler.toml` 中
  `[[r2_buckets]]` 的注释。
- 隐私政策与服务条款是占位文本，上线前必须替换。
