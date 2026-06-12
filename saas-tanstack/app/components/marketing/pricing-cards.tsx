import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { createCheckoutSessionFn } from '~/lib/payments/stripe-server-fns';
import { useAuth } from '~/lib/auth/context';

const ENABLED_PROVIDERS = (
  typeof import.meta !== 'undefined'
    ? (import.meta as any).env?.VITE_PAYMENT_PROVIDERS
    : 'stripe'
)?.split(',').map((p: string) => p.trim().toLowerCase()).filter(Boolean) || ['stripe'];

const PROVIDER_LABELS: Record<string, string> = {
  stripe: '💳 Card',
  creem: 'Creem',
  paypal: 'PayPal',
};

export default function PricingCards() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>(
    ENABLED_PROVIDERS.includes('creem') ? 'creem' : ENABLED_PROVIDERS[0]
  );

  const handleStripeCheckout = async (priceId: string, planName: string) => {
    if (!user) { window.location.href = '/login'; return; }
    setIsLoading(`stripe-${planName}`);
    try {
      const { url } = await createCheckoutSessionFn({ data: { priceId } });
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Stripe checkout error:', error);
      alert('Failed to create checkout session. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleCreemCheckout = async (productId: string, planName: string) => {
    if (!user) { window.location.href = '/login'; return; }
    setIsLoading(`creem-${planName}`);
    try {
      const response = await fetch('/api/creem/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Creem checkout error:', error);
      alert('Failed to create checkout. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handlePayPalCheckout = async (planId: string, planName: string) => {
    if (!user) { window.location.href = '/login'; return; }
    setIsLoading(`paypal-${planName}`);
    try {
      const response = await fetch('/api/paypal/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('PayPal checkout error:', error);
      alert('Failed to create PayPal subscription. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: ['100 credits/month', 'Basic features', 'Community support', 'Single user'],
      cta: 'Get Started',
      popular: false,
      stripePriceId: null as string | null,
      creemProductId: null as string | null,
      paypalPlanId: null as string | null,
    },
    {
      name: 'Basic',
      price: '$9.99',
      period: '/month',
      description: 'Great for small teams',
      features: ['500 credits/month', 'All features', 'Priority support', 'Up to 5 users', 'API access'],
      cta: 'Start Basic',
      popular: true,
      stripePriceId: (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_STRIPE_BASIC_PRICE_ID : null) || 'price_basic',
      creemProductId: (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_CREEM_PRODUCT_BASIC : null) || 'creem_product_basic',
      paypalPlanId: (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_PAYPAL_PLAN_BASIC : null) || 'paypal_plan_basic',
    },
    {
      name: 'Pro',
      price: '$29.99',
      period: '/month',
      description: 'For growing businesses',
      features: ['2000 credits/month', 'All features', 'Dedicated support', 'Up to 20 users', 'API access', 'Advanced analytics'],
      cta: 'Start Pro',
      popular: false,
      stripePriceId: (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_STRIPE_PRO_PRICE_ID : null) || 'price_pro',
      creemProductId: (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_CREEM_PRODUCT_PRO : null) || 'creem_product_pro',
      paypalPlanId: (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_PAYPAL_PLAN_PRO : null) || 'paypal_plan_pro',
    },
    {
      name: 'Enterprise',
      price: '$99.99',
      period: '/month',
      description: 'For large organizations',
      features: ['Unlimited credits', 'All features', '24/7 support', 'Unlimited users', 'API access', 'Advanced analytics', 'Custom integrations', 'SLA guarantee'],
      cta: 'Contact Sales',
      popular: false,
      stripePriceId: null,
      creemProductId: (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_CREEM_PRODUCT_ENTERPRISE : null) || null,
      paypalPlanId: (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_PAYPAL_PLAN_ENTERPRISE : null) || null,
    },
  ];

  const getPlanPriceId = (plan: typeof plans[number], provider: string): string | null => {
    if (provider === 'creem') return plan.creemProductId;
    if (provider === 'paypal') return plan.paypalPlanId;
    return plan.stripePriceId;
  };

  const handleCheckout = (plan: typeof plans[number]) => {
    const priceId = getPlanPriceId(plan, selectedProvider);
    if (!priceId) return;
    if (selectedProvider === 'creem') {
      handleCreemCheckout(priceId, plan.name);
    } else if (selectedProvider === 'paypal') {
      handlePayPalCheckout(priceId, plan.name);
    } else {
      handleStripeCheckout(priceId, plan.name);
    }
  };

  return (
    <section className="py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Choose the plan that's right for your business. All plans include a 14-day free trial.
          </p>

          {ENABLED_PROVIDERS.length > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">Pay with:</span>
              <div className="inline-flex rounded-lg border border-border p-1 bg-card">
                {ENABLED_PROVIDERS.map((p: string) => (
                  <button
                    key={p}
                    onClick={() => setSelectedProvider(p)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                      selectedProvider === p
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {PROVIDER_LABELS[p] || p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan, index) => {
              const priceId = getPlanPriceId(plan, selectedProvider);
              const loadingKey = `${selectedProvider}-${plan.name}`;
              const isPlanLoading = isLoading === loadingKey;

              return (
                <div
                  key={index}
                  className={`relative rounded-lg border p-6 ${
                    plan.popular ? 'border-primary shadow-lg scale-105' : 'hover:shadow-lg'
                  } transition-all`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3 text-sm">
                        <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleCheckout(plan)}
                    disabled={isPlanLoading || !priceId}
                    className={`w-full rounded-md px-4 py-2 text-sm font-semibold ${
                      plan.popular
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-background border text-foreground hover:bg-accent'
                    } ${!priceId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isPlanLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
                    ) : (
                      plan.cta
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
