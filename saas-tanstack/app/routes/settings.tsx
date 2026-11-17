import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { getDashboardDataFn } from '~/lib/account/server-fns';
import { changePasswordFn, sendVerificationEmailFn } from '~/lib/auth/server-fns';
import { useI18n, useTranslations } from '~/lib/i18n-context';
import { buildPageHead } from '~/lib/site-config';
import AppShell from '~/components/layout/app-shell';
import { Card } from '~/components/ui/card';
import Button from '~/components/ui/button';
import { Field, Input } from '~/components/ui/field';

export const Route = createFileRoute('/settings')({
  loader: async () => {
    const data = await getDashboardDataFn();
    if (!data) throw redirect({ to: '/login' });
    return data;
  },
  head: () =>
    buildPageHead({
      title: 'Settings',
      description: 'Account settings.',
      path: '/settings',
      noIndex: true,
    }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useLoaderData();
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const { locale } = useI18n();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwState, setPwState] = useState<{ kind: 'idle' | 'ok' | 'error'; message?: string }>({
    kind: 'idle',
  });
  const [busy, setBusy] = useState(false);
  const [verifySent, setVerifySent] = useState(false);

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setPwState({ kind: 'idle' });
    try {
      const result = await changePasswordFn({ data: { currentPassword, newPassword } });
      if (!result.ok) {
        setPwState({
          kind: 'error',
          message:
            result.error === 'WEAK_PASSWORD' && result.detail
              ? t(`passwordErrors.${result.detail}`)
              : t(`errors2.${result.error ?? 'UNKNOWN'}`),
        });
        return;
      }
      setPwState({ kind: 'ok', message: t('passwordChanged') });
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      console.error('Change password failed:', error);
      setPwState({ kind: 'error', message: t('errors2.UNKNOWN') });
    } finally {
      setBusy(false);
    }
  };

  const resendVerification = async () => {
    setBusy(true);
    try {
      await sendVerificationEmailFn({ data: { locale } });
      setVerifySent(true);
    } catch (error) {
      console.error('Resend verification failed:', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell user={user} title={tc('settings')} description={user.email ?? undefined}>
      {/* 设置项一律 measure 宽：一行 30 个字的表单标签配一个 1400px 宽的输入框，
          是模板里最容易出现的错位。 */}
      <div className="measure space-y-6">
        <Card>
          <h2 className="text-lg font-medium text-foreground">{t('emailVerification')}</h2>
          {verifySent ? (
            <p className="mt-3 text-sm text-muted-foreground">{t('verificationSent')}</p>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted-foreground">{t('verificationHint')}</p>
              <Button variant="secondary" onClick={resendVerification} disabled={busy} className="mt-5">
                {t('resendVerification')}
              </Button>
            </>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-medium text-foreground">{t('changePassword')}</h2>
          <form onSubmit={handleChangePassword} className="mt-5 space-y-5">
            {pwState.kind !== 'idle' ? (
              <div
                role="alert"
                className={`rounded-[var(--radius)] border px-4 py-3 text-sm ${
                  pwState.kind === 'ok'
                    ? 'border-success/30 bg-success/10 text-success'
                    : 'border-destructive/30 bg-destructive/10 text-destructive'
                }`}
              >
                {pwState.message}
              </div>
            ) : null}

            <Field id="current" label={t('currentPassword')}>
              <Input
                id="current"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </Field>

            <Field id="next" label={t('newPassword')} hint={t('passwordHint')}>
              <Input
                id="next"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Field>

            <Button type="submit" disabled={busy}>
              {t('changePassword')}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
