import { Link } from '@tanstack/react-router';

export default function CTA() {
  return (
    <section className="py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Join thousands of developers who are already building their SaaS products with our template.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link to="/login">
              <button className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Get Started Free
              </button>
            </Link>
            <Link to="/pricing">
              <button className="text-sm font-semibold leading-6 text-foreground">
                View Pricing <span aria-hidden="true">→</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
