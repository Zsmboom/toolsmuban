import { db } from './index';
import { users, subscriptions, payments, toolUsageLogs, countryStats, credits, creditTransactions } from './schema';
import { eq, desc, and, gte, lte, sql, count, like, or } from 'drizzle-orm';
import { getMonthlyQuota, getNextQuotaResetDate, PlanType } from '@/lib/config/credits';

// ============================================
// User Queries
// ============================================
export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user;
}

export async function updateUserLastLogin(userId: string) {
  await db.update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, userId));
}

export async function updateUserTracking(userId: string, trackingData: {
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  signupIp?: string;
  signupCountry?: string;
}) {
  await db.update(users)
    .set(trackingData)
    .where(eq(users.id, userId));
}

export async function updateLastLogin(userId: string, ip: string, country: string | null) {
  await db.update(users)
    .set({
      lastLoginAt: new Date(),
      lastLoginIp: ip,
      lastLoginCountry: country,
    })
    .where(eq(users.id, userId));
}

// ============================================
// Subscription Queries
// ============================================
export async function getUserSubscription(userId: string) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return subscription;
}

export async function createSubscription(data: typeof subscriptions.$inferInsert) {
  const [subscription] = await db.insert(subscriptions).values(data).returning();
  return subscription;
}

export async function updateSubscription(id: string, data: Partial<typeof subscriptions.$inferInsert>) {
  const [subscription] = await db
    .update(subscriptions)
    .set(data)
    .where(eq(subscriptions.id, id))
    .returning();
  return subscription;
}

// ============================================
// Payment Queries
// ============================================
export async function createPayment(data: typeof payments.$inferInsert) {
  const [payment] = await db.insert(payments).values(data).returning();
  return payment;
}

export async function getUserPayments(userId: string, limit = 10) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}

// ============================================
// Tool Usage Queries
// ============================================
export async function logToolUsage(data: typeof toolUsageLogs.$inferInsert) {
  const [log] = await db.insert(toolUsageLogs).values(data).returning();
  return log;
}

export async function getUserToolUsage(userId: string, limit = 50) {
  return db
    .select()
    .from(toolUsageLogs)
    .where(eq(toolUsageLogs.userId, userId))
    .orderBy(desc(toolUsageLogs.createdAt))
    .limit(limit);
}

// ============================================
// Admin Queries
// ============================================
export async function getAllUsers(offset = 0, limit = 50) {
  return db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAllSubscriptions(offset = 0, limit = 50) {
  return db
    .select({
      subscription: subscriptions,
      user: users,
    })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAllToolUsageLogs(offset = 0, limit = 100) {
  return db
    .select({
      log: toolUsageLogs,
      user: users,
    })
    .from(toolUsageLogs)
    .leftJoin(users, eq(toolUsageLogs.userId, users.id))
    .orderBy(desc(toolUsageLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

// ============================================
// Analytics Queries
// ============================================
export async function getCountryStats() {
  return db.select().from(countryStats).orderBy(desc(countryStats.userCount));
}

export async function getTotalUsers() {
  const [result] = await db.select({ count: count() }).from(users);
  return result.count;
}

export async function getActiveSubscriptionsCount() {
  const [result] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(eq(subscriptions.status, 'active'));
  return result.count;
}

export async function getTotalRevenue() {
  const [result] = await db
    .select({ total: sql<number>`SUM(${payments.amount})` })
    .from(payments)
    .where(eq(payments.status, 'succeeded'));
  return result.total || 0;
}

export async function getTotalToolUsage() {
  const [result] = await db.select({ count: count() }).from(toolUsageLogs);
  return result.count;
}

// ============================================
// Advanced Admin Queries
// ============================================

// User search and filtering
export async function searchUsers(query: string, offset = 0, limit = 50) {
  return db
    .select()
    .from(users)
    .where(
      or(
        like(users.email, `%${query}%`),
        like(users.name, `%${query}%`),
        like(users.country, `%${query}%`)
      )
    )
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUsersCount() {
  const [result] = await db.select({ count: count() }).from(users);
  return result.count;
}

export async function searchUsersCount(query: string) {
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(
      or(
        like(users.email, `%${query}%`),
        like(users.name, `%${query}%`),
        like(users.country, `%${query}%`)
      )
    );
  return result.count;
}

// Subscription filtering
export async function getSubscriptionsByStatus(
  status: 'active' | 'canceled' | 'past_due',
  offset = 0,
  limit = 50
) {
  return db
    .select({
      subscription: subscriptions,
      user: users,
    })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id))
    .where(eq(subscriptions.status, status))
    .orderBy(desc(subscriptions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getSubscriptionsCount() {
  const [result] = await db.select({ count: count() }).from(subscriptions);
  return result.count;
}

export async function getSubscriptionsByProvider(provider: 'stripe' | 'paypal') {
  return db
    .select({
      subscription: subscriptions,
      user: users,
    })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id))
    .where(eq(subscriptions.provider, provider))
    .orderBy(desc(subscriptions.createdAt));
}

// Tool usage filtering and analytics
export async function getToolUsageByDateRange(
  startDate: Date,
  endDate: Date,
  offset = 0,
  limit = 100
) {
  return db
    .select({
      log: toolUsageLogs,
      user: users,
    })
    .from(toolUsageLogs)
    .leftJoin(users, eq(toolUsageLogs.userId, users.id))
    .where(
      and(
        gte(toolUsageLogs.createdAt, startDate),
        lte(toolUsageLogs.createdAt, endDate)
      )
    )
    .orderBy(desc(toolUsageLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getToolUsageCount() {
  const [result] = await db.select({ count: count() }).from(toolUsageLogs);
  return result.count;
}

export async function getToolUsageByTool(toolName: string, offset = 0, limit = 100) {
  return db
    .select({
      log: toolUsageLogs,
      user: users,
    })
    .from(toolUsageLogs)
    .leftJoin(users, eq(toolUsageLogs.userId, users.id))
    .where(eq(toolUsageLogs.toolName, toolName))
    .orderBy(desc(toolUsageLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getToolUsageStats() {
  return db
    .select({
      toolName: toolUsageLogs.toolName,
      count: count(),
      avgDuration: sql<number>`AVG(${toolUsageLogs.duration})`,
    })
    .from(toolUsageLogs)
    .groupBy(toolUsageLogs.toolName)
    .orderBy(desc(count()));
}

// Country analytics
export async function getCountryStatsWithTimeline() {
  return db
    .select()
    .from(countryStats)
    .orderBy(desc(countryStats.userCount));
}

export async function getUsersByCountry(country: string, offset = 0, limit = 50) {
  return db
    .select()
    .from(users)
    .where(eq(users.country, country))
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

// Dashboard stats with date range
export async function getRevenueByDateRange(startDate: Date, endDate: Date) {
  const [result] = await db
    .select({ total: sql<number>`SUM(${payments.amount})` })
    .from(payments)
    .where(
      and(
        eq(payments.status, 'succeeded'),
        gte(payments.createdAt, startDate),
        lte(payments.createdAt, endDate)
      )
    );
  return result.total || 0;
}

export async function getNewUsersCount(startDate: Date, endDate: Date) {
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        gte(users.createdAt, startDate),
        lte(users.createdAt, endDate)
      )
    );
  return result.count;
}

export async function getSubscriptionStats() {
  return db
    .select({
      status: subscriptions.status,
      provider: subscriptions.provider,
      count: count(),
    })
    .from(subscriptions)
    .groupBy(subscriptions.status, subscriptions.provider);
}

// ============================================
// Credits Queries
// ============================================

/**
 * Get user's credit account
 */
export async function getUserCredits(userId: string) {
  const [userCredits] = await db
    .select()
    .from(credits)
    .where(eq(credits.userId, userId))
    .limit(1);
  return userCredits;
}

/**
 * Create a credit account for a new user
 */
export async function createUserCredits(userId: string, plan: PlanType) {
  const monthlyQuota = getMonthlyQuota(plan);
  const quotaResetAt = getNextQuotaResetDate();

  const [newCredits] = await db
    .insert(credits)
    .values({
      userId,
      balance: monthlyQuota >= 0 ? monthlyQuota : 0,
      totalEarned: monthlyQuota >= 0 ? monthlyQuota : 0,
      monthlyQuota,
      monthlyUsed: 0,
      quotaResetAt,
    })
    .returning();

  // Create initial transaction record
  if (monthlyQuota > 0) {
    await db.insert(creditTransactions).values({
      userId,
      type: 'monthly_quota',
      amount: monthlyQuota,
      balanceAfter: monthlyQuota,
      source: 'system',
      description: `Initial ${plan} plan quota`,
    });
  }

  return newCredits;
}

/**
 * Check if user has enough credits
 */
export async function hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
  const userCredits = await getUserCredits(userId);
  if (!userCredits) return false;

  // Unlimited credits (enterprise plan)
  if (userCredits.monthlyQuota === -1) return true;

  return userCredits.balance >= amount;
}

/**
 * Deduct credits from user account (with transaction)
 */
export async function deductCredits(
  userId: string,
  amount: number,
  source: 'subscription' | 'tool_usage' | 'purchase' | 'referral' | 'promotion' | 'admin' | 'system',
  options: {
    sourceId?: string;
    toolUsageLogId?: string;
    subscriptionId?: string;
    description?: string;
    metadata?: Record<string, any>;
  } = {}
) {
  return await db.transaction(async (tx) => {
    // Get current credits
    const [currentCredits] = await tx
      .select()
      .from(credits)
      .where(eq(credits.userId, userId))
      .limit(1);

    if (!currentCredits) {
      throw new Error('User credits not found');
    }

    // Check for unlimited credits
    if (currentCredits.monthlyQuota === -1) {
      // No deduction needed for unlimited plans
      return currentCredits;
    }

    // Check if enough credits
    if (currentCredits.balance < amount) {
      throw new Error('Insufficient credits');
    }

    // Update credits
    const newBalance = currentCredits.balance - amount;
    const newMonthlyUsed = currentCredits.monthlyUsed + amount;
    const newTotalSpent = currentCredits.totalSpent + amount;

    const [updatedCredits] = await tx
      .update(credits)
      .set({
        balance: newBalance,
        monthlyUsed: newMonthlyUsed,
        totalSpent: newTotalSpent,
      })
      .where(eq(credits.userId, userId))
      .returning();

    // Create transaction record
    await tx.insert(creditTransactions).values({
      userId,
      type: 'spend',
      amount: -amount, // Negative for spending
      balanceAfter: newBalance,
      source,
      sourceId: options.sourceId,
      toolUsageLogId: options.toolUsageLogId,
      subscriptionId: options.subscriptionId,
      description: options.description,
      metadata: options.metadata,
    });

    return updatedCredits;
  });
}

/**
 * Add credits to user account (with transaction)
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: 'earn' | 'refund' | 'adjustment' | 'bonus' | 'monthly_quota',
  source: 'subscription' | 'tool_usage' | 'purchase' | 'referral' | 'promotion' | 'admin' | 'system',
  options: {
    sourceId?: string;
    subscriptionId?: string;
    description?: string;
    metadata?: Record<string, any>;
  } = {}
) {
  return await db.transaction(async (tx) => {
    // Get current credits
    const [currentCredits] = await tx
      .select()
      .from(credits)
      .where(eq(credits.userId, userId))
      .limit(1);

    if (!currentCredits) {
      throw new Error('User credits not found');
    }

    // Update credits
    const newBalance = currentCredits.balance + amount;
    const newTotalEarned = currentCredits.totalEarned + amount;

    const [updatedCredits] = await tx
      .update(credits)
      .set({
        balance: newBalance,
        totalEarned: newTotalEarned,
      })
      .where(eq(credits.userId, userId))
      .returning();

    // Create transaction record
    await tx.insert(creditTransactions).values({
      userId,
      type,
      amount, // Positive for earning
      balanceAfter: newBalance,
      source,
      sourceId: options.sourceId,
      subscriptionId: options.subscriptionId,
      description: options.description,
      metadata: options.metadata,
    });

    return updatedCredits;
  });
}

/**
 * Reset monthly quota (called on the 1st of each month)
 */
export async function resetMonthlyQuota(userId: string) {
  return await db.transaction(async (tx) => {
    const [currentCredits] = await tx
      .select()
      .from(credits)
      .where(eq(credits.userId, userId))
      .limit(1);

    if (!currentCredits) {
      throw new Error('User credits not found');
    }

    // Skip if unlimited
    if (currentCredits.monthlyQuota === -1) {
      return currentCredits;
    }

    // Reset quota
    const newBalance = currentCredits.balance + currentCredits.monthlyQuota;
    const nextResetDate = getNextQuotaResetDate();

    const [updatedCredits] = await tx
      .update(credits)
      .set({
        balance: newBalance,
        monthlyUsed: 0,
        quotaResetAt: nextResetDate,
      })
      .where(eq(credits.userId, userId))
      .returning();

    // Create transaction record
    await tx.insert(creditTransactions).values({
      userId,
      type: 'monthly_quota',
      amount: currentCredits.monthlyQuota,
      balanceAfter: newBalance,
      source: 'system',
      description: 'Monthly quota reset',
    });

    return updatedCredits;
  });
}

/**
 * Update user's monthly quota when plan changes
 */
export async function updateUserQuota(userId: string, newPlan: PlanType) {
  const newQuota = getMonthlyQuota(newPlan);
  const nextResetDate = getNextQuotaResetDate();

  const [updatedCredits] = await db
    .update(credits)
    .set({
      monthlyQuota: newQuota,
      quotaResetAt: nextResetDate,
    })
    .where(eq(credits.userId, userId))
    .returning();

  return updatedCredits;
}

/**
 * Get credit transaction history
 */
export async function getCreditTransactions(userId: string, limit = 50, offset = 0) {
  return db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get credit statistics for a user
 */
export async function getCreditStats(userId: string) {
  const userCredits = await getUserCredits(userId);

  if (!userCredits) {
    return null;
  }

  const hasUnlimited = userCredits.monthlyQuota === -1;
  const monthlyRemaining = hasUnlimited
    ? -1
    : userCredits.monthlyQuota - userCredits.monthlyUsed;

  return {
    balance: userCredits.balance,
    totalEarned: userCredits.totalEarned,
    totalSpent: userCredits.totalSpent,
    monthlyQuota: userCredits.monthlyQuota,
    monthlyUsed: userCredits.monthlyUsed,
    monthlyRemaining,
    quotaResetAt: userCredits.quotaResetAt,
    hasUnlimited,
  };
}

