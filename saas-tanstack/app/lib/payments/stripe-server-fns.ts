/**
 * 本模块只导出 createServerFn —— 客户端构建时整体替换成 RPC 存根。
 * webhook 处理在 ./stripe-webhooks.ts，由 api 路由动态导入。
 */
import { createServerFn } from '@tanstack/react-start';
import { eq, desc } from 'drizzle-orm';
import { db } from '~/lib/db';
import { subscriptions } from '~/lib/db/schema';
import { getCurrentUserFn } from '~/lib/auth/server-fns';
import { assertKnownProductId } from './plans';
import { appUrl, stripe } from './stripe-api';


export const createCheckoutSessionFn = createServerFn({ method: 'POST' })
  .validator((data: { priceId: string }) => {
    if (!data?.priceId || typeof data.priceId !== 'string') {
      throw new Error('Missing priceId');
    }
    return { priceId: data.priceId };
  })
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) throw new Error('User not authenticated');

    // 只接受我们配置过的价格，避免前端塞任意 price id
    const plan = assertKnownProductId('stripe', data.priceId);

    const existing = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, user.id),
      orderBy: [desc(subscriptions.createdAt)],
    });

    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: data.priceId, quantity: 1 }],
      success_url: `${appUrl()}/checkout-success?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
      cancel_url: `${appUrl()}/checkout-cancel?provider=stripe`,
      // 复用已有的 Stripe customer，避免同一个人反复开新客户
      ...(existing?.customerId
        ? { customer: existing.customerId }
        : { customer_email: user.email ?? undefined }),
      client_reference_id: user.id,
      // webhook 回来时靠这些元数据确定「谁买了哪一档」，
      // 少写 plan 会导致所有订阅都被记成同一个套餐
      metadata: { userId: user.id, plan: plan.id, priceId: data.priceId },
      subscription_data: {
        metadata: { userId: user.id, plan: plan.id, priceId: data.priceId },
      },
    });

    return { sessionId: session.id, url: session.url };
  });

export const createPortalSessionFn = createServerFn({ method: 'POST' }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) throw new Error('User not authenticated');

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
    orderBy: [desc(subscriptions.createdAt)],
  });

  // billing portal 要的是 customer id（cus_…），不是 subscription id（sub_…）
  if (!subscription?.customerId) {
    throw new Error('No Stripe customer found for this account');
  }

  const session = await stripe().billingPortal.sessions.create({
    customer: subscription.customerId,
    return_url: `${appUrl()}/dashboard`,
  });

  return { url: session.url };
});
