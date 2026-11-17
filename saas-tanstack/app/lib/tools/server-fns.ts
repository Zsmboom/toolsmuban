import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader, getRequestIP } from '@tanstack/react-start/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '~/lib/db';
import { creditTransactions, toolUsageLogs } from '~/lib/db/schema';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import {
  InsufficientCreditsError,
  consumeCredits,
  getCreditAccount,
  refundCredits,
} from '~/lib/credits';
import { getTool, isToolId, type ToolId } from './registry';

/**
 * 工具的实际实现。接入自己的能力时只改这里，计费链路不用动。
 *
 * demo 顺带演示了「产物存 R2」的完整形态 —— 图片生成就是同一个骨架：
 * 算出结果 → putObject → 返回可访问的地址。R2 没配置时自动降级为
 * 直接返回内容，不会让工具挂掉。
 */
const handlers: Record<ToolId, (input: string, ctx: { userId: string }) => Promise<string>> = {
  demo: async (input: string, ctx) => {
    // 占位实现：把输入反转。换成图片生成时，这里改成调你的模型接口。
    const output = [...input].reverse().join('');

    try {
      const { putObject } = await import('~/lib/storage');
      const { key, url } = await putObject({
        userId: ctx.userId,
        toolId: 'demo',
        body: output,
        contentType: 'text/plain; charset=utf-8',
        ext: 'txt',
      });
      // 绑了自定义域名就直接给 R2 地址，否则走 Worker 代理
      return `${output}\n\n[stored] ${url ?? `/api/files/${key}`}`;
    } catch (error) {
      // R2 未配置时不影响工具本身
      console.warn('[demo] R2 storage unavailable, returning inline result:', error);
      return output;
    }
  },
};

export interface RunToolResult {
  ok: boolean;
  output?: string;
  balanceAfter?: number;
  error?: 'UNAUTHENTICATED' | 'INSUFFICIENT_CREDITS' | 'FAILED';
}

/**
 * 运行工具的统一入口：鉴权 → 扣积分 → 执行 → 失败则退款。
 *
 * 先扣后执行，是为了避免并发请求绕过额度；执行抛错再退回去。
 */
export const runToolFn = createServerFn({ method: 'POST' })
  .validator((data: { toolId: string; input: string }) => {
    if (!isToolId(data?.toolId)) throw new Error('Unknown tool');
    const input = typeof data.input === 'string' ? data.input : '';
    if (input.length > 5000) throw new Error('Input too long');
    return { toolId: data.toolId, input };
  })
  .handler(async ({ data }): Promise<RunToolResult> => {
    const user = await getCurrentUserFn();
    const tool = getTool(data.toolId);

    if (!user) {
      return { ok: false, error: 'UNAUTHENTICATED' };
    }

    const startedAt = Date.now();

    // 先扣费再执行：并发请求就都要各自过一遍余额检查，绕不开额度
    let charge: { balanceAfter: number; logId: string };
    try {
      charge = await consumeCredits({
        userId: user.id,
        cost: tool.cost,
        toolName: tool.id,
        ipAddress: getRequestIP({ xForwardedFor: true }) ?? null,
        country: getRequestHeader('cf-ipcountry') ?? null,
        metadata: { inputLength: data.input.length },
      });
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return { ok: false, error: 'INSUFFICIENT_CREDITS' };
      }
      throw error;
    }

    try {
      const output = await handlers[data.toolId](data.input, { userId: user.id });

      await db
        .update(toolUsageLogs)
        .set({ duration: Date.now() - startedAt })
        .where(eq(toolUsageLogs.id, charge.logId));

      return { ok: true, output, balanceAfter: charge.balanceAfter };
    } catch (error) {
      console.error(`Tool "${tool.id}" failed:`, error);
      // 执行失败不该让用户白扣积分
      await refundCredits({
        userId: user.id,
        amount: tool.cost,
        reason: `Refund for failed ${tool.id} run`,
        sourceId: charge.logId,
      });
      return { ok: false, error: 'FAILED' };
    }
  });

export const getCreditAccountFn = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) return null;
  return getCreditAccount(user.id);
});

export const getRecentToolRunsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) return [];

  return db
    .select({
      id: toolUsageLogs.id,
      toolName: toolUsageLogs.toolName,
      creditsUsed: toolUsageLogs.creditsUsed,
      duration: toolUsageLogs.duration,
      createdAt: toolUsageLogs.createdAt,
    })
    .from(toolUsageLogs)
    .where(eq(toolUsageLogs.userId, user.id))
    .orderBy(desc(toolUsageLogs.createdAt))
    .limit(20);
});

export const getCreditTransactionsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) return [];

  return db
    .select({
      id: creditTransactions.id,
      type: creditTransactions.type,
      amount: creditTransactions.amount,
      balanceAfter: creditTransactions.balanceAfter,
      description: creditTransactions.description,
      createdAt: creditTransactions.createdAt,
    })
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, user.id))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(50);
});
