import { createFileRoute, redirect } from '@tanstack/react-router';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { getAdminOverviewFn, getUsageTrendFn } from '~/lib/admin/server-fns';
import { AdminPageShell } from '~/components/admin/admin-page';
import { StatCard } from '~/components/ui/card';
import { useTranslations } from '~/lib/i18n-context';
import { buildPageHead } from '~/lib/site-config';
import { formatMoney, formatNumber } from '~/lib/format';

export const Route = createFileRoute('/admin/analytics')({
  loader: async () => {
    const user = await getCurrentUserFn();
    if (!user) throw redirect({ to: '/login' });
    if (user.role !== 'admin') throw redirect({ to: '/dashboard' });
    const [overview, trend] = await Promise.all([getAdminOverviewFn(), getUsageTrendFn()]);
    return { user, overview, trend };
  },
  head: () =>
    buildPageHead({ title: 'Analytics', description: 'Usage and revenue trends.', path: '/admin/analytics', noIndex: true }),
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const { user, overview, trend } = Route.useLoaderData();
  const t = useTranslations('adminAnalyticsPage');
  const tn = useTranslations('appNav');

  const peak = Math.max(1, ...trend.map((d) => d.runs));
  const totalRuns = trend.reduce((sum, d) => sum + d.runs, 0);
  const totalCredits = trend.reduce((sum, d) => sum + d.credits, 0);

  return (
    <AdminPageShell user={user} title={tn('analytics')} description={t('subtitle')}>
      <div className="grid-hairline sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t('toolRuns30d'), value: formatNumber(totalRuns) },
          { label: t('credits30d'), value: formatNumber(totalCredits) },
          { label: t('revenueMtd'), value: formatMoney(overview.revenueThisMonthCents) },
          { label: t('newUsersMtd'), value: formatNumber(overview.newUsersThisMonth) },
        ].map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} />
        ))}
      </div>

      <section className="surface mt-10 p-6 sm:p-7">
        <h2 className="text-lg font-medium text-foreground">{t('dailyRuns')}</h2>
        {trend.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">{t('noData')}</p>
        ) : (
          // 纯 CSS 柱状图：不引图表库，模板体积不会因为一张图涨几百 KB
          <div className="mt-6 flex h-48 items-end gap-1 overflow-x-auto">
            {trend.map((d) => (
              <div key={d.day} className="flex min-w-[18px] flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-[2px] bg-primary/70 transition-colors hover:bg-primary"
                  style={{ height: `${Math.round((d.runs / peak) * 100)}%` }}
                  title={t('barTitle', { day: d.day, runs: d.runs, credits: d.credits })}
                />
                <span className="tabular whitespace-nowrap text-[10px] text-muted-foreground">
                  {d.day.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminPageShell>
  );
}
