export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    credits: 100,
    features: ['100 credits/month', 'Basic features', 'Community support'],
  },
  basic: {
    name: 'Basic',
    price: 9.99,
    credits: 500,
    priceId: process.env.VITE_STRIPE_BASIC_PRICE_ID || 'price_basic',
    features: ['500 credits/month', 'All features', 'Priority support', 'API access'],
  },
  pro: {
    name: 'Pro',
    price: 29.99,
    credits: 2000,
    priceId: process.env.VITE_STRIPE_PRO_PRICE_ID || 'price_pro',
    features: ['2000 credits/month', 'All features', 'Dedicated support', 'Advanced analytics'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 99.99,
    credits: -1, // unlimited
    priceId: process.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    features: ['Unlimited credits', 'All features', '24/7 support', 'Custom integrations'],
  },
} as const;

export type PlanType = keyof typeof PLANS;

export function getPlanByPriceId(priceId: string): PlanType | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if ('priceId' in plan && plan.priceId === priceId) {
      return key as PlanType;
    }
  }
  return null;
}

export function getPlanCredits(plan: PlanType): number {
  return PLANS[plan].credits;
}

export function isSubscriptionActive(status: string): boolean {
  return ['active', 'trialing'].includes(status);
}
