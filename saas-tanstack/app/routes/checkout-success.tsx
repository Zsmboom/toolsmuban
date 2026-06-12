import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/checkout-success')({
  component: CheckoutSuccessPage,
});

function CheckoutSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-md text-center px-4">
        <div className="mb-8">
          <svg
            className="mx-auto h-16 w-16 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Payment Successful!</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Thank you for your purchase. Your subscription is now active.
        </p>
        <div className="mt-8 space-y-4">
          <Link to="/dashboard">
            <button className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90">
              Go to Dashboard
            </button>
          </Link>
          <Link to="/">
            <button className="w-full rounded-md border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
