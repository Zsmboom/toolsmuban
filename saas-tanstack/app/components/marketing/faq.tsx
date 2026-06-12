import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: 'What is included in the free plan?',
      answer: 'The free plan includes 100 credits per month, access to basic features, community support, and single user access. It\'s perfect for individuals or small projects getting started.',
    },
    {
      question: 'Can I upgrade or downgrade my plan?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated amount for the remainder of your billing cycle. When downgrading, the change will take effect at the next billing cycle.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express) through Stripe, as well as payments via Creem and PayPal. All payments are securely processed and encrypted.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! All paid plans come with a 14-day free trial. You can explore all features without any commitment. No credit card required to start your trial.',
    },
    {
      question: 'What happens if I exceed my credit limit?',
      answer: 'If you exceed your monthly credit limit, you can purchase additional credits or upgrade to a higher plan. We\'ll notify you when you\'re approaching your limit so you can make an informed decision.',
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied with our service, contact our support team within 30 days of purchase for a full refund.',
    },
  ];

  return (
    <section className="bg-muted/50 py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-heading">
            Frequently Asked Questions
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Can't find the answer you're looking for? Reach out to our support team.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-card overflow-hidden transition-shadow duration-200 hover:shadow-sm"
              >
                <h3>
                  <button
                    onClick={() => toggle(index)}
                    aria-expanded={openIndex === index}
                    aria-controls={`faq-answer-${index}`}
                    className="flex w-full items-center justify-between p-5 text-left cursor-pointer hover:bg-accent/50 transition-colors duration-200"
                  >
                    <span className="text-sm font-medium text-foreground pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                        openIndex === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </h3>
                <div
                  id={`faq-answer-${index}`}
                  role="region"
                  className={`transition-all duration-300 ease-in-out ${
                    openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {openIndex === index && (
                    <div className="border-t border-border px-5 pb-5 pt-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
