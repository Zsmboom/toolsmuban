import { createServerFn } from '@tanstack/react-start';
import { desc, eq } from 'drizzle-orm';
import { db } from '~/lib/db';
import { subscriptions } from '~/lib/db/schema';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { creemApiKey, creemBaseUrl } from './creem-api';

/**
 * 本模块只导出 createServerFn —— 客户端构建时会被整体替换成 RPC 存根，
 * db 引用不会进入浏览器 bundle。
 * 普通的 Request handler 放在 ./creem-webhooks.ts，由 api 路由动态导入。
 */
export const createCreemPortalFn = createServerFn({ method: 'POST' }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) throw new Error('User not authenticated');

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
    orderBy: [desc(subscriptions.createdAt)],
  });

  if (!sub?.customerId) throw new Error('No Creem customer found');

  const response = await fetch(`${creemBaseUrl()}/v1/customers/billing`, {
    method: 'POST',
    headers: { 'x-api-key': creemApiKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: sub.customerId }),
  });

  if (!response.ok) throw new Error('Failed to get customer portal link');

  const result = (await response.json()) as { customer_portal_link?: string };
  return { url: result.customer_portal_link ?? null };
});
