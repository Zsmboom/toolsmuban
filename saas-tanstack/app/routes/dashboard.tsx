import { createFileRoute, redirect } from '@tanstack/react-router';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { useAuth } from '~/lib/auth/context';
import Sidebar from '~/components/layout/sidebar';
import MobileSidebar from '~/components/layout/mobile-sidebar';

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({ to: '/login' });
    }
    return { user };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user!} />
      <MobileSidebar user={user!} />
      <main className="flex-1 p-8 ml-0 md:ml-64 pt-20">
        <div>
          <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back, {user?.name || 'User'}!
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-6 card-hover cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Credits</p>
                <p className="mt-1 text-2xl font-bold font-heading">100</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">+20% from last month</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 card-hover cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usage</p>
                <p className="mt-1 text-2xl font-bold font-heading">24</p>
              </div>
              <div className="rounded-xl bg-success/10 p-3">
                <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">+12% from last month</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 card-hover cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plan</p>
                <p className="mt-1 text-2xl font-bold font-heading">Free</p>
              </div>
              <div className="rounded-xl bg-secondary/10 p-3">
                <svg className="h-6 w-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              <a href="/pricing" className="text-primary hover:text-primary/80 transition-colors duration-200">Upgrade plan</a>
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 card-hover cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="mt-1 text-2xl font-bold font-heading text-success">Active</p>
              </div>
              <div className="rounded-xl bg-success/10 p-3">
                <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">All systems operational</p>
          </div>
        </div>
      </main>
    </div>
  );
}
