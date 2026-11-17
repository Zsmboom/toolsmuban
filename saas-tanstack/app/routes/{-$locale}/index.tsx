import { createFileRoute } from '@tanstack/react-router';
import Hero from '~/components/marketing/hero';
import Facts from '~/components/marketing/facts';
import HowItWorks from '~/components/marketing/how-it-works';
import ToolGrid from '~/components/marketing/tool-grid';
import Features from '~/components/marketing/features';
import Testimonials from '~/components/marketing/testimonials';
import PricingCards from '~/components/marketing/pricing-cards';
import FAQ from '~/components/marketing/faq';
import CTA from '~/components/marketing/cta';
import { normalizeLocale } from '~/lib/i18n';
import { buildPageHead, siteConfig } from '~/lib/site-config';

export const Route = createFileRoute('/{-$locale}/')({
  head: ({ match }) =>
    buildPageHead({
      locale: normalizeLocale(match.params.locale),
      title: `${siteConfig.name} - ${siteConfig.tagline}`,
      description: siteConfig.description,
      path: '/',
      rawTitle: true,
    }),
  component: HomePage,
});

/**
 * 首页信息架构 —— 工具站的顺序，不是通用 SaaS 落地页的顺序。
 *
 * 先让人看见「跑一次是什么样」（Hero 的演示卡），再给可核对的事实，
 * 然后才是流程、工具、能力。定价放在能力之后：还不知道能做什么的时候
 * 看价格是没有意义的。
 *
 * Testimonials 默认不渲染 —— siteConfig.testimonials 是空数组，
 * 模板不出厂编造的用户好评。
 */
function HomePage() {
  return (
    <>
      <Hero />
      <Facts />
      <HowItWorks />
      <ToolGrid />
      <Features />
      <Testimonials />
      <PricingCards />
      <FAQ />
      <CTA />
    </>
  );
}
