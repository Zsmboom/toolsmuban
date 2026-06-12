import Stripe from 'stripe';

// Lazy initialize Stripe to avoid build-time errors
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const stripe = getStripe();
    const value = stripe[prop as keyof Stripe];
    return typeof value === 'function' ? value.bind(stripe) : value;
  },
});

// Create a checkout session
export async function createCheckoutSession({
  userId,
  userEmail,
  priceId,
  successUrl,
  cancelUrl,
  trialDays = 0,
  allowPromotionCodes = true,
}: {
  userId: string;
  userEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  allowPromotionCodes?: boolean;
}) {
  try {
    // Generate an idempotency key to prevent duplicate checkout sessions
    // Format: checkout_{userId}_{priceId} — allows one attempt per user per price
    // Stripe idempotency keys expire after 24 hours
    const idempotencyKey = `checkout_${userId}_${priceId}`;

    const sessionParams: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: allowPromotionCodes,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
    };

    // Add trial period if specified
    if (trialDays > 0) {
      sessionParams.subscription_data.trial_period_days = trialDays;
    }

    const session = await stripe.checkout.sessions.create(sessionParams, {
      idempotencyKey,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    throw error;
  }
}

// Create customer portal session
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Stripe portal session error:', error);
    throw error;
  }
}

// Get subscription by ID
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Stripe get subscription error:', error);
    throw error;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Stripe cancel subscription error:', error);
    throw error;
  }
}

// Helper to get plan name from price ID
export function getPlanFromPriceId(priceId: string): 'basic' | 'pro' | 'enterprise' | 'free' {
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC) return 'basic';
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) return 'pro';
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE) return 'enterprise';
  return 'free';
}

// Create a refund (full or partial)
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
) {
  try {
    const refundParams: any = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundParams.amount = amount; // Partial refund in cents
    }

    if (reason) {
      refundParams.reason = reason;
    }

    const refund = await stripe.refunds.create(refundParams);
    return refund;
  } catch (error) {
    console.error('Stripe refund error:', error);
    throw error;
  }
}

// List all refunds for a payment
export async function listRefunds(paymentIntentId: string) {
  try {
    const refunds = await stripe.refunds.list({
      payment_intent: paymentIntentId,
    });
    return refunds.data;
  } catch (error) {
    console.error('Stripe list refunds error:', error);
    throw error;
  }
}

// Update subscription (for plan changes)
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string
) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations', // Prorate the price change
    });

    return updatedSubscription;
  } catch (error) {
    console.error('Stripe update subscription error:', error);
    throw error;
  }
}

// Pause subscription
export async function pauseSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: 'mark_uncollectible',
      },
    });
    return subscription;
  } catch (error) {
    console.error('Stripe pause subscription error:', error);
    throw error;
  }
}

// Resume subscription
export async function resumeSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: null,
    });
    return subscription;
  } catch (error) {
    console.error('Stripe resume subscription error:', error);
    throw error;
  }
}

// Cancel subscription at period end
export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  } catch (error) {
    console.error('Stripe cancel at period end error:', error);
    throw error;
  }
}

// Reactivate canceled subscription
export async function reactivateSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    return subscription;
  } catch (error) {
    console.error('Stripe reactivate subscription error:', error);
    throw error;
  }
}

// Get upcoming invoice for a customer
export async function getUpcomingInvoice(customerId: string, subscriptionId?: string) {
  try {
    const params: any = { customer: customerId };
    if (subscriptionId) {
      params.subscription = subscriptionId;
    }

    const invoice = await (stripe.invoices as any).retrieveUpcoming(params);
    return invoice;
  } catch (error) {
    console.error('Stripe get upcoming invoice error:', error);
    throw error;
  }
}

// List all invoices for a customer
export async function listInvoices(customerId: string, limit = 10) {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
    });
    return invoices.data;
  } catch (error) {
    console.error('Stripe list invoices error:', error);
    throw error;
  }
}
