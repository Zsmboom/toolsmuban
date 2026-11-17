import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/webhook/creem')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleCreemWebhookRequest } = await import('~/lib/payments/creem-webhooks');
        return handleCreemWebhookRequest(request);
      },
    },
  },
});
