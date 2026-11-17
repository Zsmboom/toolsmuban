import {
  ENABLED_LOCALES,
  defaultLocale,
  isMultiLocaleEnabled,
  localeHtmlLang,
  localizedPath,
  type Locale,
} from './i18n';

/** OG 协议要求的 locale 写法 */
const ogLocale: Record<Locale, string> = {
  en: 'en_US',
  zh: 'zh_CN',
};

/**
 * 站点级配置 —— 用本模板搭新站时，绝大多数「换内容」的改动只需要动这个文件。
 *
 * 这里的值同时驱动：SEO meta / OG / JSON-LD、sitemap.xml、robots.txt、
 * 导航与页脚文案、以及各支付渠道 checkout 的品牌名。
 */

/** 站点主域名，末尾不带斜杠。生产环境务必通过 VITE_APP_URL 覆盖。 */
export const SITE_URL = (
  import.meta.env?.VITE_APP_URL ||
  process.env.VITE_APP_URL ||
  'http://localhost:3000'
).replace(/\/$/, '');

/** 首页引用墙的一条真实引用 */
export interface Testimonial {
  name: string;
  role: string;
  content: string;
}

/**
 * 引用墙内容 —— **默认为空，整块不渲染**。
 *
 * 模板原来在首页写死了三个具名用户和他们的好评。任何人拿这套模板上线，
 * 首页就会挂着三条编造的社会证明。拿到真实引用再往这里填。
 */
const testimonials: Testimonial[] = [];

export const siteConfig = {
  /** 品牌名，出现在标题、导航、支付页 */
  name: 'SaaS Template',
  /** 一句话定位，用于首页 title 后缀与 OG */
  tagline: 'Build Your SaaS 10x Faster',
  description:
    'A production-ready template for launching tool sites: authentication, credit-based billing, multi-provider payments and an admin dashboard out of the box.',
  url: SITE_URL,
  /**
   * OG 图片（1200×630）。社交平台不接受 SVG，必须是 PNG/JPG。
   * 仓库里的是纯渐变占位图 —— 上线前请换成带品牌名的正式图，
   * public/og-image.svg 是可编辑的源文件。
   */
  ogImage: '/og-image.png',
  locale: 'en_US',
  twitter: '@yourhandle',
  /** 用于 JSON-LD 的组织信息 */
  organization: {
    name: 'SaaS Template',
    logo: '/logo.svg',
  },
  contactEmail: 'support@example.com',
  testimonials,
} as const;

/** 拼一个绝对 URL，OG/canonical/sitemap 都要求绝对地址 */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** 某个语言下这个页面的绝对地址 */
export function localizedUrl(path: string, locale: Locale): string {
  return absoluteUrl(localizedPath(path, locale));
}

/**
 * 生成一个页面完整的 head meta。
 * 用法：head: () => buildPageHead({ title: 'Pricing', description: '...', path: '/pricing' })
 */
export function buildPageHead(opts: {
  title: string;
  description: string;
  /** 与语言无关的路径，如 '/pricing'；语言前缀由这里统一加 */
  path: string;
  /** 传 true 时标题不追加品牌后缀（首页用） */
  rawTitle?: boolean;
  image?: string;
  noIndex?: boolean;
  /** 当前语言。公开页面必须传，否则 canonical/hreflang 会指错 */
  locale?: Locale;
  /** 私有页面（dashboard 等）不需要多语言 alternate */
  localized?: boolean;
}) {
  const locale = opts.locale ?? defaultLocale;
  const localized = opts.localized ?? !opts.noIndex;
  const title = opts.rawTitle ? opts.title : `${opts.title} | ${siteConfig.name}`;
  const url = localized ? localizedUrl(opts.path, locale) : absoluteUrl(opts.path);
  const image = absoluteUrl(opts.image ?? siteConfig.ogImage);

  // hreflang：告诉搜索引擎同一页面的其它语言版本在哪。
  // 只有启用了多语言才输出，单语言时 alternate 是噪音。
  const alternates =
    localized && isMultiLocaleEnabled
      ? [
          ...ENABLED_LOCALES.map((loc) => ({
            rel: 'alternate',
            hreflang: localeHtmlLang[loc],
            href: localizedUrl(opts.path, loc),
          })),
          {
            rel: 'alternate',
            hreflang: 'x-default',
            href: localizedUrl(opts.path, defaultLocale),
          },
        ]
      : [];

  return {
    meta: [
      { title },
      { name: 'description', content: opts.description },
      ...(opts.noIndex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),

      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: siteConfig.name },
      { property: 'og:title', content: title },
      { property: 'og:description', content: opts.description },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { property: 'og:locale', content: ogLocale[locale] ?? siteConfig.locale },

      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: opts.description },
      { name: 'twitter:image', content: image },
      { name: 'twitter:site', content: siteConfig.twitter },
    ],
    links: [{ rel: 'canonical', href: url }, ...alternates],
  };
}

/** 站点内所有希望被收录的公开页面，sitemap.xml 直接读它 */
export const publicRoutes: Array<{
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
}> = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/pricing', changefreq: 'weekly', priority: 0.9 },
  { path: '/features', changefreq: 'monthly', priority: 0.8 },
  { path: '/blog', changefreq: 'weekly', priority: 0.7 },
  { path: '/about', changefreq: 'monthly', priority: 0.5 },
  { path: '/contact', changefreq: 'monthly', priority: 0.5 },
  { path: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { path: '/terms', changefreq: 'yearly', priority: 0.3 },
];
