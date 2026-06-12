import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import { Shield } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacyPage' });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";

  return {
    title: t('metaTitle', { defaultValue: 'Privacy Policy - How We Protect Your Data' }),
    description: t('metaDescription', {
      defaultValue: `Our privacy policy explains how we collect, use, and protect your personal information. We prioritize your privacy and data security. Last updated: ${new Date().toLocaleDateString()}`
    }),
    keywords: ["privacy policy", "data protection", "gdpr", "user privacy", "data security"],
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: t('metaTitle', { defaultValue: 'Privacy Policy - How We Protect Your Data' }),
      description: t('metaDescription', {
        defaultValue: 'Our privacy policy explains how we collect, use, and protect your personal information.'
      }),
      type: "website",
      url: `${baseUrl}/privacy`,
    },
    twitter: {
      card: "summary",
      title: t('metaTitle', { defaultValue: 'Privacy Policy' }),
      description: t('metaDescription', {
        defaultValue: 'Learn how we protect your personal information and data.'
      }),
    },
    alternates: {
      canonical: `${baseUrl}/privacy`,
    },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations('privacyPage');

  const sections = [
    {
      title: "1. Information We Collect",
      content: "We collect information that you provide directly to us, including:",
      items: [
        "Name and email address",
        "Payment information (processed securely through Stripe or PayPal)",
        "Usage data and analytics",
        "Communications with us",
      ],
    },
    {
      title: "2. How We Use Your Information",
      content: "We use the information we collect to:",
      items: [
        "Provide, maintain, and improve our services",
        "Process transactions and send related information",
        "Send you technical notices and support messages",
        "Respond to your comments and questions",
        "Monitor and analyze trends and usage",
      ],
    },
    {
      title: "3. Information Sharing",
      content: "We do not share your personal information with third parties except as described in this Privacy Policy:",
      items: [
        "With your consent or at your direction",
        "With service providers who perform services on our behalf",
        "To comply with legal obligations",
        "To protect our rights and prevent fraud",
      ],
    },
    {
      title: "4. Payment Information",
      content: "Payment information is processed by our third-party payment processors, Stripe and PayPal. We do not store your credit card information on our servers.",
    },
    {
      title: "5. Data Security",
      content: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage.",
    },
    {
      title: "6. Your Rights",
      content: "You have the right to:",
      items: [
        "Access your personal information",
        "Correct inaccurate information",
        "Request deletion of your information",
        "Object to processing of your information",
        "Export your data",
      ],
    },
    {
      title: "7. Cookies",
      content: "We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.",
    },
    {
      title: "8. Changes to This Policy",
      content: 'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.',
    },
    {
      title: "9. Contact Us",
      content: "If you have any questions about this Privacy Policy, please contact us at privacy@yourdomain.com",
    },
  ];

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6 inline-flex rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 p-3">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-4 text-4xl font-bold">
            <span className="text-gradient">{t('title', { defaultValue: 'Privacy Policy' })}</span>
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
                {section.items && (
                  <ul className="mt-4 space-y-2">
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
