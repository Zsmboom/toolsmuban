import { createFileRoute, redirect } from '@tanstack/react-router';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { useAuth } from '~/lib/auth/context';
import { db } from '~/lib/db';
import { credits, subscriptions } from '~/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createPortalSessionFn } from '~/lib/payments/stripe-server-fns';
import { createCreemPortalFn } from '~/lib/payments/creem-server-fns';
import { createPayPalPortalFn } from '~/lib/payments/paypal-server-fns';
import Sidebar from '~/components/layout/sidebar';
import MobileSidebar from '~/components/layout/mobile-sidebar';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({ to: '/login' });
    }

    const userCredits = await db.query.credits.findFirst({
      where: eq(credits.userId, user.id),
    });

    const userSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, user.id),
      orderBy: (subs, { desc }) => [desc(subs.createdAt)],
    });

    return {
      user,
      credits: userCredits || null,
      subscription: userSubscription || null,
    };
  },
  component: DashboardPage,
});

function getPlanDisplayName(plan: string | null | undefined): string {
  if (!plan || plan === 'free') return 'Free';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function getProviderBadge(provider: string | null | undefined): string {
  if (provider === 'stripe') return 'Stripe';
  if (provider === 'creem') return 'Creem';
  if (provider === 'paypal') return 'PayPal';
  return '—';
}

function getStatusColor(status: string | null | undefined): string {
  if (status === 'active') return 'text-success';
  if (status === 'canceled') return 'text-destructive';
  if (status === 'past_due') return 'text-yellow-500';
  if (status === 'trialing') return 'text-blue-500';
  return 'text-muted-foreground';
}

function DashboardPage() {
  const { user } = useAuth();
  const { credits: userCredits, subscription } = Route.useLoaderData();

  const balance = userCredits?.balance ?? 0;
  const monthlyQuota = userCredits?.monthlyQuota ?? 100;
  const monthlyUsed = userCredits?.monthlyUsed ?? 0;
  const usagePercent = monthlyQuota > 0 ? Math.round((monthlyUsed / monthlyQuota) * 100) : 0;
  const planName = getPlanDisplayName(subscription?.plan);
  const providerName = getProviderBadge(subscription?.provider);
  const statusColor = getStatusColor(subscription?.status);

  const handleManageSubscription = async () => {
    if (!subscription) return;
    try {
      if (subscription.provider === 'stripe') {
        const { url } = await createPortalSessionFn();
        if (url) window.location.href = url;
      } else if (subscription.provider === 'creem') {
        const { url } = await createCreemPortalFn();
        if (url) window.location.href = url;
      } else if (subscription.provider === 'paypal') {
        const { url } = await createPayPalPortalFn();
        if (url) window.location.href = url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open manage subscription page. Please try again.');
    }
  };

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
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Credits</p>
                <p className="mt-1 text-2xl font-bold font-heading">{balance.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {monthlyQuota >= 999999 ? 'Unlimited' : `${monthlyQuota} monthly quota`}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usage</p>
                <p className="mt-1 text-2xl font-bold font-heading">{monthlyUsed}</p>
              </div>
              <div className="rounded-xl bg-success/10 p-3">
                <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {usagePercent}% of quota used
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plan</p>
                <p className="mt-1 text-2xl font-bold font-heading">{planName}</p>
              </div>
              <div className="rounded-xl bg-secondary/10 p-3">
                <svg className="h-6 w-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {subscription ? (
                <span className="flex flex-col gap-2">
                  <span>
                    via {providerName}{' · '}
                    <Link to="/pricing" className="text-primary hover:text-primary/80 transition-colors duration-200">
                      Change plan
                    </Link>
                  </span>
                  {subscription.provider && ['stripe', 'creem', 'paypal'].includes(subscription.provider) && (
                    <button
                      onClick={handleManageSubscription}
                      className="text-xs text-primary hover:text-primary/80 transition-colors duration-200 underline text-left"
                    >
                      Manage subscription
                    </button>
                  )}
                </span>
              ) : (
                <Link to="/pricing" className="text-primary hover:text-primary/80 transition-colors duration-200">
                  Upgrade plan
                </Link>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className={`mt-1 text-2xl font-bold font-heading ${statusColor}`}>
                  {subscription?.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : 'Active'}
                </p>
              </div>
              <div className="rounded-xl bg-success/10 p-3">
                <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {subscription?.currentPeriodEnd && (
                <span>Renewal: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
              )}
              {!subscription && 'No active subscription'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
