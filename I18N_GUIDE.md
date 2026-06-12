# 多语言支持 (Internationalization) 使用指南

本项目已集成 `next-intl` 实现完整的多语言支持。

## 📁 文件结构

```
├── app/
│   ├── [locale]/              # 支持多语言的页面
│   │   ├── layout.tsx         # 语言布局
│   │   ├── page.tsx          # 首页示例
│   │   └── not-found.tsx     # 404页面
│   └── layout.tsx            # 根布局（保留用于向后兼容）
├── messages/                  # 翻译文件
│   ├── en.json               # 英文翻译
│   └── zh.json               # 中文翻译
├── components/
│   └── language/
│       └── language-switcher.tsx  # 语言切换组件
├── i18n.ts                   # 国际化配置
└── middleware.ts             # 中间件（处理语言路由和认证）
```

## 🌍 支持的语言

- **英语 (en)** - 默认语言
- **中文 (zh)**

可以在 `i18n.ts` 中添加更多语言。

## 🚀 使用方法

### 1. 在服务端组件中使用翻译

```tsx
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations();

  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
    </div>
  );
}
```

### 2. 在客户端组件中使用翻译

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function ClientComponent() {
  const t = useTranslations('common');

  return <button>{t('login')}</button>;
}
```

### 3. 使用语言切换组件

```tsx
import { LanguageSwitcher } from '@/components/language/language-switcher';

export default function Header() {
  return (
    <header>
      <nav>
        {/* 其他导航项 */}
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
```

### 4. 带参数的翻译

在翻译文件中:
```json
{
  "dashboard": {
    "welcome": "Welcome back, {name}"
  }
}
```

在代码中使用:
```tsx
const t = useTranslations('dashboard');
<h1>{t('welcome', { name: user.name })}</h1>
```

## 📝 添加新的翻译

1. 在 `messages/en.json` 添加英文翻译:
```json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

2. 在 `messages/zh.json` 添加中文翻译:
```json
{
  "newFeature": {
    "title": "新功能",
    "description": "这是一个新功能"
  }
}
```

3. 在代码中使用:
```tsx
const t = useTranslations('newFeature');
<h2>{t('title')}</h2>
```

## 🔗 语言路由

项目使用 `as-needed` 策略:
- 英文（默认语言）: `https://yourdomain.com/`
- 中文: `https://yourdomain.com/zh/`

### 创建多语言链接

```tsx
import { Link } from '@/navigation';

<Link href="/about">{t('common.about')}</Link>
```

或者使用 Next.js 的 Link:
```tsx
import Link from 'next/link';

<Link href="/about">{t('common.about')}</Link>
```

## 🎯 添加新语言

1. 在 `i18n.ts` 添加新语言:
```typescript
export const locales = ['en', 'zh', 'ja'] as const;
```

2. 创建翻译文件 `messages/ja.json`

3. 在 `components/language/language-switcher.tsx` 添加语言名称:
```typescript
const languageNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
};
```

## ⚙️ 配置说明

### i18n.ts
- `locales`: 支持的语言列表
- `defaultLocale`: 默认语言
- 动态加载翻译文件

### middleware.ts
- 合并了语言路由和身份验证逻辑
- 自动语言检测
- 保护需要认证的路由

### next.config.ts
- 使用 `createNextIntlPlugin` 包装配置
- 自动处理语言前缀

## 📦 迁移现有页面

要将现有页面迁移到多语言支持:

1. 将页面从 `app/page.tsx` 移动到 `app/[locale]/page.tsx`
2. 提取所有文本到翻译文件
3. 使用 `useTranslations()` hook 替换硬编码文本
4. 测试两种语言下的页面

## 🔍 最佳实践

1. **组织翻译文件**: 按功能模块组织翻译键
2. **使用命名空间**: 使用 `useTranslations('namespace')` 指定命名空间
3. **避免硬编码**: 所有用户可见的文本都应该通过翻译
4. **保持一致性**: 在所有语言中使用相同的键结构
5. **提供回退**: 使用 `defaultValue` 参数提供回退文本

## 🐛 常见问题

### Q: 如何获取当前语言？
```tsx
import { useLocale } from 'next-intl';

const locale = useLocale(); // 'en' 或 'zh'
```

### Q: 如何在服务端组件中使用？
```tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations();
  return <h1>{t('title')}</h1>;
}
```

### Q: 如何处理复数形式？
在翻译文件中使用 ICU 消息格式:
```json
{
  "items": "{count, plural, =0 {No items} =1 {One item} other {# items}}"
}
```

## 📚 更多资源

- [next-intl 文档](https://next-intl-docs.vercel.app/)
- [Next.js 国际化指南](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
