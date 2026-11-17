import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/webhook/paypal')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handlePayPalWebhookRequest } = await import('~/lib/payments/paypal-webhooks');
        return handlePayPalWebhookRequest(request);
      },
    },
  },
});
