import { createFileRoute } from '@tanstack/react-router';
import { blogPosts } from '~/lib/blog';
import { ENABLED_LOCALES, defaultLocale, isMultiLocaleEnabled, localeHtmlLang } from '~/lib/i18n';
import { localizedUrl, publicRoutes } from '~/lib/site-config';

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string
  );
}

interface Entry {
  path: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}

/**
 * sitemap.xml
 *
 * 静态页取自 site-config.publicRoutes，文章取自 lib/blog。
 * 启用多语言后，每个页面会为每种语言各输出一条 <url>，并在每条里用
 * xhtml:link 交叉声明所有语言版本 —— 这是 Google 认可的多语言 sitemap 写法。
 * 只启用一种语言时退化成普通 sitemap，不输出多余的 alternate。
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => {
        const today = new Date().toISOString().split('T')[0];

        const entries: Entry[] = [
          ...publicRoutes.map((route) => ({
            path: route.path,
            lastmod: today,
            changefreq: route.changefreq,
            priority: route.priority,
          })),
          ...blogPosts.map((post) => ({
            path: `/blog/${post.slug}`,
            lastmod: post.date,
            changefreq: 'monthly',
            priority: 0.6,
          })),
        ];

        const urls: string[] = [];

        for (const entry of entries) {
          for (const locale of ENABLED_LOCALES) {
            const alternates = isMultiLocaleEnabled
              ? [
                  ...ENABLED_LOCALES.map(
                    (alt) =>
                      `    <xhtml:link rel="alternate" hreflang="${localeHtmlLang[alt]}" href="${escapeXml(localizedUrl(entry.path, alt))}"/>`
                  ),
                  `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(localizedUrl(entry.path, defaultLocale))}"/>`,
                ]
              : [];

            urls.push(
              [
                '  <url>',
                `    <loc>${escapeXml(localizedUrl(entry.path, locale))}</loc>`,
                ...alternates,
                `    <lastmod>${entry.lastmod}</lastmod>`,
                `    <changefreq>${entry.changefreq}</changefreq>`,
                `    <priority>${entry.priority.toFixed(1)}</priority>`,
                '  </url>',
              ].join('\n')
            );
          }
        }

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
          ...urls,
          '</urlset>',
          '',
        ].join('\n');

        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      },
    },
  },
});
