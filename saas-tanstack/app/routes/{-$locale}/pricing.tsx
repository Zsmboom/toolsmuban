import { createFileRoute } from '@tanstack/react-router';
import PricingCards from '~/components/marketing/pricing-cards';
import FAQ from '~/components/marketing/faq';
import Section from '~/components/ui/section';
import { normalizeLocale } from '~/lib/i18n';
import { buildPageHead } from '~/lib/site-config';
import { useTranslations } from '~/lib/i18n-context';
import { toolList } from '~/lib/tools/registry';

export const Route = createFileRoute('/{-$locale}/pricing')({
  head: ({ match }) =>
    buildPageHead({
      locale: normalizeLocale(match.params.locale),
      title: 'Pricing',
      description:
        "Choose the plan that's right for you. Every plan includes a monthly credit allowance.",
      path: '/pricing',
    }),
  component: PricingPage,
});

/**
 * 定价页独有的一块是**每个工具多少积分的表**：档位卡只说了每月给多少积分，
 * 不说一次调用花多少，那个数字就没法换算成「够我用吗」。
 *
 * 表格从 registry 读，不手写 —— 手写的价格表迟早和代码对不上。
 */
function PricingPage() {
  const t = useTranslations('pricingCards');
  const tp = useTranslations('pricingPage');
  const tt = useTranslations('tools');

  return (
    <>
      <Section
        tight
        align="center"
        headingLevel="h1"
        title={t('title')}
        lede={t('subtitle')}
        className="[&>div]:pb-0"
      />

      <PricingCards showHeading={false} />

      <Section tone="subtle" tight eyebrow={tp('costs.eyebrow')} title={tp('costs.title')} lede={tp('costs.lede')}>
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-b border-border bg-subtle text-left">
                  <th scope="col" className="px-5 py-3 font-medium text-muted-foreground">
                    {tp('costs.tool')}
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium text-muted-foreground">
                    {tp('costs.description')}
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-medium text-muted-foreground">
                    {tp('costs.credits')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {toolList.map((tool) => (
                  <tr key={tool.id} className="border-b border-border last:border-0">
                    <th scope="row" className="px-5 py-4 text-left font-medium text-foreground">
                      {tt(tool.nameKey)}
                    </th>
                    <td className="px-5 py-4 text-muted-foreground">{tt(tool.descriptionKey)}</td>
                    <td className="tabular px-5 py-4 text-right text-foreground">{tool.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{tp('costs.note')}</p>
      </Section>

      <FAQ />
    </>
  );
}
