import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '~/lib/utils';

/**
 * 全站唯一的按钮定义。
 *
 * 重设计之前，同一个「主按钮」在仓库里有 17 种写法（圆角 4 档、
 * 内边距 6 档、字重 2 档、焦点样式 3 套）。所有按钮都从这里取样式：
 * 需要一个链接形态的按钮时，用 `buttonClass()` 把 class 交给
 * <Link>，不要另起一套。
 *
 * 尺寸的下限是无障碍要求：sm 之外的档位实际高度都 ≥44px 触摸目标，
 * sm 仅用于表格行内操作这类明确的密集场景。
 */
export const buttonClass = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-[var(--radius)] font-medium transition-colors cursor-pointer',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        /** 一屏只应该有一个 */
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        /** 次级操作：发丝边框，不是灰底 */
        secondary: 'border border-border bg-card text-foreground hover:bg-accent hover:border-primary/40',
        /** 导航项、行内操作 */
        ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
        /** 不可逆操作 */
        destructive: 'border border-destructive/30 text-destructive hover:bg-destructive/10',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-11 px-4 text-sm',
        lg: 'h-12 px-6 text-sm',
      },
      block: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonClass>;

export default function Button({
  className,
  variant,
  size,
  block,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonClass({ variant, size, block }), className)}
      {...props}
    />
  );
}
