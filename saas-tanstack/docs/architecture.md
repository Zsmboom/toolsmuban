# Architecture Documentation

## Overview

This document describes the architecture of the SaaS Template built with TanStack Start.

## Technology Stack

- **Framework:** TanStack Start + TanStack Router
- **UI:** React 19 + Tailwind CSS v4
- **Database:** Turso (LibSQL) + Drizzle ORM
- **Payments:** Stripe + PayPal
- **Deployment:** Cloudflare Workers

## Architecture Patterns

### Server Functions

TanStack Start uses `createServerFn` for server-side logic instead of traditional API routes. This provides:

- Type-safe RPC between client and server
- Automatic serialization/deserialization
- Built-in error handling

**Example:**
```typescript
import { createServerFn } from '@tanstack/react-start';

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(async () => {
  // Server-side logic here
  return { user: null };
});
```

### Authentication Flow

1. User clicks "Continue with Google"
2. Client calls `googleLoginRedirectFn` server function
3. Server constructs Google OAuth URL and returns it
4. Client redirects to Google consent screen
5. Google redirects back to `/auth/callback` with authorization code
6. Client calls `googleCallbackFn` with the code
7. Server exchanges code for tokens, creates/updates user, creates session
8. Server returns session token
9. Client stores session token in cookie
10. Client redirects to dashboard

### Payment Flow

1. User selects a plan on pricing page
2. Client calls `createCheckoutSessionFn` with price ID
3. Server creates Stripe Checkout Session
4. Server returns checkout URL
5. Client redirects to Stripe Checkout
6. User completes payment
7. Stripe sends webhook to `/api/webhook/stripe`
8. Server verifies webhook signature
9. Server updates database (subscriptions, payments, credits)
10. User is redirected to success page

### Database Schema

The database uses the following tables:

- **users** - User accounts
- **sessions** - Authentication sessions
- **accounts** - OAuth accounts
- **subscriptions** - User subscriptions
- **payments** - Payment records
- **credits** - User credit balances
- **credit_transactions** - Credit transaction history
- **tool_usage_logs** - Tool usage tracking
- **country_stats** - Country statistics

### File Structure

```
app/
├── components/          # UI components
├── lib/                 # Business logic
│   ├── auth/           # Authentication
│   ├── db/             # Database
│   ├── payments/       # Payments
│   └── utils.ts        # Utilities
├── routes/             # Route files
└── styles/             # Global styles
```

## Deployment Architecture

### Cloudflare Workers

The application is deployed to Cloudflare Workers for:

- Edge computing
- Global distribution
- Low latency
- Automatic scaling

### Configuration

- `app.config.ts` - TanStack Start configuration with Cloudflare Workers preset
- `wrangler.toml` - Cloudflare Workers configuration
- `vite.config.ts` - Vite configuration for build

## Security Considerations

### Authentication

- Session tokens are stored in HTTP-only cookies
- Sessions expire after 30 days
- CSRF protection via TanStack Start middleware

### Payments

- Webhook signature verification
- Secure storage of API keys
- PCI compliance via Stripe Checkout

### Data Protection

- Input validation with Zod
- SQL injection prevention via Drizzle ORM
- XSS prevention via React

## Performance Optimization

### Code Splitting

TanStack Start automatically code-splits routes for faster loading.

### Data Loading

Routes use `loader` functions for server-side data fetching, reducing client-side JavaScript.

### Caching

- Static assets are cached at the edge
- Database queries are optimized with proper indexing
- Client-side caching with TanStack Query (planned)

## Monitoring and Logging

### Error Tracking

- Error boundaries catch React errors
- Server errors are logged to console
- Production error tracking (planned: Sentry)

### Performance Monitoring

- Core Web Vitals tracking (planned)
- Server response time monitoring (planned)
- Database query performance (planned)
