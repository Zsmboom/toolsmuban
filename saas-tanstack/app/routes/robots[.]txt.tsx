import { createFileRoute } from '@tanstack/react-router';
import { absoluteUrl, SITE_URL } from '~/lib/site-config';

/**
 * robots.txt。私有区域一律禁止抓取，其余放开，并指向 sitemap。
 */
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => {
        const body = [
          'User-agent: *',
          'Allow: /',
          'Disallow: /dashboard',
          'Disallow: /tools',
          'Disallow: /admin',
          'Disallow: /api/',
          'Disallow: /auth-callback',
          // 登录/找回类页面没有收录价值；reset / verify 的 URL 还带一次性令牌，
          // 更不该进爬虫队列
          'Disallow: /login',
          'Disallow: /forgot-password',
          'Disallow: /reset-password',
          'Disallow: /verify-email',
          'Disallow: /checkout-success',
          'Disallow: /checkout-cancel',
          '',
          `Host: ${SITE_URL}`,
          `Sitemap: ${absoluteUrl('/sitemap.xml')}`,
          '',
        ].join('\n');

        return new Response(body, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      },
    },
  },
});
