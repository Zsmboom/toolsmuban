import { createFileRoute, Link } from '@tanstack/react-router';
import Navbar from '~/components/layout/navbar';
import Footer from '~/components/layout/footer';

export const Route = createFileRoute('/blog')({
  head: () => ({
    meta: [
      { title: 'Blog - SaaS Template' },
      {
        name: 'description',
        content: 'Latest articles and tutorials on building SaaS products with TanStack Start.',
      },
    ],
  }),
  component: BlogPage,
});

const posts = [
  {
    title: 'Getting Started with TanStack Start',
    excerpt: 'Learn how to build your first SaaS product with TanStack Start and deploy it to Cloudflare Workers.',
    date: 'June 1, 2026',
    slug: 'getting-started-with-tanstack-start',
  },
  {
    title: 'Authentication Best Practices',
    excerpt: 'Discover the best practices for implementing secure authentication in your SaaS application.',
    date: 'May 28, 2026',
    slug: 'authentication-best-practices',
  },
  {
    title: 'Payment Integration Guide',
    excerpt: 'A comprehensive guide to integrating Stripe and PayPal payments into your SaaS product.',
    date: 'May 25, 2026',
    slug: 'payment-integration-guide',
  },
  {
    title: 'Building an Admin Dashboard',
    excerpt: 'Learn how to build a powerful admin dashboard with analytics and user management features.',
    date: 'May 22, 2026',
    slug: 'building-admin-dashboard',
  },
];

function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-heading">Blog</h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Latest articles and tutorials on building SaaS products
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-4xl">
              <div className="grid grid-cols-1 gap-8">
                {posts.map((post, index) => (
                  <article
                    key={index}
                    className="group rounded-xl bg-card border border-border p-8 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        Tutorial
                      </span>
                      <time>{post.date}</time>
                    </div>
                    <h2 className="mt-4 text-2xl font-bold font-heading">
                      <Link
                        to={`/blog/${post.slug}`}
                        className="hover:text-primary transition-colors duration-200 cursor-pointer"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    <p className="mt-4 text-muted-foreground leading-relaxed">{post.excerpt}</p>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-all duration-200 cursor-pointer gap-1 group-hover:gap-2"
                    >
                      Read more
                      <span aria-hidden="true">→</span>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
