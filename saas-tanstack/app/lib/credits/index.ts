import { and, eq, gte, lte, or, isNull, sql } from 'drizzle-orm';
import { db } from '~/lib/db';
import { credits, creditTransactions, toolUsageLogs } from '~/lib/db/schema';
import { generateId, nextMonthlyReset } from '~/lib/auth';
import { PLANS, UNLIMITED_QUOTA_VALUE, isUnlimited } from '~/lib/payments/plans';
import { greatest } from '~/lib/db/dialect';

export class InsufficientCreditsError extends Error {
  constructor() {
    super('INSUFFICIENT_CREDITS');
    this.name = 'InsufficientCreditsError';
  }
}

export interface CreditAccount {
  balance: number;
  monthlyQuota: number;
  monthlyUsed: number;
  totalEarned: number;
  totalSpent: number;
  quotaResetAt: Date | null;
  unlimited: boolean;
}

/**
 * 保证用户有积分账户。新用户走 Google 登录时已经建好，
 * 这里是给历史数据 / 手工建的账号兜底。
 */
export async function ensureCreditAccount(userId: string): Promise<void> {
  await db
    .insert(credits)
    .values({
      id: generateId(),
      userId,
      balance: PLANS.free.credits,
      totalEarned: PLANS.free.credits,
      monthlyQuota: PLANS.free.credits,
      quotaResetAt: nextMonthlyReset(),
    })
    .onConflictDoNothing({ target: credits.userId });
}

/**
 * 到期就重置本月用量，并把余额补到当月额度。
 * 用带条件的 UPDATE 完成，多个请求并发进来也只有一个会命中。
 */
export async function applyMonthlyResetIfDue(userId: string): Promise<void> {
  const now = new Date();

  await db
    .update(credits)
    .set({
      monthlyUsed: 0,
      balance: sql`${credits.monthlyQuota}`,
      totalEarned: sql`${credits.totalEarned} + ${credits.monthlyQuota}`,
      quotaResetAt: nextMonthlyReset(now),
      updatedAt: now,
    })
    .where(
      and(
        eq(credits.userId, userId),
        or(isNull(credits.quotaResetAt), lte(credits.quotaResetAt, now))
      )
    );
}

export async function getCreditAccount(userId: string): Promise<CreditAccount | null> {
  await ensureCreditAccount(userId);
  await applyMonthlyResetIfDue(userId);

  const row = await db.query.credits.findFirst({ where: eq(credits.userId, userId) });
  if (!row) return null;

  return {
    balance: row.balance,
    monthlyQuota: row.monthlyQuota,
    monthlyUsed: row.monthlyUsed,
    totalEarned: row.totalEarned,
    totalSpent: row.totalSpent,
    quotaResetAt: row.quotaResetAt,
    unlimited: isUnlimited(row.monthlyQuota),
  };
}

/**
 * 扣积分。
 *
 * 关键点：余额判断和扣减必须是同一条 SQL。
 * 先 SELECT 再 UPDATE 会有竞态——两个并发请求都读到「余额够」，
 * 然后各扣一次，余额就成负数了。这里用
 *   UPDATE ... WHERE user_id = ? AND balance >= cost RETURNING ...
 * 由 Postgres 的行锁保证原子性；影响行数为 0 即代表余额不足。
 *
 * 注：@neondatabase/serverless 的 http driver 不支持跨语句事务，
 * 所以流水和用量日志是扣费成功后再补写的（最坏情况是流水缺一条，
 * 余额本身不会错）。若需要严格一致，把 db 换成 WebSocket driver 再包 transaction。
 */
export async function consumeCredits(params: {
  userId: string;
  cost: number;
  toolName: string;
  action?: string;
  metadata?: Record<string, unknown>;
  durationMs?: number;
  ipAddress?: string | null;
  country?: string | null;
}): Promise<{ balanceAfter: number; transactionId: string; logId: string }> {
  const { userId, cost, toolName } = params;

  if (!Number.isInteger(cost) || cost < 0) {
    throw new Error('Credit cost must be a non-negative integer');
  }

  await ensureCreditAccount(userId);
  await applyMonthlyResetIfDue(userId);

  const now = new Date();

  const updated = await db
    .update(credits)
    .set({
      balance: sql`${credits.balance} - ${cost}`,
      monthlyUsed: sql`${credits.monthlyUsed} + ${cost}`,
      totalSpent: sql`${credits.totalSpent} + ${cost}`,
      updatedAt: now,
    })
    .where(and(eq(credits.userId, userId), gte(credits.balance, cost)))
    .returning({ balance: credits.balance });

  if (updated.length === 0) {
    throw new InsufficientCreditsError();
  }

  const balanceAfter = updated[0].balance;
  const logId = generateId();
  const transactionId = generateId();

  await db.insert(toolUsageLogs).values({
    id: logId,
    userId,
    toolName,
    action: params.action ?? 'run',
    metadata: params.metadata ?? null,
    duration: params.durationMs ?? null,
    ipAddress: params.ipAddress ?? null,
    country: params.country ?? null,
    creditsUsed: cost,
    creditTransactionId: transactionId,
  });

  await db.insert(creditTransactions).values({
    id: transactionId,
    userId,
    type: 'spend',
    amount: -cost,
    balanceAfter,
    source: 'tool_usage',
    sourceId: logId,
    toolUsageLogId: logId,
    description: `${toolName} run`,
  });

  return { balanceAfter, transactionId, logId };
}

/** 工具执行失败时把积分退回去 */
export async function refundCredits(params: {
  userId: string;
  amount: number;
  reason: string;
  sourceId?: string;
}): Promise<void> {
  const { userId, amount } = params;
  if (amount <= 0) return;

  const now = new Date();
  const updated = await db
    .update(credits)
    .set({
      balance: sql`${credits.balance} + ${amount}`,
      monthlyUsed: greatest(sql`${credits.monthlyUsed} - ${amount}`, 0),
      totalSpent: greatest(sql`${credits.totalSpent} - ${amount}`, 0),
      updatedAt: now,
    })
    .where(eq(credits.userId, userId))
    .returning({ balance: credits.balance });

  if (updated.length === 0) return;

  await db.insert(creditTransactions).values({
    id: generateId(),
    userId,
    type: 'refund',
    amount,
    balanceAfter: updated[0].balance,
    source: 'system',
    sourceId: params.sourceId ?? null,
    description: params.reason,
  });
}

/**
 * 订阅生效 / 续费时，把用户的月度额度调到对应套餐，
 * 并把余额补齐到新额度（升级立即可用）。
 */
export async function applyPlanQuota(params: {
  userId: string;
  quota: number;
  subscriptionId?: string;
  reason: string;
}): Promise<void> {
  const { userId, quota } = params;
  await ensureCreditAccount(userId);

  const now = new Date();
  const updated = await db
    .update(credits)
    .set({
      monthlyQuota: quota,
      monthlyUsed: 0,
      // 升级后立刻按新额度给足，不让用户等到下个自然月
      balance: quota,
      totalEarned: sql`${credits.totalEarned} + ${quota}`,
      quotaResetAt: nextMonthlyReset(now),
      updatedAt: now,
    })
    .where(eq(credits.userId, userId))
    .returning({ balance: credits.balance });

  if (updated.length === 0) return;

  await db.insert(creditTransactions).values({
    id: generateId(),
    userId,
    type: 'monthly_quota',
    amount: quota,
    balanceAfter: updated[0].balance,
    source: 'subscription',
    sourceId: params.subscriptionId ?? null,
    subscriptionId: params.subscriptionId ?? null,
    description: params.reason,
  });
}

/**
 * 管理员手工调整积分（客服补偿等）。
 * 走和扣费一样的原子 UPDATE，并且余额有下限 0，不会被调成负数。
 */
export async function adjustCreditsByAdmin(params: {
  userId: string;
  amount: number;
  reason: string;
}): Promise<number> {
  await ensureCreditAccount(params.userId);

  const now = new Date();
  const [row] = await db
    .update(credits)
    .set({
      balance: greatest(sql`${credits.balance} + ${params.amount}`, 0),
      totalEarned:
        params.amount > 0 ? sql`${credits.totalEarned} + ${params.amount}` : credits.totalEarned,
      updatedAt: now,
    })
    .where(eq(credits.userId, params.userId))
    .returning({ balance: credits.balance });

  if (!row) throw new Error('Credit account not found');

  await db.insert(creditTransactions).values({
    id: generateId(),
    userId: params.userId,
    type: 'adjustment',
    amount: params.amount,
    balanceAfter: row.balance,
    source: 'admin',
    description: params.reason,
  });

  return row.balance;
}

/** 订阅取消 / 过期后降回免费额度 */
export async function downgradeToFreeQuota(userId: string): Promise<void> {
  await applyPlanQuota({
    userId,
    quota: PLANS.free.credits,
    reason: 'Subscription ended — reverted to Free plan',
  });
}

export { UNLIMITED_QUOTA_VALUE };
