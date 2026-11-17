import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/creem/checkout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 动态导入：这些 handler 是普通函数而不是 createServerFn，
        // 顶层 import 会把数据库驱动和整套 schema 一起打进浏览器 bundle。
        const { handleCreemCheckoutRequest } = await import('~/lib/payments/creem-webhooks');
        return handleCreemCheckoutRequest(request);
      },
    },
  },
});
