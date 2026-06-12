import { notFound } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import { getPostsByCategory, getAllCategories } from "@/lib/blog";
import { BlogCard } from "@/components/blog/blog-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Folder } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { locales } from '@/i18n';

interface CategoryPageProps {
  params: Promise<{
    locale: string;
    category: string;
  }>;
}

// Generate static paths for all categories in all locales
export async function generateStaticParams() {
  const categories = await getAllCategories();

  return locales.flatMap(locale =>
    categories.map(category => ({
      locale,
      category: category.name.toLowerCase()
    }))
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: categoryParam } = await params;
  const categoryName = decodeURIComponent(categoryParam);
  const formattedCategory = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";

  return {
    title: `${formattedCategory} - Blog Categories`,
    description: `Browse all articles in the ${formattedCategory} category. Discover insights, tutorials, and guides about ${formattedCategory}.`,
    keywords: [formattedCategory, "blog category", "articles", "tutorials", "guides"],
    openGraph: {
      title: `${formattedCategory} - Blog Categories`,
      description: `Browse all articles in the ${formattedCategory} category.`,
      type: "website",
      url: `${baseUrl}/blog/category/${categoryParam}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${formattedCategory} - Blog Categories`,
      description: `Browse all articles in the ${formattedCategory} category.`,
    },
    alternates: {
      canonical: `${baseUrl}/blog/category/${categoryParam}`,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale, category: categoryParam } = await params;

  const t = await getTranslations('blogCategory');
  const categoryName = decodeURIComponent(categoryParam);
  const posts = await getPostsByCategory(categoryName);

  if (posts.length === 0) {
    notFound();
  }

  const formattedCategory = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

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
              <Folder className="h-4 w-4 text-primary" />
              {t('category', { defaultValue: 'Category' })}
            </div>
            <h1 className="mb-4 font-heading text-4xl font-bold tracking-tight md:text-5xl">
              {formattedCategory}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('articleCount', {
                defaultValue: '{count} {count, plural, one {article} other {articles}} in this category',
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
