import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getCreditStats } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/credits
 * Get user's credit balance and statistics
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getCreditStats(session.user.id);

    if (!stats) {
      return NextResponse.json(
        { error: 'Credits not found. Please contact support.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ credits: stats });
  } catch (error) {
    console.error('Get credits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
