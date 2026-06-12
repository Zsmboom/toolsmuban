import { createFileRoute } from '@tanstack/react-router';
import Navbar from '~/components/layout/navbar';
import Footer from '~/components/layout/footer';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

const sections = [
  {
    title: 'Our Mission',
    content: 'We believe that building a SaaS product should be fast, easy, and accessible to everyone. Our mission is to provide developers with the best tools and templates to launch their products quickly and efficiently.',
  },
  {
    title: 'Why We Built This',
    content: 'After years of building SaaS products, we realized that many developers spend countless hours on boilerplate code - authentication, payments, admin dashboards, and more. We wanted to change that by creating a comprehensive template that handles all the common features every SaaS needs.',
  },
  {
    title: 'Our Technology',
    content: 'We use the latest and most reliable technologies to ensure your SaaS product is fast, secure, and scalable. Our stack includes TanStack Start, React, Tailwind CSS, and Cloudflare Workers for edge deployment.',
  },
  {
    title: 'Join Us',
    content: "We're always looking for talented individuals to join our team. If you're passionate about building great products and helping developers succeed, we'd love to hear from you.",
  },
];

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-center font-heading">
              About Us
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground text-center">
              We're building the future of SaaS development
            </p>
            <div className="mt-16 space-y-12">
              {sections.map((section, i) => (
                <div key={i}>
                  <h2 className="text-2xl font-bold font-heading">{section.title}</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">{section.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
