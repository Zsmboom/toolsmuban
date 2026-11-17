import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { requestPasswordResetFn } from '~/lib/auth/server-fns';
import { useI18n, useTranslations } from '~/lib/i18n-context';
import { buildPageHead } from '~/lib/site-config';
import AuthShell from '~/components/layout/auth-shell';
import Button, { buttonClass } from '~/components/ui/button';
import { Field, Input } from '~/components/ui/field';

export const Route = createFileRoute('/forgot-password')({
  head: () =>
    buildPageHead({
      title: 'Forgot password',
      description: 'Request a password reset link.',
      path: '/forgot-password',
      noIndex: true,
    }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const { locale } = useI18n();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await requestPasswordResetFn({ data: { email, locale } });
    } catch (error) {
      console.error('Password reset request failed:', error);
    } finally {
      // 无论后端结果如何都显示同一句话 —— 否则这个页面会变成账号枚举器
      setSent(true);
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title={t('forgotTitle')} description={sent ? undefined : t('forgotSubtitle')}>
      {sent ? (
        <div className="space-y-6 text-center">
          <p className="text-sm text-muted-foreground">{t('resetLinkSent')}</p>
          <Link to="/login" className={buttonClass({ variant: 'primary' })}>
            {t('backToSignIn')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field id="email" label={t('email')}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Button type="submit" size="lg" block disabled={submitting}>
            {submitting ? t('sending') : t('sendResetLink')}
          </Button>
          <p className="text-center text-sm">
            <Link to="/login" className="text-primary underline underline-offset-4">
              {t('backToSignIn')}
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
