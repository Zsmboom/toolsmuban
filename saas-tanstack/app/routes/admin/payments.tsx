import { createFileRoute, redirect } from '@tanstack/react-router';
import { listPaymentsFn } from '~/lib/admin/server-fns';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { buildPageHead } from '~/lib/site-config';
import { AdminPageShell, AdminTable } from '~/components/admin/admin-page';
import Badge, { statusTone } from '~/components/ui/badge';
import { Cell, Row } from '~/components/ui/table';
import { useTranslations } from '~/lib/i18n-context';
import { formatDateShort, formatMoney } from '~/lib/format';

export const Route = createFileRoute('/admin/payments')({
  loader: async () => {
    const user = await getCurrentUserFn();
    if (!user) throw redirect({ to: '/login' });
    if (user.role !== 'admin') throw redirect({ to: '/dashboard' });

    const payments = await listPaymentsFn();
    return { user, payments };
  },
  head: () =>
    buildPageHead({
      title: 'Payments',
      description: 'Admin payments overview.',
      path: '/admin/payments',
      noIndex: true,
    }),
  component: AdminPaymentsPage,
});

/**
 * 之前这一页手搓了自己的外壳、表格和两套 badge 映射，
 * 与 admin-page.tsx 里的那份几乎逐字重复。现在全部走共用组件。
 */
function AdminPaymentsPage() {
  const { user, payments: paymentList } = Route.useLoaderData();
  const t = useTranslations('adminPaymentsPage');
  const tn = useTranslations('appNav');

  const succeededCount = paymentList.filter((p) => p.status === 'succeeded').length;
  const totalRevenue = paymentList
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <AdminPageShell
      user={user}
      title={tn('payments')}
      description={t('subtitle')}
      actions={
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>
            {t('revenue')}{' '}
            <span className="tabular text-foreground">{formatMoney(totalRevenue)}</span>
          </span>
          <span>
            {t('succeeded')} <span className="tabular text-success">{succeededCount}</span>
          </span>
        </div>
      }
    >
      <AdminTable
        columns={[
          t('user'),
          t('amount'),
          t('status'),
          t('provider'),
          t('description'),
          t('date'),
        ]}
        empty={t('empty')}
        isEmpty={paymentList.length === 0}
      >
        {paymentList.map((pmt) => (
          <Row key={pmt.id}>
            <Cell>
              <span className="block font-medium">{pmt.userName || t('unknownUser')}</span>
              <span className="tabular block text-xs text-muted-foreground">{pmt.userEmail}</span>
            </Cell>
            <Cell numeric>{formatMoney(pmt.amount)}</Cell>
            <Cell>
              <Badge tone={statusTone(pmt.status)}>{pmt.status || '—'}</Badge>
            </Cell>
            <Cell>
              <Badge>{pmt.provider || '—'}</Badge>
            </Cell>
            <Cell muted>
              <span className="block max-w-[16rem] truncate">{pmt.description || '—'}</span>
            </Cell>
            <Cell numeric muted>
              {formatDateShort(pmt.createdAt)}
            </Cell>
          </Row>
        ))}
      </AdminTable>
    </AdminPageShell>
  );
}
