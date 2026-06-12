import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { subscriptions, toolUsageLogs, creditTransactions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getGeoInfo } from '@/lib/utils/geo';
import { getToolCreditCost, hasUnlimitedCredits, PlanType } from '@/lib/config/credits';
import { hasEnoughCredits, deductCredits, getCreditStats } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tools/use
 * Example endpoint showing how to implement tool usage with credit deduction
 *
 * Request body:
 * {
 *   "toolName": "ai-image-generator",
 *   "action": "generate",
 *   "params": { ... } // Tool-specific parameters
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { toolName, action, params } = body;

    // Validate input
    if (!toolName || !action) {
      return NextResponse.json(
        { error: 'toolName and action are required' },
        { status: 400 }
      );
    }

    // 1. Get user's subscription plan
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const plan: PlanType = subscription?.plan || 'free';

    // 2. Calculate credit cost for this tool
    const creditCost = getToolCreditCost(plan, toolName);

    // 3. Check if user has unlimited credits
    const unlimited = hasUnlimitedCredits(plan);

    // 4. Check if user has enough credits (skip if unlimited)
    if (!unlimited && creditCost > 0) {
      const hasCredits = await hasEnoughCredits(session.user.id, creditCost);
      if (!hasCredits) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: creditCost,
            message: 'Please upgrade your plan or wait for your monthly quota to reset.'
          },
          { status: 402 } // Payment Required
        );
      }
    }

    // 5. Execute tool logic (This is where you'd put your actual tool implementation)
    const startTime = Date.now();

    // Example: Simulate tool processing
    // In a real implementation, this would be replaced with actual tool logic
    // e.g., calling an AI API, processing images, etc.
    const toolResult = {
      success: true,
      data: {
        message: `Tool ${toolName} executed successfully`,
        action,
        params,
      },
    };

    const duration = Date.now() - startTime;

    // 6. Get user's IP and country
    const { ip, country } = await getGeoInfo();

    // 7. Log tool usage
    const [usageLog] = await db
      .insert(toolUsageLogs)
      .values({
        userId: session.user.id,
        toolName,
        action,
        metadata: params,
        duration,
        ipAddress: ip,
        country: country || undefined,
        creditsUsed: creditCost,
      })
      .returning();

    // 8. Deduct credits if applicable
    let creditTransaction = null;
    if (!unlimited && creditCost > 0) {
      await deductCredits(
        session.user.id,
        creditCost,
        'tool_usage',
        {
          sourceId: toolName,
          toolUsageLogId: usageLog.id,
          description: `Used ${toolName} - ${action}`,
          metadata: {
            toolName,
            action,
            duration,
          },
        }
      );

      // Get the created transaction
      const [transaction] = await db
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.toolUsageLogId, usageLog.id))
        .limit(1);

      creditTransaction = transaction;

      // Update tool usage log with transaction ID
      await db
        .update(toolUsageLogs)
        .set({ creditTransactionId: transaction.id })
        .where(eq(toolUsageLogs.id, usageLog.id));
    }

    // 9. Get updated credit stats
    const creditStats = await getCreditStats(session.user.id);

    // 10. Return result with credit information
    return NextResponse.json({
      success: true,
      result: toolResult.data,
      usage: {
        creditsUsed: creditCost,
        creditsRemaining: creditStats?.balance || 0,
        hasUnlimited: unlimited,
        usageLogId: usageLog.id,
        transactionId: creditTransaction?.id || null,
      },
      credits: creditStats,
    });

  } catch (error: any) {
    console.error('Tool usage error:', error);

    // Handle specific error messages
    if (error.message === 'Insufficient credits') {
      return NextResponse.json(
        { error: 'Insufficient credits', message: error.message },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tools/use
 * Get available tools and their credit costs for the current user's plan
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription plan
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const plan: PlanType = subscription?.plan || 'free';

    // Get available tools and their costs
    const tools = [
      'ai-image-generator',
      'video-editor',
      'text-enhancer',
      'code-generator',
      'pdf-merger',
    ];

    const toolCosts = tools.map(tool => ({
      name: tool,
      creditCost: getToolCreditCost(plan, tool),
    }));

    return NextResponse.json({
      plan,
      unlimited: hasUnlimitedCredits(plan),
      tools: toolCosts,
    });

  } catch (error) {
    console.error('Get tools error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
