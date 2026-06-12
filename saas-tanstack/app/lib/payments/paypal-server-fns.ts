import { createServerFn } from '@tanstack/react-start';
import { db } from '~/lib/db';
import { subscriptions, payments, credits } from '~/lib/db/schema';
import { generateId, getSession } from '~/lib/auth';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { getPlanByPriceId, getPlanCredits } from './index';
import { eq } from 'drizzle-orm';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '';
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

interface PayPalAccessToken {
  access_token: string;
  expires_in: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getPayPalAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data: PayPalAccessToken = await response.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

// --- createServerFn functions (for client-side use) ---

export const createPayPalPortalFn = createServerFn({ method: 'POST' }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  });

  if (!sub?.providerId) {
    throw new Error('No PayPal subscription found');
  }

  // PayPal doesn't have a customer portal, redirect to PayPal account
  // or to the PayPal subscription detail page in sandbox/live
  const paypalAppUrl = PAYPAL_BASE_URL === 'https://api-m.paypal.com'
    ? 'https://www.paypal.com'
    : 'https://www.sandbox.paypal.com';

  // Get subscription details to redirect user
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${sub.providerId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    // Fallback: just go to PayPal account page
    return { url: `${paypalAppUrl}/myaccount/autopay/` };
  }

  const subscriptionData = await response.json();
  // PayPal returns the subscriber.email and subscriber.payer_id
  return { url: `${paypalAppUrl}/myaccount/autopay/` };
});

async function verifyWebhookSignature(headers: Record<string, string>, body: string): Promise<boolean> {
  try {
    const accessToken = await getPayPalAccessToken();
    const verification = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(body),
      }),
    });

    if (!verification.ok) return false;
    const result = await verification.json();
    return result.verification_status === 'SUCCESS';
  } catch {
    return false;
  }
}

// --- Route handlers (called from api routes, not as createServerFn) ---

export async function handlePayPalCheckoutRequest(request: Request) {
  try {
    const { planId } = await request.json();
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    const sessionToken = cookieHeader.split(';').find(c => c.trim().startsWith('session_token='))?.split('=')[1];
    if (!sessionToken) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    const session = await getSession(sessionToken);
    if (!session?.user) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });

    const baseUrl = process.env.VITE_APP_URL || 'http://localhost:3000';
    const accessToken = await getPayPalAccessToken();

    // Create a PayPal subscription
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        plan_id: planId,
        application_context: {
          brand_name: 'ToolsMuban',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
          },
          return_url: `${baseUrl}/checkout-success?provider=paypal`,
          cancel_url: `${baseUrl}/checkout-cancel?provider=paypal`,
        },
        subscriber: {
          name: { given_name: session.user.name || 'User', surname: '' },
          email_address: session.user.email || '',
        },
        custom_id: session.user.id,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return new Response(JSON.stringify({ error: `PayPal checkout failed: ${errBody}` }), { status: 400 });
    }

    const subscription = await response.json();
    const approvalUrl = subscription.links?.find((l: any) => l.rel === 'approve')?.href;

    return new Response(JSON.stringify({ url: approvalUrl, subscriptionId: subscription.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}

export async function handlePayPalWebhookRequest(request: Request) {
  try {
    const payload = await request.text();

    // Get all PayPal-specific headers for signature verification
    const headers: Record<string, string> = {};
    const paypalHeaders = [
      'paypal-auth-algo', 'paypal-cert-url',
      'paypal-transmission-id', 'paypal-transmission-sig',
      'paypal-transmission-time',
    ];
    for (const h of paypalHeaders) {
      const val = request.headers.get(h);
      if (val) headers[h] = val;
    }

    // Verify webhook signature if webhook ID is configured
    if (PAYPAL_WEBHOOK_ID && !(await verifyWebhookSignature(headers, payload))) {
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(payload);
    const resource = event.resource || {};

    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.CREATED':
      case 'PAYMENT.SALE.COMPLETED':
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const userId = resource.custom_id || '';
        if (!userId) break;

        const planId = resource.plan_id || resource.plan?.id || '';
        const plan = getPlanByPriceId(planId);
        if (!plan) break;

        // Check if subscription already exists
        const existingSub = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.providerId, resource.id || ''),
        });

        if (existingSub) {
          await db.update(subscriptions)
            .set({ status: 'active', plan, updatedAt: new Date() })
            .where(eq(subscriptions.providerId, resource.id));
        } else {
          const subId = await generateId();
          await db.insert(subscriptions).values({
            id: subId,
            userId,
            plan,
            status: 'active',
            provider: 'paypal',
            providerId: resource.id || resource.subscription_id || '',
            customerId: resource.subscriber?.payer_id || resource.payer?.payer_id,
            priceId: planId,
            currentPeriodStart: resource.start_time ? new Date(resource.start_time) : new Date(),
            currentPeriodEnd: resource.billing_info?.next_billing_time
              ? new Date(resource.billing_info.next_billing_time)
              : new Date(Date.now() + 30 * 86400000),
          });

          // Record payment for completed sales
          if (event.event_type === 'PAYMENT.SALE.COMPLETED') {
            const payId = await generateId();
            await db.insert(payments).values({
              id: payId,
              userId,
              subscriptionId: subId,
              amount: Math.round(parseFloat(resource.amount?.total || '0') * 100),
              status: 'succeeded',
              provider: 'paypal',
              providerId: resource.id,
            });
          }

          // Update credits quota
          const creditsPerMonth = getPlanCredits(plan);
          const existingCredits = await db.query.credits.findFirst({ where: eq(credits.userId, userId) });
          const quotaValue = creditsPerMonth < 0 ? 999999 : creditsPerMonth;
          if (existingCredits) {
            await db.update(credits).set({ monthlyQuota: quotaValue, updatedAt: new Date() }).where(eq(credits.userId, userId));
          } else {
            await db.insert(credits).values({ id: await generateId(), userId, balance: 100, monthlyQuota: quotaValue });
          }
        }
        break;
      }

      case 'PAYMENT.SALE.REFUNDED': {
        await db.update(payments).set({ status: 'refunded', updatedAt: new Date() })
          .where(eq(payments.providerId, resource.id || resource.sale_id || ''));
        break;
      }

      case 'BILLING.SUBSCRIPTION.UPDATED': {
        const planId = resource.plan_id || resource.plan?.id || '';
        const newPlan = planId ? getPlanByPriceId(planId) : null;
        await db.update(subscriptions)
          .set({
            status: 'active',
            ...(newPlan ? { plan: newPlan } : {}),
            priceId: planId || undefined,
            currentPeriodEnd: resource.billing_info?.next_billing_time
              ? new Date(resource.billing_info.next_billing_time)
              : undefined,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.providerId, resource.id || ''));
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        await db.update(subscriptions)
          .set({ status: 'canceled', canceledAt: new Date(), updatedAt: new Date() })
          .where(eq(subscriptions.providerId, resource.id || ''));
        break;
      }

      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        await db.update(subscriptions)
          .set({ status: 'past_due', updatedAt: new Date() })
          .where(eq(subscriptions.providerId, resource.id || ''));
        break;
      }

      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        await db.update(subscriptions)
          .set({ status: 'expired', updatedAt: new Date() })
          .where(eq(subscriptions.providerId, resource.id || ''));
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), { status: 400 });
  }
}
