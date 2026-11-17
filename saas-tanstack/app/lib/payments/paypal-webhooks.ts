import { eq } from 'drizzle-orm';
import { db } from '~/lib/db';
import { subscriptions } from '~/lib/db/schema';
import { getCurrentUserFromRequest } from '~/lib/auth';
import { siteConfig } from '~/lib/site-config';
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
import { appUrl, getPayPalAccessToken, json, paypalBaseUrl } from './paypal-api';

async function verifyWebhookSignature(
  headers: Record<string, string>,
  body: string,
  webhookId: string
): Promise<boolean> {
  try {
    const accessToken = await getPayPalAccessToken();
    const verification = await fetch(
      `${paypalBaseUrl()}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: JSON.parse(body),
        }),
      }
    );

    if (!verification.ok) return false;
    const result = (await verification.json()) as { verification_status?: string };
    return result.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('[paypal] signature verification error:', error);
    return false;
  }
}

export async function handlePayPalCheckoutRequest(request: Request): Promise<Response> {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) return json({ error: 'Not authenticated' }, 401);

    const body = (await request.json()) as { planId?: string };
    // 校验 plan id 属于我们配置过的套餐
    const plan = assertKnownProductId('paypal', body.planId);

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${paypalBaseUrl()}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        plan_id: plan.paypalPlanId,
        application_context: {
          brand_name: siteConfig.name,
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${appUrl()}/checkout-success?provider=paypal`,
          cancel_url: `${appUrl()}/checkout-cancel?provider=paypal`,
        },
        subscriber: {
          name: { given_name: user.name || 'User', surname: '-' },
          email_address: user.email || undefined,
        },
        custom_id: user.id,
      }),
    });

    if (!response.ok) {
      console.error('[paypal] checkout failed:', await response.text());
      return json({ error: 'PayPal checkout failed' }, 400);
    }

    const subscription = (await response.json()) as {
      id?: string;
      links?: Array<{ rel: string; href: string }>;
    };
    const approvalUrl = subscription.links?.find((l) => l.rel === 'approve')?.href ?? null;

    return json({ url: approvalUrl, subscriptionId: subscription.id ?? null });
  } catch (error) {
    console.error('[paypal] checkout error:', error);
    return json({ error: 'Internal error' }, 500);
  }
}

interface PayPalResource {
  id?: string;
  plan_id?: string;
  custom_id?: string;
  status?: string;
  start_time?: string;
  billing_agreement_id?: string;
  amount?: { total?: string; currency?: string; value?: string };
  subscriber?: { payer_id?: string };
  billing_info?: { next_billing_time?: string };
}

/**
 * 解析套餐。之前这里错用了 Stripe 的 price id 做匹配，
 * 导致 PayPal 订阅永远解析不出套餐、永远不入库。
 */
function resolvePayPalPlan(planId: string | undefined): PaidPlanType | null {
  const plan = getPlanByProviderProductId('paypal', planId);
  return plan && plan.id !== 'free' ? (plan.id as PaidPlanType) : null;
}

export async function handlePayPalWebhookRequest(request: Request): Promise<Response> {
  try {
    const payload = await request.text();
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    // 没配 webhook id 就直接拒绝。放行等于任何人都能伪造付款事件。
    if (!webhookId) {
      console.error('[paypal] PAYPAL_WEBHOOK_ID is not configured');
      return new Response('Webhook id not configured', { status: 500 });
    }

    const headers: Record<string, string> = {};
    for (const h of [
      'paypal-auth-algo',
      'paypal-cert-url',
      'paypal-transmission-id',
      'paypal-transmission-sig',
      'paypal-transmission-time',
    ]) {
      const val = request.headers.get(h);
      if (val) headers[h] = val;
    }

    if (!(await verifyWebhookSignature(headers, payload, webhookId))) {
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(payload) as {
      id?: string;
      event_type?: string;
      resource?: PayPalResource;
    };
    const resource = event.resource ?? {};

    const isNew = await claimWebhookEvent('paypal', event.id, event.event_type);
    if (!isNew) return json({ received: true, deduped: true });

    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.CREATED':
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.UPDATED': {
        const userId = resource.custom_id;
        const planId = resolvePayPalPlan(resource.plan_id);
        if (!userId || !planId || !resource.id) break;

        const now = new Date();
        const subId = await upsertSubscription({
          userId,
          plan: planId,
          status: event.event_type === 'BILLING.SUBSCRIPTION.CREATED' ? 'trialing' : 'active',
          provider: 'paypal',
          providerId: resource.id,
          customerId: resource.subscriber?.payer_id ?? null,
          priceId: resource.plan_id ?? null,
          currentPeriodStart: resource.start_time ? new Date(resource.start_time) : now,
          currentPeriodEnd: resource.billing_info?.next_billing_time
            ? new Date(resource.billing_info.next_billing_time)
            : new Date(now.getTime() + 30 * 86_400_000),
        });

        if (event.event_type !== 'BILLING.SUBSCRIPTION.CREATED') {
          await grantPlanCredits(userId, PLANS[planId], subId);
        }
        break;
      }

      // 每期扣款成功，续费加额度
      case 'PAYMENT.SALE.COMPLETED': {
        const subscriptionProviderId = resource.billing_agreement_id;
        if (!subscriptionProviderId || !resource.id) break;

        const sub = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.providerId, subscriptionProviderId),
        });
        if (!sub) break;

        await recordPayment({
          userId: sub.userId,
          subscriptionId: sub.id,
          amount: Math.round(parseFloat(resource.amount?.total ?? '0') * 100),
          currency: (resource.amount?.currency ?? 'usd').toLowerCase(),
          provider: 'paypal',
          providerId: resource.id,
          description: `${sub.plan} subscription payment`,
        });

        await updateSubscriptionStatus(subscriptionProviderId, 'active');

        if (sub.plan !== 'free') {
          await grantPlanCredits(sub.userId, PLANS[sub.plan as PaidPlanType], sub.id);
        }
        break;
      }

      case 'PAYMENT.SALE.REFUNDED': {
        if (resource.id) await markPaymentRefunded('paypal', resource.id);
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        if (!resource.id) break;
        const row = await updateSubscriptionStatus(
          resource.id,
          event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED' ? 'canceled' : 'expired',
          { canceledAt: new Date() }
        );
        if (row) await revokePlanCredits(row.userId);
        break;
      }

      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        if (resource.id) await updateSubscriptionStatus(resource.id, 'past_due');
        break;
      }
    }

    return json({ received: true });
  } catch (error) {
    console.error('[paypal] webhook error:', error);
    return json({ error: 'Webhook processing failed' }, 400);
  }
}
