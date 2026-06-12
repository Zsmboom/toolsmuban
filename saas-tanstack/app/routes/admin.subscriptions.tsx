import { createFileRoute, redirect } from '@tanstack/react-router';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { useAuth } from '~/lib/auth/context';
import { db } from '~/lib/db';
import { subscriptions, users } from '~/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import AdminSidebar from '~/components/layout/admin-sidebar';

export const Route = createFileRoute('/admin/subscriptions')({
  loader: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({ to: '/login' });
    }
    if (user.role !== 'admin') {
      throw redirect({ to: '/dashboard' });
    }

    const allSubscriptions = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        provider: subscriptions.provider,
        providerId: subscriptions.providerId,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        createdAt: subscriptions.createdAt,
        canceledAt: subscriptions.canceledAt,
        userEmail: users.email,
        userName: users.name,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(100);

    return { subscriptions: allSubscriptions, user };
  },
  component: AdminSubscriptionsPage,
});

function getStatusBadge(status: string | null) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    canceled: 'bg-red-100 text-red-800 border-red-200',
    past_due: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    trialing: 'bg-blue-100 text-blue-800 border-blue-200',
    paused: 'bg-gray-100 text-gray-800 border-gray-200',
    expired: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  const s = status || 'unknown';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[s] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

function getProviderBadge(provider: string | null) {
  const styles: Record<string, string> = {
    stripe: 'bg-purple-100 text-purple-800 border-purple-200',
    creem: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    paypal: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  const p = provider || '—';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[provider || ''] || 'bg-gray-100 text-gray-800'}`}>
      {p}
    </span>
  );
}

function AdminSubscriptionsPage() {
  const { user } = useAuth();
  const { subscriptions: subList } = Route.useLoaderData();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar user={user!} />
      <main className="flex-1 p-8 ml-0 md:ml-64 pt-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-heading">Subscriptions</h1>
            <p className="mt-2 text-muted-foreground">
              All subscriptions across all payment providers
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: {subList.length}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Plan</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Provider</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Period End</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {subList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  subList.map((sub) => (
                    <tr key={sub.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{sub.userName || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{sub.userEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium capitalize">{sub.plan}</td>
                      <td className="px-4 py-3">{getStatusBadge(sub.status)}</td>
                      <td className="px-4 py-3">{getProviderBadge(sub.provider)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
