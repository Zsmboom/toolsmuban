import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/session-provider";
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { getTranslations, getMessages } from 'next-intl/server';
import { inter, poppins } from '@/app/fonts';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";
  const localeMap: Record<string, string> = {
    en: 'en_US',
    zh: 'zh_CN',
  };

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: t('title', { defaultValue: 'SaaS Template - Modern SaaS Starter Kit' }),
      template: `%s | ${t('siteName', { defaultValue: 'SaaS Template' })}`,
    },
    description: t('description', {
      defaultValue: 'A complete SaaS template with authentication, payments, and admin dashboard'
    }),
    keywords: ["saas", "template", "nextjs", "stripe", "paypal", "typescript", "tailwind"],
    authors: [{ name: "Your Name", url: baseUrl }],
    creator: "Your Name",
    publisher: t('siteName', { defaultValue: 'SaaS Template' }),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: localeMap[locale] || 'en_US',
      url: baseUrl,
      title: t('title', { defaultValue: 'SaaS Template' }),
      description: t('description', {
        defaultValue: 'A complete SaaS template with authentication, payments, and admin dashboard'
      }),
      siteName: t('siteName', { defaultValue: 'SaaS Template' }),
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: t('title', { defaultValue: 'SaaS Template - Modern SaaS Starter Kit' }),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t('title', { defaultValue: 'SaaS Template' }),
      description: t('description', {
        defaultValue: 'A complete SaaS template with authentication, payments, and admin dashboard'
      }),
      creator: "@yourhandle",
      images: ["/og-image.png"],
    },
    verification: {
      google: "your-google-site-verification",
    },
    alternates: {
      languages: {
        'en': `${baseUrl}`,
        'zh': `${baseUrl}/zh`,
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  const isValidLocale = locales.includes(locale as (typeof locales)[number]);
  if (!isValidLocale) {
    notFound();
  }

  // Enable static rendering

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages({ locale });
  const t = await getTranslations({ locale, namespace: 'nav' });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AuthProvider>
            {/* Skip to main content link - for keyboard users */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {t('skipToMain')}
            </a>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
