import { eq } from 'drizzle-orm';
import { db } from '~/lib/db';
import { payments, subscriptions, webhookEvents } from '~/lib/db/schema';
import { generateId } from '~/lib/auth';
import { applyPlanQuota, downgradeToFreeQuota } from '~/lib/credits';
import { toQuotaValue, type PaidPlanType, type PaymentProvider, type Plan } from './plans';

type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'paused'
  | 'expired';

/**
 * webhook 幂等闸门。
 *
 * 三家渠道都会重投事件（网络超时、我们返回非 2xx 等）。处理前先往
 * webhook_events 插一条，靠 (provider, event_id) 的唯一约束挡住重复：
 * 插入成功说明是第一次见到，返回 true；冲突说明处理过，返回 false。
 * 少了这一步，用户一次付款可能被开通多次、入账多次。
 */
export async function claimWebhookEvent(
  provider: PaymentProvider,
  eventId: string | null | undefined,
  eventType: string | null | undefined,
  payload?: unknown
): Promise<boolean> {
  if (!eventId) {
    // 拿不到事件 ID 就没法去重，放行但记一笔日志，便于排查
    console.warn(`[${provider}] webhook without event id (type=${eventType ?? 'unknown'})`);
    return true;
  }

  const inserted = await db
    .insert(webhookEvents)
    .values({
      id: generateId(),
      provider,
      eventId,
      eventType: eventType ?? null,
      payload: (payload as Record<string, unknown>) ?? null,
    })
    .onConflictDoNothing({ target: [webhookEvents.provider, webhookEvents.eventId] })
    .returning({ id: webhookEvents.id });

  return inserted.length > 0;
}

/**
 * 按 providerId upsert 订阅。providerId 上有唯一约束，
 * 所以同一个订阅无论收到多少次事件都只会有一行。
 */
export async function upsertSubscription(params: {
  userId: string;
  plan: PaidPlanType;
  status: SubscriptionStatus;
  provider: PaymentProvider;
  providerId: string;
  customerId?: string | null;
  priceId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}): Promise<string> {
  const now = new Date();
  const id = generateId();

  const [row] = await db
    .insert(subscriptions)
    .values({
      id,
      userId: params.userId,
      plan: params.plan,
      status: params.status,
      provider: params.provider,
      providerId: params.providerId,
      customerId: params.customerId ?? null,
      priceId: params.priceId ?? null,
      currentPeriodStart: params.currentPeriodStart ?? null,
      currentPeriodEnd: params.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
    })
    .onConflictDoUpdate({
      target: subscriptions.providerId,
      set: {
        userId: params.userId,
        plan: params.plan,
        status: params.status,
        provider: params.provider,
        customerId: params.customerId ?? null,
        priceId: params.priceId ?? null,
        currentPeriodStart: params.currentPeriodStart ?? null,
        currentPeriodEnd: params.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
        updatedAt: now,
      },
    })
    .returning({ id: subscriptions.id });

  return row?.id ?? id;
}

export async function updateSubscriptionStatus(
  providerId: string,
  status: SubscriptionStatus,
  extra?: { canceledAt?: Date; currentPeriodEnd?: Date | null }
): Promise<{ userId: string } | null> {
  const [row] = await db
    .update(subscriptions)
    .set({
      status,
      updatedAt: new Date(),
      ...(extra?.canceledAt ? { canceledAt: extra.canceledAt } : {}),
      ...(extra?.currentPeriodEnd !== undefined
        ? { currentPeriodEnd: extra.currentPeriodEnd }
        : {}),
    })
    .where(eq(subscriptions.providerId, providerId))
    .returning({ userId: subscriptions.userId });

  return row ?? null;
}

/**
 * 入账。(provider, providerId) 唯一，重复事件不会重复记账。
 */
export async function recordPayment(params: {
  userId: string;
  subscriptionId?: string | null;
  amount: number;
  currency?: string;
  status?: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'canceled';
  provider: PaymentProvider;
  providerId: string;
  description?: string;
}): Promise<void> {
  await db
    .insert(payments)
    .values({
      id: generateId(),
      userId: params.userId,
      subscriptionId: params.subscriptionId ?? null,
      amount: params.amount,
      currency: params.currency ?? 'usd',
      status: params.status ?? 'succeeded',
      provider: params.provider,
      providerId: params.providerId,
      description: params.description ?? null,
    })
    .onConflictDoNothing({ target: [payments.provider, payments.providerId] });
}

export async function markPaymentRefunded(
  provider: PaymentProvider,
  providerId: string
): Promise<void> {
  await db
    .update(payments)
    .set({ status: 'refunded', updatedAt: new Date() })
    .where(eq(payments.providerId, providerId));
}

/** 订阅生效后把积分额度调到该套餐 */
export async function grantPlanCredits(
  userId: string,
  plan: Plan,
  subscriptionId?: string
): Promise<void> {
  await applyPlanQuota({
    userId,
    quota: toQuotaValue(plan.credits),
    subscriptionId,
    reason: `${plan.name} plan credits`,
  });
}

/** 订阅终止后降回免费额度 */
export async function revokePlanCredits(userId: string): Promise<void> {
  await downgradeToFreeQuota(userId);
}

export type { SubscriptionStatus };
