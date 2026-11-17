import { createFileRoute, redirect } from '@tanstack/react-router';
import { getAdminOverviewFn } from '~/lib/admin/server-fns';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { buildPageHead } from '~/lib/site-config';
import { formatMoney, formatNumber } from '~/lib/format';
import { AdminPageShell } from '~/components/admin/admin-page';
import { StatCard } from '~/components/ui/card';
import { useTranslations } from '~/lib/i18n-context';

export const Route = createFileRoute('/admin/')({
  loader: async () => {
    const user = await getCurrentUserFn();
    if (!user) throw redirect({ to: '/login' });
    if (user.role !== 'admin') throw redirect({ to: '/dashboard' });

    const overview = await getAdminOverviewFn();
    return { user, overview };
  },
  head: () =>
    buildPageHead({
      title: 'Admin',
      description: 'Admin panel.',
      path: '/admin',
      noIndex: true,
    }),
  component: AdminPage,
});

function AdminPage() {
  const { user, overview } = Route.useLoaderData();
  const t = useTranslations('adminPage');
  const tn = useTranslations('appNav');

  // 这些数字全部来自数据库实时聚合
  const cards = [
    {
      label: t('totalUsers'),
      value: formatNumber(overview.totalUsers),
      hint: t('newThisMonth', { count: overview.newUsersThisMonth }),
    },
    {
      label: t('revenueMtd'),
      value: formatMoney(overview.revenueThisMonthCents),
      hint: t('revenueHint'),
    },
    {
      label: t('activeSubscriptions'),
      value: formatNumber(overview.activeSubscriptions),
      hint: t('activeHint'),
    },
    {
      label: t('toolRunsMtd'),
      value: formatNumber(overview.toolRunsThisMonth),
      hint: t('toolRunsHint'),
    },
  ];

  return (
    <AdminPageShell
      user={user}
      title={tn('adminPanel')}
      description={t('welcome', { name: user.name || tn('adminFallbackName') })}
    >
      <div className="grid-hairline sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} hint={card.hint} />
        ))}
      </div>
    </AdminPageShell>
  );
}
