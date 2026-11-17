import { createServerFn } from '@tanstack/react-start';
import { setCookie } from '@tanstack/react-start/server';
import { LOCALE_COOKIE, isEnabledLocale } from './i18n';

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * 记住用户选过的语言。
 *
 * 注意 cookie **不参与** SSR 渲染哪种语言的决策 —— 那是 URL 的事。
 * 它只用于「用户下次直接访问站点时，可以引导到上次选择的语言」，
 * 以及切换器的默认高亮。
 */
export const setLocaleFn = createServerFn({ method: 'POST' })
  .validator((data: { locale: string }) => {
    if (!isEnabledLocale(data?.locale)) throw new Error(`Unsupported locale: ${data?.locale}`);
    return { locale: data.locale };
  })
  .handler(async ({ data }) => {
    setCookie(LOCALE_COOKIE, data.locale, {
      path: '/',
      maxAge: ONE_YEAR,
      sameSite: 'lax',
      httpOnly: false,
    });
    return { locale: data.locale };
  });
