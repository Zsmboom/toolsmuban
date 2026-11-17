import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cn } from '~/lib/utils';

/**
 * 表单控件。重设计之前同一串 input class 在 6 个文件里逐字重复
 * （其中两份还漏了 transition，成了看得见的不一致）。
 */
const CONTROL = [
  'block w-full rounded-[var(--radius)] border border-input bg-card',
  'px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground',
  'transition-colors focus:border-primary focus:outline-none',
].join(' ');

export function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
      {children}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, 'h-11', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, className)} {...props} />;
}

/** label + 控件 + 说明/错误 的固定间距，保证跨页面表单基线一致 */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
