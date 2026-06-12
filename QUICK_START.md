# TanStack Start 迁移 - 快速入门

## 🚀 5 分钟快速开始

### 1. 创建新项目
```bash
# 创建 TanStack Start 项目（使用 Cloudflare 模板）
npx create-ts-router-app@latest saas-tanstack --template cloudflare

# 进入项目目录
cd saas-tanstack

# 安装依赖
npm install
```

### 2. 安装额外依赖
```bash
# 核心依赖
npm install @tanstack/react-router @tanstack/react-start
npm install tailwindcss @tailwindcss/vite
npm install drizzle-orm @libsql/client
npm install stripe @paypal/checkout-server-sdk
npm install zod date-fns lucide-react framer-motion recharts

# 开发依赖
npm install -D drizzle-kit wrangler
npm install -D @types/node @types/react @types/react-dom
```

### 3. 复制配置文件

从你的 Next.js 项目复制以下文件到新项目：

```bash
# 复制 Tailwind 配置
cp ../toolsmuban-new/tailwind.config.ts ./

# 复制 TypeScript 配置（需要修改）
cp ../toolsmuban-new/tsconfig.json ./

# 复制 Drizzle 配置
cp ../toolsmuban-new/drizzle.config.ts ./

# 复制环境变量示例
cp ../toolsmuban-new/.env.example ./

# 复制翻译文件
cp -r ../toolsmuban-new/messages/ ./
```

### 4. 修改 TypeScript 配置

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["app/**/*", "lib/**/*", "components/**/*"],
  "exclude": ["node_modules"]
}
```

### 5. 创建应用配置

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

### 6. 创建基础路由

```bash
# 创建目录结构
mkdir -p app/routes
mkdir -p app/components
mkdir -p app/lib
mkdir -p app/messages
mkdir -p app/styles

# 创建根路由
cat > app/routes/__root.tsx << 'EOF'
import { createRootRoute, Outlet } from '@tanstack/react-router';
import '@/styles/globals.css';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
EOF

# 创建首页
cat > app/routes/index.tsx << 'EOF'
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Welcome to SaaS Template</h1>
    </div>
  );
}
EOF
```

### 7. 创建全局样式

```css
/* app/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 8. 测试项目

```bash
# 启动开发服务器
npm run dev

# 在浏览器中打开
# http://localhost:3000
```

### 9. 部署到 Cloudflare

```bash
# 构建项目
npm run build

# 部署到 Cloudflare Workers
npx wrangler deploy
```

---

## 📚 学习路径

### 第一天：理解基础
1. 阅读 [TanStack Start 官方文档](https://tanstack.com/start/latest)
2. 学习 [TanStack Router 基础](https://tanstack.com/router/latest)
3. 了解 [Cloudflare Workers](https://developers.cloudflare.com/workers/)

### 第二天：实践项目
1. 创建第一个 TanStack Start 项目
2. 实现基本路由
3. 部署到 Cloudflare

### 第三天：迁移数据库
1. 配置 Drizzle ORM
2. 迁移数据库 Schema
3. 测试数据库操作

### 第四天：实现认证
1. 学习认证方案（Better Auth 或自定义）
2. 实现 Google OAuth
3. 实现路由守卫

### 第五天：实现支付
1. 配置 Stripe
2. 配置 PayPal
3. 实现 Webhook 处理

### 第六天：迁移 UI
1. 迁移 shadcn/ui 组件
2. 迁移营销页面
3. 迁移仪表盘

### 第七天：测试和优化
1. 功能测试
2. 性能优化
3. 部署验证

---

## 🔧 常用命令

```bash
# 开发
npm run dev                    # 启动开发服务器
npm run build                  # 构建项目
npm run preview                # 预览构建结果

# 数据库
npm run db:generate            # 生成迁移文件
npm run db:push                # 推送数据库变更
npm run db:studio              # 打开数据库管理界面

# 部署
npx wrangler deploy            # 部署到 Cloudflare
npx wrangler tail              # 查看实时日志

# 代码质量
npm run lint                   # 运行 ESLint
npm run type-check             # 类型检查
```

---

## 📖 关键概念速查

### 路由
```typescript
// 文件路由
app/routes/index.tsx           -> /
app/routes/about.tsx           -> /about
app/routes/blog/$slug.tsx      -> /blog/:slug

// 布局路由
app/routes/_layout.tsx         -> 布局组件（不影响 URL）
app/routes/_dashboard/index.tsx -> /dashboard

// API 路由
app/routes/api/user.ts         -> /api/user
```

### 服务器函数
```typescript
import { createServerFn } from '@tanstack/start';

// GET 请求
export const getUser = createServerFn({ method: 'GET' })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    return await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
  });

// POST 请求
export const createUser = createServerFn({ method: 'POST' })
  .validator((data: { name: string; email: string }) => data)
  .handler(async ({ data }) => {
    return await db.insert(users).values(data);
  });
```

### 路由守卫
```typescript
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

### 数据加载
```typescript
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const [user, credits] = await Promise.all([
      getUser(),
      getUserCredits(),
    ]);
    return { user, credits };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { user, credits } = Route.useLoaderData();
  return <div>...</div>;
}
```

---

## 🎯 迁移清单

### 基础架构
- [ ] 创建 TanStack Start 项目
- [ ] 配置 TypeScript
- [ ] 配置 Tailwind CSS
- [ ] 配置 Cloudflare Workers
- [ ] 测试基本路由

### 数据库
- [ ] 复制 Drizzle 配置
- [ ] 迁移数据库 Schema
- [ ] 迁移数据库连接
- [ ] 测试数据库操作

### 认证
- [ ] 实现认证逻辑
- [ ] 实现 Google OAuth
- [ ] 实现会话管理
- [ ] 实现路由守卫
- [ ] 测试认证流程

### 支付
- [ ] 配置 Stripe
- [ ] 配置 PayPal
- [ ] 实现 Server Functions
- [ ] 实现 Webhook 处理
- [ ] 测试支付流程

### UI 和页面
- [ ] 迁移 UI 组件
- [ ] 迁移营销页面
- [ ] 迁移仪表盘
- [ ] 迁移管理后台
- [ ] 迁移国际化

### 测试和优化
- [ ] 功能测试
- [ ] 性能优化
- [ ] 安全审计
- [ ] 部署验证

---

## 💡 最佳实践

### 1. 代码组织
```
app/
├── routes/           # 路由文件
│   ├── index.tsx     # 首页
│   ├── about.tsx     # 关于页
│   └── _dashboard/   # 仪表盘布局
├── components/       # UI 组件
│   ├── ui/          # 基础组件
│   ├── layout/      # 布局组件
│   └── marketing/   # 营销组件
├── lib/             # 业务逻辑
│   ├── auth/        # 认证
│   ├── db/          # 数据库
│   └── payments/    # 支付
└── messages/        # 翻译文件
```

### 2. 性能优化
- 使用代码分割
- 使用预加载
- 使用缓存
- 使用边缘计算

### 3. 安全考虑
- 验证所有输入
- 使用 HTTPS
- 实现 CSRF 保护
- 定期更新依赖

### 4. 可维护性
- 编写清晰的文档
- 使用一致的代码风格
- 实现自动化测试
- 使用版本控制

---

## 🔗 有用的资源

### 官方文档
- [TanStack Start](https://tanstack.com/start/latest)
- [TanStack Router](https://tanstack.com/router/latest)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Drizzle ORM](https://orm.drizzle.team/)

### 示例项目
- [TanStack Start 示例](https://github.com/TanStack/start/tree/main/examples)
- [Cloudflare Workers 示例](https://developers.cloudflare.com/workers/examples/)

### 社区
- [TanStack Discord](https://discord.gg/tanstack)
- [Cloudflare Discord](https://discord.gg/cloudflare)

---

## 🎉 开始迁移

现在你已经准备好了！按照以下步骤开始迁移：

1. **创建新项目** ✅
2. **复制配置文件** ✅
3. **创建基础路由** ✅
4. **测试项目** ✅
5. **逐步迁移功能**

祝你迁移顺利！🚀

---

## 📞 遇到问题？

如果在迁移过程中遇到问题：

1. 查阅官方文档
2. 搜索 GitHub Issues
3. 在 Discord 社区提问
4. 参考示例项目

记住：迁移是一个渐进的过程，不要急于求成。一步一步来，确保每一步都正确。
