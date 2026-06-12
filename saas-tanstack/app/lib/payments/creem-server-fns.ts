import { createServerFn } from '@tanstack/react-start';
import { db } from '~/lib/db';
import { subscriptions, payments, credits } from '~/lib/db/schema';
import { generateId, getSession } from '~/lib/auth';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { getPlanByCreemProductId, getPlanCredits } from './index';
import { eq } from 'drizzle-orm';

const CREEM_API_KEY = process.env.CREEM_API_KEY || '';
const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET || '';
const CREEM_BASE_URL = CREEM_API_KEY.startsWith('creem_test_')
  ? 'https://test-api.creem.io'
  : 'https://api.creem.io';

// --- createServerFn functions (for client-side use) ---

export const createCreemPortalFn = createServerFn({ method: 'POST' }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  });

  if (!sub?.customerId) {
    throw new Error('No Creem customer found');
  }

  const response = await fetch(`${CREEM_BASE_URL}/v1/customers/billing`, {
    method: 'POST',
    headers: { 'x-api-key': CREEM_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: sub.customerId }),
  });

  if (!response.ok) {
    throw new Error('Failed to get customer portal link');
  }

  const result = await response.json();
  return { url: result.customer_portal_link };
});

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBytes = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const computed = Array.from(new Uint8Array(sigBytes)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (computed.length !== signature.length) return false;
    let result = 0;
    for (let i = 0; i < computed.length; i++) result |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
    return result === 0;
  } catch { return false; }
}

// --- Route handlers (called from api routes, not as createServerFn) ---

export async function handleCreemCheckoutRequest(request: Request) {
  try {
    const { productId } = await request.json();
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    const sessionToken = cookieHeader.split(';').find(c => c.trim().startsWith('session_token='))?.split('=')[1];
    if (!sessionToken) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    const session = await getSession(sessionToken);
    if (!session?.user) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });

    const baseUrl = process.env.VITE_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${CREEM_BASE_URL}/v1/checkouts`, {
      method: 'POST',
      headers: { 'x-api-key': CREEM_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        success_url: `${baseUrl}/checkout-success?provider=creem`,
        cancel_url: `${baseUrl}/checkout-cancel?provider=creem`,
        customer: { email: session.user.email },
        metadata: { userId: session.user.id },
      }),
    });
    if (!response.ok) return new Response(JSON.stringify({ error: 'Creem checkout failed' }), { status: 400 });

    const checkout = await response.json();
    return new Response(JSON.stringify({ url: checkout.checkout_url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}

export async function handleCreemWebhookRequest(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('creem-signature') || '';
    if (!(await verifySignature(payload, signature, CREEM_WEBHOOK_SECRET))) {
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(payload);
    const object = event.object || {};

    switch (event.eventType) {
      case 'checkout.completed': {
        const userId = object.metadata?.userId;
        if (!userId) throw new Error('No userId');
        const plan = getPlanByCreemProductId(object.product_id);
        if (!plan) throw new Error('Unknown plan');

        const subId = await generateId();
        await db.insert(subscriptions).values({
          id: subId,
          userId, plan, status: 'active', provider: 'creem',
          providerId: object.subscription_id || object.id,
          customerId: object.customer_id, priceId: object.product_id,
          currentPeriodStart: object.created_at ? new Date(object.created_at) : new Date(),
          currentPeriodEnd: object.trial_end ? new Date(object.trial_end) : new Date(Date.now() + 30 * 86400000),
        });

        const payId = await generateId();
        await db.insert(payments).values({
          id: payId,
          userId, subscriptionId: subId, amount: object.amount || 0,
          status: 'succeeded', provider: 'creem', providerId: object.order_id || object.id,
        });

        // Update credits quota
        const creditsPerMonth = getPlanCredits(plan);
        const existingCredits = await db.query.credits.findFirst({ where: eq(credits.userId, userId) });
        const quotaValue = creditsPerMonth < 0 ? 999999 : creditsPerMonth;
        if (existingCredits) {
          await db.update(credits).set({ monthlyQuota: quotaValue, updatedAt: new Date() }).where(eq(credits.userId, userId));
        } else {
          await db.insert(credits).values({ id: await generateId(), userId, balance: 100, monthlyQuota: quotaValue });
        }
        break;
      }
      case 'subscription.active': case 'subscription.paid': case 'subscription.update': {
        const subId = object.subscription_id || object.id;
        const p = object.product_id ? getPlanByCreemProductId(object.product_id) : null;
        if (subId && p) {
          await db.insert(subscriptions).values({
            id: await generateId(), userId: object.metadata?.userId || '',
            plan: p, status: 'active', provider: 'creem', providerId: subId,
            customerId: object.customer_id,
          }).onConflictDoUpdate({ target: subscriptions.providerId, set: { status: 'active', plan: p, updatedAt: new Date() } });
          if (object.metadata?.userId) {
            const cpm = getPlanCredits(p);
            const qv = cpm < 0 ? 999999 : cpm;
            const ec = await db.query.credits.findFirst({ where: eq(credits.userId, object.metadata.userId) });
            if (ec) await db.update(credits).set({ monthlyQuota: qv, updatedAt: new Date() }).where(eq(credits.userId, object.metadata.userId));
            else await db.insert(credits).values({ id: await generateId(), userId: object.metadata.userId, balance: 100, monthlyQuota: qv });
          }
        }
        break;
      }
      case 'subscription.canceled': case 'subscription.expired': {
        await db.update(subscriptions).set({ status: 'canceled', canceledAt: new Date(), updatedAt: new Date() })
          .where(eq(subscriptions.providerId, object.subscription_id || object.id));
        break;
      }
      case 'subscription.past_due': {
        await db.update(subscriptions).set({ status: 'past_due', updatedAt: new Date() })
          .where(eq(subscriptions.providerId, object.subscription_id || object.id));
        break;
      }
      case 'subscription.paused': {
        await db.update(subscriptions).set({ status: 'paused', updatedAt: new Date() })
          .where(eq(subscriptions.providerId, object.subscription_id || object.id));
        break;
      }
      case 'refund.created': {
        await db.update(payments).set({ status: 'refunded', updatedAt: new Date() })
          .where(eq(payments.providerId, object.order_id || object.id));
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
