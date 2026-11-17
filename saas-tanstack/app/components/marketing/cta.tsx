import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { buttonClass } from '~/components/ui/button';
import { useTranslations } from '~/lib/i18n-context';

export default function CTA() {
  const t = useTranslations('cta');

  return (
    <section className="border-t border-border bg-background">
      <div className="shell py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="display-2 text-pretty text-foreground">{t('title')}</h2>
          <p className="lede mx-auto mt-4 text-pretty text-muted-foreground">{t('subtitle')}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/login" className={buttonClass({ variant: 'primary', size: 'lg' })}>
              {t('startTrial')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/{-$locale}/pricing"
              className={buttonClass({ variant: 'secondary', size: 'lg' })}
            >
              {t('viewPricing')}
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">{t('trialInfo')}</p>
        </div>
      </div>
    </section>
  );
}
