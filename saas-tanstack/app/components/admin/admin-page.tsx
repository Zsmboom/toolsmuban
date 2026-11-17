import type { ReactNode } from 'react';
import AppShell from '~/components/layout/app-shell';
import Table from '~/components/ui/table';
import type { User } from '~/lib/auth';

export { default as Badge, statusTone } from '~/components/ui/badge';

/**
 * 后台页面外壳。
 *
 * 现在只是 AppShell 的一层薄封装 —— 后台和前台用**同一个**外壳，
 * 只是换一份导航配置。之前后台是自己一套（还带着那个 `md:ml-64`
 * 双重偏移的 bug），于是同一个产品里存在两种侧栏页布局。
 */
export function AdminPageShell({
  user,
  title,
  description,
  actions,
  children,
}: {
  user: User;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AppShell user={user} variant="admin" title={title} description={description} actions={actions}>
      {children}
    </AppShell>
  );
}

/**
 * 后台表格。表格自己横向滚动，绝不让 body 横滚。
 * 空态渲染成一行跨列的提示，而不是一张只有表头的空表。
 */
export function AdminTable({
  columns,
  children,
  empty,
  isEmpty,
}: {
  columns: string[];
  children: ReactNode;
  empty: string;
  isEmpty: boolean;
}) {
  return (
    <Table columns={columns}>
      {isEmpty ? (
        <tr>
          <td
            colSpan={columns.length}
            className="px-5 py-12 text-center text-sm text-muted-foreground"
          >
            {empty}
          </td>
        </tr>
      ) : (
        children
      )}
    </Table>
  );
}
