import { createServerFn } from '@tanstack/react-start';
import { desc, eq } from 'drizzle-orm';
import { db } from '~/lib/db';
import { subscriptions } from '~/lib/db/schema';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { paypalWebUrl } from './paypal-api';

/**
 * 本模块只导出 createServerFn —— 这样客户端构建时会被整体替换成 RPC 存根，
 * 里面的 db 引用不会进入浏览器 bundle。
 * 普通的 Request handler 一律放在 ./paypal-webhooks.ts，由 api 路由动态导入。
 */
export const createPayPalPortalFn = createServerFn({ method: 'POST' }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) throw new Error('User not authenticated');

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
    orderBy: [desc(subscriptions.createdAt)],
  });

  if (!sub?.providerId) throw new Error('No PayPal subscription found');

  // PayPal 没有可托管的账单门户，只能把用户送去自动付款页
  return { url: `${paypalWebUrl()}/myaccount/autopay/` };
});
