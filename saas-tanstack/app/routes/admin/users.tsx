import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import {
  adjustCreditsFn,
  listUsersFn,
  revokeUserSessionsFn,
  unlockUserFn,
} from '~/lib/admin/server-fns';
import { AdminPageShell, AdminTable, Badge } from '~/components/admin/admin-page';
import { Cell, Row } from '~/components/ui/table';
import Button from '~/components/ui/button';
import { useTranslations } from '~/lib/i18n-context';
import { buildPageHead } from '~/lib/site-config';
import { formatDateShort, formatNumber } from '~/lib/format';

export const Route = createFileRoute('/admin/users')({
  loader: async () => {
    const user = await getCurrentUserFn();
    if (!user) throw redirect({ to: '/login' });
    if (user.role !== 'admin') throw redirect({ to: '/dashboard' });
    return { user, users: await listUsersFn() };
  },
  head: () =>
    buildPageHead({ title: 'Users', description: 'Admin user management.', path: '/admin/users', noIndex: true }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { user, users } = Route.useLoaderData();
  const router = useRouter();
  const t = useTranslations('adminUsersPage');
  const tn = useTranslations('appNav');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = async (id: string, fn: () => Promise<unknown>, label: string) => {
    setBusy(id);
    setMessage(null);
    try {
      await fn();
      await router.invalidate();
      setMessage(label);
    } catch (error) {
      console.error(error);
      setMessage(t('operationFailed'));
    } finally {
      setBusy(null);
    }
  };

  const adjust = (userId: string) => {
    const raw = window.prompt(t('creditPrompt'));
    if (!raw) return;
    const amount = Number(raw);
    if (!Number.isInteger(amount) || amount === 0) return;
    const reason = window.prompt(t('reasonPrompt'));
    if (!reason) return;
    void run(userId, () => adjustCreditsFn({ data: { userId, amount, reason } }), t('creditsAdjusted'));
  };

  return (
    <AdminPageShell
      user={user}
      title={tn('users')}
      description={t('accountCount', { count: users.length })}
      actions={message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    >
      <AdminTable
        columns={[t('user'), t('role'), t('signIn'), t('credits'), t('joined'), t('actions')]}
        empty={t('empty')}
        isEmpty={users.length === 0}
      >
        {users.map((u) => {
          const locked = u.lockedUntil && new Date(u.lockedUntil) > new Date();
          return (
            <Row key={u.id}>
              <Cell>
                <span className="block font-medium">{u.name || '—'}</span>
                <span className="tabular block text-xs text-muted-foreground">{u.email}</span>
              </Cell>
              <Cell>
                <Badge tone={u.role === 'admin' ? 'info' : 'neutral'}>{u.role}</Badge>
              </Cell>
              <Cell>
                <span className="flex flex-wrap gap-1">
                  <Badge>{u.hasPassword ? t('password') : 'Google'}</Badge>
                  {locked ? <Badge tone="destructive">{t('locked')}</Badge> : null}
                </span>
              </Cell>
              <Cell numeric>
                {u.balance === null
                  ? '—'
                  : `${formatNumber(u.balance)} / ${formatNumber(u.monthlyQuota ?? 0)}`}
              </Cell>
              <Cell numeric muted>
                {formatDateShort(u.createdAt)}
              </Cell>
              <Cell>
                <span className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => adjust(u.id)}
                    disabled={busy === u.id}
                  >
                    {t('credits')}
                  </Button>
                  {locked ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => run(u.id, () => unlockUserFn({ data: { userId: u.id } }), t('unlocked'))}
                      disabled={busy === u.id}
                    >
                      {t('unlock')}
                    </Button>
                  ) : null}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      run(
                        u.id,
                        () => revokeUserSessionsFn({ data: { userId: u.id } }),
                        t('sessionsRevoked'),
                      )
                    }
                    disabled={busy === u.id}
                  >
                    {t('signOut')}
                  </Button>
                </span>
              </Cell>
            </Row>
          );
        })}
      </AdminTable>
    </AdminPageShell>
  );
}
