import type { ReactNode } from 'react';

/**
 * 数据表。
 *
 * 一条硬规矩：**表格自己横向滚动，绝不让 body 横滚**。
 * 窄屏上一个撑破视口的表格会把整页都推歪，而用户以为是页面坏了。
 *
 * 用真的 <thead>/<th>，不用 div 假装表格 —— 读屏软件靠这个念出
 * 「第 3 行 状态 已取消」。
 */
export default function Table({
  columns,
  empty,
  children,
  caption,
}: {
  columns: string[];
  empty?: string;
  children: ReactNode;
  caption?: string;
}) {
  const rows = Array.isArray(children) ? children : [children];
  const isEmpty = rows.filter(Boolean).length === 0;

  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-border bg-subtle text-left">
              {columns.map((column) => (
                <th key={column} scope="col" className="px-5 py-3 font-medium text-muted-foreground">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {isEmpty && empty ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">{empty}</p>
      ) : null}
    </div>
  );
}

/** 表格行 —— 统一行高、分隔线与悬停反馈，避免每个页面各写一份 */
export function Row({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-border transition-colors last:border-0 hover:bg-accent/50">
      {children}
    </tr>
  );
}

/** 普通单元格。数值/日期/ID 传 `numeric` 走等宽 */
export function Cell({
  children,
  numeric = false,
  muted = false,
  align = 'left',
}: {
  children: ReactNode;
  numeric?: boolean;
  muted?: boolean;
  align?: 'left' | 'right';
}) {
  return (
    <td
      className={[
        'px-5 py-3.5',
        numeric ? 'tabular' : '',
        muted ? 'text-muted-foreground' : 'text-foreground',
        align === 'right' ? 'text-right' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </td>
  );
}
