import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { getCurrentUserFn, googleLoginRedirectFn, loginFn, registerFn } from '~/lib/auth/server-fns';
import { useRouter } from '@tanstack/react-router';
import { useTranslations } from '~/lib/i18n-context';
import { buildPageHead, siteConfig } from '~/lib/site-config';
import AuthShell from '~/components/layout/auth-shell';
import Button from '~/components/ui/button';
import { Field, Input } from '~/components/ui/field';

export const Route = createFileRoute('/login')({
  loader: async () => {
    // 已登录就别再看登录页了
    const user = await getCurrentUserFn();
    if (user) throw redirect({ to: '/dashboard' });
    return null;
  },
  head: () =>
    buildPageHead({
      title: 'Sign in',
      description: `Sign in to your ${siteConfig.name} account.`,
      path: '/login',
      noIndex: true,
    }),
  component: LoginPage,
});

function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const { url } = await googleLoginRedirectFn();
      window.location.href = url;
    } catch (err) {
      console.error('Failed to initiate Google login:', err);
      setError(t('errors.OAuthSignin'));
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const fn = mode === 'signup' ? registerFn : loginFn;
      const result = await fn({ data: { email, password, name } });

      if (!result.ok) {
        // 密码强度问题给出具体原因，其余按错误码映射文案
        setError(
          result.error === 'WEAK_PASSWORD' && result.detail
            ? t(`passwordErrors.${result.detail}`)
            : t(`errors2.${result.error ?? 'UNKNOWN'}`)
        );
        return;
      }

      // 会话 cookie 已由服务端下发，刷新路由让 loader 拿到登录态
      await router.invalidate();
      await router.navigate({ to: '/dashboard' });
    } catch (err) {
      console.error('Credential auth failed:', err);
      setError(t('errors2.UNKNOWN'));
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError('');
  };

  return (
    <AuthShell
      title={mode === 'signup' ? t('signUpTitle') : t('loginTitle')}
      description={t('signInToAccess')}
      footer={
        <>
          {t('bySigningIn')}{' '}
          <Link to="/{-$locale}/terms" className="text-primary underline underline-offset-4">
            {t('termsOfService')}
          </Link>{' '}
          {t('and')}{' '}
          <Link to="/{-$locale}/privacy" className="text-primary underline underline-offset-4">
            {t('privacyPolicy')}
          </Link>
          .
        </>
      }
    >
      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <Button
        variant="secondary"
        size="lg"
        block
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        {t('continueWith', { provider: 'Google' })}
      </Button>

      {/* 分隔线上的文字压在卡片底色上，不是浮在一条线中间 */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-xs text-muted-foreground">{t('orContinueWith')}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === 'signup' ? (
          <Field id="name" label={t('name')}>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        ) : null}

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

        <Field id="password" label={t('password')}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength={mode === 'signup' ? 8 : undefined}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Button type="submit" size="lg" block disabled={submitting}>
          {submitting
            ? mode === 'signup'
              ? t('creatingAccount')
              : t('signingIn')
            : mode === 'signup'
              ? t('signUp')
              : t('signIn')}
        </Button>
      </form>

      {mode === 'signin' ? (
        <p className="mt-5 text-center text-sm">
          <Link to="/forgot-password" className="text-primary underline underline-offset-4">
            {t('forgotLink')}
          </Link>
        </p>
      ) : null}

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {mode === 'signup' ? t('switchToSignIn') : t('switchToSignUp')}{' '}
        <button
          type="button"
          onClick={switchMode}
          className="cursor-pointer font-medium text-primary underline underline-offset-4"
        >
          {mode === 'signup' ? t('signInLink') : t('signUpLink')}
        </button>
      </p>
    </AuthShell>
  );
}
