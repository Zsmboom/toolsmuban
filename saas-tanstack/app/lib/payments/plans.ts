/**
 * 套餐定义 —— 全站唯一数据源。
 *
 * 定价页、结账、webhook 回写、积分额度全部读这里。
 * 改价格 / 改额度 / 换支付渠道商品 ID，只改这个文件。
 *
 * 三家渠道的商品 ID 都通过 VITE_ 前缀的构建期变量注入（非敏感信息），
 * 这样服务端和浏览器端拿到的是同一份值。
 */

/** 同时兼容浏览器端（import.meta.env）和服务端（process.env） */
function env(key: string): string | undefined {
  const fromVite = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[key];
  if (fromVite) return fromVite;
  if (typeof process !== 'undefined') return process.env?.[key];
  return undefined;
}

/** credits 为 -1 表示不限量 */
export const UNLIMITED_CREDITS = -1;
/** 不限量在数据库里存成一个足够大的数，方便统一做数值比较 */
export const UNLIMITED_QUOTA_VALUE = 999_999_999;

export interface Plan {
  id: PlanType;
  name: string;
  /** 美元月价，仅用于展示 */
  price: number;
  /** 每月额度，-1 表示不限量 */
  credits: number;
  stripePriceId: string | null;
  creemProductId: string | null;
  paypalPlanId: string | null;
  /** 该套餐在 messages.pricingCards.<id> 下有几条 featureN 文案 */
  featureCount: number;
  popular: boolean;
}

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 100,
    stripePriceId: null,
    creemProductId: null,
    paypalPlanId: null,
    featureCount: 4,
    popular: false,
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    credits: 500,
    stripePriceId: env('VITE_STRIPE_BASIC_PRICE_ID') ?? null,
    creemProductId: env('VITE_CREEM_PRODUCT_BASIC') ?? null,
    paypalPlanId: env('VITE_PAYPAL_PLAN_BASIC') ?? null,
    featureCount: 6,
    popular: true,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29.99,
    credits: 2000,
    stripePriceId: env('VITE_STRIPE_PRO_PRICE_ID') ?? null,
    creemProductId: env('VITE_CREEM_PRODUCT_PRO') ?? null,
    paypalPlanId: env('VITE_PAYPAL_PLAN_PRO') ?? null,
    featureCount: 7,
    popular: false,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    credits: UNLIMITED_CREDITS,
    stripePriceId: env('VITE_STRIPE_ENTERPRISE_PRICE_ID') ?? null,
    creemProductId: env('VITE_CREEM_PRODUCT_ENTERPRISE') ?? null,
    paypalPlanId: env('VITE_PAYPAL_PLAN_ENTERPRISE') ?? null,
    featureCount: 7,
    popular: false,
  },
} satisfies Record<string, Plan>;

export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';
/** 付费套餐（可入库到 subscriptions.plan） */
export type PaidPlanType = Exclude<PlanType, 'free'>;

export const planList: Plan[] = [PLANS.free, PLANS.basic, PLANS.pro, PLANS.enterprise];

export type PaymentProvider = 'stripe' | 'creem' | 'paypal';

/** 按渠道取某个套餐对应的商品/价格 ID */
export function getProviderProductId(plan: Plan, provider: PaymentProvider): string | null {
  switch (provider) {
    case 'stripe':
      return plan.stripePriceId;
    case 'creem':
      return plan.creemProductId;
    case 'paypal':
      return plan.paypalPlanId;
  }
}

/**
 * 反查：拿渠道回传的商品 ID 找回套餐。
 * webhook 里必须用它来确定用户买的到底是哪一档，
 * 不能靠猜或写死默认值。
 */
export function getPlanByProviderProductId(
  provider: PaymentProvider,
  productId: string | null | undefined
): Plan | null {
  if (!productId) return null;
  return (
    planList.find((plan) => getProviderProductId(plan, provider) === productId) ?? null
  );
}

/** 校验前端传来的商品 ID 确实属于我们配置过的套餐，防止被塞任意值 */
export function assertKnownProductId(
  provider: PaymentProvider,
  productId: string | null | undefined
): Plan {
  const plan = getPlanByProviderProductId(provider, productId);
  if (!plan || plan.id === 'free') {
    throw new Error(`Unknown ${provider} product id`);
  }
  return plan;
}

export function getPlanCredits(planId: PlanType): number {
  return PLANS[planId].credits;
}

/** 把套餐额度换算成写进 credits 表的数值 */
export function toQuotaValue(credits: number): number {
  return credits === UNLIMITED_CREDITS ? UNLIMITED_QUOTA_VALUE : credits;
}

export function isUnlimited(quota: number): boolean {
  return quota >= UNLIMITED_QUOTA_VALUE;
}

export function isSubscriptionActive(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing';
}

/** 当前启用了哪些支付渠道，由 VITE_PAYMENT_PROVIDERS 控制 */
export function getEnabledProviders(): PaymentProvider[] {
  const raw = env('VITE_PAYMENT_PROVIDERS') ?? 'stripe';
  const parsed = raw
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is PaymentProvider => p === 'stripe' || p === 'creem' || p === 'paypal');
  return parsed.length > 0 ? parsed : ['stripe'];
}
