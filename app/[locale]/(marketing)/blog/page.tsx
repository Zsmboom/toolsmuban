import { getAllPosts, getAllCategories, getAllTags } from "@/lib/blog";
import { BlogCard } from "@/components/blog/blog-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getTranslations } from 'next-intl/server';
import { BookOpen, Tag, Folder } from "lucide-react";
import type { Metadata } from "next";
import { getOptimizedOgImage, getOptimizedTwitterImage } from '@/lib/og-image-utils';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blogPage' });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";

  return {
    title: t('metaTitle', { defaultValue: 'Blog - SaaS Template' }),
    description: t('metaDescription', {
      defaultValue: 'Read our latest articles, tutorials, and insights about building successful SaaS products with Next.js, TypeScript, and modern best practices. Learn from real-world examples.'
    }),
    keywords: ["blog", "saas tutorials", "nextjs guides", "saas development", "web development", "react tutorials"],
    openGraph: {
      title: t('metaTitle', { defaultValue: 'Blog - SaaS Template' }),
      description: t('metaDescription', {
        defaultValue: 'Read our latest articles, tutorials, and insights about building successful SaaS products with Next.js, TypeScript, and modern best practices. Learn from real-world examples.'
      }),
      type: "website",
      url: `${baseUrl}/blog`,
      images: getOptimizedOgImage('og-blog', t('metaTitle', { defaultValue: 'SaaS Template Blog' })),
    },
    twitter: {
      card: "summary_large_image",
      title: t('metaTitle', { defaultValue: 'Blog - SaaS Template' }),
      description: t('metaDescription', {
        defaultValue: 'Read our latest articles, tutorials, and insights about building successful SaaS products.'
      }),
      images: getOptimizedTwitterImage('og-blog'),
    },
    alternates: {
      canonical: `${baseUrl}/blog`,
    },
  };
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations('blogPage');
  const posts = await getAllPosts();
  const categories = await getAllCategories();
  const tags = await getAllTags();

  const featuredPost = posts[0];
  const recentPosts = posts.slice(1, 7);

  // CollectionPage Schema for SEO
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t('metaTitle', { defaultValue: 'Blog - SaaS Template' }),
    description: t('metaDescription', {
      defaultValue: 'Read our latest articles, tutorials, and insights about building successful SaaS products.'
    }),
    url: `${baseUrl}/blog`,
    mainEntity: {
      "@type": "Blog",
      name: t('metaTitle', { defaultValue: 'SaaS Template Blog' }),
      description: t('metaDescription', {
        defaultValue: 'Articles, tutorials, and insights about building SaaS products.'
      }),
    },
  };

  return (
    <div className="min-h-screen">
      {/* CollectionPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionPageSchema),
        }}
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 text-sm backdrop-blur-sm">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>{t('knowledgeBase', { defaultValue: 'Knowledge Base' })}</span>
            </div>
            <h1 className="mb-6 font-heading text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              {t('title', { defaultValue: 'Blog & Resources' })}
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              {t('subtitle', {
                defaultValue: 'Discover articles, tutorials, and insights to help you build and grow your SaaS product.'
              })}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-4">
            {/* Main Content - Blog Posts */}
            <div className="lg:col-span-3">
              {/* Featured Post */}
              {featuredPost && (
                <div className="mb-16">
                  <div className="mb-6 flex items-center gap-2 text-sm font-medium text-primary">
                    <div className="h-px w-12 bg-primary" />
                    {t('featured', { defaultValue: 'Featured Article' })}
                  </div>
                  <BlogCard post={featuredPost} featured />
                </div>
              )}

              {/* Recent Posts Grid */}
              {recentPosts.length > 0 ? (
                <>
                  <h2 className="mb-8 font-heading text-2xl font-bold">
                    {t('recentArticles', { defaultValue: 'Recent Articles' })}
                  </h2>
                  <div className="grid gap-8 md:grid-cols-2">
                    {recentPosts.map((post) => (
                      <BlogCard key={post.slug} post={post} />
                    ))}
                  </div>
                </>
              ) : (
                <Card className="p-12 text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    {t('noPosts', { defaultValue: 'No posts yet' })}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('checkBackSoon', { defaultValue: 'Check back soon for new articles and insights.' })}
                  </p>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Categories */}
              {categories.length > 0 && (
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Folder className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{t('categories', { defaultValue: 'Categories' })}</h3>
                  </div>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <Link
                        key={category.name}
                        href={`/blog/category/${category.name.toLowerCase()}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent"
                      >
                        <span>{category.name}</span>
                        <Badge variant="secondary">{category.count}</Badge>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{t('tags', { defaultValue: 'Tags' })}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Link key={tag.name} href={`/blog/tag/${tag.name.toLowerCase()}`}>
                        <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground">
                          {tag.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
