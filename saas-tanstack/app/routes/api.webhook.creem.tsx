import { createFileRoute } from '@tanstack/react-router';
import { handleCreemWebhookRequest } from '~/lib/payments/creem-server-fns';

export const Route = createFileRoute('/api/webhook/creem')({
  server: {
    handlers: {
      POST: async ({ request }) => handleCreemWebhookRequest(request),
    },
  },
});
