import { PricingCards } from "@/components/marketing/pricing-cards";
import { FAQ } from "@/components/marketing/faq";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import { getOptimizedOgImage, getOptimizedTwitterImage } from '@/lib/og-image-utils';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricingPage' });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";

  return {
    title: t('metaTitle', { defaultValue: 'Pricing Plans - Start Free Today' }),
    description: t('metaDescription', {
      defaultValue: 'Flexible pricing for teams of all sizes. Basic $29/mo, Pro $99/mo, Enterprise custom pricing. Start with a 14-day free trial, no credit card required. Cancel anytime.'
    }),
    keywords: ["saas pricing", "subscription plans", "free trial", "pricing comparison"],
    openGraph: {
      title: t('metaTitle', { defaultValue: 'Pricing Plans - SaaS Template' }),
      description: t('metaDescription', { defaultValue: 'Choose the perfect plan for your needs. Start with a 14-day free trial.' }),
      type: "website",
      url: `${baseUrl}/pricing`,
      images: getOptimizedOgImage('og-pricing', t('metaTitle', { defaultValue: 'SaaS Template Pricing Plans' })),
    },
    twitter: {
      card: "summary_large_image",
      title: t('metaTitle', { defaultValue: 'Pricing Plans - SaaS Template' }),
      description: t('metaDescription', { defaultValue: 'Flexible pricing for teams of all sizes. 14-day free trial.' }),
      images: getOptimizedTwitterImage('og-pricing'),
    },
    alternates: {
      canonical: `${baseUrl}/pricing`,
    },
  };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations('pricingPage');

  // Product Schema for pricing plans
  const productSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Basic Plan",
      description: "Perfect for getting started with up to 10,000 requests per month",
      offers: {
        "@type": "Offer",
        price: "29.00",
        priceCurrency: "USD",
        priceValidUntil: "2025-12-31",
        availability: "https://schema.org/InStock",
        url: "https://yourdomain.com/pricing",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Pro Plan",
      description: "Perfect for growing businesses with unlimited requests",
      offers: {
        "@type": "Offer",
        price: "99.00",
        priceCurrency: "USD",
        priceValidUntil: "2025-12-31",
        availability: "https://schema.org/InStock",
        url: "https://yourdomain.com/pricing",
      },
    },
  ];

  return (
    <>
      {productSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              {t('title', { defaultValue: 'Simple, Transparent Pricing' })}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {t('subtitle', { defaultValue: 'Choose the plan that\'s right for you' })}
            </p>
          </div>

          <PricingCards />
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <FAQ />
        </div>
      </section>
    </>
  );
}
