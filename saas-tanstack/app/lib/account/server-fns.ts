import { createServerFn } from '@tanstack/react-start';
import { desc, eq } from 'drizzle-orm';
import { db } from '~/lib/db';
import { subscriptions } from '~/lib/db/schema';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { getCreditAccount } from '~/lib/credits';
import type { User } from '~/lib/auth';

export interface DashboardData {
  user: User;
  credits: {
    balance: number;
    monthlyQuota: number;
    monthlyUsed: number;
    unlimited: boolean;
  } | null;
  subscription: {
    plan: string;
    status: string;
    provider: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
}

/**
 * dashboard 需要的全部数据，一次取回。
 *
 * 放在 server function 里而不是路由 loader 里，是因为 loader 是同构的——
 * 在 loader 顶层 import db 会把 Neon driver 和整套表结构打进浏览器 bundle。
 */
export const getDashboardDataFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DashboardData | null> => {
    const user = await getCurrentUserFn();
    if (!user) return null;

    const [account, subscription] = await Promise.all([
      getCreditAccount(user.id),
      db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, user.id),
        orderBy: [desc(subscriptions.createdAt)],
      }),
    ]);

    return {
      user,
      credits: account
        ? {
            balance: account.balance,
            monthlyQuota: account.monthlyQuota,
            monthlyUsed: account.monthlyUsed,
            unlimited: account.unlimited,
          }
        : null,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            provider: subscription.provider,
            // 序列化成字符串，避免 Date 跨 RPC 边界的类型漂移
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
          }
        : null,
    };
  }
);
