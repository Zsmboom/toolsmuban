import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

export type Accent = 'orange' | 'teal' | 'green' | 'blue' | 'amber' | 'violet' | 'pink';

/**
 * 营销页区块的统一骨架。
 *
 * 它固定三件事，从而让相邻区块**天然对齐**：
 * - 纵向节奏：营销页一律 py-20 sm:py-28（内容页用 `tight`）
 * - 横向容器：一律 `shell`，不再各写各的 container
 * - 区块头版式：eyebrow → 标题（mt-4）→ 引导语（mt-4），内容 mt-12
 *
 * `tone="subtle"` 是交替底色 —— 相邻区块靠它换气，不用一路白到底。
 * `accent` 换这一整块的强调色（见 globals.css 的 data-accent）。
 */
export default function Section({
  id,
  eyebrow,
  title,
  lede,
  accent,
  tone = 'plain',
  tight = false,
  headingLevel: Heading = 'h2',
  align = 'start',
  actions,
  children,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  lede?: ReactNode;
  accent?: Accent;
  tone?: 'plain' | 'subtle';
  tight?: boolean;
  headingLevel?: 'h1' | 'h2';
  align?: 'start' | 'center';
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const centered = align === 'center';

  return (
    <section
      id={id}
      data-accent={accent}
      className={cn(
        tone === 'subtle' ? 'border-y border-border bg-subtle' : 'bg-background',
        className,
      )}
    >
      <div className={cn('shell', tight ? 'py-14 sm:py-20' : 'py-20 sm:py-28')}>
        {title || eyebrow || lede ? (
          <div
            className={cn(
              'flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between',
              centered && 'sm:flex-col sm:items-center',
            )}
          >
            <div className={cn(centered && 'text-center')}>
              {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
              {title ? (
                <Heading
                  className={cn(
                    Heading === 'h1' ? 'display-1' : 'display-2',
                    'mt-4 max-w-3xl text-pretty text-foreground',
                    centered && 'mx-auto',
                  )}
                >
                  {title}
                </Heading>
              ) : null}
              {lede && !centered ? (
                <p className="lede measure mt-4 text-muted-foreground">{lede}</p>
              ) : null}
            </div>
            {lede && centered ? (
              <p className="lede measure mx-auto text-center text-muted-foreground">{lede}</p>
            ) : null}
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        ) : null}
        {children ? <div className={cn(title || eyebrow ? 'mt-12' : '')}>{children}</div> : null}
      </div>
    </section>
  );
}
