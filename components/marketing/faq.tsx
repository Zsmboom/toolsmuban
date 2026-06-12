"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { HelpCircle, MessageCircle } from "lucide-react";

export function FAQ() {
  const shouldReduceMotion = useReducedMotion();
  const t = useTranslations('faq');

  const faqs = [
    { qKey: 'question1.q', aKey: 'question1.a' },
    { qKey: 'question2.q', aKey: 'question2.a' },
    { qKey: 'question3.q', aKey: 'question3.a' },
    { qKey: 'question4.q', aKey: 'question4.a' },
    { qKey: 'question5.q', aKey: 'question5.a' },
    { qKey: 'question6.q', aKey: 'question6.a' },
    { qKey: 'question7.q', aKey: 'question7.a' },
    { qKey: 'question8.q', aKey: 'question8.a' },
  ];

  // FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: t(faq.qKey as any),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(faq.aKey as any),
      },
    })),
  };

  return (
    <section className="relative overflow-hidden bg-muted/30 py-20 md:py-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      {/* Decorative background */}
      <div className="absolute top-20 right-10 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-accent/5 blur-3xl" />

      <div className="container mx-auto px-4">
        <motion.div
          className="mx-auto mb-16 max-w-3xl text-center"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <HelpCircle className="h-4 w-4" />
            <span>FAQ</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </motion.div>

        <motion.div
          className="mx-auto max-w-3xl"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border rounded-xl px-4 bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-medium text-sm md:text-base">{t(faq.qKey as any)}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                  {t(faq.aKey as any)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Contact CTA */}
          <motion.div
            className="mt-12 text-center"
            initial={shouldReduceMotion ? undefined : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="inline-flex flex-col items-center gap-4 rounded-2xl border bg-card p-8 shadow-sm">
              <MessageCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold mb-1">Still have questions?</p>
                <p className="text-sm text-muted-foreground">We're here to help you get started.</p>
              </div>
              <Link href="mailto:support@example.com">
                <Button variant="outline" className="active:scale-95 transition-transform">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
