import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { verifyEmailFn } from '~/lib/auth/server-fns';
import { useTranslations } from '~/lib/i18n-context';
import { buildPageHead } from '~/lib/site-config';
import { CheckCircle2, XCircle } from 'lucide-react';
import AuthShell from '~/components/layout/auth-shell';
import { buttonClass } from '~/components/ui/button';

export const Route = createFileRoute('/verify-email')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  head: () =>
    buildPageHead({
      title: 'Verify email',
      description: 'Confirm your email address.',
      path: '/verify-email',
      noIndex: true,
    }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token } = Route.useSearch();
  const t = useTranslations('auth');
  const [state, setState] = useState<'pending' | 'ok' | 'failed'>('pending');
  // 令牌是一次性的，严格模式下 effect 跑两次会把它消费掉
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!token) {
      setState('failed');
      return;
    }
    verifyEmailFn({ data: { token } })
      .then((r) => setState(r.ok ? 'ok' : 'failed'))
      .catch(() => setState('failed'));
  }, [token]);

  if (state === 'pending') {
    return (
      <AuthShell title={t('verifying')}>
        <div
          className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          role="status"
          aria-label={t('verifying')}
        />
      </AuthShell>
    );
  }

  const ok = state === 'ok';

  return (
    <AuthShell
      title={ok ? t('verifiedTitle') : t('verifyFailedTitle')}
      description={ok ? t('verifiedBody') : t('verifyFailedBody')}
      icon={
        ok ? (
          <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
        ) : (
          <XCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
        )
      }
    >
      <Link
        to="/dashboard"
        className={buttonClass({ variant: ok ? 'primary' : 'secondary', block: true, size: 'lg' })}
      >
        {t('goToDashboard')}
      </Link>
    </AuthShell>
  );
}
