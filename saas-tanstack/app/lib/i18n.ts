import en from '~/messages/en.json';
import zh from '~/messages/zh.json';

/**
 * ============================================================
 * 多语言路由方案
 * ============================================================
 * 默认语言不带前缀，其他语言带前缀：
 *
 *     /pricing        → en（默认语言，无前缀）
 *     /zh/pricing     → zh
 *
 * 实现方式是 TanStack Router 的可选路径段 `{-$locale}`：
 * 公开页面都放在 app/routes/{-$locale}/ 下，同一份路由同时匹配
 * 带前缀和不带前缀两种 URL，不需要维护两套路由树。
 *
 * `ENABLED_LOCALES` 控制第一版实际对外开放哪些语言。只放 'en' 时，
 * 带前缀的 URL 会 404、语言切换器隐藏、sitemap 只输出默认语言，
 * 但路由结构、链接助手、hreflang、canonical 全都已经就位 ——
 * 以后要开中文只需要往这个数组里加一项。
 */

export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];

/** 默认语言。它的 URL 永远不带前缀。 */
export const defaultLocale: Locale = 'en';

/**
 * 第一版实际启用的语言。
 * 想开中文：改成 `['en', 'zh']`，其余什么都不用动。
 */
export const ENABLED_LOCALES: readonly Locale[] = ['en'];

/** 是否存在默认语言之外的可用语言（决定要不要显示语言切换器） */
export const isMultiLocaleEnabled = ENABLED_LOCALES.length > 1;

/** cookie 名：记住用户在切换器里选过的语言 */
export const LOCALE_COOKIE = 'locale';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
};

/** html lang / hreflang 用的 BCP-47 标签 */
export const localeHtmlLang: Record<Locale, string> = {
  en: 'en',
  zh: 'zh-Hans',
};

export type Messages = typeof en;

const messagesByLocale: Record<Locale, Messages> = {
  en: en as Messages,
  zh: zh as unknown as Messages,
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && locales.includes(value as Locale);
}

/** 只有已启用的语言才算数；未启用的当作无效，走 404 */
export function isEnabledLocale(value: unknown): value is Locale {
  return isLocale(value) && ENABLED_LOCALES.includes(value);
}

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale] ?? messagesByLocale[defaultLocale];
}

/**
 * 把路由参数里的 locale 规整成一个确定的语言。
 * `{-$locale}` 没匹配到时 params.locale 是 undefined，代表默认语言。
 */
export function normalizeLocale(param: string | undefined): Locale {
  return isEnabledLocale(param) ? param : defaultLocale;
}

/**
 * 给 <Link> 用的 params。默认语言传 undefined，
 * 路由就会生成不带前缀的 URL。
 */
export function localeParam(locale: Locale): { locale: string | undefined } {
  return { locale: locale === defaultLocale ? undefined : locale };
}

/**
 * 构造某个语言下的实际路径，用于 canonical / hreflang / sitemap。
 *   localizedPath('/pricing', 'en') → '/pricing'
 *   localizedPath('/pricing', 'zh') → '/zh/pricing'
 */
export function localizedPath(path: string, locale: Locale): string {
  const clean = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) return clean || '/';
  return `/${locale}${clean}`;
}

/**
 * 从完整 pathname 里剥掉语言前缀，拿回「与语言无关」的路径。
 * 语言切换器靠它把当前页面换算到另一种语言的地址。
 */
export function stripLocalePrefix(pathname: string): { locale: Locale; path: string } {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    const locale = segments[0] as Locale;
    return { locale, path: `/${segments.slice(1).join('/')}`.replace(/\/$/, '') || '/' };
  }
  return { locale: defaultLocale, path: pathname || '/' };
}

/**
 * 从 Accept-Language 头里挑一个我们支持的语言。
 *
 * 注意：**不要**用它来决定 SSR 渲染哪种语言 —— 同一个 URL 必须始终返回
 * 同一种语言的 HTML，否则爬虫（基本都用 en-US 抓取）永远看不到其它语言，
 * CDN 缓存也会互相污染。它只适合用来「建议用户跳到某个语言版本」。
 */
export function getLocaleFromAcceptLanguage(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.slice(2)) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    if (isEnabledLocale(base)) return base;
  }

  return defaultLocale;
}

/**
 * 按 'a.b.c' 形式取翻译。取不到时回落到默认语言，再取不到就把 key 原样返回，
 * 这样漏翻的地方在页面上一眼可见，而不是渲染成空白。
 */
export function translate(
  locale: Locale,
  key: string,
  values?: Record<string, string | number>
): string {
  const read = (loc: Locale): unknown =>
    key.split('.').reduce<unknown>((acc, segment) => {
      if (acc && typeof acc === 'object' && segment in (acc as object)) {
        return (acc as Record<string, unknown>)[segment];
      }
      return undefined;
    }, getMessages(loc));

  const raw = read(locale) ?? (locale === defaultLocale ? undefined : read(defaultLocale));

  if (typeof raw !== 'string') return key;
  if (!values) return raw;

  return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match
  );
}
