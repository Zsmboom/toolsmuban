import { Card } from "@/components/ui/card";
import { Mail, MapPin, Users, Rocket, Shield, HeartHandshake, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import { getOptimizedOgImage, getOptimizedTwitterImage } from '@/lib/og-image-utils';
import { Button } from "@/components/ui/button";
import { Link } from "@/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'aboutPage' });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";

  return {
    title: t('metaTitle', { defaultValue: 'About Us - Our Mission & Story' }),
    description: t('metaDescription', {
      defaultValue: 'Learn how we\'re helping developers build amazing SaaS products faster with our production-ready Next.js 15 template. Built with TypeScript, Tailwind CSS, and modern best practices.'
    }),
    keywords: ["about us", "saas template story", "nextjs template", "developer tools"],
    openGraph: {
      title: t('metaTitle', { defaultValue: 'About Us - SaaS Template' }),
      description: t('metaDescription', { defaultValue: 'Helping developers build amazing SaaS products faster' }),
      type: "website",
      url: `${baseUrl}/about`,
      images: getOptimizedOgImage('og-about', t('metaTitle', { defaultValue: 'About SaaS Template' })),
    },
    twitter: {
      card: "summary_large_image",
      title: t('metaTitle', { defaultValue: 'About Us - SaaS Template' }),
      description: t('metaDescription', { defaultValue: 'Helping developers build amazing SaaS products faster' }),
      images: getOptimizedTwitterImage('og-about'),
    },
    alternates: {
      canonical: `${baseUrl}/about`,
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations('aboutPage');

  // Organization Schema for SEO
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SaaS Template",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "Production-ready Next.js 15 SaaS starter template with authentication, payments, and analytics",
    foundingDate: "2024",
    address: {
      "@type": "PostalAddress",
      addressLocality: "San Francisco",
      addressRegion: "CA",
      addressCountry: "US"
    },
    sameAs: [
      "https://twitter.com/yourhandle",
      "https://github.com/yourorg",
      "https://linkedin.com/company/yourcompany"
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "support@example.com"
    }
  };

  return (
    <>
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute inset-0 -z-10 bg-dot-grid opacity-40" />
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
            <span className="text-gradient">{t('title', { defaultValue: 'About Us' })}</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {t('subtitle', { defaultValue: 'We\'re on a mission to help developers build amazing SaaS products faster.' })}
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <Card className="p-8 md:p-12 border border-border/50 shadow-xl">
              <div className="mb-6 inline-flex rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 p-3">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mb-6 text-3xl font-bold">
                {t('story.title', { defaultValue: 'Our Story' })}
              </h2>
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  {t('story.paragraph1', {
                    defaultValue: 'We started with a simple idea: building a SaaS product shouldn\'t require months of setup and configuration. Every developer deserves a solid foundation to build upon.'
                  })}
                </p>
                <p>
                  {t('story.paragraph2', {
                    defaultValue: 'This template was born from our experience building multiple SaaS products. We\'ve included everything we wish we had when starting out - authentication, payments, analytics, and more.'
                  })}
                </p>
                <p>
                  {t('story.paragraph3', {
                    defaultValue: 'Today, developers around the world use our template to launch their ideas faster, allowing them to focus on what makes their product unique.'
                  })}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              {t('values.title', { defaultValue: 'Our Values' })}
            </h2>
            <p className="text-muted-foreground">
              {t('values.subtitle', { defaultValue: 'What drives us every day' })}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="group p-6 card-hover border-border/50">
              <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 p-3 transition-transform duration-300 group-hover:scale-110">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                {t('values.quality.title', { defaultValue: 'Quality First' })}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('values.quality.description', {
                  defaultValue: 'We maintain high standards and follow best practices in every aspect of the template.'
                })}
              </p>
            </Card>

            <Card className="group p-6 card-hover border-border/50">
              <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-3 transition-transform duration-300 group-hover:scale-110">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                {t('values.developer.title', { defaultValue: 'Developer Experience' })}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('values.developer.description', {
                  defaultValue: 'Clean code, clear documentation, and intuitive structure make development a joy.'
                })}
              </p>
            </Card>

            <Card className="group p-6 card-hover border-border/50">
              <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-3 transition-transform duration-300 group-hover:scale-110">
                <HeartHandshake className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                {t('values.support.title', { defaultValue: 'Continuous Support' })}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('values.support.description', {
                  defaultValue: 'Regular updates, bug fixes, and new features to keep you ahead.'
                })}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 text-3xl font-bold">
              {t('cta.title', { defaultValue: 'Ready to Get Started?' })}
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              {t('cta.description', { defaultValue: 'Join thousands of developers who are already building with our template.' })}
            </p>
            <Link href="/pricing">
              <Button size="lg" className="shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200">
                {t('cta.button', { defaultValue: 'View Pricing' })}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
