import { createFileRoute } from '@tanstack/react-router';
import { handlePayPalCheckoutRequest } from '~/lib/payments/paypal-server-fns';

export const Route = createFileRoute('/api/paypal/checkout')({
  server: {
    handlers: {
      POST: async ({ request }) => handlePayPalCheckoutRequest(request),
    },
  },
});
