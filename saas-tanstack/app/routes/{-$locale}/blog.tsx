import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import Section from '~/components/ui/section';
import Badge from '~/components/ui/badge';
import { GridFill } from '~/components/ui/grid-fill';
import { blogPosts, formatPostDate } from '~/lib/blog';
import { useI18n, useTranslations } from '~/lib/i18n-context';
import { normalizeLocale } from '~/lib/i18n';
import { buildPageHead } from '~/lib/site-config';

export const Route = createFileRoute('/{-$locale}/blog')({
  head: ({ match }) =>
    buildPageHead({
      locale: normalizeLocale(match.params.locale),
      title: 'Blog',
      description: 'Articles and tutorials on building and shipping tool sites.',
      path: '/blog',
    }),
  component: BlogPage,
});

/**
 * 列表页独有的是**头条一篇 + 其余成网格**：全部平铺等于告诉读者
 * 「这些文章一样重要」，那就没有入口了。
 *
 * 卡片不再做 hover:-translate-y + hover:shadow —— 那是全站唯一一处
 * 会让布局抖动的悬停效果。现在只动边框与底色。
 */
function BlogPage() {
  const { locale } = useI18n();
  const t = useTranslations('blogPage');
  const [featured, ...rest] = blogPosts;

  return (
    <Section
      tight
      headingLevel="h1"
      eyebrow={t('knowledgeBase')}
      title={t('title')}
      lede={t('subtitle')}
    >
      {featured ? (
        <Link
          to="/{-$locale}/blog/$slug"
          params={{ slug: featured.slug }}
          className="surface-interactive group block p-6 sm:p-10"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="brand">{t('featured')}</Badge>
            <Badge>{featured.category}</Badge>
            <time dateTime={featured.date} className="tabular text-xs text-muted-foreground">
              {formatPostDate(featured.date, locale)}
            </time>
          </div>
          <h2 className="display-3 mt-5 max-w-3xl text-pretty text-foreground transition-colors group-hover:text-primary">
            {featured.title}
          </h2>
          <p className="measure mt-4 text-muted-foreground">{featured.excerpt}</p>
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            {t('readMore')}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
      ) : null}

      {rest.length > 0 ? (
        <>
          <h2 className="eyebrow mt-14">{t('recentArticles')}</h2>
          <ul className="grid-hairline mt-4 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((post) => (
              <li key={post.slug} className="bg-card">
                <Link
                  to="/{-$locale}/blog/$slug"
                  params={{ slug: post.slug }}
                  className="group flex h-full flex-col p-6 transition-colors hover:bg-accent sm:p-7"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge>{post.category}</Badge>
                    <time dateTime={post.date} className="tabular text-xs text-muted-foreground">
                      {formatPostDate(post.date, locale)}
                    </time>
                  </div>
                  <h3 className="mt-4 text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                </Link>
              </li>
            ))}
            <GridFill count={rest.length} />
          </ul>
        </>
      ) : (
        <p className="text-muted-foreground">{t('noPosts')}</p>
      )}
    </Section>
  );
}
