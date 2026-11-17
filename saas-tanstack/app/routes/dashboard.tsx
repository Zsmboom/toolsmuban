import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { getDashboardDataFn } from '~/lib/account/server-fns';
import { createPortalSessionFn } from '~/lib/payments/stripe-server-fns';
import { createCreemPortalFn } from '~/lib/payments/creem-server-fns';
import { createPayPalPortalFn } from '~/lib/payments/paypal-server-fns';
import { useTranslations } from '~/lib/i18n-context';
import { buildPageHead } from '~/lib/site-config';
import { formatDateShort, formatNumber } from '~/lib/format';
import AppShell from '~/components/layout/app-shell';
import { Card, StatCard } from '~/components/ui/card';
import Badge, { statusTone } from '~/components/ui/badge';
import { buttonClass } from '~/components/ui/button';

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    // loader 里只调 server function，不直接碰 db —— 否则数据库驱动会被打进前端 bundle
    const data = await getDashboardDataFn();
    if (!data) throw redirect({ to: '/login' });
    return data;
  },
  head: () =>
    buildPageHead({
      title: 'Dashboard',
      description: 'Your usage, credits and subscription.',
      path: '/dashboard',
      noIndex: true,
    }),
  component: DashboardPage,
});

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function DashboardPage() {
  const { user, credits, subscription } = Route.useLoaderData();
  const t = useTranslations('credits');
  const tc = useTranslations('common');
  const td = useTranslations('dashboard');
  const tn = useTranslations('appNav');
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const balance = credits?.balance ?? 0;
  const monthlyQuota = credits?.monthlyQuota ?? 0;
  const monthlyUsed = credits?.monthlyUsed ?? 0;
  const unlimited = credits?.unlimited ?? false;
  const usagePercent =
    unlimited || monthlyQuota <= 0
      ? 0
      : Math.min(100, Math.round((monthlyUsed / monthlyQuota) * 100));

  const handleManageSubscription = async () => {
    if (!subscription?.provider) return;
    setPortalError(null);
    setPortalLoading(true);
    try {
      const result =
        subscription.provider === 'stripe'
          ? await createPortalSessionFn()
          : subscription.provider === 'creem'
            ? await createCreemPortalFn()
            : await createPayPalPortalFn();

      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setPortalError(tc('error'));
    } catch (error) {
      console.error('Portal error:', error);
      setPortalError(tc('error'));
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <AppShell
      user={user}
      title={tc('dashboard')}
      description={td('welcome', { name: user.name || tn('anonymous') })}
    >
      {/* 四张统计卡走缝隙网格，和营销页的卡片网格是同一套对齐规则 */}
      <div className="grid-hairline sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('balance')}
          value={unlimited ? t('unlimited') : formatNumber(balance)}
          hint={unlimited ? t('unlimited') : t('monthlyQuota', { quota: monthlyQuota })}
        />
        <StatCard
          label={t('used')}
          value={formatNumber(monthlyUsed)}
          hint={unlimited ? t('unlimited') : t('quotaUsed', { percent: usagePercent })}
        />
        <StatCard
          label={td('plan')}
          value={titleCase(subscription?.plan ?? 'free')}
          hint={
            <span className="flex flex-col items-start gap-1">
              <Link
                to="/{-$locale}/pricing"
                className="text-primary transition-colors hover:text-primary/80"
              >
                {subscription ? td('changePlan') : td('upgradePlan')}
              </Link>
              {subscription?.provider ? (
                <button
                  type="button"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="cursor-pointer text-left text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
                >
                  {portalLoading ? tc('loading') : td('manageSubscription')}
                </button>
              ) : null}
              {portalError ? <span className="text-destructive">{portalError}</span> : null}
            </span>
          }
        />
        <StatCard
          label={td('status')}
          value={<Badge tone={statusTone(subscription?.status ?? 'free')}>
            {subscription?.status ?? 'free'}
          </Badge>}
          hint={
            subscription?.currentPeriodEnd
              ? td('renewsOn', { date: formatDateShort(subscription.currentPeriodEnd) })
              : td('noSubscription')
          }
        />
      </div>

      {/* 用量条：光给数字看不出「还剩多少」，一条 1px 的槽就够了 */}
      {!unlimited && monthlyQuota > 0 ? (
        <div className="mt-6">
          <div className="flex items-baseline justify-between text-xs text-muted-foreground">
            <span>{t('used')}</span>
            <span className="tabular">
              {formatNumber(monthlyUsed)} / {formatNumber(monthlyQuota)}
            </span>
          </div>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full border border-border bg-subtle"
            role="progressbar"
            aria-valuenow={usagePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('used')}
          >
            <div className="h-full bg-primary" style={{ width: `${usagePercent}%` }} />
          </div>
        </div>
      ) : null}

      <Card className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">{td('tools')}</h2>
          <p className="measure mt-2 text-sm text-muted-foreground">{td('toolsHint')}</p>
        </div>
        <Link to="/tools" className={buttonClass({ variant: 'primary' })}>
          {td('tools')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Card>
    </AppShell>
  );
}
