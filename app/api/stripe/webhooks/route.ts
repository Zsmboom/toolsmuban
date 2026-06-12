import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { db } from '@/lib/db';
import { subscriptions, payments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateUserQuota } from '@/lib/db/queries';
import Stripe from 'stripe';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const subscriptionId = session.subscription as string;

  if (!userId || !subscriptionId) {
    console.error('Missing userId or subscriptionId in checkout session');
    return;
  }

  // Get subscription details
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Create or update subscription in database
  await handleSubscriptionUpdate(stripeSubscription);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  const priceId = subscription.items.data[0]?.price.id;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  const plan = getPlanFromPriceId(priceId);
  const status = mapStripeStatus(subscription.status);

  // Check if subscription exists
  const [existingSubscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.providerId, subscription.id))
    .limit(1);

  const subscriptionData = {
    userId,
    plan,
    status,
    provider: 'stripe' as const,
    providerId: subscription.id,
    priceId,
    currentPeriodStart: new Date(subscription.items.data[0].current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end ? true : false,
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
  };

  if (existingSubscription) {
    // Update existing subscription
    await db
      .update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.id, existingSubscription.id));

    // Sync credit quota if plan changed
    if (existingSubscription.plan !== plan) {
      try {
        await updateUserQuota(userId, plan);
        console.log(`Credit quota synced: user=${userId}, old=${existingSubscription.plan}, new=${plan}`);
      } catch (error) {
        console.error('Failed to sync credit quota:', error);
      }
    }
  } else {
    // Create new subscription
    await db.insert(subscriptions).values(subscriptionData);

    // Set initial credit quota for new subscription
    try {
      await updateUserQuota(userId, plan);
      console.log(`Initial credit quota set: user=${userId}, plan=${plan}`);
    } catch (error) {
      console.error('Failed to set initial credit quota:', error);
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      canceledAt: new Date(),
    })
    .where(eq(subscriptions.providerId, subscription.id));
}

async function handlePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription as string;
  const userId = invoice.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in invoice metadata');
    return;
  }

  // Get subscription from database
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.providerId, subscriptionId))
    .limit(1);

  // Record payment
  await db.insert(payments).values({
    userId,
    subscriptionId: subscription?.id || null,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: 'succeeded',
    provider: 'stripe',
    providerId: invoice.id,
    description: invoice.description || 'Subscription payment',
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const userId = invoice.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in invoice metadata');
    return;
  }

  // Record failed payment
  await db.insert(payments).values({
    userId,
    amount: invoice.amount_due,
    currency: invoice.currency,
    status: 'failed',
    provider: 'stripe',
    providerId: invoice.id,
    description: invoice.description || 'Failed subscription payment',
  });
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused' | 'expired' {
  switch (status) {
    case 'active':
      return 'active';
    case 'canceled':
      return 'canceled';
    case 'past_due':
      return 'past_due';
    case 'trialing':
      return 'trialing';
    case 'paused':
      return 'paused';
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
      return 'expired';
    default:
      return 'expired';
  }
}

function getPlanFromPriceId(priceId: string): 'basic' | 'pro' | 'enterprise' | 'free' {
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC) return 'basic';
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) return 'pro';
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE) return 'enterprise';
  return 'free';
}
