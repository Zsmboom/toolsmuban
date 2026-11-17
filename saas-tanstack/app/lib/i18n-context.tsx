import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { defaultLocale, translate, type Locale } from './i18n';

interface I18nContextValue {
  locale: Locale;
  /** 取翻译，key 为 'namespace.key' 形式 */
  t: (key: string, values?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => translate(locale, key, values),
    [locale]
  );

  const value = useMemo(() => ({ locale, t }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  // Provider 一定在 __root 里，这里的回落只是为了让单测能直接渲染组件
  if (!ctx) {
    return {
      locale: defaultLocale,
      t: (key, values) => translate(defaultLocale, key, values),
    };
  }
  return ctx;
}

/**
 * 绑定到某个命名空间，省掉每次都写前缀。
 *   const t = useTranslations('nav')
 *   t('pricing')  // -> messages[locale].nav.pricing
 */
export function useTranslations(namespace: string) {
  const { t } = useI18n();
  return useCallback(
    (key: string, values?: Record<string, string | number>) => t(`${namespace}.${key}`, values),
    [t, namespace]
  );
}
