import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { createPayPalOrder } from '@/lib/payments/paypal';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const { orderId, approvalUrl } = await createPayPalOrder({
      planId,
      userId: session.user.id!,
    });

    if (!approvalUrl) {
      return NextResponse.json(
        { error: 'Failed to create PayPal order' },
        { status: 500 }
      );
    }

    return NextResponse.json({ orderId, approvalUrl });
  } catch (error) {
    console.error('PayPal create order API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
