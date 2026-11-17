import Section from '~/components/ui/section';
import { useTranslations } from '~/lib/i18n-context';

const STEPS = ['signUp', 'pickPlan', 'runTool', 'watchUsage'] as const;

/**
 * 四步：注册 → 选套餐 → 调用工具 → 看用量。
 *
 * 用 `grid-hairline`：格子之间只有 1px 边框色的缝，没有间距也没有阴影。
 * 编号走等宽，它是序号不是文案。
 */
export default function HowItWorks() {
  const t = useTranslations('howItWorks');

  return (
    <Section id="how-it-works" eyebrow={t('eyebrow')} title={t('title')} lede={t('lede')}>
      <ol className="grid-hairline sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step} className="bg-card p-6 sm:p-7">
            <span className="tabular text-xs text-primary">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-4 text-base font-medium text-foreground">{t(`${step}.title`)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(`${step}.description`)}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
