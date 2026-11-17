import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { siteConfig } from '~/lib/site-config';

/**
 * 认证与结账结果页的统一外壳。
 *
 * 之前认证四页用的是 `glass` 毛玻璃卡，而 checkout 两页用了一个
 * 「差一点」的变体（没有卡片、内外边距都不同），两组页面看起来
 * 像来自两个网站。毛玻璃与「发丝边框」体系冲突，这里一起去掉。
 */
export default function AuthShell({
  title,
  description,
  icon,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main
      id="main"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12"
    >
      {/* 底纹必须是独立的一层：`grid-field` 带 mask-image，
          直接挂在容器上会把卡片本身一起渐隐掉 */}
      <div className="grid-field pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <div className="text-center">
          <Link
            to="/{-$locale}"
            className="text-lg font-medium tracking-tight text-foreground transition-colors hover:text-primary"
          >
            {siteConfig.name}
          </Link>
        </div>

        <div className="surface mt-8 p-8">
          {icon ? <div className="mb-6 flex justify-center">{icon}</div> : null}
          <h1 className="display-3 text-center text-foreground">{title}</h1>
          {description ? (
            <div className="mt-3 text-center text-sm text-muted-foreground">{description}</div>
          ) : null}
          <div className="mt-8">{children}</div>
        </div>

        {footer ? (
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        ) : null}
      </div>
    </main>
  );
}
