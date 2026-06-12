"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useTranslations } from "next-intl";
import {
  Zap,
  Shield,
  CreditCard,
  BarChart,
  Smartphone,
  Code,
  Lock,
  Globe,
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function Features() {
  const shouldReduceMotion = useReducedMotion();
  const t = useTranslations('features');

  const features = [
    {
      icon: Zap,
      titleKey: 'lightningFast.title',
      descriptionKey: 'lightningFast.description',
      gradient: "from-amber-500 to-orange-500",
    },
    {
      icon: Shield,
      titleKey: 'secureAuth.title',
      descriptionKey: 'secureAuth.description',
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      icon: CreditCard,
      titleKey: 'dualPayment.title',
      descriptionKey: 'dualPayment.description',
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: BarChart,
      titleKey: 'analytics.title',
      descriptionKey: 'analytics.description',
      gradient: "from-violet-500 to-purple-500",
    },
    {
      icon: Smartphone,
      titleKey: 'responsive.title',
      descriptionKey: 'responsive.description',
      gradient: "from-sky-500 to-cyan-500",
    },
    {
      icon: Code,
      titleKey: 'typescript.title',
      descriptionKey: 'typescript.description',
      gradient: "from-blue-600 to-blue-400",
    },
    {
      icon: Lock,
      titleKey: 'roleAccess.title',
      descriptionKey: 'roleAccess.description',
      gradient: "from-rose-500 to-pink-500",
    },
    {
      icon: Globe,
      titleKey: 'multiCountry.title',
      descriptionKey: 'multiCountry.description',
      gradient: "from-teal-500 to-emerald-500",
    },
  ];

  return (
    <section id="features" className="relative overflow-hidden py-20 md:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          className="mx-auto mb-16 max-w-3xl text-center"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={shouldReduceMotion ? undefined : containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.titleKey} variants={itemVariants}>
                <Card className="group h-full p-6 border border-border/50 hover-lift hover:border-primary/20 transition-all duration-300">
                  <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${feature.gradient} p-3 shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 font-semibold">{t(feature.titleKey as any)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(feature.descriptionKey as any)}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
