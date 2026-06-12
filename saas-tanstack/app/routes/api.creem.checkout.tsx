import { createFileRoute } from '@tanstack/react-router';
import { handleCreemCheckoutRequest } from '~/lib/payments/creem-server-fns';

export const Route = createFileRoute('/api/creem/checkout')({
  server: {
    handlers: {
      POST: async ({ request }) => handleCreemCheckoutRequest(request),
    },
  },
});
