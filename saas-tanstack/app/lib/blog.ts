import { formatDate } from './format';
import type { Locale } from './i18n';

/**
 * 示例文章数据。搭真实站点时把它换成 CMS / MDX / 数据库来源即可，
 * 列表页、详情页和 sitemap 都读这一份。
 */
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO 日期，便于排序和生成 sitemap 的 lastmod */
  date: string;
  category: string;
  body: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'getting-started-with-tanstack-start',
    title: 'Getting Started with TanStack Start',
    excerpt:
      'Learn how to build your first tool site with TanStack Start and deploy it to Cloudflare Workers.',
    date: '2026-06-01',
    category: 'Tutorial',
    body: [
      'TanStack Start gives you server-side rendering, type-safe routing and server functions in a single Vite-powered project.',
      'This template wires those pieces together with authentication, a credit ledger and three payment providers so you only have to build the tool itself.',
      'Replace the demo handler in app/lib/tools/server-fns.ts with your own implementation and the metering, logging and refund flow keeps working unchanged.',
    ],
  },
  {
    slug: 'authentication-best-practices',
    title: 'Authentication Best Practices',
    excerpt:
      'Why session cookies must be HttpOnly, and how the OAuth state parameter protects your sign-in flow.',
    date: '2026-05-28',
    category: 'Security',
    body: [
      'A session token stored in a JavaScript-readable cookie can be exfiltrated by any cross-site scripting bug on your domain.',
      'This template issues the session cookie server-side with HttpOnly, Secure and SameSite=Lax, so the browser sends it automatically and scripts can never read it.',
      'The OAuth flow also carries a random state value and a PKCE challenge, which together stop an attacker from injecting their own authorization code into your callback.',
    ],
  },
  {
    slug: 'payment-integration-guide',
    title: 'Payment Integration Guide',
    excerpt:
      'Handling Stripe, Creem and PayPal webhooks without double-charging or double-provisioning.',
    date: '2026-05-25',
    category: 'Payments',
    body: [
      'Every payment provider retries webhooks. Without deduplication, one purchase can create several subscription rows and grant credits multiple times.',
      'This template records each event id in a webhook_events table with a unique constraint, so a replayed delivery is recognised and skipped.',
      'Plan resolution always goes through the shared plans module, which means the plan a customer actually paid for is the plan they receive.',
    ],
  },
  {
    slug: 'building-admin-dashboard',
    title: 'Building an Admin Dashboard',
    excerpt: 'Aggregating users, revenue and tool usage into a live operations view.',
    date: '2026-05-22',
    category: 'Product',
    body: [
      'The admin area aggregates real numbers straight from the database: total users, new signups, active subscriptions, month-to-date revenue and tool runs.',
      'All queries live in server functions behind a role check, so the database client is never shipped to the browser.',
      'Add your own panels by extending app/lib/admin/server-fns.ts.',
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function formatPostDate(date: string, locale: Locale): string {
  return formatDate(date, locale);
}
