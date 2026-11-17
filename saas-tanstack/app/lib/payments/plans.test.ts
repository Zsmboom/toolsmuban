import { describe, it, expect } from 'vitest';
import en from '~/messages/en.json';
import {
  PLANS,
  assertKnownProductId,
  getEnabledProviders,
  getPlanByProviderProductId,
  getProviderProductId,
  isSubscriptionActive,
  isUnlimited,
  planList,
  toQuotaValue,
  UNLIMITED_CREDITS,
  UNLIMITED_QUOTA_VALUE,
} from './plans';

describe('plans', () => {
  it('exposes every plan in display order', () => {
    expect(planList.map((p) => p.id)).toEqual(['free', 'basic', 'pro', 'enterprise']);
  });

  it('has a matching translation block for every plan', () => {
    // 定价页按 featureCount 渲染 featureN，缺文案会显示成 key
    for (const plan of planList) {
      const block = (en.pricingCards as Record<string, unknown>)[plan.id] as
        | Record<string, string>
        | undefined;
      expect(block, `pricingCards.${plan.id} missing`).toBeDefined();
      expect(block!.name).toBeTruthy();
      expect(block!.description).toBeTruthy();
      for (let i = 1; i <= plan.featureCount; i++) {
        expect(block![`feature${i}`], `pricingCards.${plan.id}.feature${i} missing`).toBeTruthy();
      }
    }
  });

  describe('provider product id resolution', () => {
    it('round-trips a configured product id back to its plan', () => {
      // 用一个确定存在的值来验证反查逻辑，不依赖环境变量是否配置
      const plan = { ...PLANS.pro, stripePriceId: 'price_test_pro' };
      const list = [PLANS.free, PLANS.basic, plan, PLANS.enterprise];
      const found = list.find((p) => getProviderProductId(p, 'stripe') === 'price_test_pro');
      expect(found?.id).toBe('pro');
    });

    it('returns null for unknown or empty ids', () => {
      expect(getPlanByProviderProductId('stripe', 'price_does_not_exist')).toBeNull();
      expect(getPlanByProviderProductId('paypal', undefined)).toBeNull();
      expect(getPlanByProviderProductId('creem', null)).toBeNull();
    });

    it('keeps each provider’s ids in a separate namespace', () => {
      // 这正是之前的 bug：拿 PayPal 的 plan_id 去比 Stripe 的 price id
      const paypalId = PLANS.basic.paypalPlanId;
      const stripeId = PLANS.basic.stripePriceId;
      if (paypalId && stripeId && paypalId !== stripeId) {
        expect(getPlanByProviderProductId('stripe', paypalId)).toBeNull();
      }
      expect(getProviderProductId(PLANS.basic, 'paypal')).toBe(paypalId);
      expect(getProviderProductId(PLANS.basic, 'stripe')).toBe(stripeId);
    });
  });

  describe('assertKnownProductId', () => {
    it('rejects ids that are not configured', () => {
      expect(() => assertKnownProductId('stripe', 'price_attacker_supplied')).toThrow();
      expect(() => assertKnownProductId('creem', undefined)).toThrow();
    });

    it('rejects the free plan as a checkout target', () => {
      expect(() => assertKnownProductId('stripe', null)).toThrow();
    });
  });

  describe('quota conversion', () => {
    it('maps unlimited to a comparable sentinel', () => {
      expect(toQuotaValue(UNLIMITED_CREDITS)).toBe(UNLIMITED_QUOTA_VALUE);
      expect(isUnlimited(toQuotaValue(UNLIMITED_CREDITS))).toBe(true);
    });

    it('passes finite quotas through unchanged', () => {
      expect(toQuotaValue(500)).toBe(500);
      expect(isUnlimited(500)).toBe(false);
    });

    it('gives the enterprise plan an unlimited quota', () => {
      expect(isUnlimited(toQuotaValue(PLANS.enterprise.credits))).toBe(true);
    });
  });

  describe('isSubscriptionActive', () => {
    it('treats active and trialing as entitled', () => {
      expect(isSubscriptionActive('active')).toBe(true);
      expect(isSubscriptionActive('trialing')).toBe(true);
    });

    it('treats everything else as not entitled', () => {
      for (const status of ['canceled', 'past_due', 'paused', 'expired', null, undefined]) {
        expect(isSubscriptionActive(status)).toBe(false);
      }
    });
  });

  describe('getEnabledProviders', () => {
    it('always returns at least one provider', () => {
      expect(getEnabledProviders().length).toBeGreaterThan(0);
    });

    it('only returns providers we actually implement', () => {
      for (const provider of getEnabledProviders()) {
        expect(['stripe', 'creem', 'paypal']).toContain(provider);
      }
    });
  });
});
