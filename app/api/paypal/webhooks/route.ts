import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions, payments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * Verify PayPal webhook signature
 * Uses PayPal's recommended approach: POST to /v1/notifications/verify-webhook-signature
 * https://developer.paypal.com/api/rest/webhooks/rest/#link-verifysignature
 */
async function verifyWebhookSignature(
  req: NextRequest,
  body: string
): Promise<boolean> {
  try {
    const transmissionId = req.headers.get('paypal-transmission-id');
    const transmissionTime = req.headers.get('paypal-transmission-time');
    const transmissionSig = req.headers.get('paypal-transmission-sig');
    const certUrl = req.headers.get('paypal-cert-url');
    const authAlgo = req.headers.get('paypal-auth-algo');
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo || !webhookId) {
      console.error('Missing PayPal webhook headers');
      return false;
    }

    // Verify signature using PayPal's verification endpoint (production-ready)
    const paypalBaseUrl = process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com';
    const accessToken = await getPayPalAccessToken();

    const verifyResponse = await fetch(`${paypalBaseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    });

    const result = await verifyResponse.json();
    return result.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Get PayPal OAuth access token for API calls
 */
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;
  const paypalBaseUrl = process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com';

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const event = JSON.parse(body);

    // Verify webhook signature (skip in development)
    if (process.env.NODE_ENV === 'production') {
      const isValid = await verifyWebhookSignature(req, body);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    console.log('PayPal webhook event:', event.event_type);

    // Handle different webhook events
    switch (event.event_type) {
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(event);
        break;

      case 'PAYMENT.SALE.REFUNDED':
        await handlePaymentRefunded(event);
        break;

      case 'BILLING.SUBSCRIPTION.CREATED':
        await handleSubscriptionCreated(event);
        break;

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event);
        break;

      case 'BILLING.SUBSCRIPTION.UPDATED':
        await handleSubscriptionUpdated(event);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(event);
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handleSubscriptionPaymentFailed(event);
        break;

      default:
        console.log('Unhandled PayPal webhook event:', event.event_type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCompleted(event: any) {
  const sale = event.resource;
  const customId = sale.custom || sale.custom_id;

  if (!customId) {
    console.error('No custom_id in payment completed event');
    return;
  }

  const userId = customId;
  const amount = parseFloat(sale.amount?.total || '0');
  const currency = sale.amount?.currency?.toLowerCase() || 'usd';

  await db.insert(payments).values({
    userId,
    amount: Math.round(amount * 100),
    currency,
    status: 'succeeded',
    provider: 'paypal',
    providerId: sale.id,
    description: 'PayPal payment completed',
  });

  console.log('Payment completed:', sale.id);
}

async function handlePaymentRefunded(event: any) {
  const refund = event.resource;
  const saleId = refund.sale_id;

  // Update payment status
  await db
    .update(payments)
    .set({ status: 'refunded' })
    .where(eq(payments.providerId, saleId));

  console.log('Payment refunded:', saleId);
}

async function handleSubscriptionCreated(event: any) {
  const subscription = event.resource;
  const customId = subscription.custom_id;

  if (!customId) {
    console.error('No custom_id in subscription created event');
    return;
  }

  console.log('Subscription created:', subscription.id);
}

async function handleSubscriptionActivated(event: any) {
  const subscription = event.resource;
  const customId = subscription.custom_id;

  if (!customId) {
    console.error('No custom_id in subscription activated event');
    return;
  }

  const userId = customId;

  // Determine plan from subscription plan_id or amount
  const planName: 'basic' | 'pro' | 'enterprise' = 'pro';
  // You should map PayPal plan IDs to your plan names here

  await db
    .update(subscriptions)
    .set({
      status: 'active',
      providerId: subscription.id,
    })
    .where(eq(subscriptions.userId, userId));

  console.log('Subscription activated:', subscription.id);
}

async function handleSubscriptionUpdated(event: any) {
  const subscription = event.resource;
  const customId = subscription.custom_id;

  if (!customId) {
    console.error('No custom_id in subscription updated event');
    return;
  }

  console.log('Subscription updated:', subscription.id);
}

async function handleSubscriptionCancelled(event: any) {
  const subscription = event.resource;
  const customId = subscription.custom_id;

  if (!customId) {
    console.error('No custom_id in subscription cancelled event');
    return;
  }

  const userId = customId;

  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      cancelAtPeriodEnd: true,
    })
    .where(eq(subscriptions.userId, userId));

  console.log('Subscription cancelled:', subscription.id);
}

async function handleSubscriptionSuspended(event: any) {
  const subscription = event.resource;
  const customId = subscription.custom_id;

  if (!customId) {
    console.error('No custom_id in subscription suspended event');
    return;
  }

  const userId = customId;

  await db
    .update(subscriptions)
    .set({ status: 'paused' })
    .where(eq(subscriptions.userId, userId));

  console.log('Subscription suspended:', subscription.id);
}

async function handleSubscriptionPaymentFailed(event: any) {
  const subscription = event.resource;
  const customId = subscription.custom_id;

  if (!customId) {
    console.error('No custom_id in subscription payment failed event');
    return;
  }

  const userId = customId;

  // You might want to send an email notification here
  console.log('Subscription payment failed:', subscription.id);

  // Optionally mark subscription as past_due
  await db
    .update(subscriptions)
    .set({ status: 'past_due' })
    .where(eq(subscriptions.userId, userId));
}
