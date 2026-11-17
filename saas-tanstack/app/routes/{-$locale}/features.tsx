import { createFileRoute } from '@tanstack/react-router';
import Features, { Boundaries } from '~/components/marketing/features';
import CTA from '~/components/marketing/cta';
import Section from '~/components/ui/section';
import { useTranslations } from '~/lib/i18n-context';
import { normalizeLocale } from '~/lib/i18n';
import { buildPageHead, siteConfig } from '~/lib/site-config';

export const Route = createFileRoute('/{-$locale}/features')({
  head: ({ match }) =>
    buildPageHead({
      locale: normalizeLocale(match.params.locale),
      title: 'Features',
      description: `Everything included in ${siteConfig.name}: authentication, credit metering, multi-provider payments, admin dashboard and SEO defaults.`,
      path: '/features',
    }),
  component: FeaturesPage,
});

/**
 * 这一页与首页共用能力网格，但**首屏不同**：首页是产品演示，
 * 这里是一句话定位；结尾多一块「模板不做什么」——
 * 边界写在动手之前，是全站一贯的做法。
 */
function FeaturesPage() {
  const t = useTranslations('featuresPage');

  return (
    <>
      <Section
        tight
        headingLevel="h1"
        eyebrow={t('eyebrow')}
        title={t('title')}
        lede={t('subtitle')}
      />
      <Features showHeading={false} />
      <Boundaries />
      <CTA />
    </>
  );
}
