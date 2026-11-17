import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/paypal/checkout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handlePayPalCheckoutRequest } = await import('~/lib/payments/paypal-webhooks');
        return handlePayPalCheckoutRequest(request);
      },
    },
  },
});
