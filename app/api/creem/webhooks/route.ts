import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions, payments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateUserQuota } from '@/lib/db/queries';
import crypto from 'crypto';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';

const webhookSecret = process.env.CREEM_WEBHOOK_SECRET!;

/**
 * Verify Creem webhook signature using HMAC-SHA256
 * Creem sends the signature in the creem-signature header as a hex string
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const computed = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch (error) {
    console.error('Creem signature verification error:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('creem-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing creem-signature header' }, { status: 400 });
  }

  if (!webhookSecret) {
    console.error('CREEM_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // Verify webhook signature
  const isValid = verifySignature(body, signature, webhookSecret);
  if (!isValid) {
    console.error('Invalid Creem webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = event.type || event.event_type;
  console.log(`Creem webhook received: ${eventType}`);

  try {
    switch (eventType) {
      case 'checkout.completed': {
        const checkout = event.data || event;
        await handleCheckoutCompleted(checkout);
        break;
      }

      case 'subscription.active':
      case 'subscription.paid':
      case 'subscription.trialing':
      case 'subscription.update':
      case 'subscription.updated': {
        const subscription = event.data || event;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'subscription.canceled':
      case 'subscription.scheduled_cancel':
      case 'subscription.expired': {
        const subscription = event.data || event;
        await handleSubscriptionEnded(subscription, eventType);
        break;
      }

      case 'subscription.past_due': {
        const subscription = event.data || event;
        await handleSubscriptionPastDue(subscription);
        break;
      }

      case 'subscription.paused': {
        const subscription = event.data || event;
        await handleSubscriptionPaused(subscription);
        break;
      }

      case 'refund.created': {
        const refund = event.data || event;
        await handleRefundCreated(refund);
        break;
      }

      case 'dispute.created': {
        const dispute = event.data || event;
        console.warn('Creem dispute created:', dispute);
        break;
      }

      default:
        console.log(`Unhandled Creem webhook event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Creem webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// ============================================
// Webhook Handlers
// ============================================

async function handleCheckoutCompleted(checkout: any) {
  const userId = checkout.metadata?.userId;
  const subscriptionId = checkout.subscription_id || checkout.subscriptionId;

  if (!userId) {
    console.error('Missing userId in Creem checkout metadata');
    return;
  }

  const customerId = checkout.customer_id || checkout.customerId;
  const productId = checkout.product_id || checkout.productId;
  const plan = getPlanFromCreemProductId(productId);

  // If subscription_id exists, fetch subscription details
  if (subscriptionId) {
    const subEndpoint = `/subscriptions?subscription_id=${subscriptionId}`;
    try {
      const sub = await creemFetch(subEndpoint);
      await handleSubscriptionUpsert(sub, userId, plan);
    } catch (error) {
      console.error('Failed to fetch Creem subscription:', error);
    }
  }

  // Record payment
  const amount = checkout.amount || checkout.total || 0;
  await db.insert(payments).values({
    userId,
    amount: typeof amount === 'number' ? amount : 0,
    currency: (checkout.currency || 'usd').toLowerCase(),
    status: 'succeeded',
    provider: 'creem',
    providerId: checkout.id || checkout.checkout_id,
    description: `Creem ${plan} plan checkout`,
  });
}

async function handleSubscriptionUpdate(subscription: any) {
  const metadata = subscription.metadata || {};
  const userId = metadata.userId || metadata.referenceId;

  if (!userId) {
    console.error('Missing userId in Creem subscription metadata');
    return;
  }

  const productId = subscription.product_id || subscription.productId;
  const plan = getPlanFromCreemProductId(productId);

  await handleSubscriptionUpsert(subscription, userId, plan);
}

async function handleSubscriptionUpsert(subscription: any, userId: string, plan: string) {
  const subscriptionId = subscription.id || subscription.subscription_id;
  const status = mapCreemStatus(subscription.status);

  const now = new Date();
  const periodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000)
    : now;
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Check if subscription exists by providerId
  const [existingSubscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.providerId, subscriptionId),
        eq(subscriptions.provider, 'creem' as const)
      )
    )
    .limit(1);

  const subscriptionData = {
    userId,
    plan: plan as 'basic' | 'pro' | 'enterprise' | 'free',
    status,
    provider: 'creem' as const,
    providerId: subscriptionId,
    priceId: subscription.product_id || subscription.productId || null,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || subscription.scheduled_cancel ? true : false,
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
  };

  if (existingSubscription) {
    await db
      .update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.id, existingSubscription.id));

    // Sync credit quota if plan changed
    if (existingSubscription.plan !== plan) {
      try {
        await updateUserQuota(userId, plan as any);
        console.log(`[Creem] Credit quota synced: user=${userId}, old=${existingSubscription.plan}, new=${plan}`);
      } catch (error) {
        console.error('[Creem] Failed to sync credit quota:', error);
      }
    }
  } else {
    await db.insert(subscriptions).values(subscriptionData);

    try {
      await updateUserQuota(userId, plan as any);
      console.log(`[Creem] Initial credit quota set: user=${userId}, plan=${plan}`);
    } catch (error) {
      console.error('[Creem] Failed to set initial credit quota:', error);
    }
  }
}

async function handleSubscriptionEnded(subscription: any, eventType: string) {
  const subscriptionId = subscription.id || subscription.subscription_id;

  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      canceledAt: new Date(),
      cancelAtPeriodEnd: eventType === 'subscription.scheduled_cancel',
    })
    .where(
      and(
        eq(subscriptions.providerId, subscriptionId),
        eq(subscriptions.provider, 'creem' as const)
      )
    );
}

async function handleSubscriptionPastDue(subscription: any) {
  const subscriptionId = subscription.id || subscription.subscription_id;

  await db
    .update(subscriptions)
    .set({ status: 'past_due' })
    .where(
      and(
        eq(subscriptions.providerId, subscriptionId),
        eq(subscriptions.provider, 'creem' as const)
      )
    );
}

async function handleSubscriptionPaused(subscription: any) {
  const subscriptionId = subscription.id || subscription.subscription_id;

  await db
    .update(subscriptions)
    .set({ status: 'paused' })
    .where(
      and(
        eq(subscriptions.providerId, subscriptionId),
        eq(subscriptions.provider, 'creem' as const)
      )
    );
}

async function handleRefundCreated(refund: any) {
  const paymentId = refund.transaction_id || refund.transactionId;

  if (paymentId) {
    await db
      .update(payments)
      .set({ status: 'refunded' })
      .where(eq(payments.providerId, paymentId));
  }

  console.log('Creem refund processed:', refund.id);
}

// ============================================
// Helpers
// ============================================

function mapCreemStatus(
  status: string
): 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused' | 'expired' {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'active';
    case 'canceled':
      return 'canceled';
    case 'past_due':
    case 'past due':
      return 'past_due';
    case 'trialing':
      return 'trialing';
    case 'paused':
      return 'paused';
    case 'expired':
    case 'unpaid':
    case 'incomplete':
      return 'expired';
    default:
      return 'expired';
  }
}

function getPlanFromCreemProductId(productId: string): 'basic' | 'pro' | 'enterprise' | 'free' {
  if (!productId) return 'free';
  if (productId === process.env.NEXT_PUBLIC_CREEM_PRODUCT_BASIC) return 'basic';
  if (productId === process.env.NEXT_PUBLIC_CREEM_PRODUCT_PRO) return 'pro';
  if (productId === process.env.NEXT_PUBLIC_CREEM_PRODUCT_ENTERPRISE) return 'enterprise';
  return 'free';
}

async function creemFetch(endpoint: string, options: { method?: string; body?: any } = {}): Promise<any> {
  const apiKey = process.env.CREEM_API_KEY!;
  const apiBase = apiKey?.startsWith('creem_test_')
    ? 'https://test-api.creem.io/v1'
    : 'https://api.creem.io/v1';

  const response = await fetch(`${apiBase}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    ...(options.body && { body: JSON.stringify(options.body) }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Creem API error: ${response.status}`);
  }

  return response.json();
}
