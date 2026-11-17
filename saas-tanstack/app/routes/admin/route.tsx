import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getCurrentUserFn } from '~/lib/auth/server-fns';

/**
 * 后台布局路由。
 *
 * 注意这个文件必须存在且渲染 <Outlet />：admin.tsx 同时充当「/admin 页面」和
 * 「/admin/* 的父布局」时，子路由是渲染不出来的 —— 访问 /admin/users 会看到
 * /admin 的内容。把布局和首页拆开才是正确结构。
 *
 * 鉴权放在这里做一次，所有子页面都被覆盖。
 */
export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (!user) throw redirect({ to: '/login' });
    if (user.role !== 'admin') throw redirect({ to: '/dashboard' });
    return { adminUser: user };
  },
  component: () => <Outlet />,
});
