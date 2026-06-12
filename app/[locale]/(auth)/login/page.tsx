import type { Metadata } from "next";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { getTranslations } from 'next-intl/server';
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
};

export async function generateMetadata({ params }: Omit<Props, 'searchParams'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return {
    title: t('loginTitle'),
    description: t('signInToAccess'),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { error, callbackUrl } = await searchParams;


  const t = await getTranslations('auth');
  const errorKey = error || 'unknown';
  const knownErrors = [
    'OAuthSignin',
    'OAuthCallback',
    'OAuthCreateAccount',
    'EmailCreateAccount',
    'Callback',
    'OAuthAccountNotLinked',
    'SessionRequired',
    'Default'
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-lg border">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">{t('loginTitle')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('signInToAccess')}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm text-destructive">
              {knownErrors.includes(errorKey)
                ? t(`errors.${errorKey}`)
                : t('errors.unknown')}
            </p>
          </div>
        )}

        <GoogleSignInButton callbackUrl={callbackUrl || "/dashboard"} />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('bySigningIn')}{" "}
          <Link href="/terms" className="text-primary hover:underline">
            {t('termsOfService')}
          </Link>{" "}
          {t('and')}{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            {t('privacyPolicy')}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
