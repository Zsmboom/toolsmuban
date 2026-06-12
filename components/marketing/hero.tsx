"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useTranslations } from "next-intl";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const t = useTranslations('hero');

  return (
    <section className="relative overflow-hidden py-20 md:py-36">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute inset-0 -z-10 bg-dot-grid opacity-40" />

      {/* Floating decorative orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      {/* Decorative grid lines */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-[50%] border border-primary/10" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-[50%] border border-accent/10" />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          variants={shouldReduceMotion ? undefined : containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-background/50 backdrop-blur-sm px-4 py-2 text-sm shadow-sm hover:shadow-md transition-shadow">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-medium">
                {t('badge')}
              </span>
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl leading-tight"
          >
            <span className="text-gradient">{t('title')}</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mb-10 text-lg text-muted-foreground md:text-xl leading-relaxed max-w-3xl mx-auto"
          >
            {t('description')}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/login">
              <Button
                size="lg"
                className="w-full sm:w-auto shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
              >
                {t('cta')}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/#features">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto active:scale-95 transition-all duration-200"
              >
                {t('learnMore')}
              </Button>
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            {[
              { color: "bg-green-500", label: t('productionReady') },
              { color: "bg-blue-500", label: t('typescript') },
              { color: "bg-purple-500", label: t('responsive') },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 backdrop-blur-sm border hover:shadow-sm transition-all">
                <div className={`h-2 w-2 rounded-full ${item.color} animate-pulse`} />
                <span>{item.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            variants={itemVariants}
            className="mt-16 flex flex-col items-center gap-2 text-muted-foreground/50"
          >
            <span className="text-xs font-medium tracking-wider uppercase">Scroll</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
