import { notFound } from "next/navigation";
import { getAllPostSlugs, getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { BlogHeader } from "@/components/blog/blog-header";
import { MarkdownRenderer } from "@/components/blog/markdown-renderer";
import { BlogCard } from "@/components/blog/blog-card";
import { ShareButton } from "@/components/blog/share-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import { locales } from '@/i18n';

interface BlogPostPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// Generate static paths for all blog posts in all locales
export async function generateStaticParams() {
  const slugs = getAllPostSlugs();

  return locales.flatMap(locale =>
    slugs.map(slug => ({
      locale,
      slug
    }))
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";

  return {
    title: `${post.title} - Blog`,
    description: post.description,
    authors: [{ name: post.author }],
    keywords: [...post.tags, post.category],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      images: post.image ? [{ url: post.image, alt: post.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : [],
    },
    alternates: {
      canonical: `${baseUrl}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;

  const t = await getTranslations('blogPost');
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(slug, 3);

  // Article Schema for SEO
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.image ? `${baseUrl}${post.image}` : undefined,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "SaaS Template",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${slug}`,
    },
    keywords: post.tags.join(", "),
    articleSection: post.category,
    wordCount: post.content.split(/\s+/).length,
  };

  return (
    <div className="min-h-screen">
      {/* Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      {/* Back Button */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('backToBlog', { defaultValue: 'Back to Blog' })}
            </Button>
          </Link>
        </div>
      </div>

      {/* Article Content */}
      <article className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <BlogHeader
              title={post.title}
              description={post.description}
              date={post.date}
              author={post.author}
              category={post.category}
              tags={post.tags}
              readingTime={post.readingTime}
              image={post.image}
            />

            {/* Share Buttons */}
            <div className="mb-8 flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                {t('share', { defaultValue: 'Share:' })}
              </span>
              <ShareButton
                title={post.title}
                description={post.description}
              />
            </div>

            {/* Content */}
            <div className="prose prose-neutral max-w-none dark:prose-invert">
              <MarkdownRenderer content={post.content} />
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-12 flex flex-wrap items-center gap-3 border-t pt-8">
                <span className="text-sm font-medium text-muted-foreground">
                  {t('tags', { defaultValue: 'Tags:' })}
                </span>
                {post.tags.map((tag) => (
                  <Link key={tag} href={`/blog/tag/${tag.toLowerCase()}`}>
                    <span className="rounded-full bg-muted px-3 py-1 text-sm hover:bg-accent">
                      {tag}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <h2 className="mb-12 text-center font-heading text-3xl font-bold">
                {t('relatedArticles', { defaultValue: 'Related Articles' })}
              </h2>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <BlogCard key={relatedPost.slug} post={relatedPost} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
