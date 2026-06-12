"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, ease: "easeOut" as const },
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

export function Testimonials() {
  const shouldReduceMotion = useReducedMotion();
  const t = useTranslations('testimonials');

  const testimonials = [
    {
      nameKey: 'testimonial1.name',
      roleKey: 'testimonial1.role',
      contentKey: 'testimonial1.content',
      image: "https://i.pravatar.cc/150?img=1",
      rating: 5,
    },
    {
      nameKey: 'testimonial2.name',
      roleKey: 'testimonial2.role',
      contentKey: 'testimonial2.content',
      image: "https://i.pravatar.cc/150?img=2",
      rating: 5,
    },
    {
      nameKey: 'testimonial3.name',
      roleKey: 'testimonial3.role',
      contentKey: 'testimonial3.content',
      image: "https://i.pravatar.cc/150?img=3",
      rating: 5,
    },
  ];

  return (
    <section className="relative overflow-hidden bg-muted/30 py-20 md:py-32">
      {/* Decorative quote marks */}
      <div className="absolute top-10 left-10 text-8xl font-serif text-primary/5 select-none leading-none" aria-hidden="true">
        &ldquo;
      </div>
      <div className="absolute bottom-10 right-10 text-8xl font-serif text-primary/5 select-none leading-none" aria-hidden="true">
        &rdquo;
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
          className="grid gap-8 md:grid-cols-3"
          variants={shouldReduceMotion ? undefined : containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={testimonial.nameKey} variants={itemVariants}>
              <Card className="group h-full p-6 card-hover relative overflow-hidden">
                {/* Quote decoration */}
                <div className="absolute top-3 right-4 text-4xl font-serif text-primary/10 select-none leading-none" aria-hidden="true">
                  &ldquo;
                </div>

                {/* Star rating */}
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="mb-6 text-muted-foreground leading-relaxed relative z-10">
                  &ldquo;{t(testimonial.contentKey as any)}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <Avatar className="ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
                    <AvatarImage src={testimonial.image} alt={t(testimonial.nameKey as any)} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                      {t(testimonial.nameKey as any)[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{t(testimonial.nameKey as any)}</p>
                    <p className="text-sm text-muted-foreground">{t(testimonial.roleKey as any)}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
