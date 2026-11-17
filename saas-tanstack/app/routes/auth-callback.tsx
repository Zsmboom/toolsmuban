import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '~/lib/auth/context';
import { googleCallbackFn } from '~/lib/auth/server-fns';
import { useTranslations } from '~/lib/i18n-context';
import { buildPageHead } from '~/lib/site-config';
import { XCircle } from 'lucide-react';
import AuthShell from '~/components/layout/auth-shell';
import Button from '~/components/ui/button';

interface CallbackSearch {
  code?: string;
  state?: string;
  error?: string;
}

export const Route = createFileRoute('/auth-callback')({
  validateSearch: (search: Record<string, unknown>): CallbackSearch => ({
    code: typeof search.code === 'string' ? search.code : undefined,
    state: typeof search.state === 'string' ? search.state : undefined,
    error: typeof search.error === 'string' ? search.error : undefined,
  }),
  head: () =>
    buildPageHead({
      title: 'Signing in',
      description: 'Completing authentication.',
      path: '/auth-callback',
      noIndex: true,
    }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { refetchUser } = useAuth();
  const { code, state, error: oauthError } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);
  // React 18 严格模式下 effect 会跑两次，而授权码只能用一次
  const startedRef = useRef(false);
  const t = useTranslations('auth');

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      if (oauthError) {
        setError(oauthError === 'access_denied' ? t('accessDenied') : t('genericError'));
        return;
      }
      if (!code || !state) {
        setError(t('missingCode'));
        return;
      }

      try {
        await googleCallbackFn({ data: { code, state } });
        await refetchUser();
        // 让所有 loader 拿到新的登录态
        await router.invalidate();
        await navigate({ to: '/dashboard', replace: true });
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(t('genericError'));
      }
    };

    void run();
  }, [code, state, oauthError, refetchUser, router, navigate, t]);

  if (error) {
    return (
      <AuthShell
        title={t('errorTitle')}
        description={error}
        icon={<XCircle className="h-10 w-10 text-destructive" aria-hidden="true" />}
      >
        <Button size="lg" block onClick={() => navigate({ to: '/login', replace: true })}>
          {t('tryAgain')}
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('completing')}>
      <div
        className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        role="status"
        aria-label={t('completing')}
      />
    </AuthShell>
  );
}
