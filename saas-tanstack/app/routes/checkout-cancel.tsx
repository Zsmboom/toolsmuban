import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';
import { buildPageHead } from '~/lib/site-config';
import AuthShell from '~/components/layout/auth-shell';
import Badge from '~/components/ui/badge';
import { buttonClass } from '~/components/ui/button';
import { useTranslations } from '~/lib/i18n-context';

export const Route = createFileRoute('/checkout-cancel')({
  validateSearch: (search: Record<string, unknown>) => ({
    provider: typeof search.provider === 'string' ? search.provider : undefined,
  }),
  head: () =>
    buildPageHead({
      title: 'Payment cancelled',
      description: 'No charge was made.',
      path: '/checkout-cancel',
      noIndex: true,
    }),
  component: CheckoutCancelPage,
});

function CheckoutCancelPage() {
  const search = Route.useSearch();
  const t = useTranslations('checkout');
  const tp = useTranslations('pricingCards');
  const provider = search.provider || 'stripe';

  return (
    <AuthShell
      title={t('cancelTitle')}
      description={t('cancelBody')}
      icon={<AlertTriangle className="h-10 w-10 text-warning" aria-hidden="true" />}
    >
      <div className="flex justify-center">
        <Badge tone="warning">{tp(`providers.${provider}`)}</Badge>
      </div>

      <div className="mt-8 space-y-3">
        <Link
          to="/{-$locale}/pricing"
          className={buttonClass({ variant: 'primary', size: 'lg', block: true })}
        >
          {t('viewPlans')}
        </Link>
        <Link
          to="/{-$locale}"
          className={buttonClass({ variant: 'secondary', size: 'lg', block: true })}
        >
          {t('backToHome')}
        </Link>
      </div>
    </AuthShell>
  );
}
