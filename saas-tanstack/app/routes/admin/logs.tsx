import { createFileRoute, redirect } from '@tanstack/react-router';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { listAuditLogsFn, listToolLogsFn } from '~/lib/admin/server-fns';
import { AdminPageShell, AdminTable, Badge } from '~/components/admin/admin-page';
import { Cell, Row } from '~/components/ui/table';
import { useTranslations } from '~/lib/i18n-context';
import { buildPageHead } from '~/lib/site-config';
import { formatDateTime } from '~/lib/format';

export const Route = createFileRoute('/admin/logs')({
  loader: async () => {
    const user = await getCurrentUserFn();
    if (!user) throw redirect({ to: '/login' });
    if (user.role !== 'admin') throw redirect({ to: '/dashboard' });
    const [toolLogs, auditLogs] = await Promise.all([listToolLogsFn(), listAuditLogsFn()]);
    return { user, toolLogs, auditLogs };
  },
  head: () =>
    buildPageHead({ title: 'Logs', description: 'Tool usage and admin audit logs.', path: '/admin/logs', noIndex: true }),
  component: AdminLogsPage,
});

function AdminLogsPage() {
  const { user, toolLogs, auditLogs } = Route.useLoaderData();
  const t = useTranslations('adminLogsPage');
  const tn = useTranslations('appNav');

  return (
    <AdminPageShell user={user} title={tn('logs')} description={t('subtitle')}>
      <section>
        <h2 className="eyebrow">{t('toolRuns')}</h2>
        <div className="mt-4">
          <AdminTable
            columns={[t('tool'), t('user'), t('credits'), t('duration'), t('country'), t('when')]}
            empty={t('noToolRuns')}
            isEmpty={toolLogs.length === 0}
          >
            {toolLogs.map((l) => (
              <Row key={l.id}>
                <Cell>{l.toolName}</Cell>
                <Cell muted>{l.userEmail ?? '—'}</Cell>
                <Cell numeric>{l.creditsUsed}</Cell>
                <Cell numeric muted>{l.duration ? `${l.duration}ms` : '—'}</Cell>
                <Cell muted>{l.country ?? '—'}</Cell>
                <Cell numeric muted>{formatDateTime(l.createdAt)}</Cell>
              </Row>
            ))}
          </AdminTable>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="eyebrow">{t('auditTrail')}</h2>
        <p className="measure mt-2 text-sm text-muted-foreground">{t('auditHint')}</p>
        <div className="mt-4">
          <AdminTable
            columns={[t('action'), t('actor'), t('target'), t('detail'), t('ip'), t('when')]}
            empty={t('noAudit')}
            isEmpty={auditLogs.length === 0}
          >
            {auditLogs.map((l) => (
              <Row key={l.id}>
                <Cell>
                  <Badge tone="info">{l.action}</Badge>
                </Cell>
                <Cell muted>{l.actorEmail ?? l.actorId}</Cell>
                <Cell muted>{l.targetType ? `${l.targetType}:${l.targetId ?? '—'}` : '—'}</Cell>
                <Cell muted>
                  <span className="block max-w-[14rem] truncate text-xs">{l.detail ?? '—'}</span>
                </Cell>
                <Cell numeric muted>{l.ipAddress ?? '—'}</Cell>
                <Cell numeric muted>{formatDateTime(l.createdAt)}</Cell>
              </Row>
            ))}
          </AdminTable>
        </div>
      </section>
    </AdminPageShell>
  );
}
