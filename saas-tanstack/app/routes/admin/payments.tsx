import { createFileRoute, redirect } from '@tanstack/react-router';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { useAuth } from '~/lib/auth/context';
import { db } from '~/lib/db';
import { payments, users } from '~/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import AdminSidebar from '~/components/layout/admin-sidebar';

export const Route = createFileRoute('/admin/payments')({
  loader: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({ to: '/login' });
    }
    if (user.role !== 'admin') {
      throw redirect({ to: '/dashboard' });
    }

    const allPayments = await db
      .select({
        id: payments.id,
        userId: payments.userId,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        provider: payments.provider,
        providerId: payments.providerId,
        description: payments.description,
        createdAt: payments.createdAt,
        userEmail: users.email,
        userName: users.name,
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .orderBy(desc(payments.createdAt))
      .limit(100);

    return { payments: allPayments, user };
  },
  component: AdminPaymentsPage,
});

function getStatusBadge(status: string | null) {
  const styles: Record<string, string> = {
    succeeded: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    refunded: 'bg-purple-100 text-purple-800 border-purple-200',
    canceled: 'bg-gray-100 text-gray-800 border-gray-200',
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

function AdminPaymentsPage() {
  const { user } = useAuth();
  const { payments: paymentList } = Route.useLoaderData();

  const succeededCount = paymentList.filter(p => p.status === 'succeeded').length;
  const refundedCount = paymentList.filter(p => p.status === 'refunded').length;
  const totalRevenue = paymentList
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar user={user!} />
      <main className="flex-1 p-8 ml-0 md:ml-64 pt-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-heading">Payments</h1>
            <p className="mt-2 text-muted-foreground">
              All payment transactions across all providers
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Revenue: <strong className="text-foreground">${(totalRevenue / 100).toLocaleString()}</strong></span>
            <span>Success: <strong className="text-green-600">{succeededCount}</strong></span>
            <span>Refunded: <strong className="text-purple-600">{refundedCount}</strong></span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Provider</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Description</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {paymentList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  paymentList.map((pmt) => (
                    <tr key={pmt.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{pmt.userName || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{pmt.userEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        ${(pmt.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(pmt.status)}</td>
                      <td className="px-4 py-3">{getProviderBadge(pmt.provider)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                        {pmt.description || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {pmt.createdAt ? new Date(pmt.createdAt).toLocaleDateString() : '—'}
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
