"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/navigation";
import { Check, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { StripeCheckoutButton } from "@/components/payments/stripe-checkout-button";
import { PayPalCheckoutButton } from "@/components/payments/paypal-checkout-button";
import { CreemCheckoutButton } from "@/components/payments/creem-checkout-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Read enabled payment providers from env
const ENABLED_PROVIDERS = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDERS || 'stripe,paypal')
  .split(',')
  .map((p) => p.trim().toLowerCase())
  .filter(Boolean);

export function PricingCards() {
  const { data: session } = useSession();
  const shouldReduceMotion = useReducedMotion();
  const t = useTranslations('pricingCards');
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const monthlyPrices = { basic: "$29", pro: "$99", enterprise: "Custom" };
  const yearlyPrices = { basic: "$290", pro: "$990", enterprise: "Custom" };

  const plans = [
    {
      nameKey: 'basic.name',
      price: monthlyPrices.basic,
      yearlyPrice: yearlyPrices.basic,
      period: "/month",
      yearlyPeriod: "/year",
      descriptionKey: 'basic.description',
      popular: false,
      planId: "basic",
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC,
      paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_BASIC,
      creemProductId: process.env.NEXT_PUBLIC_CREEM_PRODUCT_BASIC,
      features: [
        'basic.feature1',
        'basic.feature2',
        'basic.feature3',
        'basic.feature4',
        'basic.feature5',
        'basic.feature6',
      ],
    },
    {
      nameKey: 'pro.name',
      price: monthlyPrices.pro,
      yearlyPrice: yearlyPrices.pro,
      period: "/month",
      yearlyPeriod: "/year",
      descriptionKey: 'pro.description',
      popular: true,
      planId: "pro",
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
      paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_PRO,
      creemProductId: process.env.NEXT_PUBLIC_CREEM_PRODUCT_PRO,
      features: [
        'pro.feature1',
        'pro.feature2',
        'pro.feature3',
        'pro.feature4',
        'pro.feature5',
        'pro.feature6',
        'pro.feature7',
        'pro.feature8',
      ],
    },
    {
      nameKey: 'enterprise.name',
      price: "Custom",
      yearlyPrice: "Custom",
      period: "",
      yearlyPeriod: "",
      descriptionKey: 'enterprise.description',
      popular: false,
      planId: "enterprise",
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE,
      paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ENTERPRISE,
      creemProductId: process.env.NEXT_PUBLIC_CREEM_PRODUCT_ENTERPRISE,
      features: [
        'enterprise.feature1',
        'enterprise.feature2',
        'enterprise.feature3',
        'enterprise.feature4',
        'enterprise.feature5',
        'enterprise.feature6',
        'enterprise.feature7',
        'enterprise.feature8',
        'enterprise.feature9',
      ],
    },
  ];

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />

      <div className="container mx-auto px-4">
        <motion.div
          className="mx-auto mb-12 max-w-3xl text-center"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <span className={cn("text-sm font-medium transition-colors", billing === "monthly" ? "text-foreground" : "text-muted-foreground")}>
            Monthly
          </span>
          <button
            onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
            className={cn(
              "relative h-7 w-12 rounded-full transition-colors duration-300",
              billing === "yearly" ? "bg-primary" : "bg-muted-foreground/30"
            )}
            aria-label="Toggle billing period"
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-300",
                billing === "yearly" && "translate-x-5"
              )}
            />
          </button>
          <span className={cn("text-sm font-medium transition-colors", billing === "yearly" ? "text-foreground" : "text-muted-foreground")}>
            Yearly
            <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Save 20%
            </span>
          </span>
        </div>

        <motion.div
          className="grid gap-8 lg:grid-cols-3 items-stretch"
          initial={shouldReduceMotion ? undefined : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ staggerChildren: 0.1 }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.nameKey}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: shouldReduceMotion ? 0 : index * 0.1, duration: 0.4 }}
              className="flex"
            >
              <Card
                className={cn(
                  "relative flex flex-col p-8 w-full transition-all duration-300",
                  plan.popular
                    ? "border-primary shadow-xl scale-[1.02] lg:scale-105 border-2"
                    : "hover-lift border-border/50"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-primary to-accent shadow-lg px-4 py-1 text-xs font-semibold gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      {t('mostPopular')}
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="mb-2 text-2xl font-bold">{t(plan.nameKey as any)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(plan.descriptionKey as any)}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    {billing === "yearly" ? plan.yearlyPrice : plan.price}
                  </span>
                  <span className="text-muted-foreground">
                    {billing === "yearly" ? plan.yearlyPeriod : plan.period}
                  </span>
                  {plan.popular && billing === "yearly" && (
                    <div className="mt-1 text-xs text-primary font-medium">
                      Save ${parseInt(monthlyPrices.pro.replace("$", "")) * 12 - parseInt(yearlyPrices.pro.replace("$", ""))}/year
                    </div>
                  )}
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((featureKey) => (
                    <li key={featureKey} className="flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      <span className="text-sm">{t(featureKey as any)}</span>
                    </li>
                  ))}
                </ul>

                {session ? (
                  plan.planId === "enterprise" ? (
                    <Link href="mailto:sales@example.com" className="w-full">
                      <Button className="w-full active:scale-95 transition-transform" variant="outline" size="lg">
                        {t('contactSales')}
                      </Button>
                    </Link>
                  ) : (
                    <PaymentTabs plan={plan} planName={t(plan.nameKey as any)} />
                  )
                ) : (
                  <Link href="/login" className="w-full">
                    <Button
                      className="w-full active:scale-95 transition-transform shadow-md hover:shadow-lg"
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                    >
                      {t('getStarted')}
                    </Button>
                  </Link>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          {t('trialInfo')}
        </p>
      </div>
    </section>
  );
}

/**
 * Dynamically renders payment tabs based on NEXT_PUBLIC_PAYMENT_PROVIDERS env var.
 *
 * - Single provider: displays button directly without tabs
 * - Multiple providers: displays tabs for each enabled provider
 *
 * Supported values: "stripe", "paypal", "creem" (comma-separated)
 * Example: NEXT_PUBLIC_PAYMENT_PROVIDERS=stripe,paypal,creem
 */
function PaymentTabs({
  plan,
  planName,
}: {
  plan: {
    stripePriceId?: string;
    paypalPlanId?: string;
    creemProductId?: string;
  };
  planName: string;
}) {
  // Determine default tab — first enabled provider
  const defaultProvider = ENABLED_PROVIDERS[0] || 'stripe';

  if (ENABLED_PROVIDERS.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No payment providers configured.
      </p>
    );
  }

  // Single provider: no tabs needed
  if (ENABLED_PROVIDERS.length === 1) {
    const provider = ENABLED_PROVIDERS[0];

    if (provider === 'stripe' && plan.stripePriceId) {
      return <StripeCheckoutButton priceId={plan.stripePriceId} planName={planName} />;
    }
    if (provider === 'paypal' && plan.paypalPlanId) {
      return <PayPalCheckoutButton planId={plan.paypalPlanId} planName={planName} />;
    }
    if (provider === 'creem' && plan.creemProductId) {
      return <CreemCheckoutButton productId={plan.creemProductId} planName={planName} />;
    }

    return (
      <p className="text-center text-sm text-muted-foreground">
        No payment option available for this plan.
      </p>
    );
  }

  // Multiple providers: render tabs
  return (
    <Tabs defaultValue={defaultProvider} className="w-full">
      <TabsList
        className="grid w-full mb-3"
        style={{ gridTemplateColumns: `repeat(${ENABLED_PROVIDERS.length}, 1fr)` }}
      >
        {ENABLED_PROVIDERS.includes('stripe') && (
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
        )}
        {ENABLED_PROVIDERS.includes('paypal') && (
          <TabsTrigger value="paypal">PayPal</TabsTrigger>
        )}
        {ENABLED_PROVIDERS.includes('creem') && (
          <TabsTrigger value="creem">Creem</TabsTrigger>
        )}
      </TabsList>
      {ENABLED_PROVIDERS.includes('stripe') && plan.stripePriceId && (
        <TabsContent value="stripe">
          <StripeCheckoutButton priceId={plan.stripePriceId} planName={planName} />
        </TabsContent>
      )}
      {ENABLED_PROVIDERS.includes('paypal') && plan.paypalPlanId && (
        <TabsContent value="paypal">
          <PayPalCheckoutButton planId={plan.paypalPlanId} planName={planName} />
        </TabsContent>
      )}
      {ENABLED_PROVIDERS.includes('creem') && plan.creemProductId && (
        <TabsContent value="creem">
          <CreemCheckoutButton productId={plan.creemProductId} planName={planName} />
        </TabsContent>
      )}
    </Tabs>
  );
}
