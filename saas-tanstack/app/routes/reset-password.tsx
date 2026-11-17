import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { resetPasswordFn } from '~/lib/auth/server-fns';
import { useTranslations } from '~/lib/i18n-context';
import { buildPageHead } from '~/lib/site-config';
import AuthShell from '~/components/layout/auth-shell';
import Button, { buttonClass } from '~/components/ui/button';
import { Field, Input } from '~/components/ui/field';

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  head: () =>
    buildPageHead({
      title: 'Reset password',
      description: 'Choose a new password.',
      path: '/reset-password',
      noIndex: true,
    }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const t = useTranslations('auth');
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await resetPasswordFn({ data: { token, password } });
      if (!result.ok) {
        setError(
          result.error === 'WEAK_PASSWORD' && result.detail
            ? t(`passwordErrors.${result.detail}`)
            : t(`errors2.${result.error ?? 'UNKNOWN'}`)
        );
        return;
      }
      setDone(true);
      await router.invalidate();
    } catch (err) {
      console.error('Password reset failed:', err);
      setError(t('errors2.UNKNOWN'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title={t('resetTitle')}>
      {!token ? (
        <p className="text-center text-sm text-destructive">{t('errors2.INVALID_TOKEN')}</p>
      ) : done ? (
        <div className="space-y-6 text-center">
          <p className="text-sm text-muted-foreground">{t('resetDone')}</p>
          <Link to="/login" className={buttonClass({ variant: 'primary' })}>
            {t('backToSignIn')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? (
            <div
              role="alert"
              className="rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          ) : null}
          <Field id="password" label={t('newPassword')} hint={t('passwordHint')}>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" size="lg" block disabled={submitting}>
            {submitting ? t('sending') : t('resetSubmit')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
