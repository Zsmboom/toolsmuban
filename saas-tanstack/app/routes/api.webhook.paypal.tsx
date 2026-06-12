import { createFileRoute } from '@tanstack/react-router';
import { handlePayPalWebhookRequest } from '~/lib/payments/paypal-server-fns';

export const Route = createFileRoute('/api/webhook/paypal')({
  server: {
    handlers: {
      POST: async ({ request }) => handlePayPalWebhookRequest(request),
    },
  },
});
