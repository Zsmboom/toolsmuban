import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import {
  updateSubscription,
  cancelSubscriptionAtPeriodEnd,
  reactivateSubscription,
  pauseSubscription,
  resumeSubscription,
} from '@/lib/payments/stripe';
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, priceId } = await req.json();

    // Get user's subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1);

    if (!subscription?.providerId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    let result;

    switch (action) {
      case 'update':
        if (!priceId) {
          return NextResponse.json(
            { error: 'Price ID is required for update' },
            { status: 400 }
          );
        }
        result = await updateSubscription(subscription.providerId, priceId);
        break;

      case 'cancel':
        result = await cancelSubscriptionAtPeriodEnd(subscription.providerId);
        break;

      case 'reactivate':
        result = await reactivateSubscription(subscription.providerId);
        break;

      case 'pause':
        result = await pauseSubscription(subscription.providerId);
        break;

      case 'resume':
        result = await resumeSubscription(subscription.providerId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, subscription: result });
  } catch (error) {
    console.error('Subscription management error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
