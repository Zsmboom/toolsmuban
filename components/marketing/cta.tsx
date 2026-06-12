"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function CTA() {
  const shouldReduceMotion = useReducedMotion();
  const t = useTranslations('cta');

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 bg-dot-grid opacity-30" />

      <div className="container mx-auto px-4">
        <motion.div
          className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent p-8 text-center text-primary-foreground md:p-16 shadow-2xl"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.08)_0%,_transparent_70%)]" />

          <div className="relative z-10">
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm border border-white/10">
                <Sparkles className="h-4 w-4" />
                <span>Get Started Today</span>
              </div>
            </motion.div>

            <motion.h2
              className="mb-4 text-3xl font-bold md:text-5xl tracking-tight"
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {t('title')}
            </motion.h2>

            <motion.p
              className="mb-10 text-lg opacity-90 max-w-2xl mx-auto"
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {t('subtitle')}
            </motion.p>

            <motion.div
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Link href="/login">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto shadow-lg active:scale-95 transition-all duration-200 hover:shadow-xl"
                >
                  {t('startTrial')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20 active:scale-95 transition-all duration-200 sm:w-auto backdrop-blur-sm"
                >
                  {t('viewPricing')}
                </Button>
              </Link>
            </motion.div>

            <motion.p
              className="mt-6 text-sm opacity-75"
              initial={shouldReduceMotion ? undefined : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {t('trialInfo')}
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
