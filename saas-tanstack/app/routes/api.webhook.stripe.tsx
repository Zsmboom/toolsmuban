import { createFileRoute } from '@tanstack/react-router';
import { handleWebhookFn } from '~/lib/payments/stripe-server-fns';

export const Route = createFileRoute('/api/webhook/stripe')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = await request.text();
          const signature = request.headers.get('stripe-signature');

          if (!signature) {
            return new Response('Missing stripe-signature header', { status: 400 });
          }

          await handleWebhookFn({ data: { payload, signature } });

          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Webhook error:', error);
          return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
  },
});
