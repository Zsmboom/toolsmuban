import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { createCheckoutSessionFn } from '~/lib/payments/stripe-server-fns';
import {
  getEnabledProviders,
  getProviderProductId,
  planList,
  type PaymentProvider,
  type Plan,
} from '~/lib/payments/plans';
import { buttonClass } from '~/components/ui/button';
import { useAuth } from '~/lib/auth/context';
import { useTranslations } from '~/lib/i18n-context';
import { cn } from '~/lib/utils';
import { GridFill } from '~/components/ui/grid-fill';

const ENABLED_PROVIDERS = getEnabledProviders();

/**
 * 档位卡。
 *
 * 结账逻辑一行没动；改的是视觉：
 * - 五种圆角收敛成两种，去掉 shadow-lg 与 lg:scale-105
 *   （放大 5% 会让这一张卡的文字和邻居对不齐，是最扎眼的一处错位）
 * - 推荐档改用顶部 2px 强调线 + 强调色浅底，靠颜色而不是投影区分
 * - 价格走等宽：它是数字不是文案（规矩 3）
 * - 渠道名从写死的 '💳 Card' 改成 i18n
 */
export default function PricingCards({ showHeading = true }: { showHeading?: boolean } = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = useTranslations('pricingCards');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<PaymentProvider>(ENABLED_PROVIDERS[0]);

  const startCheckout = async (plan: Plan) => {
    if (!user) {
      void navigate({ to: '/login' });
      return;
    }

    const productId = getProviderProductId(plan, provider);
    if (!productId) return;

    setLoadingPlan(plan.id);
    setError(null);

    try {
      let url: string | null = null;

      if (provider === 'stripe') {
        const result = await createCheckoutSessionFn({ data: { priceId: productId } });
        url = result.url ?? null;
      } else {
        const endpoint = provider === 'creem' ? '/api/creem/checkout' : '/api/paypal/checkout';
        const payload = provider === 'creem' ? { productId } : { planId: productId };
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`Checkout failed with ${response.status}`);
        const data = (await response.json()) as { url?: string };
        url = data.url ?? null;
      }

      if (!url) throw new Error('No checkout URL returned');
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(t('checkoutFailed'));
      setLoadingPlan(null);
    }
  };

  return (
    <section
      id="pricing"
      className={cn('bg-background', showHeading && 'border-t border-border')}
    >
      {/* 定价页把标题放在上一个区块里，这时不能再来一份 py-28，
          否则标题和档位卡之间会空出一整屏的白 */}
      <div className={cn('shell', showHeading ? 'py-20 sm:py-28' : 'pb-14 sm:pb-20')}>
        <div className="mx-auto max-w-2xl text-center">
          {showHeading ? (
            <>
              <p className="eyebrow">{t('eyebrow')}</p>
              <h2 className="display-2 mt-4 text-pretty text-foreground">{t('title')}</h2>
              <p className="lede mt-4 text-pretty text-muted-foreground">{t('subtitle')}</p>
            </>
          ) : null}

          {ENABLED_PROVIDERS.length > 1 ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm text-muted-foreground">{t('payWith')}</span>
              <div
                role="group"
                aria-label={t('payWith')}
                className="inline-flex rounded-[var(--radius)] border border-border bg-card p-1"
              >
                {ENABLED_PROVIDERS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    aria-pressed={provider === p}
                    className={cn(
                      'min-h-9 cursor-pointer rounded-[calc(var(--radius)-2px)] px-4 text-sm transition-colors',
                      provider === p
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t(`providers.${p}`)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <ul className={cn('grid-hairline sm:grid-cols-2 lg:grid-cols-4', showHeading && 'mt-12')}>
          {planList.map((plan) => {
            const productId = getProviderProductId(plan, provider);
            const isFree = plan.id === 'free';
            // 该渠道没配这档商品就禁用按钮，而不是点了没反应
            const unavailable = !isFree && !productId;
            const isLoading = loadingPlan === plan.id;

            return (
              <li
                key={plan.id}
                className={cn(
                  'relative flex flex-col p-6 sm:p-7',
                  plan.popular ? 'bg-brand-subtle' : 'bg-card',
                )}
              >
                {plan.popular ? (
                  <>
                    <span
                      className="absolute inset-x-0 top-0 h-0.5 bg-primary"
                      aria-hidden="true"
                    />
                    <span className="eyebrow">{t('mostPopular')}</span>
                  </>
                ) : (
                  <span className="eyebrow text-transparent" aria-hidden="true">
                    &nbsp;
                  </span>
                )}

                <h3 className="mt-4 text-lg font-medium text-foreground">{t(`${plan.id}.name`)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(`${plan.id}.description`)}</p>

                <p className="mt-6 flex items-baseline gap-1.5">
                  <span className="tabular text-3xl text-foreground">
                    ${plan.price.toFixed(2).replace(/\.00$/, '')}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {isFree ? t('forever') : t('perMonth')}
                  </span>
                </p>

                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {Array.from({ length: plan.featureCount }, (_, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="text-muted-foreground">
                        {t(`${plan.id}.feature${i + 1}`)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {isFree ? (
                    <Link
                      to="/login"
                      className={buttonClass({ variant: 'secondary', block: true })}
                    >
                      {t('getStarted')}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startCheckout(plan)}
                      disabled={unavailable || isLoading}
                      className={buttonClass({
                        variant: plan.popular ? 'primary' : 'secondary',
                        block: true,
                      })}
                    >
                      {unavailable
                        ? t('notConfigured')
                        : isLoading
                          ? t('processing')
                          : t('getStarted')}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
          <GridFill count={planList.length} />
        </ul>

        <p className="mt-8 text-center text-sm text-muted-foreground">{t('trialInfo')}</p>
      </div>
    </section>
  );
}
