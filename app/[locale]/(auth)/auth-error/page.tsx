import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export const metadata: Metadata = {
  title: 'Authentication Error',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AuthErrorPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { error } = await searchParams;


  const t = await getTranslations('auth.errorPage');

  const errorTypes = [
    'Configuration',
    'AccessDenied',
    'Verification',
    'OAuthSignin',
    'OAuthCallback',
    'OAuthCreateAccount',
    'EmailCreateAccount',
    'Callback',
    'OAuthAccountNotLinked',
    'SessionRequired',
    'Default'
  ];

  const errorType = error && errorTypes.includes(error) ? error : 'Default';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-lg border">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">{t(`${errorType}.title`)}</h1>
          <p className="text-muted-foreground">{t(`${errorType}.description`)}</p>
        </div>

        <div className="space-y-3">
          <Link href="/login" className="block">
            <Button className="w-full">{t('tryAgain')}</Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full">
              {t('backToHome')}
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('persistsProblem')}{" "}
          <Link href="/about" className="text-primary hover:underline">
            {t('contactSupport')}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
