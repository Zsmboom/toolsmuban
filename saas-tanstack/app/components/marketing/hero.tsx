import { Link } from '@tanstack/react-router';
import { ArrowRight, Check, ChevronRight, Play } from 'lucide-react';
import { buttonClass } from '~/components/ui/button';
import { useTranslations } from '~/lib/i18n-context';
import { TOOLS } from '~/lib/tools/registry';

/**
 * 首屏：左边说清楚这是什么，右边直接给一张「工具跑起来长什么样」的静态演示。
 *
 * 之前这里是 Tailwind 官方营销模板那个 clipPath 渐变色块 —— 它是全站
 * 仅有的两处硬编码颜色，也是「模板感」最重的一块。换成 `grid-field`
 * 细网格底纹：给大片留白一点结构，但不抢内容。
 *
 * 右边这张卡不是装饰：工具站的首屏必须先回答「跑一次是什么体验、
 * 花多少积分」，用一段文案说服不了这件事。
 */
export default function Hero() {
  const t = useTranslations('hero');
  const cost = TOOLS.demo.cost;

  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="grid-field pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="shell relative py-16 sm:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,0.95fr)] lg:gap-16">
          <div className="animate-rise">
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              {t('badge')}
            </span>

            <h1 className="display-1 mt-6 max-w-[16ch] text-pretty text-foreground">
              {t('title')}
            </h1>

            <p className="lede measure mt-6 text-pretty text-muted-foreground">
              {t('description')}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/login" className={buttonClass({ variant: 'primary', size: 'lg' })}>
                {t('cta')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/{-$locale}/features"
                className={buttonClass({ variant: 'secondary', size: 'lg' })}
              >
                {t('learnMore')}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {['noCard', 'openSource', 'selfHost'].map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t(`checks.${key}`)}
                </li>
              ))}
            </ul>
          </div>

          {/* 工具运行演示 —— 静态渲染，不做假的可交互控件 */}
          <div className="surface overflow-hidden" aria-label={t('demo.label')}>
            <div className="flex items-center justify-between gap-3 border-b border-border bg-subtle px-4 py-3">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full border border-border" />
                <span className="h-2.5 w-2.5 rounded-full border border-border" />
                <span className="h-2.5 w-2.5 rounded-full border border-border" />
              </div>
              <span className="tabular text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground">
                {t('demo.label')}
              </span>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <p className="text-xs text-muted-foreground">{t('demo.inputLabel')}</p>
                <div className="mt-2 rounded-[var(--radius)] border border-input bg-background px-3 py-2.5 text-sm text-foreground">
                  {t('demo.inputValue')}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span
                  className={buttonClass({ variant: 'primary', size: 'md' })}
                  aria-hidden="true"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('demo.run')}
                </span>
                <span className="tabular text-xs text-muted-foreground">
                  {t('demo.cost', { cost })}
                </span>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">{t('demo.outputLabel')}</p>
                <div className="mt-2 rounded-[var(--radius)] border border-border bg-subtle px-3 py-2.5 text-sm text-foreground">
                  {t('demo.outputValue')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs sm:px-6">
              <span className="text-muted-foreground">{t('demo.ledger')}</span>
              <span className="tabular text-foreground">{t('demo.balance', { cost })}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
