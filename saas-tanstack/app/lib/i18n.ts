export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function getLocaleFromUrl(url: string): Locale {
  const path = new URL(url).pathname;
  const segments = path.split('/');

  if (segments[1] && locales.includes(segments[1] as Locale)) {
    return segments[1] as Locale;
  }

  return defaultLocale;
}

export function getLocaleFromHeaders(headers: Headers): Locale {
  const acceptLanguage = headers.get('accept-language');
  if (!acceptLanguage) return defaultLocale;

  const preferred = acceptLanguage.split(',')[0].split('-')[0];
  if (locales.includes(preferred as Locale)) {
    return preferred as Locale;
  }

  return defaultLocale;
}

export async function getTranslations(locale: Locale, namespace: string) {
  try {
    const messages = await import(`~/messages/${locale}.json`);
    return messages.default[namespace] || {};
  } catch (error) {
    console.error(`Failed to load translations for ${locale}/${namespace}`);
    return {};
  }
}

export function createI18nMiddleware() {
  return async (request: Request) => {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Check if language prefix already exists
    const hasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (!hasLocale) {
      // Get preferred language from headers
      const locale = getLocaleFromHeaders(request.headers);
      url.pathname = `/${locale}${pathname}`;

      return Response.redirect(url.toString(), 302);
    }

    return null; // Continue processing request
  };
}
