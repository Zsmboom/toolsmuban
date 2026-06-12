import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/checkout-cancel')({
  component: CheckoutCancelPage,
});

function CheckoutCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-md text-center px-4">
        <div className="mb-8">
          <svg
            className="mx-auto h-16 w-16 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Payment Cancelled</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your payment was cancelled. No charges were made.
        </p>
        <div className="mt-8 space-y-4">
          <Link to="/pricing">
            <button className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90">
              View Plans
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
