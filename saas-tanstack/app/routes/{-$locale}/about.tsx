import { createFileRoute } from '@tanstack/react-router';
import Section from '~/components/ui/section';
import { useTranslations } from '~/lib/i18n-context';
import { normalizeLocale } from '~/lib/i18n';
import { buildPageHead, siteConfig } from '~/lib/site-config';

export const Route = createFileRoute('/{-$locale}/about')({
  head: ({ match }) =>
    buildPageHead({
      locale: normalizeLocale(match.params.locale),
      title: 'About',
      description: `Why we built ${siteConfig.name} and the stack behind it.`,
      path: '/about',
    }),
  component: AboutPage,
});

const FACTS = ['stack', 'database', 'payments', 'deploy'] as const;
const VALUES = ['quality', 'developer', 'support'] as const;

/**
 * 关于页是全站唯一的「左侧固定事实栏 + 右侧长文」排版 ——
 * 每种页型必须有一样别人没有的东西，否则站内所有页面会长成同一张脸。
 *
 * 正文用 `measure` 控制行长：长文超过 75 字符一行就开始难读，
 * 而这一页是全站文字最多的地方。
 *
 * 之前这四段是写死的英文（中文站直接露英文），现在全部走 i18n。
 */
function AboutPage() {
  const t = useTranslations('aboutPage');

  return (
    <>
      <Section tight headingLevel="h1" title={t('title')} lede={t('subtitle')}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-16">
          {/* 事实栏：宽屏上跟着滚动停住，长文再长也一直看得见 */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="eyebrow">{t('facts.title')}</h2>
            <dl className="mt-4 divide-y divide-border border-y border-border">
              {FACTS.map((fact) => (
                <div key={fact} className="py-4">
                  <dt className="text-xs text-muted-foreground">{t(`facts.${fact}.label`)}</dt>
                  <dd className="tabular mt-1 text-sm text-foreground">
                    {t(`facts.${fact}.value`)}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>

          <div className="measure">
            <h2 className="display-3 text-foreground">{t('story.title')}</h2>
            <div className="mt-5 space-y-4 text-muted-foreground">
              <p>{t('story.paragraph1')}</p>
              <p>{t('story.paragraph2')}</p>
              <p>{t('story.paragraph3')}</p>
            </div>

            <h2 className="display-3 mt-14 text-foreground">{t('values.title')}</h2>
            <dl className="mt-5 space-y-6">
              {VALUES.map((value) => (
                <div key={value}>
                  <dt className="text-base font-medium text-foreground">
                    {t(`values.${value}.title`)}
                  </dt>
                  <dd className="mt-1.5 text-muted-foreground">{t(`values.${value}.description`)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>
    </>
  );
}
