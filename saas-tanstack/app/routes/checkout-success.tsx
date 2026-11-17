import { createFileRoute, Link } from '@tanstack/react-router';
import { CheckCircle2 } from 'lucide-react';
import { buildPageHead } from '~/lib/site-config';
import AuthShell from '~/components/layout/auth-shell';
import Badge from '~/components/ui/badge';
import { buttonClass } from '~/components/ui/button';
import { useTranslations } from '~/lib/i18n-context';

export const Route = createFileRoute('/checkout-success')({
  validateSearch: (search: Record<string, unknown>) => ({
    provider: typeof search.provider === 'string' ? search.provider : undefined,
    session_id: typeof search.session_id === 'string' ? search.session_id : undefined,
    order_id: typeof search.order_id === 'string' ? search.order_id : undefined,
  }),
  head: () =>
    buildPageHead({
      title: 'Payment successful',
      description: 'Your subscription is being activated.',
      path: '/checkout-success',
      noIndex: true,
    }),
  component: CheckoutSuccessPage,
});

/**
 * 结账结果页与认证页共用 AuthShell —— 之前这两页各写一套居中布局，
 * 同一个流程里的相邻两屏看起来像两个网站。
 */
function CheckoutSuccessPage() {
  const search = Route.useSearch();
  const t = useTranslations('checkout');
  const tp = useTranslations('pricingCards');
  const provider = search.provider || 'stripe';

  return (
    <AuthShell
      title={t('successTitle')}
      description={t('successBody')}
      icon={<CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />}
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Badge tone="success">{tp(`providers.${provider}`)}</Badge>
        {search.order_id ? (
          <span className="tabular text-xs text-muted-foreground">
            {t('orderId')} {search.order_id}
          </span>
        ) : null}
      </div>

      <div className="mt-8 space-y-3">
        <Link to="/dashboard" className={buttonClass({ variant: 'primary', size: 'lg', block: true })}>
          {t('goToDashboard')}
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
