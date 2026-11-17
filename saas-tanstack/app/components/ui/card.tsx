import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

/**
 * 卡片：1px 边框，没有阴影。规矩 2。
 *
 * 重设计之前，`rounded-xl border border-border bg-card p-6` 这串
 * 在 dashboard / admin×3 / settings 里各抄了一份。
 */
export function Card({
  className,
  children,
  interactive = false,
}: {
  className?: string;
  children: ReactNode;
  interactive?: boolean;
}) {
  return (
    <div className={cn(interactive ? 'surface-interactive' : 'surface', 'p-6 sm:p-7', className)}>
      {children}
    </div>
  );
}

/**
 * 统计卡：一个标签 + 一个数值（+ 可选的脚注）。
 * 数值一律走 `tabular` —— 它是数据，不是文案。规矩 3。
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <p className="tabular mt-3 text-2xl text-foreground">{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
