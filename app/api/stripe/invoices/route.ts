import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { listInvoices, getUpcomingInvoice } from '@/lib/payments/stripe';
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { stripe } from '@/lib/payments/stripe';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'list';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get user's subscription to find customer ID
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

    // Get customer ID from Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.providerId
    );
    const customerId = stripeSubscription.customer as string;

    if (type === 'upcoming') {
      // Get upcoming invoice
      const invoice = await getUpcomingInvoice(customerId, subscription.providerId);
      return NextResponse.json({ invoice });
    }

    // List past invoices
    const invoices = await listInvoices(customerId, limit);
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Invoice API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
