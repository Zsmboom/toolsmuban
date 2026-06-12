# TanStack Start 重构 - 实施计划

## 🚀 快速开始

### 步骤 1: 创建新项目
```bash
# 创建 TanStack Start 项目
npx create-ts-router-app@latest saas-tanstack --template cloudflare

# 进入项目目录
cd saas-tanstack

# 安装依赖
npm install
```

### 步骤 2: 配置项目
```bash
# 安装额外依赖
npm install @tanstack/react-router @tanstack/react-start
npm install tailwindcss @tailwindcss/vite
npm install drizzle-orm @libsql/client
npm install stripe @paypal/checkout-server-sdk
npm install zod date-fns lucide-react
npm install framer-motion recharts

# 开发依赖
npm install -D drizzle-kit wrangler
npm install -D @types/node @types/react @types/react-dom
```

### 步骤 3: 项目结构
创建以下目录结构：
```
saas-tanstack/
├── app/
│   ├── routes/
│   │   ├── index.tsx              # 首页
│   │   ├── pricing.tsx            # 定价页
│   │   ├── about.tsx              # 关于页
│   │   ├── privacy.tsx            # 隐私政策
│   │   ├── terms.tsx              # 服务条款
│   │   ├── blog/
│   │   │   ├── index.tsx          # 博客列表
│   │   │   └── $slug.tsx          # 博客详情
│   │   ├── _auth/
│   │   │   ├── login.tsx          # 登录页
│   │   │   └── auth-error.tsx     # 认证错误
│   │   ├── _dashboard/
│   │   │   ├── index.tsx          # 仪表盘首页
│   │   │   ├── history.tsx        # 使用历史
│   │   │   ├── tools.tsx          # 工具页
│   │   │   └── settings.tsx       # 设置页
│   │   ├── admin/
│   │   │   ├── index.tsx          # 管理后台
│   │   │   ├── users.tsx          # 用户管理
│   │   │   ├── logs.tsx           # 日志查看
│   │   │   ├── subscriptions.tsx  # 订阅管理
│   │   │   └── analytics/
│   │   │       └── countries.tsx  # 国家分析
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login.ts       # 登录 API
│   │       │   ├── register.ts    # 注册 API
│   │       │   └── logout.ts      # 登出 API
│   │       ├── stripe/
│   │       │   ├── checkout.ts    # Stripe 结账
│   │       │   ├── portal.ts      # Stripe 门户
│   │       │   └── webhooks.ts    # Stripe Webhooks
│   │       ├── paypal/
│   │       │   ├── create-order.ts # PayPal 创建订单
│   │       │   ├── capture.ts     # PayPal 捕获支付
│   │       │   └── webhooks.ts    # PayPal Webhooks
│   │       └── user/
│   │           ├── credits.ts     # 用户积分
│   │           └── profile.ts     # 用户资料
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 组件
│   │   ├── layout/                # 布局组件
│   │   ├── marketing/             # 营销组件
│   │   ├── dashboard/             # 仪表盘组件
│   │   ├── admin/                 # 管理后台组件
│   │   ├── payments/              # 支付组件
│   │   └── auth/                  # 认证组件
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── index.ts           # 认证逻辑
│   │   │   └── providers.ts       # OAuth 提供者
│   │   ├── db/
│   │   │   ├── index.ts           # 数据库连接
│   │   │   ├── schema.ts          # 数据库 Schema
│   │   │   └── queries.ts         # 数据库查询
│   │   ├── payments/
│   │   │   ├── stripe.ts          # Stripe 逻辑
│   │   │   └── paypal.ts          # PayPal 逻辑
│   │   ├── i18n.ts                # 国际化
│   │   └── utils.ts               # 工具函数
│   ├── messages/
│   │   ├── en.json                # 英文翻译
│   │   └── zh.json                # 中文翻译
│   ├── styles/
│   │   └── globals.css            # 全局样式
│   ├── app.config.ts              # 应用配置
│   └── router.tsx                 # 路由配置
├── public/                        # 静态资源
├── drizzle.config.ts              # Drizzle 配置
├── wrangler.toml                  # Cloudflare 配置
├── tsconfig.json                  # TypeScript 配置
└── package.json                   # 项目依赖
```

---

## 📝 核心代码示例

### 1. 应用配置 (app.config.ts)
```typescript
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

### 2. 路由配置 (router.tsx)
```typescript
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultStaleTime: 5000,
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
```

### 3. 根路由 (app/routes/__root.tsx)
```typescript
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { AuthProvider } from '@/lib/auth/context';
import '@/styles/globals.css';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
      {process.env.NODE_ENV === 'development' && <TanStackRouterDevtools />}
    </AuthProvider>
  );
}
```

### 4. 首页路由 (app/routes/index.tsx)
```typescript
import { createFileRoute } from '@tanstack/react-router';
import Hero from '@/components/marketing/hero';
import Features from '@/components/marketing/features';
import Testimonials from '@/components/marketing/testimonials';
import PricingCards from '@/components/marketing/pricing-cards';
import FAQ from '@/components/marketing/faq';
import CTA from '@/components/marketing/cta';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <Testimonials />
      <PricingCards />
      <FAQ />
      <CTA />
    </main>
  );
}
```

### 5. 布局路由 (app/routes/_layout.tsx)
```typescript
import { createFileRoute, Outlet } from '@tanstack/react-router';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

export const Route = createFileRoute('/_layout')({
  component: MarketingLayout,
});

function MarketingLayout() {
  return (
    <div>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
```

### 6. 仪表盘布局 (app/routes/_dashboard.tsx)
```typescript
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/context';
import Sidebar from '@/components/layout/sidebar';
import MobileSidebar from '@/components/layout/mobile-sidebar';

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: async () => {
    const { user } = useAuth();
    if (!user) {
      throw redirect({ to: '/login' });
    }
    return { user };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user } = Route.useRouteContext();

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <MobileSidebar user={user} />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
```

### 7. 服务器函数示例 (app/routes/api/user/credits.ts)
```typescript
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

export const updateUserCredits = createServerFn({ method: 'POST' })
  .validator((data: { amount: number; type: string }) => data)
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session) {
      throw new Error('Unauthorized');
    }

    // 更新积分逻辑
    const currentCredits = await db.query.credits.findFirst({
      where: eq(credits.userId, session.user.id),
    });

    if (!currentCredits) {
      throw new Error('Credits not found');
    }

    const newBalance = currentCredits.balance + data.amount;

    await db.update(credits)
      .set({ balance: newBalance })
      .where(eq(credits.userId, session.user.id));

    return { balance: newBalance };
  });
```

### 8. 数据库配置 (lib/db/index.ts)
```typescript
import { drizzle } from 'drizzle-orm/libsql/http';
import { createClient } from '@libsql/client/http';
import * as schema from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
```

### 9. 数据库 Schema (lib/db/schema.ts)
```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: integer('email_verified', { mode: 'timestamp' }),
  image: text('image'),
  role: text('role').default('user'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(new Date()),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  sessionToken: text('session_token').unique(),
  userId: text('user_id').references(() => users.id),
  expires: integer('expires', { mode: 'timestamp' }),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  type: text('type'),
  provider: text('provider'),
  providerAccountId: text('provider_account_id'),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
});

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  plan: text('plan').default('free'),
  status: text('status').default('active'),
  provider: text('provider'),
  providerSubscriptionId: text('provider_subscription_id'),
  currentPeriodStart: integer('current_period_start', { mode: 'timestamp' }),
  currentPeriodEnd: integer('current_period_end', { mode: 'timestamp' }),
  cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(new Date()),
});

export const credits = sqliteTable('credits', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).unique(),
  balance: integer('balance').default(0),
  monthlyQuota: integer('monthly_quota').default(100),
  lastResetAt: integer('last_reset_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(new Date()),
});

export const creditTransactions = sqliteTable('credit_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  amount: integer('amount'),
  type: text('type'),
  description: text('description'),
  metadata: text('metadata'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
});

export const toolUsageLogs = sqliteTable('tool_usage_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  toolType: text('tool_type'),
  creditsUsed: integer('credits_used'),
  duration: integer('duration'),
  ipAddress: text('ip_address'),
  country: text('country'),
  metadata: text('metadata'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  subscription: one(subscriptions),
  credits: one(credits),
  creditTransactions: many(creditTransactions),
  toolUsageLogs: many(toolUsageLogs),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const creditsRelations = relations(credits, ({ one, many }) => ({
  user: one(users, {
    fields: [credits.userId],
    references: [users.id],
  }),
  transactions: many(creditTransactions),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

export const toolUsageLogsRelations = relations(toolUsageLogs, ({ one }) => ({
  user: one(users, {
    fields: [toolUsageLogs.userId],
    references: [users.id],
  }),
}));
```

### 10. 国际化配置 (lib/i18n.ts)
```typescript
export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function getLocaleFromUrl(url: string): Locale {
  const path = new URL(url).pathname;
  const segments = path.split('/');

  if (segments[1] && locales.includes(segments[1] as Locale)) {
    return segments[1] as Locale;
  }

  return defaultLocale;
}

export function getLocaleFromHeaders(headers: Headers): Locale {
  const acceptLanguage = headers.get('accept-language');
  if (!acceptLanguage) return defaultLocale;

  const preferred = acceptLanguage.split(',')[0].split('-')[0];
  if (locales.includes(preferred as Locale)) {
    return preferred as Locale;
  }

  return defaultLocale;
}

export async function getTranslations(locale: Locale, namespace: string) {
  try {
    const messages = await import(`@/messages/${locale}.json`);
    return messages.default[namespace] || {};
  } catch (error) {
    console.error(`Failed to load translations for ${locale}/${namespace}`);
    return {};
  }
}

export function createI18nMiddleware() {
  return async (request: Request) => {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 检查是否已经有语言前缀
    const hasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (!hasLocale) {
      // 从 headers 获取首选语言
      const locale = getLocaleFromHeaders(request.headers);
      url.pathname = `/${locale}${pathname}`;

      return Response.redirect(url.toString(), 302);
    }

    return null; // 继续处理请求
  };
}
```

### 11. 认证配置 (lib/auth/index.ts)
```typescript
import { db } from '@/lib/db';
import { users, sessions, accounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  user: User;
}

export async function hashPassword(password: string): Promise<string> {
  return createHash('sha256').update(password).digest('hex');
}

export async function generateSessionToken(): Promise<string> {
  return randomBytes(32).toString('hex');
}

export async function createSession(userId: string): Promise<string> {
  const sessionToken = await generateSessionToken();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.insert(sessions).values({
    id: randomBytes(16).toString('hex'),
    sessionToken,
    userId,
    expires,
  });

  return sessionToken;
}

export async function getSession(sessionToken: string): Promise<Session | null> {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.sessionToken, sessionToken),
    with: {
      user: true,
    },
  });

  if (!session || session.expires < new Date()) {
    return null;
  }

  return session as Session;
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}

export async function getUserFromGoogle(
  accessToken: string,
  refreshToken: string
): Promise<User> {
  // 获取 Google 用户信息
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const googleUser = await response.json();

  // 查找或创建用户
  let user = await db.query.users.findFirst({
    where: eq(users.email, googleUser.email),
  });

  if (!user) {
    const userId = randomBytes(16).toString('hex');
    await db.insert(users).values({
      id: userId,
      name: googleUser.name,
      email: googleUser.email,
      image: googleUser.picture,
      emailVerified: new Date(),
    });

    // 创建积分账户
    await db.insert(credits).values({
      id: randomBytes(16).toString('hex'),
      userId,
      balance: 100,
      monthlyQuota: 100,
      lastResetAt: new Date(),
    });

    user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
  }

  // 保存 OAuth 账户信息
  await db.insert(accounts).values({
    id: randomBytes(16).toString('hex'),
    userId: user!.id,
    type: 'oauth',
    provider: 'google',
    providerAccountId: googleUser.id,
    accessToken,
    refreshToken,
  });

  return user!;
}
```

### 12. 认证上下文 (lib/auth/context.tsx)
```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './index';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (sessionToken: string) => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = (sessionToken: string) => {
    document.cookie = `session_token=${sessionToken}; path=/; max-age=${30 * 24 * 60 * 60}`;
    fetchUser();
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      document.cookie = 'session_token=; path=/; max-age=0';
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetchUser: fetchUser }}>
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

### 13. Stripe 配置 (lib/payments/stripe.ts)
```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export async function createCheckoutSession(
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
  });

  return session;
}

export async function createPortalSession(userId: string, returnUrl: string) {
  // 获取用户的 Stripe 客户 ID
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  if (!subscription?.providerSubscriptionId) {
    throw new Error('No active subscription found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.providerSubscriptionId,
    return_url: returnUrl,
  });

  return session;
}

export async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  await db.insert(subscriptions).values({
    id: randomBytes(16).toString('hex'),
    userId,
    plan: 'basic',
    status: 'active',
    provider: 'stripe',
    providerSubscriptionId: subscription.id,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  // 更新用户积分配额
  await db.update(credits)
    .set({ monthlyQuota: 500 })
    .where(eq(credits.userId, userId));
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await db.update(subscriptions)
    .set({
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.providerSubscriptionId, subscription.id));
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await db.update(subscriptions)
    .set({
      status: 'canceled',
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.providerSubscriptionId, subscription.id));
}
```

### 14. PayPal 配置 (lib/payments/paypal.ts)
```typescript
import paypal from '@paypal/checkout-server-sdk';

if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  throw new Error('PayPal credentials are not set');
}

const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_CLIENT_SECRET
    )
  : new paypal.core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_CLIENT_SECRET
    );

const client = new paypal.core.PayPalHttpClient(environment);

export async function createOrder(planId: string) {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: getPlanPrice(planId),
        },
        description: `SaaS Template - ${planId} Plan`,
      },
    ],
  });

  const response = await client.execute(request);
  return response.result;
}

export async function captureOrder(orderId: string) {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  const response = await client.execute(request);
  return response.result;
}

export function getPlanPrice(planId: string): string {
  const prices: Record<string, string> = {
    basic: '9.99',
    pro: '29.99',
    enterprise: '99.99',
  };

  return prices[planId] || '0';
}
```

### 15. Cloudflare 配置 (wrangler.toml)
```toml
name = "saas-tanstack"
main = "./dist/server/index.mjs"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[vars]
NODE_ENV = "production"
ENVIRONMENT = "production"

# 使用 Cloudflare KV 存储
[[kv_namespaces]]
binding = "KV"
id = "your_kv_namespace_id"

# 使用 Cloudflare D1 数据库（可选）
# [[d1_databases]]
# binding = "DB"
# database_name = "saas-db"
# database_id = "your_database_id"
```

---

## 🔄 迁移步骤

### 阶段 1: 基础架构 (第 1-2 天)
1. ✅ 创建 TanStack Start 项目
2. ✅ 配置 TypeScript、Tailwind CSS
3. ✅ 设置目录结构
4. ✅ 配置 Cloudflare Workers 部署
5. ✅ 测试基本路由

### 阶段 2: 数据库层 (第 3-4 天)
1. ✅ 迁移 Drizzle 配置
2. ✅ 迁移数据库 Schema
3. ✅ 迁移数据库连接
4. ✅ 迁移数据库查询
5. ✅ 测试数据库操作

### 阶段 3: 认证系统 (第 5-7 天)
1. ✅ 实现自定义认证逻辑
2. ✅ 实现 Google OAuth 集成
3. ✅ 实现会话管理
4. ✅ 实现路由守卫
5. ✅ 测试认证流程

### 阶段 4: 支付系统 (第 8-9 天)
1. ✅ 迁移 Stripe 配置
2. ✅ 迁移 PayPal 配置
3. ✅ 实现 Server Functions
4. ✅ 实现 Webhook 处理
5. ✅ 测试支付流程

### 阶段 5: UI 和页面 (第 10-14 天)
1. ✅ 迁移 UI 组件
2. ✅ 迁移营销页面
3. ✅ 迁移仪表盘
4. ✅ 迁移管理后台
5. ✅ 迁移国际化

### 阶段 6: 测试和优化 (第 15-17 天)
1. ✅ 功能测试
2. ✅ 性能优化
3. ✅ 安全审计
4. ✅ 部署测试
5. ✅ 文档更新

---

## 📊 进度追踪

### 完成情况
- [x] 阶段 1: 基础架构搭建
- [ ] 阶段 2: 数据库层迁移
- [ ] 阶段 3: 认证系统重构
- [ ] 阶段 4: 支付系统迁移
- [ ] 阶段 5: UI 和页面迁移
- [ ] 阶段 6: 测试和优化

### 关键里程碑
- **里程碑 1**: 基础架构完成 ✅
- **里程碑 2**: 数据库层完成
- **里程碑 3**: 认证系统完成
- **里程碑 4**: 支付系统完成
- **里程碑 5**: UI 和页面完成
- **里程碑 6**: 项目上线

---

## 🎯 下一步行动

### 立即开始
1. **创建新项目**: 运行 `npx create-ts-router-app@latest saas-tanstack --template cloudflare`
2. **配置基础架构**: 按照上面的代码示例配置项目
3. **迁移数据库**: 复制数据库 Schema 和连接代码
4. **实现认证**: 实现自定义认证逻辑
5. **逐步迁移**: 按照迁移清单逐步完成

### 学习资源
- [TanStack Start 官方文档](https://tanstack.com/start/latest)
- [TanStack Router 官方文档](https://tanstack.com/router/latest)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)

### 支持渠道
- TanStack Discord: https://discord.gg/tanstack
- Cloudflare Discord: https://discord.gg/cloudflare
- GitHub Issues: https://github.com/TanStack/start/issues

---

## 💡 最佳实践

### 1. 代码组织
- 使用文件路由，保持路由结构清晰
- 将业务逻辑放在 `lib/` 目录
- 将 UI 组件放在 `components/` 目录
- 使用 TypeScript 严格模式

### 2. 性能优化
- 使用代码分割，减少初始包大小
- 使用预加载，提升页面加载速度
- 使用缓存，减少数据库查询
- 使用边缘计算，提升响应速度

### 3. 安全考虑
- 实现 CSRF 保护
- 验证所有用户输入
- 使用 HTTPS
- 定期更新依赖

### 4. 可维护性
- 编写清晰的文档
- 使用一致的代码风格
- 实现自动化测试
- 使用版本控制

---

## 🎉 总结

这个实施计划提供了一个完整的迁移路径，从 Next.js 15 迁移到 TanStack Start 并部署到 Cloudflare Workers。通过遵循这个计划，你将能够：

1. ✅ 保持所有现有功能
2. ✅ 提升性能和可扩展性
3. ✅ 降低部署成本
4. ✅ 获得更好的边缘计算支持

祝你迁移顺利！🚀
