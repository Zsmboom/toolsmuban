import type Stripe from 'stripe';
import {
  PLANS,
  getPlanByProviderProductId,
  type PaidPlanType,
} from './plans';
import {
  claimWebhookEvent,
  grantPlanCredits,
  markPaymentRefunded,
  recordPayment,
  revokePlanCredits,
  updateSubscriptionStatus,
  upsertSubscription,
  type SubscriptionStatus,
} from './sync';
import { stripe } from './stripe-api';

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'paused':
      return 'paused';
    case 'canceled':
      return 'canceled';
    case 'incomplete':
    case 'incomplete_expired':
      return 'expired';
    default:
      return 'expired';
  }
}

/** 从订阅对象上解析出套餐：优先 metadata，回落到 price id 反查 */
function resolvePlan(
  metadata: Stripe.Metadata | null | undefined,
  priceId: string | null | undefined
) {
  const fromMetadata = metadata?.plan;
  if (fromMetadata === 'basic' || fromMetadata === 'pro' || fromMetadata === 'enterprise') {
    return { planId: fromMetadata as PaidPlanType, priceId: metadata?.priceId ?? priceId ?? null };
  }
  const byPrice = getPlanByProviderProductId('stripe', priceId);
  if (byPrice && byPrice.id !== 'free') {
    return { planId: byPrice.id as PaidPlanType, priceId };
  }
  return null;
}

/**
 * 处理 Stripe webhook。签名校验 + 幂等去重都在这里。
 * 注意 payload 必须是原始字符串，任何 JSON 解析再序列化都会让验签失败。
 */
export async function handleStripeWebhook(payload: string, signature: string): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch {
    throw new Error('Webhook signature verification failed');
  }

  const isNew = await claimWebhookEvent('stripe', event.id, event.type);
  if (!isNew) return;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId ?? session.client_reference_id ?? undefined;
      if (!userId || !session.subscription) break;

      const stripeSub = await stripe().subscriptions.retrieve(session.subscription as string);
      const priceId = stripeSub.items.data[0]?.price?.id ?? session.metadata?.priceId ?? null;
      const resolved = resolvePlan({ ...session.metadata, ...stripeSub.metadata }, priceId);
      if (!resolved) {
        console.error('[stripe] could not resolve plan for session', session.id);
        break;
      }

      const subId = await upsertSubscription({
        userId,
        plan: resolved.planId,
        status: mapStripeStatus(stripeSub.status),
        provider: 'stripe',
        providerId: stripeSub.id,
        customerId: typeof stripeSub.customer === 'string' ? stripeSub.customer : null,
        priceId: resolved.priceId,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      });

      await recordPayment({
        userId,
        subscriptionId: subId,
        amount: session.amount_total ?? 0,
        currency: session.currency ?? 'usd',
        provider: 'stripe',
        providerId: session.id,
        description: `${resolved.planId} subscription`,
      });

      await grantPlanCredits(userId, PLANS[resolved.planId], subId);
      break;
    }

    // 续费成功：重置当月额度，否则用户第二个月就没积分可用
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.subscription) break;
      // 首次订阅由 checkout.session.completed 处理，这里只管续费
      if (invoice.billing_reason !== 'subscription_cycle') break;

      const stripeSub = await stripe().subscriptions.retrieve(invoice.subscription as string);
      const priceId = stripeSub.items.data[0]?.price?.id ?? null;
      const resolved = resolvePlan(stripeSub.metadata, priceId);
      const userId = stripeSub.metadata?.userId;
      if (!resolved || !userId) break;

      const subId = await upsertSubscription({
        userId,
        plan: resolved.planId,
        status: mapStripeStatus(stripeSub.status),
        provider: 'stripe',
        providerId: stripeSub.id,
        customerId: typeof stripeSub.customer === 'string' ? stripeSub.customer : null,
        priceId: resolved.priceId,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      });

      await recordPayment({
        userId,
        subscriptionId: subId,
        amount: invoice.amount_paid ?? 0,
        currency: invoice.currency ?? 'usd',
        provider: 'stripe',
        providerId: invoice.id,
        description: `${resolved.planId} renewal`,
      });

      await grantPlanCredits(userId, PLANS[resolved.planId], subId);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price?.id ?? null;
      const resolved = resolvePlan(sub.metadata, priceId);
      const userId = sub.metadata?.userId;

      if (resolved && userId) {
        await upsertSubscription({
          userId,
          plan: resolved.planId,
          status: mapStripeStatus(sub.status),
          provider: 'stripe',
          providerId: sub.id,
          customerId: typeof sub.customer === 'string' ? sub.customer : null,
          priceId: resolved.priceId,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        });
      } else {
        await updateSubscriptionStatus(sub.id, mapStripeStatus(sub.status), {
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const row = await updateSubscriptionStatus(sub.id, 'canceled', { canceledAt: new Date() });
      if (row) await revokePlanCredits(row.userId);
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      if (charge.invoice) await markPaymentRefunded('stripe', charge.invoice as string);
      break;
    }
  }
}
