# Google OAuth 登录实现指南

## 📋 概述

本项目已完整实现 Google OAuth 2.0 登录功能，包括用户认证、会话管理、积分系统集成等。

## ✅ 已实现功能

### 1. 核心认证功能
- ✅ Google OAuth 2.0 Provider 集成
- ✅ NextAuth.js v5 (Auth.js) 配置
- ✅ Drizzle ORM 数据库适配器
- ✅ 服务端会话管理
- ✅ 路由保护中间件

### 2. 用户体验优化
- ✅ 专业的登录页面设计
- ✅ Google 品牌按钮样式
- ✅ 加载状态指示
- ✅ 详细的错误处理和提示
- ✅ 专用错误页面
- ✅ 响应式设计

### 3. 用户追踪与分析
- ✅ IP 地址和国家自动捕获
- ✅ 注册来源追踪（IP、国家、Referrer）
- ✅ 登录信息记录（最后登录时间、IP、国家）
- ✅ UTM 参数支持（用于营销分析）

### 4. 积分系统集成
- ✅ 新用户自动创建积分账户（Free 计划，100 积分）
- ✅ 月度配额自动分配
- ✅ 积分交易记录
- ✅ 与订阅系统集成

### 5. 权限管理
- ✅ 用户角色系统（user/admin）
- ✅ Admin 路由保护
- ✅ 动态侧边栏菜单（根据权限显示）
- ✅ API 端点权限验证

## 🚀 快速开始

### 步骤 1: 创建 Google OAuth 应用

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)

2. 创建新项目或选择现有项目

3. 启用 Google+ API：
   - 导航到 "APIs & Services" > "Library"
   - 搜索 "Google+ API"
   - 点击 "Enable"

4. 创建 OAuth 2.0 凭据：
   - 导航到 "APIs & Services" > "Credentials"
   - 点击 "Create Credentials" > "OAuth client ID"
   - 应用类型：选择 "Web application"
   - 名称：输入应用名称（如 "SaaS Template"）

5. 配置授权重定向 URI：
   ```
   开发环境：
   http://localhost:3000/api/auth/callback/google

   生产环境：
   https://yourdomain.com/api/auth/callback/google
   ```

6. 保存并复制：
   - Client ID
   - Client Secret

### 步骤 2: 配置环境变量

1. 复制环境变量模板：
   ```bash
   cp .env.example .env.local
   ```

2. 编辑 `.env.local`，填入以下信息：

   ```env
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

3. 生成 NEXTAUTH_SECRET：
   ```bash
   openssl rand -base64 32
   ```

### 步骤 3: 初始化数据库

1. 推送数据库 Schema：
   ```bash
   npm run db:push
   ```

2. 验证数据库表：
   ```bash
   npm run db:studio
   ```

   检查以下表是否创建成功：
   - `users` - 用户基本信息
   - `accounts` - OAuth 账户关联
   - `sessions` - 会话管理
   - `verificationTokens` - 验证令牌
   - `credits` - 用户积分账户
   - `creditTransactions` - 积分交易记录

### 步骤 4: 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000/login 测试登录功能。

## 📁 项目结构

```
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx              # 登录页面
│   │   └── auth-error/page.tsx         # 错误页面
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts # NextAuth API 路由
│   └── dashboard/
│       └── layout.tsx                   # Dashboard 布局（含 session）
├── components/
│   ├── auth/
│   │   └── google-signin-button.tsx    # Google 登录按钮
│   └── layout/
│       ├── sidebar.tsx                  # 桌面侧边栏
│       └── mobile-sidebar.tsx           # 移动侧边栏
├── lib/
│   ├── auth/
│   │   └── config.ts                    # NextAuth 核心配置
│   ├── db/
│   │   ├── schema.ts                    # 数据库 Schema
│   │   └── queries.ts                   # 数据库查询函数
│   └── utils/
│       └── geo.ts                       # 地理位置工具
└── middleware.ts                        # 路由保护中间件
```

## 🔧 核心配置文件

### lib/auth/config.ts

```typescript
// NextAuth 核心配置
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {...}),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    // Session 回调 - 添加用户信息到 session
    async session({ session, user }) {...},

    // SignIn 回调 - 处理用户注册和登录
    async signIn({ user }) {...}
  },
  pages: {
    signIn: '/login',
    error: '/auth-error',
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
```

### middleware.ts

```typescript
// 路由保护中间件
export default auth((req) => {
  const token = req.auth;
  const isAuth = !!token;
  const isAdmin = token?.user?.role === "admin";

  // 重定向已登录用户
  if (isAuthPage && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 保护 Dashboard 路由
  if (isDashboard && !isAuth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 保护 Admin 路由
  if ((isAdminRoute || isApiAdminRoute) && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});
```

## 🎯 用户登录流程

### 1. 用户点击 "Sign in with Google"
   - 显示加载状态
   - 调用 `signIn("google")`

### 2. Google OAuth 授权
   - 重定向到 Google 登录页面
   - 用户授权应用访问
   - Google 返回授权码

### 3. NextAuth 处理回调
   - 使用授权码获取 access token
   - 获取用户 Google 资料
   - 检查数据库中是否存在该用户

### 4. 新用户注册流程
   ```
   ┌─────────────────────┐
   │ Google OAuth 成功   │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │ 创建 User 记录      │
   │ - email, name, image│
   │ - signupIp          │
   │ - signupCountry     │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │ 创建 Account 记录   │
   │ - Google OAuth 信息 │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │ 创建 Credits 账户   │
   │ - plan: free        │
   │ - balance: 100      │
   │ - monthlyQuota: 100 │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │ 创建 Session        │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │ 重定向到 Dashboard  │
   └─────────────────────┘
   ```

### 5. 老用户登录流程
   ```
   ┌─────────────────────┐
   │ Google OAuth 成功   │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │ 更新 User 记录      │
   │ - lastLoginAt       │
   │ - lastLoginIp       │
   │ - lastLoginCountry  │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │ 创建 Session        │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │ 重定向到 Dashboard  │
   └─────────────────────┘
   ```

## 🔐 安全特性

### 1. CSRF 保护
- NextAuth 自动处理 CSRF token
- 所有请求都需要有效的 CSRF token

### 2. Session 安全
- 数据库会话存储（不使用 JWT）
- 30 天过期时间
- 自动刷新机制

### 3. OAuth 安全
- State 参数验证
- PKCE (Proof Key for Code Exchange)
- Nonce 验证

### 4. 路由保护
- 中间件级别的认证检查
- 服务端组件二次验证
- API 路由权限控制

## 🎨 UI/UX 特性

### 1. 登录页面
- 专业的 Google 品牌按钮
- 响应式设计
- 加载状态指示
- 错误提示

### 2. 错误处理
- 详细的错误信息
- 用户友好的错误页面
- 重试选项
- 支持链接

### 3. 移动端优化
- 触摸友好的按钮尺寸
- 响应式布局
- 移动侧边栏菜单

## 📊 数据库 Schema

### users 表
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  role TEXT DEFAULT 'user',
  country TEXT,

  -- 注册追踪
  signupIp TEXT,
  signupCountry TEXT,
  referrer TEXT,

  -- 登录追踪
  lastLoginAt TIMESTAMP,
  lastLoginIp TEXT,
  lastLoginCountry TEXT,

  -- UTM 参数
  utmSource TEXT,
  utmMedium TEXT,
  utmCampaign TEXT,
  utmTerm TEXT,
  utmContent TEXT,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### accounts 表
```sql
CREATE TABLE accounts (
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,

  PRIMARY KEY (provider, providerAccountId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### credits 表
```sql
CREATE TABLE credits (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  totalEarned INTEGER NOT NULL DEFAULT 0,
  totalSpent INTEGER NOT NULL DEFAULT 0,
  monthlyQuota INTEGER NOT NULL DEFAULT 100,
  monthlyUsed INTEGER NOT NULL DEFAULT 0,
  quotaResetAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🧪 测试

### 测试新用户注册
1. 清空浏览器 cookies
2. 访问 http://localhost:3000/login
3. 点击 "Continue with Google"
4. 使用新的 Google 账户登录
5. 验证：
   - 重定向到 /dashboard
   - 数据库中创建了 user 记录
   - 创建了 credits 账户（balance=100）
   - signupIp 和 signupCountry 已记录

### 测试老用户登录
1. 使用已注册的 Google 账户登录
2. 验证：
   - 成功登录
   - lastLoginAt 已更新
   - lastLoginIp 和 lastLoginCountry 已更新

### 测试错误处理
1. 在 Google OAuth 页面点击 "取消"
2. 验证：
   - 重定向到 /auth-error
   - 显示适当的错误信息
   - 提供 "Try Again" 按钮

### 测试路由保护
1. 未登录状态访问 /dashboard
2. 验证：重定向到 /login

3. 登录后访问 /admin（非 admin 用户）
4. 验证：重定向到 /dashboard

## 🔍 常见问题

### Q: Google OAuth 返回 "redirect_uri_mismatch" 错误
**A:** 检查以下内容：
1. Google Console 中配置的重定向 URI 是否正确
2. NEXTAUTH_URL 环境变量是否正确
3. 确保使用完整的 URL（包括协议）

### Q: 登录后立即退出
**A:** 可能的原因：
1. NEXTAUTH_SECRET 未设置或更改
2. 数据库连接问题
3. Session 表未创建

### Q: 无法获取用户 IP 地址
**A:**
1. 检查 `lib/utils/geo.ts` 中的 IP 获取逻辑
2. 确保部署平台支持相应的请求头
3. Vercel: 使用 `x-forwarded-for`
4. Cloudflare: 使用 `cf-connecting-ip`

### Q: 积分账户未自动创建
**A:**
1. 检查 `lib/auth/config.ts` 中的 signIn 回调
2. 确保 credits 表已创建
3. 查看服务器日志中的错误信息

## 🚀 生产环境部署

### 1. 更新 Google OAuth 配置
在 Google Console 中添加生产环境的重定向 URI：
```
https://yourdomain.com/api/auth/callback/google
```

### 2. 设置环境变量
在部署平台（如 Vercel）设置：
```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<生产环境的 secret>
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
```

### 3. 配置 OAuth 同意屏幕
1. 在 Google Console 中配置 OAuth 同意屏幕
2. 添加应用 Logo
3. 填写隐私政策 URL
4. 填写服务条款 URL
5. 提交审核（如需公开发布）

### 4. 测试生产环境
1. 访问生产环境登录页面
2. 完整测试登录流程
3. 验证数据库记录
4. 测试错误情况

## 📚 相关文档

- [NextAuth.js 文档](https://next-auth.js.org/)
- [Google OAuth 文档](https://developers.google.com/identity/protocols/oauth2)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [Next.js 文档](https://nextjs.org/docs)

## 🆘 获取帮助

如果遇到问题：
1. 查看服务器日志
2. 检查浏览器控制台
3. 验证环境变量配置
4. 查阅 NextAuth.js 文档
5. 提交 Issue 到项目仓库

---

**最后更新**: 2026-02-12
**版本**: 1.0.0
