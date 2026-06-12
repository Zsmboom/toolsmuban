import { createFileRoute } from '@tanstack/react-router';
import Navbar from '~/components/layout/navbar';
import Footer from '~/components/layout/footer';
import Hero from '~/components/marketing/hero';
import Features from '~/components/marketing/features';
import Testimonials from '~/components/marketing/testimonials';
import PricingCards from '~/components/marketing/pricing-cards';
import FAQ from '~/components/marketing/faq';
import CTA from '~/components/marketing/cta';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'SaaS Template - Build Your SaaS 10x Faster' },
      {
        name: 'description',
        content: 'A complete SaaS template with authentication, payments, admin dashboard, and everything you need to launch your SaaS business.',
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <Hero />
        <Features />
        <Testimonials />
        <PricingCards />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
