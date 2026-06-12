import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { Testimonials } from "@/components/marketing/testimonials";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { FAQ } from "@/components/marketing/faq";
import { CTA } from "@/components/marketing/cta";
import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import { getOptimizedOgImage, getOptimizedTwitterImage } from '@/lib/og-image-utils';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'homePage' });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";

  return {
    title: t('metaTitle', { defaultValue: 'SaaS Template - Launch Your SaaS Product 10x Faster' }),
    description: t('metaDescription', {
      defaultValue: 'Complete Next.js 15 SaaS starter with authentication, Stripe & PayPal payments, admin dashboard, and analytics. Production-ready, fully customizable, and optimized for performance.'
    }),
    keywords: ["saas template", "nextjs saas", "saas starter", "stripe integration", "paypal integration", "nextjs 15", "typescript saas"],
    openGraph: {
      title: t('metaTitle', { defaultValue: 'SaaS Template - Launch Your SaaS Product 10x Faster' }),
      description: t('metaDescription', { defaultValue: 'Complete Next.js 15 SaaS starter with authentication, payments, and admin dashboard' }),
      type: "website",
      url: baseUrl,
      images: getOptimizedOgImage('og-image', t('metaTitle', { defaultValue: 'SaaS Template - Modern SaaS Starter Kit' })),
    },
    twitter: {
      card: "summary_large_image",
      title: t('metaTitle', { defaultValue: 'SaaS Template - Launch Your SaaS Product 10x Faster' }),
      description: t('metaDescription', { defaultValue: 'Complete Next.js 15 SaaS starter with authentication, payments, and admin dashboard' }),
      images: getOptimizedTwitterImage('og-image'),
    },
    alternates: {
      canonical: baseUrl,
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations('homePage');

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SaaS Template",
    url: "https://yourdomain.com",
    logo: "https://yourdomain.com/logo.png",
    description: t('schemaDescription', { defaultValue: 'Modern SaaS starter template with Next.js 15, authentication, and payment integration' }),
    sameAs: [
      "https://twitter.com/yourhandle",
      "https://github.com/yourorg",
    ],
  };

  // WebSite Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SaaS Template",
    url: "https://yourdomain.com",
    description: t('schemaDescription', { defaultValue: 'Complete SaaS template with authentication, payments, and admin dashboard' }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <Hero />
      <Features />
      <Testimonials />
      <PricingCards />
      <FAQ />
      <CTA />
    </>
  );
}
