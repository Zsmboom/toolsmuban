import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { createCheckoutSessionFn } from '~/lib/payments/stripe-server-fns';
import { useAuth } from '~/lib/auth/context';

export default function PricingCards() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, planName: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setIsLoading(planName);
    try {
      const { url } = await createCheckoutSessionFn({ data: { priceId } });
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to create checkout session. Please try again.');
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
      features: [
        '100 credits/month',
        'Basic features',
        'Community support',
        'Single user',
      ],
      cta: 'Get Started',
      popular: false,
      priceId: null,
    },
    {
      name: 'Basic',
      price: '$9.99',
      period: '/month',
      description: 'Great for small teams',
      features: [
        '500 credits/month',
        'All features',
        'Priority support',
        'Up to 5 users',
        'API access',
      ],
      cta: 'Start Basic',
      popular: true,
      priceId: process.env.VITE_STRIPE_BASIC_PRICE_ID || 'price_basic',
    },
    {
      name: 'Pro',
      price: '$29.99',
      period: '/month',
      description: 'For growing businesses',
      features: [
        '2000 credits/month',
        'All features',
        'Dedicated support',
        'Up to 20 users',
        'API access',
        'Advanced analytics',
      ],
      cta: 'Start Pro',
      popular: false,
      priceId: process.env.VITE_STRIPE_PRO_PRICE_ID || 'price_pro',
    },
    {
      name: 'Enterprise',
      price: '$99.99',
      period: '/month',
      description: 'For large organizations',
      features: [
        'Unlimited credits',
        'All features',
        '24/7 support',
        'Unlimited users',
        'API access',
        'Advanced analytics',
        'Custom integrations',
        'SLA guarantee',
      ],
      cta: 'Contact Sales',
      popular: false,
      priceId: null,
    },
  ];

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
        </div>
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-lg border p-6 ${
                  plan.popular
                    ? 'border-primary shadow-lg scale-105'
                    : 'hover:shadow-lg'
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
                      <svg
                        className="h-4 w-4 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => plan.priceId && handleCheckout(plan.priceId, plan.name)}
                  disabled={isLoading === plan.name || !plan.priceId}
                  className={`w-full rounded-md px-4 py-2 text-sm font-semibold ${
                    plan.popular
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-background border text-foreground hover:bg-accent'
                  } ${!plan.priceId ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading === plan.name ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
