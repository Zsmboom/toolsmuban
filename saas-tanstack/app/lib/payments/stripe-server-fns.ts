import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import Stripe from 'stripe';
import { db } from '~/lib/db';
import { subscriptions, payments, credits } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { generateId } from '~/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
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
      success_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/checkout-cancel`,
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

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await db.insert(subscriptions).values({
          id: await generateId(),
          userId,
          plan: 'basic',
          status: 'active',
          provider: 'stripe',
          providerId: subscription.id,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });

        await db.update(credits)
          .set({ monthlyQuota: 500 })
          .where(eq(credits.userId, userId));

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        await db.update(subscriptions)
          .set({
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          })
          .where(eq(subscriptions.providerId, subscription.id));

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await db.update(subscriptions)
          .set({ status: 'canceled' })
          .where(eq(subscriptions.providerId, subscription.id));

        break;
      }
    }

    return { received: true };
  });
