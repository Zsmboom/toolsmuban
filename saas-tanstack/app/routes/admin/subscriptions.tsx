import { createFileRoute, redirect } from '@tanstack/react-router';
import { listSubscriptionsFn } from '~/lib/admin/server-fns';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { buildPageHead } from '~/lib/site-config';
import { AdminPageShell, AdminTable } from '~/components/admin/admin-page';
import Badge, { statusTone } from '~/components/ui/badge';
import { Cell, Row } from '~/components/ui/table';
import { useTranslations } from '~/lib/i18n-context';
import { formatDateShort } from '~/lib/format';

export const Route = createFileRoute('/admin/subscriptions')({
  loader: async () => {
    const user = await getCurrentUserFn();
    if (!user) throw redirect({ to: '/login' });
    if (user.role !== 'admin') throw redirect({ to: '/dashboard' });

    // 数据经 server function 取回，路由文件里不出现 db
    const subscriptions = await listSubscriptionsFn();
    return { user, subscriptions };
  },
  head: () =>
    buildPageHead({
      title: 'Subscriptions',
      description: 'Admin subscriptions overview.',
      path: '/admin/subscriptions',
      noIndex: true,
    }),
  component: AdminSubscriptionsPage,
});

function AdminSubscriptionsPage() {
  const { user, subscriptions: subList } = Route.useLoaderData();
  const t = useTranslations('adminSubscriptionsPage');
  const tn = useTranslations('appNav');

  return (
    <AdminPageShell
      user={user}
      title={tn('subscriptions')}
      description={t('subtitle')}
      actions={
        <span className="text-sm text-muted-foreground">
          {t('total')} <span className="tabular text-foreground">{subList.length}</span>
        </span>
      }
    >
      <AdminTable
        columns={[t('user'), t('plan'), t('status'), t('provider'), t('periodEnd'), t('created')]}
        empty={t('empty')}
        isEmpty={subList.length === 0}
      >
        {subList.map((sub) => (
          <Row key={sub.id}>
            <Cell>
              <span className="block font-medium">{sub.userName || t('unknownUser')}</span>
              <span className="tabular block text-xs text-muted-foreground">{sub.userEmail}</span>
            </Cell>
            <Cell>
              <span className="capitalize">{sub.plan}</span>
            </Cell>
            <Cell>
              <Badge tone={statusTone(sub.status)}>{sub.status || '—'}</Badge>
            </Cell>
            <Cell>
              <Badge>{sub.provider || '—'}</Badge>
            </Cell>
            <Cell numeric muted>
              {formatDateShort(sub.currentPeriodEnd)}
            </Cell>
            <Cell numeric muted>
              {formatDateShort(sub.createdAt)}
            </Cell>
          </Row>
        ))}
      </AdminTable>
    </AdminPageShell>
  );
}
