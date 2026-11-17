import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Badge from '~/components/ui/badge';
import { GridFill } from '~/components/ui/grid-fill';
import { blogPosts, formatPostDate, getPostBySlug } from '~/lib/blog';
import { useI18n, useTranslations } from '~/lib/i18n-context';
import { localeHtmlLang, normalizeLocale } from '~/lib/i18n';
import { buildPageHead, localizedUrl, siteConfig } from '~/lib/site-config';

export const Route = createFileRoute('/{-$locale}/blog/$slug')({
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData, match }) => {
    const locale = normalizeLocale(match.params.locale);
    const post = loaderData?.post;
    if (!post) {
      return buildPageHead({
        title: 'Post not found',
        description: 'This article does not exist.',
        path: '/blog',
        locale,
        noIndex: true,
      });
    }

    const head = buildPageHead({
      title: post.title,
      description: post.excerpt,
      path: `/blog/${post.slug}`,
      locale,
    });

    return {
      ...head,
      meta: [
        ...head.meta,
        { property: 'og:type', content: 'article' },
        { property: 'article:published_time', content: post.date },
        { property: 'article:section', content: post.category },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            url: localizedUrl(`/blog/${post.slug}`, locale),
            inLanguage: localeHtmlLang[locale],
            publisher: {
              '@type': 'Organization',
              name: siteConfig.organization.name,
            },
          }),
        },
      ],
    };
  },
  component: BlogPostPage,
});

/**
 * 详情页独有的是**单栏 measure 正文 + 结尾的相关文章出口**。
 * 正文行长锁在 68ch：这一页是全站唯一一处会连续读几百字的地方，
 * 让它跟着屏幕变宽只会更难读。
 */
function BlogPostPage() {
  const { post } = Route.useLoaderData();
  const { locale } = useI18n();
  const t = useTranslations('blogPost');

  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <article className="shell py-14 sm:py-20">
      <div className="measure">
        <Link
          to="/{-$locale}/blog"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('backToBlog')}
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge tone="brand">{post.category}</Badge>
          <time dateTime={post.date} className="tabular text-xs text-muted-foreground">
            {formatPostDate(post.date, locale)}
          </time>
        </div>

        <h1 className="display-2 mt-5 text-pretty text-foreground">{post.title}</h1>
        <p className="lede mt-5 text-muted-foreground">{post.excerpt}</p>

        <div className="mt-10 space-y-5 border-t border-border pt-10 text-foreground">
          {post.body.map((paragraph, index) => (
            <p key={index} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {related.length > 0 ? (
        <div className="mt-16 border-t border-border pt-10">
          <h2 className="eyebrow">{t('relatedArticles')}</h2>
          <ul className="grid-hairline mt-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.slug} className="bg-card">
                <Link
                  to="/{-$locale}/blog/$slug"
                  params={{ slug: item.slug }}
                  className="group flex h-full flex-col p-6 transition-colors hover:bg-accent"
                >
                  <time dateTime={item.date} className="tabular text-xs text-muted-foreground">
                    {formatPostDate(item.date, locale)}
                  </time>
                  <h3 className="mt-3 flex-1 text-base font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                    {item.title}
                  </h3>
                  <ArrowUpRight
                    className="mt-4 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
            <GridFill count={related.length} />
          </ul>
        </div>
      ) : null}
    </article>
  );
}
