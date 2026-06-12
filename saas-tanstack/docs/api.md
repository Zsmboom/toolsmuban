# API Documentation

## Server Functions

This document describes all server functions available in the application.

## Authentication Server Functions

### `getCurrentUserFn`

**Method:** GET

**Description:** Gets the current authenticated user from the session cookie.

**Parameters:** None

**Returns:**
- `User | null` - The authenticated user or null

**Example:**
```typescript
import { getCurrentUserFn } from '~/lib/auth/server-fns';

const user = await getCurrentUserFn();
```

---

### `logoutFn`

**Method:** POST

**Description:** Logs out the current user by deleting their session.

**Parameters:** None

**Returns:**
- `{ success: boolean, error?: string }` - Success status

**Example:**
```typescript
import { logoutFn } from '~/lib/auth/server-fns';

const result = await logoutFn();
```

---

### `googleLoginRedirectFn`

**Method:** GET

**Description:** Generates the Google OAuth authorization URL.

**Parameters:** None

**Returns:**
- `{ url: string }` - The Google OAuth authorization URL

**Example:**
```typescript
import { googleLoginRedirectFn } from '~/lib/auth/server-fns';

const { url } = await googleLoginRedirectFn();
window.location.href = url;
```

---

### `googleCallbackFn`

**Method:** POST

**Description:** Handles the Google OAuth callback by exchanging the authorization code for tokens.

**Parameters:**
- `code: string` - The authorization code from Google

**Returns:**
- `{ sessionToken: string, user: User }` - The session token and user

**Example:**
```typescript
import { googleCallbackFn } from '~/lib/auth/server-fns';

const result = await googleCallbackFn({ data: { code: 'authorization_code' } });
```

---

## Payment Server Functions

### `createCheckoutSessionFn`

**Method:** POST

**Description:** Creates a Stripe Checkout Session for subscription payment.

**Parameters:**
- `priceId: string` - The Stripe price ID

**Returns:**
- `{ sessionId: string, url: string }` - The session ID and checkout URL

**Example:**
```typescript
import { createCheckoutSessionFn } from '~/lib/payments/stripe-server-fns';

const { url } = await createCheckoutSessionFn({ data: { priceId: 'price_xxx' } });
window.location.href = url;
```

---

### `createPortalSessionFn`

**Method:** POST

**Description:** Creates a Stripe billing portal session for managing subscriptions.

**Parameters:** None

**Returns:**
- `{ url: string }` - The billing portal URL

**Example:**
```typescript
import { createPortalSessionFn } from '~/lib/payments/stripe-server-fns';

const { url } = await createPortalSessionFn();
window.location.href = url;
```

---

### `handleWebhookFn`

**Method:** POST

**Description:** Handles Stripe webhook events.

**Parameters:**
- `payload: string` - The raw webhook payload
- `signature: string` - The Stripe signature header

**Returns:**
- `{ received: boolean }` - Confirmation of webhook processing

**Example:**
```typescript
import { handleWebhookFn } from '~/lib/payments/stripe-server-fns';

// This is typically called from the webhook route
await handleWebhookFn({ 
  data: { 
    payload: rawBody, 
    signature: stripeSignature 
  } 
});
```

---

## Webhook Routes

### Stripe Webhook

**Endpoint:** `/api/webhook/stripe`

**Method:** POST

**Description:** Receives and processes Stripe webhook events.

**Headers:**
- `stripe-signature` - The Stripe signature for verification

**Events Handled:**
- `checkout.session.completed` - Creates subscription and updates credits
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Marks subscription as canceled

**Example:**
```bash
curl -X POST http://localhost:3000/api/webhook/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: whsec_xxx" \
  -d '{"type": "checkout.session.completed", ...}'
```

---

## Error Handling

All server functions throw errors that can be caught on the client:

```typescript
try {
  const result = await someServerFn();
} catch (error) {
  console.error('Server function error:', error);
  // Handle error
}
```

## Rate Limiting

Rate limiting is implemented at the Cloudflare Workers level for production deployments.

## Authentication

Most server functions require authentication. If a user is not authenticated, the function will throw an error.

## Environment Variables

Server functions access environment variables via `process.env`:

- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `TURSO_DATABASE_URL` - Turso database URL
- `TURSO_AUTH_TOKEN` - Turso auth token
