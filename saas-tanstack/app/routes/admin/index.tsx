import { createFileRoute, redirect } from '@tanstack/react-router';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { useAuth } from '~/lib/auth/context';
import AdminSidebar from '~/components/layout/admin-sidebar';

export const Route = createFileRoute('/admin')({
  loader: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({ to: '/login' });
    }
    if (user.role !== 'admin') {
      throw redirect({ to: '/dashboard' });
    }
    return { user };
  },
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar user={user!} />
      <main className="flex-1 p-8 ml-0 md:ml-64 pt-20">
        <div>
          <h1 className="text-3xl font-bold font-heading">Admin Panel</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back, {user?.name || 'Admin'}!
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-6 card-hover cursor-pointer">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="mt-1 text-2xl font-bold font-heading">1,234</p>
            <p className="mt-2 text-xs text-muted-foreground">+18% this month</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 card-hover cursor-pointer">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="mt-1 text-2xl font-bold font-heading">$12,345</p>
            <p className="mt-2 text-xs text-muted-foreground">+25% this month</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 card-hover cursor-pointer">
            <p className="text-sm text-muted-foreground">Subscriptions</p>
            <p className="mt-1 text-2xl font-bold font-heading">456</p>
            <p className="mt-2 text-xs text-muted-foreground">+8% this month</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 card-hover cursor-pointer">
            <p className="text-sm text-muted-foreground">Active Now</p>
            <p className="mt-1 text-2xl font-bold font-heading">89</p>
            <p className="mt-2 text-xs text-muted-foreground">Currently online</p>
          </div>
        </div>
      </main>
    </div>
  );
}
