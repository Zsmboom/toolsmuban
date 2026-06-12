import { notFound } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import { getPostsByTag, getAllTags } from "@/lib/blog";
import { BlogCard } from "@/components/blog/blog-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { locales } from '@/i18n';

interface TagPageProps {
  params: Promise<{
    locale: string;
    tag: string;
  }>;
}

// Generate static paths for all tags in all locales
export async function generateStaticParams() {
  const tags = await getAllTags();

  return locales.flatMap(locale =>
    tags.map(tag => ({
      locale,
      tag: tag.name.toLowerCase()
    }))
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag: tagParam } = await params;
  const tagName = decodeURIComponent(tagParam);
  const formattedTag = tagName.charAt(0).toUpperCase() + tagName.slice(1);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";

  return {
    title: `${formattedTag} - Blog Tags`,
    description: `Browse all articles tagged with ${formattedTag}. Find related content, tutorials, and insights about ${formattedTag}.`,
    keywords: [formattedTag, "blog tag", "articles", "related content"],
    openGraph: {
      title: `${formattedTag} - Blog Tags`,
      description: `Browse all articles tagged with ${formattedTag}.`,
      type: "website",
      url: `${baseUrl}/blog/tag/${tagParam}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${formattedTag} - Blog Tags`,
      description: `Browse all articles tagged with ${formattedTag}.`,
    },
    alternates: {
      canonical: `${baseUrl}/blog/tag/${tagParam}`,
    },
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { locale, tag: tagParam } = await params;

  const t = await getTranslations('blogTag');
  const tagName = decodeURIComponent(tagParam);
  const posts = await getPostsByTag(tagName);

  if (posts.length === 0) {
    notFound();
  }

  const formattedTag = tagName.charAt(0).toUpperCase() + tagName.slice(1);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
        <div className="container mx-auto px-4">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="mb-8 gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('backToBlog', { defaultValue: 'Back to Blog' })}
            </Button>
          </Link>

          <div className="mx-auto max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 text-sm backdrop-blur-sm">
              <Tag className="h-4 w-4 text-primary" />
              {t('tag', { defaultValue: 'Tag' })}
            </div>
            <h1 className="mb-4 font-heading text-4xl font-bold tracking-tight md:text-5xl">
              #{formattedTag}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('articleCount', {
                defaultValue: '{count} {count, plural, one {article} other {articles}} with this tag',
                count: posts.length
              })}
            </p>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
