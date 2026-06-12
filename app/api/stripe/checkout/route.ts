import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Check if user already has an active subscription to prevent duplicates
    const [existingSubscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, session.user.id),
          or(
            eq(subscriptions.status, 'active'),
            eq(subscriptions.status, 'trialing')
          )
        )
      )
      .limit(1);

    if (existingSubscription) {
      return NextResponse.json(
        {
          error: 'existing_subscription',
          message: 'You already have an active subscription. Please manage your existing subscription instead.',
          plan: existingSubscription.plan,
          status: existingSubscription.status,
        },
        { status: 409 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { url } = await createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email!,
      priceId,
      successUrl: `${baseUrl}/dashboard?success=true`,
      cancelUrl: `${baseUrl}/pricing?canceled=true`,
    });

    if (!url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
