import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import { Scale } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'termsPage' });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";

  return {
    title: t('metaTitle', { defaultValue: 'Terms of Service - Legal Terms & Conditions' }),
    description: t('metaDescription', {
      defaultValue: 'Read our terms of service to understand the rules, regulations, and legal conditions for using our SaaS template platform. Includes user rights, responsibilities, and guidelines.'
    }),
    keywords: ["terms of service", "user agreement", "saas terms", "legal terms", "terms and conditions"],
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: t('metaTitle', { defaultValue: 'Terms of Service - Legal Terms & Conditions' }),
      description: t('metaDescription', {
        defaultValue: 'Read our terms of service to understand the rules and regulations for using our platform.'
      }),
      type: "website",
      url: `${baseUrl}/terms`,
    },
    twitter: {
      card: "summary",
      title: t('metaTitle', { defaultValue: 'Terms of Service' }),
      description: t('metaDescription', {
        defaultValue: 'Legal terms and conditions for using our SaaS platform.'
      }),
    },
    alternates: {
      canonical: `${baseUrl}/terms`,
    },
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations('termsPage');

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.",
    },
    {
      title: "2. Use License",
      content: "Permission is granted to temporarily download one copy of the materials for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.",
      items: [
        "Modify or copy the materials",
        "Use the materials for any commercial purpose",
        "Attempt to decompile or reverse engineer any software",
        "Remove any copyright or other proprietary notations",
      ],
      note: "Under this license you may not:",
    },
    {
      title: "3. User Accounts",
      content: "When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms.",
      extra: "You are responsible for safeguarding the password and for all activities that occur under your account.",
    },
    {
      title: "4. Subscriptions",
      content: "Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis.",
      extra: "At the end of each billing period, your subscription will automatically renew unless you cancel it or we cancel it.",
    },
    {
      title: "5. Refunds",
      content: "Certain refund requests may be considered by us on a case-by-case basis and granted at our sole discretion.",
    },
    {
      title: "6. Changes to Terms",
      content: "We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the service.",
    },
    {
      title: "7. Contact Us",
      content: "If you have any questions about these Terms, please contact us at support@yourdomain.com",
    },
  ];

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6 inline-flex rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 p-3">
            <Scale className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-4 text-4xl font-bold">
            <span className="text-gradient">{t('title', { defaultValue: 'Terms of Service' })}</span>
          </h1>
          <p className="text-muted-foreground">
            {t('lastUpdated', { defaultValue: 'Last updated' })}: {new Date().toLocaleDateString()}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 md:pb-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl space-y-8">
            {sections.map((section, index) => (
              <div key={index} className="rounded-xl border bg-card p-8 shadow-sm">
                <h2 className="mb-4 text-2xl font-semibold">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                {section.extra && (
                  <p className="mt-4 text-muted-foreground leading-relaxed">{section.extra}</p>
                )}
                {section.note && (
                  <p className="mt-4 font-medium text-foreground">{section.note}</p>
                )}
                {section.items && (
                  <ul className="mt-3 space-y-2">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-muted-foreground">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
