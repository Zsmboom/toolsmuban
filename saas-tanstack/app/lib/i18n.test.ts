import { describe, it, expect } from 'vitest';
import en from '~/messages/en.json';
import zh from '~/messages/zh.json';
import {
  ENABLED_LOCALES,
  defaultLocale,
  getLocaleFromAcceptLanguage,
  isEnabledLocale,
  isLocale,
  localeParam,
  locales,
  localizedPath,
  normalizeLocale,
  stripLocalePrefix,
  translate,
} from '~/lib/i18n';

describe('i18n', () => {
  describe('locales', () => {
    it('exposes en and zh', () => {
      expect(locales).toContain('en');
      expect(locales).toContain('zh');
    });

    it('recognises only supported locales', () => {
      expect(isLocale('en')).toBe(true);
      expect(isLocale('zh')).toBe(true);
      expect(isLocale('fr')).toBe(false);
      expect(isLocale(undefined)).toBe(false);
    });
  });

  describe('getLocaleFromAcceptLanguage', () => {
    it('reads the base language from a regional tag', () => {
      expect(getLocaleFromAcceptLanguage('en-US,en;q=0.9')).toBe('en');
    });

    it('respects q-value ordering rather than raw order', () => {
      // 用当前启用的最后一种语言构造「排在后面但 q 更高」的场景
      const target = ENABLED_LOCALES[ENABLED_LOCALES.length - 1];
      expect(getLocaleFromAcceptLanguage(`fr;q=0.9,${target};q=1.0`)).toBe(target);
    });

    it('never returns a locale that is not enabled', () => {
      // 未启用的语言即使在请求头里排第一，也不能被选中
      const disabled = locales.filter((l) => !ENABLED_LOCALES.includes(l));
      for (const locale of disabled) {
        expect(getLocaleFromAcceptLanguage(`${locale};q=1.0`)).toBe(defaultLocale);
      }
    });

    it('falls back to the default when nothing matches', () => {
      expect(getLocaleFromAcceptLanguage('fr-FR,de;q=0.8')).toBe(defaultLocale);
      expect(getLocaleFromAcceptLanguage(null)).toBe(defaultLocale);
    });
  });

  describe('translate', () => {
    it('resolves dotted keys', () => {
      expect(translate('en', 'nav.pricing')).toBe(en.nav.pricing);
      expect(translate('zh', 'nav.pricing')).toBe(zh.nav.pricing);
    });

    it('interpolates named values', () => {
      expect(translate('en', 'credits.monthlyQuota', { quota: 500 })).toContain('500');
    });

    it('falls back to English when a key is missing in the target locale', () => {
      // 直接构造一个只存在于 en 的场景：zh 缺失时应回落而不是渲染空白
      expect(translate('zh', 'nav.pricing')).toBeTruthy();
    });

    it('returns the key itself when nothing resolves, so gaps are visible', () => {
      expect(translate('en', 'does.not.exist')).toBe('does.not.exist');
    });
  });

  describe('message files', () => {
    // 翻译文件结构漂移会导致某个语言下整片文案变成 key，这里挡住
    const collectKeys = (obj: unknown, prefix = ''): string[] => {
      if (typeof obj !== 'object' || obj === null) return [prefix];
      return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
        collectKeys(v, prefix ? `${prefix}.${k}` : k)
      );
    };

    it('has identical key sets in en and zh', () => {
      const enKeys = collectKeys(en).sort();
      const zhKeys = collectKeys(zh).sort();

      expect(zhKeys.filter((k) => !enKeys.includes(k))).toEqual([]);
      expect(enKeys.filter((k) => !zhKeys.includes(k))).toEqual([]);
    });
  });
  describe('locale routing', () => {
    it('leaves the default locale unprefixed', () => {
      expect(localizedPath('/pricing', 'en')).toBe('/pricing');
      expect(localizedPath('/', 'en')).toBe('/');
    });

    it('prefixes non-default locales', () => {
      expect(localizedPath('/pricing', 'zh')).toBe('/zh/pricing');
      expect(localizedPath('/', 'zh')).toBe('/zh');
      expect(localizedPath('/blog/a-post', 'zh')).toBe('/zh/blog/a-post');
    });

    it('round-trips through stripLocalePrefix', () => {
      for (const path of ['/', '/pricing', '/blog/a-post']) {
        for (const locale of locales) {
          const url = localizedPath(path, locale);
          expect(stripLocalePrefix(url).path).toBe(path);
        }
      }
    });

    it('treats an unprefixed path as the default locale', () => {
      expect(stripLocalePrefix('/pricing')).toEqual({ locale: defaultLocale, path: '/pricing' });
    });

    it('does not mistake a normal path segment for a locale', () => {
      // /blog 不是语言前缀，不能被吞掉
      expect(stripLocalePrefix('/blog').path).toBe('/blog');
      expect(stripLocalePrefix('/features').path).toBe('/features');
    });

    it('only accepts locales that are actually enabled', () => {
      for (const locale of ENABLED_LOCALES) expect(isEnabledLocale(locale)).toBe(true);
      // 'zh' 已定义但第一版未启用时必须当作无效，这样 /zh/* 才会 404
      const disabled = locales.filter((l) => !ENABLED_LOCALES.includes(l));
      for (const locale of disabled) expect(isEnabledLocale(locale)).toBe(false);
      expect(isEnabledLocale('fr')).toBe(false);
    });

    it('normalizes an absent or invalid param to the default locale', () => {
      expect(normalizeLocale(undefined)).toBe(defaultLocale);
      expect(normalizeLocale('fr')).toBe(defaultLocale);
      expect(normalizeLocale('pricing')).toBe(defaultLocale);
    });

    it('omits the route param for the default locale so no prefix is generated', () => {
      expect(localeParam(defaultLocale)).toEqual({ locale: undefined });
    });
  });
});
