import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import Stripe from 'stripe';
import { db } from '~/lib/db';
import { subscriptions, credits, payments } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { generateId } from '~/lib/auth';
import { getPlanByPriceId, getPlanCredits } from './index';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const createCheckoutSessionFn = createServerFn({ method: 'POST' })
  .validator((data: { priceId: string }) => data)
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { priceId } = data;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/checkout-success?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
      cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/checkout-cancel?provider=stripe`,
      metadata: {
        userId: user.id,
      },
    });

    return { sessionId: session.id, url: session.url };
  });

export const createPortalSessionFn = createServerFn({ method: 'POST' }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  });

  if (!subscription?.providerId) {
    throw new Error('No active subscription found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.providerId,
    return_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/dashboard`,
  });

  return { url: session.url };
});

export const handleWebhookFn = createServerFn({ method: 'POST' })
  .validator((data: { payload: string; signature: string }) => data)
  .handler(async ({ data }) => {
    const { payload, signature } = data;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new Error('Webhook signature verification failed');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          throw new Error('No userId in session metadata');
        }

        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const planFromPrice = session.metadata?.plan
          ? (session.metadata.plan as 'basic' | 'pro' | 'enterprise')
          : 'basic';

        // Create subscription record
        const subId = await generateId();
        await db.insert(subscriptions).values({
          id: subId,
          userId,
          plan: planFromPrice,
          status: stripeSubscription.status as 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused' | 'expired',
          provider: 'stripe',
          providerId: stripeSubscription.id,
          customerId: stripeSubscription.customer as string,
          priceId: session.metadata?.price_id,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        });

        // Record payment
        const paymentId = await generateId();
        await db.insert(payments).values({
          id: paymentId,
          userId,
          subscriptionId: subId,
          amount: session.amount_total || 0,
          status: 'succeeded',
          provider: 'stripe',
          providerId: session.id,
        });

        // Update credits quota
        const creditsPerMonth = getPlanCredits(planFromPrice);
        const existingCredits = await db.query.credits.findFirst({
          where: eq(credits.userId, userId),
        });
        const quotaValue = creditsPerMonth < 0 ? 999999 : creditsPerMonth;
        if (existingCredits) {
          await db.update(credits)
            .set({ monthlyQuota: quotaValue, updatedAt: new Date() })
            .where(eq(credits.userId, userId));
        } else {
          await db.insert(credits).values({
            id: await generateId(),
            userId,
            balance: 100,
            monthlyQuota: quotaValue,
          });
        }

        break;
      }

      case 'customer.subscription.updated': {
        const stripeSubUpdated = event.data.object as Stripe.Subscription;

        await db.update(subscriptions)
          .set({
            status: stripeSubUpdated.status as "active" | "canceled" | "past_due" | "trialing" | "paused" | "expired",
            currentPeriodStart: new Date(stripeSubUpdated.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubUpdated.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubUpdated.cancel_at_period_end as boolean,
          })
          .where(eq(subscriptions.providerId, stripeSubUpdated.id));

        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSubDeleted = event.data.object as Stripe.Subscription;

        await db.update(subscriptions)
          .set({ status: 'canceled', canceledAt: new Date(), updatedAt: new Date() })
          .where(eq(subscriptions.providerId, stripeSubDeleted.id));

        break;
      }
    }

    return { received: true };
  });
