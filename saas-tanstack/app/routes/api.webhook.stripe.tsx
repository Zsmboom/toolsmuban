import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/webhook/stripe')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get('stripe-signature');
        if (!signature) {
          return new Response('Missing stripe-signature header', { status: 400 });
        }

        // 必须拿原始文本，不能 JSON.parse 后再 stringify，否则验签一定失败
        const payload = await request.text();

        try {
          const { handleStripeWebhook } = await import('~/lib/payments/stripe-webhooks');
          await handleStripeWebhook(payload, signature);
        } catch (error) {
          console.error('[stripe] webhook error:', error);
          // 返回 4xx 让 Stripe 重投；幂等表保证重投不会重复开通
          return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    },
  },
});
