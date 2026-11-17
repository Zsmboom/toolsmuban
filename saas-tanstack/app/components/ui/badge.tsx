import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'destructive' | 'info' | 'brand';

const TONE: Record<BadgeTone, string> = {
  neutral: 'border-border bg-muted text-muted-foreground',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-info/30 bg-info/10 text-info',
  brand: 'border-primary/30 bg-brand-subtle text-primary',
};

/**
 * 状态芯片。重设计之前 admin-page / payments / subscriptions
 * 各带一份几乎相同的 tone 映射表，三份都收编到这里。
 *
 * 状态文本走等宽：它是枚举值不是句子。
 */
export default function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'tabular inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6875rem]',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** 支付/订阅状态到 tone 的统一映射 —— 三个 admin 页共用 */
export function statusTone(status: string | null | undefined): BadgeTone {
  switch ((status ?? '').toLowerCase()) {
    case 'active':
    case 'succeeded':
    case 'paid':
    case 'completed':
      return 'success';
    case 'trialing':
    case 'pending':
    case 'processing':
      return 'info';
    case 'past_due':
    case 'incomplete':
    case 'paused':
      return 'warning';
    case 'canceled':
    case 'cancelled':
    case 'failed':
    case 'refunded':
    case 'expired':
      return 'destructive';
    default:
      return 'neutral';
  }
}
