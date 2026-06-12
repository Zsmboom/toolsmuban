# SaaS Template - TanStack Start 重构指南

## 📋 项目概述

本项目是一个功能完备的 SaaS 模板，当前基于 Next.js 15 构建，计划重构为 TanStack Start 并部署到 Cloudflare Workers。

### 当前技术栈
- **框架**: Next.js 15 (App Router)
- **UI**: React 19 + Tailwind CSS + shadcn/ui
- **数据库**: Turso (LibSQL) + Drizzle ORM
- **认证**: NextAuth v5 (beta) + Google OAuth
- **支付**: Stripe + PayPal
- **国际化**: next-intl (en/zh)
- **部署**: Vercel

### 目标技术栈
- **框架**: TanStack Start + TanStack Router
- **UI**: React 19 + Tailwind CSS + shadcn/ui (保持不变)
- **数据库**: Turso + Drizzle ORM (保持不变)
- **认证**: 自定义 Auth 或 Better Auth
- **支付**: Stripe + PayPal (保持不变)
- **国际化**: 自定义 i18n 方案
- **部署**: Cloudflare Workers

---

## 🚀 重构阶段

### 阶段 1: 基础架构搭建
1. 创建 TanStack Start 项目
2. 配置 TypeScript、Tailwind CSS
3. 设置文件路由系统
4. 配置 Cloudflare Workers 部署

### 阶段 2: 核心功能迁移
1. 数据库层迁移（Drizzle + Turso）
2. 认证系统重构
3. 支付系统迁移
4. 积分系统迁移

### 阶段 3: UI 和页面迁移
1. 布局系统重构
2. 营销页面迁移
3. 仪表盘迁移
4. 管理后台迁移

### 阶段 4: API 和服务器逻辑
1. Server Functions 实现
2. Webhook 处理
3. 外部 API 集成

### 阶段 5: 测试和优化
1. 功能测试
2. 性能优化
3. 部署验证

---

## 📚 关键技术决策

### 1. 路由系统
**选择**: TanStack Router 文件路由

**理由**:
- 与 Next.js App Router 类似的文件结构
- 类型安全的路由
- 内置的路由守卫和中间件支持

**示例结构**:
```
app/
  routes/
    _layout.tsx              # 根布局
    index.tsx                # 首页
    pricing.tsx              # 定价页
    _auth/
      login.tsx              # 登录页
    _dashboard/
      index.tsx              # 仪表盘首页
      settings.tsx           # 设置页
    admin/
      index.tsx              # 管理后台
```

### 2. 认证方案
**选择**: 自定义 Auth + Lucia 或 Better Auth

**理由**:
- NextAuth v5 对 Cloudflare 支持不完善
- Better Auth 提供更好的边缘计算支持
- 或者完全自定义认证逻辑

**替代方案**:
- Better Auth: https://better-auth.com
- Lucia: https://lucia-auth.com

### 3. 国际化
**选择**: 自定义 i18n 方案

**理由**:
- next-intl 与 Next.js 强耦合
- 可以使用 i18next 或自定义方案
- 基于 URL 前缀的语言路由需要自定义实现

**实现思路**:
```typescript
// lib/i18n.ts
export const locales = ['en', 'zh'] as const;
export type Locale = typeof locales[number];

export function getLocaleFromUrl(url: string): Locale {
  const path = new URL(url).pathname;
  if (path.startsWith('/zh')) return 'zh';
  return 'en';
}

export async function getTranslations(locale: Locale) {
  const messages = await import(`@/messages/${locale}.json`);
  return messages.default;
}
```

### 4. 服务器函数
**选择**: TanStack Start 的 `createServerFn`

**理由**:
- 原生支持
- 类型安全
- 自动序列化/反序列化
- 支持边缘计算

**示例**:
```typescript
// app/routes/api/auth/login.ts
import { createServerFn } from '@tanstack/start';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const login = createServerFn({ method: 'POST' })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    // 登录逻辑
    return { success: true };
  });
```

### 5. 部署配置
**选择**: Cloudflare Workers

**配置文件**:
```typescript
// app.config.ts
import { defineConfig } from '@tanstack/start/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    preset: 'cloudflare-workers',
    rollupConfig: {
      external: ['node:async_hooks'],
    },
  },
});
```

---

## 📂 目录结构映射

### 当前结构 (Next.js)
```
app/
  api/                    # API Routes
  [locale]/               # 国际化路由
    (marketing)/          # 营销页面
    (auth)/               # 认证页面
    dashboard/            # 仪表盘
    admin/                # 管理后台
lib/
  auth/                   # 认证配置
  db/                     # 数据库
  payments/               # 支付
components/
  ui/                     # UI 组件
  layout/                 # 布局组件
  marketing/              # 营销组件
  dashboard/              # 仪表盘组件
  admin/                  # 管理后台组件
messages/                 # 翻译文件
```

### 目标结构 (TanStack Start)
```
app/
  routes/                 # 路由文件
    index.tsx             # 首页
    pricing.tsx           # 定价页
    about.tsx             # 关于页
    privacy.tsx           # 隐私政策
    terms.tsx             # 服务条款
    blog/
      index.tsx           # 博客列表
      $slug.tsx           # 博客详情
    _auth/
      login.tsx           # 登录页
      auth-error.tsx      # 认证错误
    _dashboard/
      index.tsx           # 仪表盘首页
      history.tsx         # 使用历史
      tools.tsx           # 工具页
      settings.tsx        # 设置页
    admin/
      index.tsx           # 管理后台
      users.tsx           # 用户管理
      logs.tsx            # 日志查看
      subscriptions.tsx   # 订阅管理
      analytics/
        countries.tsx     # 国家分析
    api/
      auth/
        login.ts          # 登录 API
        register.ts       # 注册 API
        logout.ts         # 登出 API
      stripe/
        checkout.ts       # Stripe 结账
        portal.ts         # Stripe 门户
        webhooks.ts       # Stripe Webhooks
      paypal/
        create-order.ts   # PayPal 创建订单
        capture.ts        # PayPal 捕获支付
        webhooks.ts       # PayPal Webhooks
      user/
        credits.ts        # 用户积分
        profile.ts        # 用户资料
lib/
  auth/                   # 认证逻辑
  db/                     # 数据库 (保持不变)
  payments/               # 支付逻辑 (保持不变)
  i18n.ts                 # 国际化逻辑
  utils.ts                # 工具函数
components/
  ui/                     # UI 组件 (保持不变)
  layout/                 # 布局组件 (重构)
  marketing/              # 营销组件 (保持不变)
  dashboard/              # 仪表盘组件 (保持不变)
  admin/                  # 管理后台组件 (保持不变)
messages/                 # 翻译文件 (保持不变)
public/                   # 静态资源
```

---

## 🔧 迁移清单

### 1. 基础架构 ✅
- [ ] 创建 TanStack Start 项目
- [ ] 配置 TypeScript (tsconfig.json)
- [ ] 配置 Tailwind CSS
- [ ] 配置 PostCSS
- [ ] 设置路径别名 (@/*)
- [ ] 配置 Cloudflare Workers 部署

### 2. 数据库层 ✅
- [ ] 迁移 Drizzle 配置 (drizzle.config.ts)
- [ ] 迁移数据库 Schema (lib/db/schema.ts)
- [ ] 迁移数据库连接 (lib/db/index.ts)
- [ ] 迁移数据库查询 (lib/db/queries.ts)
- [ ] 测试数据库连接

### 3. 认证系统 🔄
- [ ] 选择认证方案 (Better Auth 或自定义)
- [ ] 实现 Google OAuth 集成
- [ ] 实现会话管理
- [ ] 实现路由守卫
- [ ] 迁移认证中间件逻辑

### 4. 支付系统 ✅
- [ ] 迁移 Stripe 配置
- [ ] 迁移 PayPal 配置
- [ ] 实现 Server Functions (替代 API Routes)
- [ ] 实现 Webhook 处理
- [ ] 测试支付流程

### 5. 积分系统 ✅
- [ ] 迁移积分配置
- [ ] 迁移积分查询逻辑
- [ ] 实现积分消费逻辑
- [ ] 测试积分系统

### 6. 国际化 🔄
- [ ] 实现自定义 i18n 方案
- [ ] 实现语言路由 (/en/..., /zh/...)
- [ ] 迁移翻译文件
- [ ] 实现语言切换组件
- [ ] 测试国际化功能

### 7. UI 和页面 🔄
- [ ] 迁移根布局
- [ ] 迁移营销页面
  - [ ] 首页 (Hero, Features, Testimonials, Pricing, FAQ, CTA)
  - [ ] 定价页
  - [ ] 关于页
  - [ ] 隐私政策
  - [ ] 服务条款
  - [ ] 博客页面
- [ ] 迁移认证页面
  - [ ] 登录页
  - [ ] 认证错误页
- [ ] 迁移仪表盘
  - [ ] 仪表盘首页
  - [ ] 使用历史
  - [ ] 工具页
  - [ ] 设置页
- [ ] 迁移管理后台
  - [ ] 管理后台首页
  - [ ] 用户管理
  - [ ] 日志查看
  - [ ] 订阅管理
  - [ ] 国家分析

### 8. 组件迁移 ✅
- [ ] 迁移 UI 组件 (shadcn/ui)
- [ ] 迁移布局组件 (navbar, footer, sidebar)
- [ ] 迁移营销组件
- [ ] 迁移仪表盘组件
- [ ] 迁移管理后台组件
- [ ] 迁移支付组件
- [ ] 迁移认证组件
- [ ] 迁移博客组件

### 9. API 迁移 🔄
- [ ] 实现认证 API (login, register, logout)
- [ ] 实现支付 API (Stripe, PayPal)
- [ ] 实现用户 API (credits, profile)
- [ ] 实现工具 API (use)
- [ ] 实现 Webhook 处理

### 10. SEO 和优化 ✅
- [ ] 实现 Sitemap 生成
- [ ] 实现 Robots.txt
- [ ] 实现 Open Graph
- [ ] 实现 JSON-LD Schema
- [ ] 性能优化

### 11. 部署配置 🔄
- [ ] 配置 Cloudflare Workers
- [ ] 配置环境变量
- [ ] 配置域名和 DNS
- [ ] 配置 SSL 证书
- [ ] 测试部署

### 12. 测试 ✅
- [ ] 功能测试
- [ ] 性能测试
- [ ] 安全测试
- [ ] 部署测试

---

## 📖 TanStack Start 学习资源

### 官方文档
- **TanStack Start**: https://tanstack.com/start/latest
- **TanStack Router**: https://tanstack.com/router/latest
- **GitHub**: https://github.com/TanStack/start

### 关键概念

#### 1. 项目结构
```typescript
// app.config.ts - 项目配置
import { defineConfig } from '@tanstack/start/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    preset: 'cloudflare-workers',
  },
});
```

#### 2. 路由系统
```typescript
// app/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return <div>首页</div>;
}
```

#### 3. 服务器函数
```typescript
import { createServerFn } from '@tanstack/start';

export const getUser = createServerFn({ method: 'GET' })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    // 服务器端逻辑
    return { id: userId, name: 'John' };
  });
```

#### 4. 路由守卫
```typescript
// app/routes/_dashboard.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: async () => {
    const user = await getUser();
    if (!user) {
      throw redirect({ to: '/login' });
    }
    return { user };
  },
  component: DashboardLayout,
});
```

#### 5. 布局系统
```typescript
// app/routes/_layout.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_layout')({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div>
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}
```

---

## 🔐 认证方案对比

### 方案 1: Better Auth (推荐)
**优点**:
- 边缘计算友好
- 支持多种数据库
- 内置 OAuth 支持
- 活跃的社区

**缺点**:
- 相对较新
- 文档可能不完善

**安装**:
```bash
npm install better-auth
```

**配置**:
```typescript
// lib/auth.ts
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  database: {
    url: process.env.TURSO_DATABASE_URL,
    token: process.env.TURSO_AUTH_TOKEN,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
```

### 方案 2: 自定义 Auth
**优点**:
- 完全控制
- 更轻量
- 更好的性能

**缺点**:
- 开发成本高
- 需要自己处理安全问题

**实现**:
```typescript
// lib/auth.ts
import { db } from './db';
import { users, sessions } from './db/schema';
import { eq } from 'drizzle-orm';

export async function createSession(userId: string) {
  const sessionToken = generateToken();
  await db.insert(sessions).values({
    sessionToken,
    userId,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  return sessionToken;
}

export async function getSession(sessionToken: string) {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.sessionToken, sessionToken),
    with: { user: true },
  });
  if (!session || session.expires < new Date()) {
    return null;
  }
  return session;
}
```

### 方案 3: Lucia Auth
**优点**:
- 轻量级
- 边缘计算友好
- 灵活的适配器

**缺点**:
- 需要手动实现更多功能

**安装**:
```bash
npm install lucia @lucia-auth/adapter-drizzle
```

---

## ☁️ Cloudflare Workers 部署

### 1. 安装依赖
```bash
npm install wrangler --save-dev
```

### 2. 配置文件
```typescript
// app.config.ts
import { defineConfig } from '@tanstack/start/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    preset: 'cloudflare-workers',
    rollupConfig: {
      external: ['node:async_hooks'],
    },
  },
});
```

### 3. 环境变量
```bash
# .dev.vars (本地开发)
TURSO_DATABASE_URL=your_turso_url
TURSO_AUTH_TOKEN=your_turso_token
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

### 4. 部署命令
```bash
# 构建
npm run build

# 部署到 Cloudflare
npx wrangler deploy
```

### 5. 环境变量配置
在 Cloudflare Dashboard 中配置环境变量：
- 进入 Workers & Pages
- 选择你的 Worker
- 点击 "Settings" -> "Variables"
- 添加环境变量

---

## 📝 迁移示例

### 示例 1: 迁移 API Route 到 Server Function

**当前 (Next.js)**:
```typescript
// app/api/user/credits/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { credits } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userCredits = await db.query.credits.findFirst({
    where: eq(credits.userId, session.user.id),
  });

  return NextResponse.json(userCredits);
}
```

**目标 (TanStack Start)**:
```typescript
// app/routes/api/user/credits.ts
import { createServerFn } from '@tanstack/start';
import { db } from '@/lib/db';
import { credits } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export const getUserCredits = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await getSession();
    if (!session) {
      throw new Error('Unauthorized');
    }

    const userCredits = await db.query.credits.findFirst({
      where: eq(credits.userId, session.user.id),
    });

    return userCredits;
  });
```

### 示例 2: 迁移页面组件

**当前 (Next.js)**:
```typescript
// app/[locale]/(marketing)/pricing/page.tsx
import { getTranslations } from 'next-intl/server';
import PricingCards from '@/components/marketing/pricing-cards';

export default async function PricingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'pricing' });

  return (
    <div>
      <h1>{t('title')}</h1>
      <PricingCards />
    </div>
  );
}
```

**目标 (TanStack Start)**:
```typescript
// app/routes/pricing.tsx
import { createFileRoute } from '@tanstack/react-router';
import { getTranslations } from '@/lib/i18n';
import PricingCards from '@/components/marketing/pricing-cards';

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
  loader: async () => {
    const locale = getLocaleFromUrl(window.location.href);
    const t = await getTranslations(locale, 'pricing');
    return { t };
  },
});

function PricingPage() {
  const { t } = Route.useLoaderData();

  return (
    <div>
      <h1>{t('title')}</h1>
      <PricingCards />
    </div>
  );
}
```

### 示例 3: 迁移中间件到路由守卫

**当前 (Next.js)**:
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 国际化路由
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    const locale = getLocale(request);
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );
  }

  // 认证保护
  if (pathname.includes('/dashboard') || pathname.includes('/admin')) {
    const session = auth();
    if (!session) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  return NextResponse.next();
}
```

**目标 (TanStack Start)**:
```typescript
// app/routes/_dashboard.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { getSession } from '@/lib/auth';

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
    return { session };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { session } = Route.useRouteContext();

  return (
    <div>
      <Sidebar user={session.user} />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

---

## 🎯 关键挑战和解决方案

### 挑战 1: 国际化路由
**问题**: TanStack Router 没有内置的国际化支持

**解决方案**:
```typescript
// app/router.tsx
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

const router = createRouter({
  routeTree,
  // 自定义路径解析
  parseParams: (path) => {
    const segments = path.split('/');
    if (locales.includes(segments[1])) {
      return {
        locale: segments[1],
        ...parseRemainingParams(segments.slice(2)),
      };
    }
    return { locale: 'en', ...parseRemainingParams(segments) };
  },
  // 自定义路径生成
  stringifyParams: (params) => {
    const { locale, ...rest } = params;
    return `/${locale}${generatePath(rest)}`;
  },
});
```

### 挑战 2: 认证状态管理
**问题**: 需要在客户端和服务器端共享认证状态

**解决方案**:
```typescript
// lib/auth/context.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从服务器获取用户信息
    fetchUser().then((user) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 挑战 3: 数据库连接
**问题**: Cloudflare Workers 不支持原生 TCP 连接

**解决方案**: 使用 Turso 的 HTTP 客户端
```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/libsql/http';
import { createClient } from '@libsql/client/http';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client);
```

### 挑战 4: Webhook 处理
**问题**: 需要处理 Stripe/PayPal 的 Webhook 签名验证

**解决方案**:
```typescript
// app/routes/api/stripe/webhooks.ts
import { createServerFn } from '@tanstack/start';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const handleStripeWebhook = createServerFn({ method: 'POST' })
  .handler(async ({ request }) => {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      throw new Error('Invalid signature');
    }

    // 处理不同的事件类型
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      // ... 其他事件
    }

    return { received: true };
  });
```

---

## 📊 性能优化

### 1. 代码分割
TanStack Start 自动进行代码分割，但可以手动优化：
```typescript
// 路由级别代码分割
export const Route = createFileRoute('/dashboard')({
  component: lazy(() => import('./dashboard-component')),
});
```

### 2. 数据预取
```typescript
// 预取数据
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    // 预取数据
    const [user, credits, history] = await Promise.all([
      getUser(),
      getUserCredits(),
      getUsageHistory(),
    ]);
    return { user, credits, history };
  },
  // 预加载下一页数据
  preload: true,
  preloadDelay: 500,
});
```

### 3. 缓存策略
```typescript
// 使用 Cloudflare KV 缓存
const CACHE_TTL = 60 * 60; // 1 小时

export const getCachedData = createServerFn({ method: 'GET' })
  .handler(async () => {
    const cacheKey = 'data:key';
    const cached = await env.KV.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const data = await fetchData();
    await env.KV.put(cacheKey, JSON.stringify(data), {
      expirationTtl: CACHE_TTL,
    });

    return data;
  });
```

---

## 🔒 安全考虑

### 1. CSRF 保护
```typescript
// lib/security/csrf.ts
export function generateCSRFToken() {
  return crypto.randomUUID();
}

export function validateCSRFToken(token: string, sessionToken: string) {
  // 验证 CSRF token
  return token === sessionToken;
}
```

### 2. 输入验证
```typescript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
});

export const createUser = createServerFn({ method: 'POST' })
  .validator(userSchema)
  .handler(async ({ data }) => {
    // 数据已经过验证
    const hashedPassword = await hashPassword(data.password);
    // ...
  });
```

### 3. 速率限制
```typescript
// lib/security/rate-limit.ts
const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string, limit: number = 100) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 分钟

  const record = rateLimit.get(ip);

  if (!record || now > record.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
```

---

## 📚 参考资源

### 官方文档
- [TanStack Start 文档](https://tanstack.com/start/latest)
- [TanStack Router 文档](https://tanstack.com/router/latest)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [Turso 文档](https://docs.turso.tech/)

### 示例项目
- [TanStack Start 示例](https://github.com/TanStack/start/tree/main/examples)
- [Cloudflare Workers 示例](https://developers.cloudflare.com/workers/examples/)

### 社区资源
- [TanStack Discord](https://discord.gg/tanstack)
- [Cloudflare Discord](https://discord.gg/cloudflare)

---

## 🎯 下一步

1. **开始阶段 1**: 创建 TanStack Start 项目并配置基础架构
2. **学习 TanStack Router**: 熟悉路由系统和文件路由
3. **实现认证**: 选择并实现认证方案
4. **逐步迁移**: 按照迁移清单逐步完成迁移
5. **测试和优化**: 全面测试并优化性能

---

## 📞 支持

如果在迁移过程中遇到问题，可以参考：
- TanStack 官方文档和示例
- Cloudflare Workers 文档
- 社区论坛和 Discord

祝你迁移顺利！🚀
