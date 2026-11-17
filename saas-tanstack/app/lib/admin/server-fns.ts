import { createServerFn } from '@tanstack/react-start';
import { and, count, desc, eq, gte, sum } from 'drizzle-orm';
import { db } from '~/lib/db';
import { credits, payments, sessions, subscriptions, toolUsageLogs, users } from '~/lib/db/schema';
import { toDateString } from '~/lib/db/dialect';
import { listAuditLogs, recordAudit, requireAdmin } from './guard';

function startOfMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export interface AdminOverview {
  totalUsers: number;
  newUsersThisMonth: number;
  activeSubscriptions: number;
  /** 单位为分 */
  revenueThisMonthCents: number;
  toolRunsThisMonth: number;
}

/** 后台首页统计。之前这几个数字是写死的假数据。 */
export const getAdminOverviewFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminOverview> => {
    await requireAdmin();
    const monthStart = startOfMonth();

    const [totalUsers, newUsers, activeSubs, revenue, toolRuns] = await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(users).where(gte(users.createdAt, monthStart)),
      db
        .select({ value: count() })
        .from(subscriptions)
        .where(eq(subscriptions.status, 'active')),
      db
        .select({ value: sum(payments.amount) })
        .from(payments)
        .where(and(eq(payments.status, 'succeeded'), gte(payments.createdAt, monthStart))),
      db
        .select({ value: count() })
        .from(toolUsageLogs)
        .where(gte(toolUsageLogs.createdAt, monthStart)),
    ]);

    return {
      totalUsers: totalUsers[0]?.value ?? 0,
      newUsersThisMonth: newUsers[0]?.value ?? 0,
      activeSubscriptions: activeSubs[0]?.value ?? 0,
      revenueThisMonthCents: Number(revenue[0]?.value ?? 0),
      toolRunsThisMonth: toolRuns[0]?.value ?? 0,
    };
  }
);

export const listSubscriptionsFn = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin();

  const rows = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      plan: subscriptions.plan,
      status: subscriptions.status,
      provider: subscriptions.provider,
      providerId: subscriptions.providerId,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      createdAt: subscriptions.createdAt,
      canceledAt: subscriptions.canceledAt,
      userEmail: users.email,
      userName: users.name,
    })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(100);

  return rows.map((row) => ({
    ...row,
    currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    canceledAt: row.canceledAt?.toISOString() ?? null,
  }));
});

export const listPaymentsFn = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin();

  const rows = await db
    .select({
      id: payments.id,
      userId: payments.userId,
      amount: payments.amount,
      currency: payments.currency,
      status: payments.status,
      provider: payments.provider,
      providerId: payments.providerId,
      description: payments.description,
      createdAt: payments.createdAt,
      userEmail: users.email,
      userName: users.name,
    })
    .from(payments)
    .leftJoin(users, eq(payments.userId, users.id))
    .orderBy(desc(payments.createdAt))
    .limit(100);

  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
});

/** 最近 30 天按天聚合的工具调用量，给后台画趋势用 */
export const getUsageTrendFn = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin();

  const since = new Date(Date.now() - 30 * 86_400_000);
  const rows = await db
    .select({
      day: toDateString(toolUsageLogs.createdAt),
      runs: count(),
      credits: sum(toolUsageLogs.creditsUsed),
    })
    .from(toolUsageLogs)
    .where(gte(toolUsageLogs.createdAt, since))
    .groupBy(toDateString(toolUsageLogs.createdAt))
    .orderBy(toDateString(toolUsageLogs.createdAt));

  return rows.map((r) => ({ day: r.day, runs: r.runs, credits: Number(r.credits ?? 0) }));
});


// ============================================
// 用户管理
// ============================================

export const listUsersFn = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin();

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      emailVerified: users.emailVerified,
      hasPassword: users.passwordHash,
      lockedUntil: users.lockedUntil,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      balance: credits.balance,
      monthlyQuota: credits.monthlyQuota,
    })
    .from(users)
    .leftJoin(credits, eq(credits.userId, users.id))
    .orderBy(desc(users.createdAt))
    .limit(200);

  return rows.map((r) => ({
    ...r,
    // 只暴露「有没有设过密码」，绝不把哈希送到前端
    hasPassword: Boolean(r.hasPassword),
    emailVerified: r.emailVerified?.toISOString() ?? null,
    lockedUntil: r.lockedUntil?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    lastLoginAt: r.lastLoginAt?.toISOString() ?? null,
  }));
});

/** 强制某个用户下线：删掉他所有会话。用于名单变更或账号异常。 */
export const revokeUserSessionsFn = createServerFn({ method: 'POST' })
  .validator((data: { userId: string }) => {
    if (!data?.userId || typeof data.userId !== 'string') throw new Error('Missing userId');
    return { userId: data.userId };
  })
  .handler(async ({ data }) => {
    const actor = await requireAdmin();
    const deleted = await db
      .delete(sessions)
      .where(eq(sessions.userId, data.userId))
      .returning({ token: sessions.sessionToken });

    await recordAudit({
      actor,
      action: 'user.revoke_sessions',
      targetType: 'user',
      targetId: data.userId,
      detail: { revoked: deleted.length },
    });

    return { revoked: deleted.length };
  });

/** 解除登录锁定 */
export const unlockUserFn = createServerFn({ method: 'POST' })
  .validator((data: { userId: string }) => {
    if (!data?.userId || typeof data.userId !== 'string') throw new Error('Missing userId');
    return { userId: data.userId };
  })
  .handler(async ({ data }) => {
    const actor = await requireAdmin();
    await db
      .update(users)
      .set({ failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date() })
      .where(eq(users.id, data.userId));

    await recordAudit({ actor, action: 'user.unlock', targetType: 'user', targetId: data.userId });
    return { ok: true };
  });

/** 手工调整积分（补偿、客服处理等），必须留痕 */
export const adjustCreditsFn = createServerFn({ method: 'POST' })
  .validator((data: { userId: string; amount: number; reason: string }) => {
    if (!data?.userId) throw new Error('Missing userId');
    const amount = Number(data.amount);
    if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 1_000_000) {
      throw new Error('Invalid amount');
    }
    const reason = String(data.reason ?? '').slice(0, 200);
    if (!reason) throw new Error('Missing reason');
    return { userId: data.userId, amount, reason };
  })
  .handler(async ({ data }) => {
    const actor = await requireAdmin();
    const { adjustCreditsByAdmin } = await import('~/lib/credits');
    const balanceAfter = await adjustCreditsByAdmin(data);

    await recordAudit({
      actor,
      action: 'credits.adjust',
      targetType: 'user',
      targetId: data.userId,
      detail: { amount: data.amount, reason: data.reason, balanceAfter },
    });

    return { balanceAfter };
  });

// ============================================
// 调用日志
// ============================================

export const listToolLogsFn = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin();

  const rows = await db
    .select({
      id: toolUsageLogs.id,
      toolName: toolUsageLogs.toolName,
      action: toolUsageLogs.action,
      creditsUsed: toolUsageLogs.creditsUsed,
      duration: toolUsageLogs.duration,
      country: toolUsageLogs.country,
      createdAt: toolUsageLogs.createdAt,
      userEmail: users.email,
    })
    .from(toolUsageLogs)
    .leftJoin(users, eq(toolUsageLogs.userId, users.id))
    .orderBy(desc(toolUsageLogs.createdAt))
    .limit(200);

  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
});

// ============================================
// 审计日志
// ============================================

export const listAuditLogsFn = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin();
  return listAuditLogs(200);
});
