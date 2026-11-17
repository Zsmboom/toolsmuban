import { getCurrentUserFromRequest, timingSafeEqual } from '~/lib/auth';
import {
  PLANS,
  assertKnownProductId,
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
} from './sync';
import { appUrl, creemApiKey, creemBaseUrl, json } from './creem-api';

/** HMAC-SHA256 验签，恒定时间比较 */
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  if (!signature || !secret) return false;
  try {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBytes = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload));
    const computed = Array.from(new Uint8Array(sigBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return timingSafeEqual(computed, signature.trim().toLowerCase());
  } catch {
    return false;
  }
}

export async function handleCreemCheckoutRequest(request: Request): Promise<Response> {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) return json({ error: 'Not authenticated' }, 401);

    const body = (await request.json()) as { productId?: string };
    // 校验商品 ID 属于我们配置过的套餐
    const plan = assertKnownProductId('creem', body.productId);

    const response = await fetch(`${creemBaseUrl()}/v1/checkouts`, {
      method: 'POST',
      headers: { 'x-api-key': creemApiKey(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: plan.creemProductId,
        success_url: `${appUrl()}/checkout-success?provider=creem`,
        cancel_url: `${appUrl()}/checkout-cancel?provider=creem`,
        customer: { email: user.email },
        metadata: { userId: user.id, plan: plan.id },
      }),
    });

    if (!response.ok) {
      console.error('[creem] checkout failed:', await response.text());
      return json({ error: 'Creem checkout failed' }, 400);
    }

    const checkout = (await response.json()) as { checkout_url?: string };
    return json({ url: checkout.checkout_url ?? null });
  } catch (error) {
    console.error('[creem] checkout error:', error);
    return json({ error: 'Internal error' }, 500);
  }
}

interface CreemObject {
  id?: string;
  subscription_id?: string;
  order_id?: string;
  customer_id?: string;
  product_id?: string;
  amount?: number;
  currency?: string;
  created_at?: string;
  current_period_end_date?: string;
  next_transaction_date?: string;
  metadata?: { userId?: string; plan?: string };
}

function resolveCreemPlan(object: CreemObject): PaidPlanType | null {
  const fromMetadata = object.metadata?.plan;
  if (fromMetadata === 'basic' || fromMetadata === 'pro' || fromMetadata === 'enterprise') {
    return fromMetadata;
  }
  const plan = getPlanByProviderProductId('creem', object.product_id);
  return plan && plan.id !== 'free' ? (plan.id as PaidPlanType) : null;
}

function parseDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export async function handleCreemWebhookRequest(request: Request): Promise<Response> {
  try {
    const payload = await request.text();
    const signature = request.headers.get('creem-signature') ?? '';
    const secret = process.env.CREEM_WEBHOOK_SECRET;

    // 没配密钥就拒绝，绝不能「没配置=跳过验签」
    if (!secret) {
      console.error('[creem] CREEM_WEBHOOK_SECRET is not configured');
      return new Response('Webhook secret not configured', { status: 500 });
    }
    if (!(await verifySignature(payload, signature, secret))) {
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(payload) as {
      id?: string;
      eventType?: string;
      object?: CreemObject;
    };
    const object = event.object ?? {};

    const isNew = await claimWebhookEvent('creem', event.id, event.eventType);
    if (!isNew) return json({ received: true, deduped: true });

    const subscriptionProviderId = object.subscription_id || object.id;

    switch (event.eventType) {
      case 'checkout.completed':
      case 'subscription.active':
      case 'subscription.paid':
      case 'subscription.update': {
        const userId = object.metadata?.userId;
        const planId = resolveCreemPlan(object);
        if (!userId || !planId || !subscriptionProviderId) {
          console.error('[creem] missing userId/plan on', event.eventType);
          break;
        }

        const now = new Date();
        const subId = await upsertSubscription({
          userId,
          plan: planId,
          status: 'active',
          provider: 'creem',
          providerId: subscriptionProviderId,
          customerId: object.customer_id ?? null,
          priceId: object.product_id ?? null,
          currentPeriodStart: parseDate(object.created_at, now),
          currentPeriodEnd: parseDate(
            object.current_period_end_date ?? object.next_transaction_date,
            new Date(now.getTime() + 30 * 86_400_000)
          ),
        });

        if (object.order_id || event.eventType === 'checkout.completed') {
          await recordPayment({
            userId,
            subscriptionId: subId,
            amount: object.amount ?? 0,
            currency: object.currency ?? 'usd',
            provider: 'creem',
            providerId: object.order_id ?? object.id ?? subscriptionProviderId,
            description: `${planId} subscription`,
          });
        }

        await grantPlanCredits(userId, PLANS[planId], subId);
        break;
      }

      case 'subscription.canceled':
      case 'subscription.expired': {
        if (!subscriptionProviderId) break;
        const row = await updateSubscriptionStatus(
          subscriptionProviderId,
          event.eventType === 'subscription.canceled' ? 'canceled' : 'expired',
          { canceledAt: new Date() }
        );
        if (row) await revokePlanCredits(row.userId);
        break;
      }

      case 'subscription.past_due': {
        if (subscriptionProviderId) await updateSubscriptionStatus(subscriptionProviderId, 'past_due');
        break;
      }

      case 'subscription.paused': {
        if (subscriptionProviderId) await updateSubscriptionStatus(subscriptionProviderId, 'paused');
        break;
      }

      case 'refund.created': {
        const paymentId = object.order_id ?? object.id;
        if (paymentId) await markPaymentRefunded('creem', paymentId);
        break;
      }
    }

    return json({ received: true });
  } catch (error) {
    console.error('[creem] webhook error:', error);
    return json({ error: 'Webhook processing failed' }, 400);
  }
}
