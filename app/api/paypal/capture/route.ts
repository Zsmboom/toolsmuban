import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder, getPlanFromPayPalId } from '@/lib/payments/paypal';
import { db } from '@/lib/db';
import { subscriptions, payments, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token'); // PayPal order ID

    if (!token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=missing_token`
      );
    }

    // Capture the payment
    const captureData = await capturePayPalOrder(token);

    // Extract user ID and plan ID from custom_id
    const customId = captureData.purchase_units[0]?.payments?.captures[0]?.custom_id ||
                     captureData.purchase_units[0]?.reference_id;

    if (!customId) {
      console.error('Missing user ID in PayPal response');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=missing_user`
      );
    }

    const userId = customId;

    // Verify user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      console.error('User not found:', userId);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=user_not_found`
      );
    }

    // Extract payment details
    const capture = captureData.purchase_units[0]?.payments?.captures[0];
    const amount = parseFloat(capture?.amount?.value || '0');
    const currency = capture?.amount?.currency_code?.toLowerCase() || 'usd';
    const status = capture?.status === 'COMPLETED' ? 'succeeded' : 'failed';

    if (status !== 'succeeded') {
      console.error('Payment not completed:', captureData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=payment_failed`
      );
    }

    // Determine plan from description or amount
    const description = captureData.purchase_units[0]?.description || '';
    let planName: 'basic' | 'pro' | 'enterprise' | 'free' = 'free';

    if (description.includes('basic') || amount === 29) {
      planName = 'basic';
    } else if (description.includes('pro') || amount === 99) {
      planName = 'pro';
    } else if (description.includes('enterprise') || amount === 299) {
      planName = 'enterprise';
    }

    // Record payment in database
    await db.insert(payments).values({
      userId,
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      status,
      provider: 'paypal',
      providerId: token,
      description: `PayPal ${planName} plan subscription`,
    });

    // Check if user has existing subscription from the same provider (by providerId)
    // This prevents overwriting a Stripe subscription with PayPal data
    const existingSubByProvider = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.providerId, token),
          eq(subscriptions.provider, 'paypal' as const)
        )
      )
      .limit(1);

    // Also check for existing active subscriptions to prevent cross-provider duplicates
    const existingActiveSub = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      )
      .limit(1);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30); // 30 days subscription

    if (existingSubByProvider.length > 0) {
      // Update existing PayPal subscription (same provider + same order ID)
      await db
        .update(subscriptions)
        .set({
          plan: planName,
          status: 'active',
          provider: 'paypal',
          providerId: token,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        })
        .where(eq(subscriptions.id, existingSubByProvider[0].id));
    } else if (existingActiveSub.length > 0 && existingActiveSub[0].provider !== 'paypal') {
      // User has an active subscription from another provider (e.g., Stripe)
      // Don't overwrite it; redirect with warning
      console.warn(
        `User ${userId} attempted PayPal purchase while having an active ${existingActiveSub[0].provider} subscription`
      );
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=existing_subscription`
      );
    } else if (existingActiveSub.length > 0) {
      // Update existing PayPal subscription
      await db
        .update(subscriptions)
        .set({
          plan: planName,
          status: 'active',
          provider: 'paypal',
          providerId: token,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        })
        .where(eq(subscriptions.id, existingActiveSub[0].id));
    } else {
      // Create new subscription
      await db.insert(subscriptions).values({
        userId,
        plan: planName,
        status: 'active',
        provider: 'paypal',
        providerId: token,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });
    }

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=subscription_created&plan=${planName}`
    );
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=capture_failed`
    );
  }
}
