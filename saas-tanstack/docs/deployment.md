# 部署指南

模板部署到 Cloudflare Workers，数据库用 Neon（PostgreSQL）。
数据库的运维细节（连接串分工、迁移、备份、排障）见 [database.md](./database.md)。

## 1. 前提

| 项 | 要求 |
|---|---|
| Node.js | ≥ 24（仓库有 `.nvmrc`） |
| Neon 账号 | 免费计划即可 |
| Cloudflare 账号 | Workers 免费计划即可；R2 / Email Service 需要相应权限 |
| 命令行 | `npm i -g neon` 与 `wrangler`（作为 devDependency 已装） |

## 2. 本地开发

```bash
cd saas-tanstack
npm install

cp .env.example .env.local
# 用 Neon CLI 自动填连接串（不要手拼）
neon link --project-id <project-id> --branch main
neon env pull

npm run db:check     # 确认库与迁移文件一致
npm run db:migrate   # 库落后时应用迁移
npm run dev          # http://localhost:3000
```

> **跨境访问注意**：本机到 Neon 的直连在建连阶段可能抖到十几秒，
> 而 Node 的 undici 默认 10s 超时。若频繁出现 `UND_ERR_CONNECT_TIMEOUT`，
> 带代理启动：`HTTPS_PROXY=http://127.0.0.1:7890 NODE_USE_ENV_PROXY=1 npm run dev`

## 3. Neon 准备

```bash
neon projects create --name <name> --region-id aws-ap-southeast-1   # 区域创建后不可改
neon link --project-id <project-id> --branch main
neon env pull        # 同时写入 DATABASE_URL（池化）与 DATABASE_URL_UNPOOLED（直连）
npm run db:migrate
```

两个连接串分工不同，别混用：应用用池化，迁移/备份用直连。见 [database.md](./database.md)。

## 4. 部署到 Cloudflare Workers

### 4.1 构建与部署

```bash
npm run build:cf     # tsc --noEmit && vite build
wrangler deploy
```

入口是 [`worker/index.ts`](../worker/index.ts)，不是构建产物本身——原因见该文件注释。

### 4.2 设置运行时机密

```bash
wrangler secret put DATABASE_URL      # 池化端点（-pooler），不是直连
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put ADMIN_EMAILS      # 逗号分隔，不配则后台对所有人关闭
```

`DATABASE_URL_UNPOOLED` **不要**注入 Worker：它只给迁移和 CI 用。

### 4.3 构建期变量（非机密）

`VITE_*` 会被内联进产物，所以必须在**构建时**就存在：

| 变量 | 例 |
|---|---|
| `VITE_APP_URL` | `https://your-domain.com`（决定 OAuth 回调、支付跳转、canonical/sitemap 的绝对 URL） |
| `VITE_PAYMENT_PROVIDERS` | `stripe` 或 `stripe,creem,paypal` |
| `VITE_STRIPE_*` / `VITE_CREEM_*` / `VITE_PAYPAL_*` | 各渠道的价格 / 商品 ID |

本地构建：直接写进 `.env.local`。CI：配成仓库 Variables。

### 4.4 CI 自动部署

`.github/workflows/deploy.yml`：

1. **verify**（PR 也跑）：`npm ci` → `audit` → `types:cf` → `type-check` → `lint` → `test`
2. **deploy**（仅 main 分支）：先 `db:check`（库落后于迁移文件就不部署），再构建、部署

需要的仓库配置：

| 类型 | 名称 | 说明 |
|---|---|---|
| Secret | `CF_API_TOKEN` | 权限：`Workers Scripts:Edit` + `Account:Read` |
| Secret | `CF_ACCOUNT_ID` | 账号 ID（`wrangler whoami` 可查） |
| Secret | `DATABASE_URL_UNPOOLED` | 迁移检查用，仅 CI |
| Variable | `VITE_APP_URL`、`VITE_PAYMENT_PROVIDERS`、各渠道商品 ID | 构建期内联 |

> **token 会失效**。CI 报 `Authentication error [code: 10000]` 时，
> 去 Cloudflare Dashboard 重新生成 API Token 并更新该 secret。

## 5. 第三方配置

### 5.1 Stripe

1. Dashboard → Developers → API Keys：拿 Secret Key / Publishable Key
2. Products → 为每个套餐建产品与价格，记下 `price_...`
3. Webhooks → 添加端点 `https://your-domain.com/api/webhook/stripe`，
   勾选 `checkout.session.completed`、`customer.subscription.updated`、
   `customer.subscription.deleted`

结账只接收 `priceId`，金额与套餐由服务端映射，前端传什么金额都不影响扣款。

### 5.2 Creem / PayPal

Webhook 端点分别是 `/api/webhook/creem` 和 `/api/webhook/paypal`。
PayPal 必须设 `PAYPAL_WEBHOOK_ID`，否则回调会被直接拒绝（不验签等于门户大开）；
`PAYPAL_MODE` 显式设为 `sandbox` 或 `live`，不要依赖 `NODE_ENV`。

### 5.3 Google OAuth

1. Google Cloud Console 建项目 → APIs & Services → Credentials → OAuth client ID（Web application）
2. **已授权的重定向 URI 填**：`<VITE_APP_URL>/auth-callback`

> ⚠️ 是 `/auth-callback`（中划线），**不是** `/auth/callback`。填错会得到
> `redirect_uri_mismatch`，而且报错页面不会告诉你是路径写错了。

## 6. 自定义域名

1. 域名接入 Cloudflare
2. Workers & Pages → 选中该 Worker → Settings → Domains & Routes → Add custom domain
3. 把 `VITE_APP_URL` 改成新域名并**重新构建**（它被内联进产物），重新部署
4. 同步更新 Google 的授权回调地址与各渠道的 webhook 地址

## 7. 排障

| 现象 | 原因 | 处置 |
|---|---|---|
| 全站 500，日志 `No database connection string was provided to neon()` | `compatibility_date` < 2025-04-01，`process.env` 是空对象 | 把 `wrangler.toml` 的 `compatibility_date` 提到 2026-09-07 后重新部署 |
| 注册/登录报错，日志 `Pbkdf2 failed: iteration counts above 100000` | PBKDF2 迭代数超过 Workers 上限 | 保持 `app/lib/auth/password.ts` 的 `ITERATIONS = 100_000` |
| CI 报 `Authentication error [code: 10000]` | `CF_API_TOKEN` 失效 | 重新生成并更新 secret |
| `npm run db:migrate` 报「relation already exists」 | 库是 `db:push` 建的，迁移记录为空 | `npm run db:baseline` 后再 migrate |
| 本地 `UND_ERR_CONNECT_TIMEOUT` | 跨境建连抖动 + undici 10s 超时 | 带代理启动（见第 2 节） |

## 8. 上线检查清单

- [ ] `npm run db:check` 通过（库与迁移文件一致）
- [ ] `wrangler secret list` 里 `DATABASE_URL` 指向**池化**端点
- [ ] `ADMIN_EMAILS` 已配置（不配则后台对所有人关闭）
- [ ] `MAIL_PROVIDER` 从 `console` 换成真实服务商
- [ ] 隐私政策 / 服务条款占位文本已替换
- [ ] `VITE_APP_URL` 与线上域名一致，且部署前重新构建过
- [ ] 三个渠道的 webhook 端点都能收到回调（在 Dashboard 里看投递记录）
- [ ] 走一遍：注册 → 登录 → 跑工具扣积分 → 登出 → 重登
