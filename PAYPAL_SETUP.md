# PayPal Integration Guide

This guide will help you set up PayPal payments for your SaaS application.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [PayPal Account Setup](#paypal-account-setup)
3. [Environment Configuration](#environment-configuration)
4. [Testing the Integration](#testing-the-integration)
5. [Going Live](#going-live)
6. [Webhook Configuration](#webhook-configuration)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- PayPal Business account (Sandbox for testing)
- Node.js and npm/yarn/pnpm installed
- Database configured (SQLite/PostgreSQL/MySQL)

## PayPal Account Setup

### 1. Create a PayPal Developer Account

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Log in or create a new account
3. Navigate to **Dashboard**

### 2. Create a Sandbox App

1. Go to **Apps & Credentials**
2. Select **Sandbox** tab
3. Click **Create App**
4. Enter your app name (e.g., "My SaaS App - Sandbox")
5. Click **Create App**
6. You'll see your **Client ID** and **Secret** - save these for later

### 3. Create Sandbox Test Accounts

1. Go to **Sandbox > Accounts**
2. Click **Create Account**
3. Create two accounts:
   - **Business Account** (merchant - receives payments)
   - **Personal Account** (buyer - makes payments)
4. Note the login credentials for testing

## Environment Configuration

### 1. Copy Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### 2. Configure PayPal Variables

Update the following in your `.env.local` file:

```bash
# PayPal Sandbox Credentials
NEXT_PUBLIC_PAYPAL_CLIENT_ID="your-sandbox-client-id"
PAYPAL_CLIENT_SECRET="your-sandbox-secret"
NEXT_PUBLIC_PAYPAL_MODE="sandbox"

# PayPal Plan IDs (for now, use placeholder values)
NEXT_PUBLIC_PAYPAL_PLAN_BASIC="basic"
NEXT_PUBLIC_PAYPAL_PLAN_PRO="pro"
NEXT_PUBLIC_PAYPAL_PLAN_ENTERPRISE="enterprise"

# PayPal Webhook ID (optional for development)
PAYPAL_WEBHOOK_ID=""

# Your app URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Plan IDs Explained

The current implementation uses **one-time payments** rather than recurring subscriptions. The plan IDs are simple identifiers:

- `basic` → $29.00
- `pro` → $99.00
- `enterprise` → $299.00

These are mapped in `/lib/payments/paypal.ts` in the `getPriceForPlan()` function.

#### If you want to use PayPal Subscriptions:

1. Go to PayPal Dashboard > **Products & Services**
2. Create subscription plans for each tier
3. Get the Plan IDs (format: `P-XXXXXXXXXXXXX`)
4. Update the environment variables with actual Plan IDs
5. Modify the integration to use PayPal Subscriptions API instead of Orders API

## Testing the Integration

### 1. Start Your Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### 2. Test the Payment Flow

1. Navigate to `http://localhost:3000/pricing`
2. Click **Get Started** or log in if you have an account
3. After logging in, you'll see **Stripe** and **PayPal** tabs
4. Click the **PayPal** tab
5. Click **Pay with PayPal**
6. You'll be redirected to PayPal's sandbox login
7. Use your **sandbox personal account** credentials
8. Complete the payment
9. You should be redirected back to `/dashboard?success=subscription_created`

### 3. Verify Payment in Database

Check your database to ensure:
- A new record in the `payments` table
- A new/updated record in the `subscriptions` table
- The subscription status is `active`

### 4. Test Sandbox Accounts

**Sandbox Personal Account:**
- Email: Usually in format `personal-facilitator@example.com`
- Password: Check PayPal Developer Dashboard > Sandbox > Accounts

**Sandbox Business Account:**
- Email: Usually in format `business-facilitator@example.com`
- You can log in to see received payments

## Going Live

### 1. Create a Live App

1. Go to PayPal Developer Dashboard
2. Click **Apps & Credentials**
3. Select **Live** tab
4. Click **Create App**
5. Enter your app name
6. Get your **Live Client ID** and **Secret**

### 2. Update Environment Variables

Update your production environment variables:

```bash
NEXT_PUBLIC_PAYPAL_CLIENT_ID="your-live-client-id"
PAYPAL_CLIENT_SECRET="your-live-secret"
NEXT_PUBLIC_PAYPAL_MODE="live"
```

### 3. Update Plan IDs

If using subscription plans, create live subscription plans and update the Plan IDs.

### 4. Deploy Your Application

Deploy to your hosting provider (Vercel, Netlify, etc.) with the updated environment variables.

## Webhook Configuration

Webhooks allow PayPal to notify your application about events like successful payments, refunds, subscription cancellations, etc.

### 1. Create a Webhook Endpoint

Your webhook endpoint is already created at:
```
https://yourdomain.com/api/paypal/webhooks
```

### 2. Register Webhook in PayPal Dashboard

1. Go to PayPal Developer Dashboard
2. Select your app
3. Scroll down to **Webhooks**
4. Click **Add Webhook**
5. Enter your webhook URL:
   - Development: Use [ngrok](https://ngrok.com/) to expose localhost
   - Production: `https://yourdomain.com/api/paypal/webhooks`
6. Select events to subscribe to:
   - `PAYMENT.SALE.COMPLETED`
   - `PAYMENT.SALE.REFUNDED`
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.UPDATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
7. Click **Save**
8. Copy the **Webhook ID** and add it to your environment:
   ```bash
   PAYPAL_WEBHOOK_ID="your-webhook-id"
   ```

### 3. Test Webhooks (Development)

#### Using ngrok:

1. Install ngrok: `npm install -g ngrok`
2. Start your dev server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Update PayPal webhook URL to: `https://abc123.ngrok.io/api/paypal/webhooks`
6. Make a test payment
7. Check your terminal logs for webhook events

#### Using PayPal Webhook Simulator:

1. Go to PayPal Developer Dashboard
2. Navigate to **Webhooks** section
3. Click on your webhook
4. Click **Simulate webhook event**
5. Select an event type (e.g., `PAYMENT.SALE.COMPLETED`)
6. Click **Send**
7. Check your application logs

## Troubleshooting

### Error: "Unauthorized" when creating order

**Solution:** Check that your PayPal Client ID and Secret are correct in `.env.local`.

### Error: "Missing token" after payment

**Solution:** Ensure `NEXT_PUBLIC_APP_URL` is set correctly and matches your development/production URL.

### Payment completed but subscription not created

**Possible causes:**
1. Check database connection
2. Check server logs for errors
3. Verify user ID is being passed correctly
4. Check that `custom_id` or `reference_id` contains the user ID

### Webhook signature verification failing

**Solution:**
- In development, signature verification is disabled
- In production, ensure `PAYPAL_WEBHOOK_ID` is set
- Implement proper signature verification using PayPal SDK

### PayPal button not showing

**Possible causes:**
1. User not logged in (button only shows for authenticated users)
2. Missing environment variables
3. Check browser console for errors

### Different amounts in test vs production

**Solution:** Update the `getPriceForPlan()` function in `/lib/payments/paypal.ts` to match your pricing.

## Additional Resources

- [PayPal Orders API Documentation](https://developer.paypal.com/docs/api/orders/v2/)
- [PayPal Subscriptions API Documentation](https://developer.paypal.com/docs/api/subscriptions/v1/)
- [PayPal Webhooks Documentation](https://developer.paypal.com/api/rest/webhooks/)
- [PayPal Sandbox Testing Guide](https://developer.paypal.com/docs/api-basics/sandbox/)

## Support

For issues specific to this integration:
- Check the server logs for detailed error messages
- Review the PayPal Developer Dashboard for transaction details
- Consult PayPal's developer forums for API-specific issues

---

**Note:** This integration currently uses PayPal Orders API for one-time payments. If you need recurring subscriptions, consider switching to PayPal Subscriptions API for better subscription management features like automatic billing, trial periods, and subscription upgrades/downgrades.
