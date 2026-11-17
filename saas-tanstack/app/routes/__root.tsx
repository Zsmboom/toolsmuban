import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouterState,
} from '@tanstack/react-router';
import { AuthProvider } from '~/lib/auth/context';
import { I18nProvider } from '~/lib/i18n-context';
import { localeHtmlLang, normalizeLocale, type Locale } from '~/lib/i18n';
import { absoluteUrl, siteConfig } from '~/lib/site-config';
import { buttonClass } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { THEME_INIT_SCRIPT } from '~/components/ui/theme-toggle';
import '~/styles/globals.css';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      // 浏览器 UI 跟着主题走 —— 深色模式下白色地址栏会很扎眼
      { name: 'theme-color', content: '#FAFAF9', media: '(prefers-color-scheme: light)' },
      { name: 'theme-color', content: '#0B0B0C', media: '(prefers-color-scheme: dark)' },
      // 各页面用 buildPageHead() 覆盖下面这两项
      { title: `${siteConfig.name} - ${siteConfig.tagline}` },
      { name: 'description', content: siteConfig.description },
    ],
    links: [
      // 字体走 <link> 而不是 CSS @import —— @import 会串行阻塞首屏渲染
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap',
      },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      // 浏览器会无条件请求 /favicon.ico，不提供就是一条 404
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
    scripts: [
      // 必须在首屏绘制之前跑：否则选了深色的用户每次进站都要先闪一下白
      { children: THEME_INIT_SCRIPT },
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteConfig.organization.name,
          url: siteConfig.url,
          logo: absoluteUrl(siteConfig.organization.logo),
        }),
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: RootError,
});

/**
 * 语言由 URL 决定，不由请求头决定 —— 同一个 URL 必须始终返回同一种语言的
 * HTML，否则爬虫只会看到默认语言，CDN 缓存也会互相污染。
 *
 * 这里用 useRouterState 而不是 loader：客户端路由跳转时根 loader 不会重跑，
 * 用 loader 会导致切换语言后 <html lang> 和文案不更新。
 */
function useCurrentLocale(): Locale {
  return useRouterState({
    select: (state) =>
      normalizeLocale(state.location.pathname.split('/').filter(Boolean)[0]),
  });
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const locale = useCurrentLocale();

  return (
    <html lang={localeHtmlLang[locale] ?? 'en'}>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {/*
          跳过导航链接：平时不可见，键盘 Tab 到它时才显示。
          让键盘/读屏用户不必每页都穿过整个导航栏。
        */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius)] focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <I18nProvider locale={locale}>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
        {/* Scripts 负责注入客户端 bundle —— 少了它整站没有任何交互 */}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function NotFound() {
  return (
    <RootDocument>
      <main id="main" className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="eyebrow">404</p>
        <h1 className="display-2 mt-4 text-foreground">Page not found</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/{-$locale}" className={buttonClass({ variant: 'primary' })}>
            Back to home
          </Link>
          <Link to="/{-$locale}/pricing" className={buttonClass({ variant: 'secondary' })}>
            View pricing
          </Link>
        </div>
      </main>
    </RootDocument>
  );
}

function RootError({ error }: { error: Error }) {
  return (
    <RootDocument>
      <main id="main" className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="display-2 text-foreground">Something went wrong</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        {import.meta.env?.DEV && (
          <pre className="tabular mt-6 max-w-2xl overflow-x-auto rounded-[var(--radius)] border border-border bg-subtle p-4 text-left text-xs">
            {error.message}
          </pre>
        )}
        <Link to="/{-$locale}" className={cn(buttonClass({ variant: 'primary' }), 'mt-8')}>
          Back to home
        </Link>
      </main>
    </RootDocument>
  );
}
