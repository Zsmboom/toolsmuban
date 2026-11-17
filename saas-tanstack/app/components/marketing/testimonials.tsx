import Section from '~/components/ui/section';
import { useTranslations } from '~/lib/i18n-context';
import { siteConfig } from '~/lib/site-config';
import { GridFill } from '~/components/ui/grid-fill';

/**
 * 引用墙 —— **数据驱动，默认为空**。
 *
 * 模板原来在这里写死了三个具名用户（Sarah Johnson / Michael Chen /
 * Emily Davis）和他们的好评。任何人拿这套模板上线，首页就会挂着
 * 三条编造的社会证明，而且是英文的。
 *
 * 现在改成读 `siteConfig.testimonials`：没有真实引用时整块不渲染，
 * 拿到真的了再往 site-config.ts 里填。
 */
export default function Testimonials() {
  const t = useTranslations('testimonials');
  const quotes = siteConfig.testimonials;

  if (quotes.length === 0) return null;

  return (
    <Section tone="subtle" eyebrow={t('eyebrow')} title={t('title')} lede={t('subtitle')}>
      <ul className="grid-hairline sm:grid-cols-2 lg:grid-cols-4">
        {quotes.map((quote) => (
          <li key={quote.name} className="flex flex-col bg-card p-6 sm:p-7">
            <blockquote className="flex-1 text-sm leading-relaxed text-foreground">
              {quote.content}
            </blockquote>
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground">{quote.name}</p>
              <p className="text-xs text-muted-foreground">{quote.role}</p>
            </div>
          </li>
        ))}
        <GridFill count={quotes.length} />
      </ul>
    </Section>
  );
}
