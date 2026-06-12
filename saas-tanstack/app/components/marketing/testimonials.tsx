export default function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Founder, TechStart',
      content: 'This template saved us months of development time. The code quality is exceptional and the documentation is comprehensive.',
      avatar: '👩‍💻',
    },
    {
      name: 'Michael Chen',
      role: 'CTO, DataFlow',
      content: 'The built-in payment integration with Stripe and PayPal made monetization incredibly easy. Highly recommended!',
      avatar: '👨‍💼',
    },
    {
      name: 'Emily Davis',
      role: 'Product Manager, GrowthLab',
      content: 'The admin dashboard and analytics features are exactly what we needed. It helped us understand our users better.',
      avatar: '👩‍🔬',
    },
  ];

  return (
    <section className="bg-muted/50 py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by Developers
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            See what our customers have to say about their experience.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="relative rounded-lg border bg-background p-6 shadow-sm"
              >
                <div className="mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{testimonial.avatar}</div>
                    <div>
                      <h4 className="text-sm font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="mt-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-4 w-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
