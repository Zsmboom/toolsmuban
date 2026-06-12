import { createFileRoute } from '@tanstack/react-router';
import Navbar from '~/components/layout/navbar';
import Footer from '~/components/layout/footer';
import PricingCards from '~/components/marketing/pricing-cards';
import FAQ from '~/components/marketing/faq';

export const Route = createFileRoute('/pricing')({
  head: () => ({
    meta: [
      { title: 'Pricing - SaaS Template' },
      {
        name: 'description',
        content: 'Choose the plan that\'s right for your business. All plans include a 14-day free trial.',
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-heading">
                Simple, Transparent Pricing
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Choose the plan that's right for your business. All plans include a 14-day free trial.
              </p>
            </div>
          </div>
        </section>
        <PricingCards />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
