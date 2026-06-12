import { createRootRoute, Outlet, HeadContent } from '@tanstack/react-router';
import { AuthProvider } from '~/lib/auth/context';
import '~/styles/globals.css';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body className="min-h-screen bg-background font-sans antialiased">
          <Outlet />
        </body>
      </html>
    </AuthProvider>
  );
}
