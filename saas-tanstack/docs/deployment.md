# Deployment Guide

## Overview

This guide explains how to deploy the SaaS Template to Cloudflare Workers.

## Prerequisites

1. Node.js 18+ installed
2. Cloudflare account
3. Wrangler CLI installed (`npm install -g wrangler`)
4. Turso database setup
5. Stripe account (for payments)
6. Google Cloud Console project (for OAuth)

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### 3. Setup Database

```bash
npm run db:generate
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Cloudflare Workers Deployment

### 1. Login to Cloudflare

```bash
wrangler login
```

### 2. Configure wrangler.toml

Update `wrangler.toml` with your Cloudflare account details:

```toml
name = "saas-tanstack"
main = "./dist/server/index.mjs"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[site]
bucket = "./dist/client"
```

### 3. Set Environment Variables

Set secrets using Wrangler:

```bash
wrangler secret put TURSO_DATABASE_URL
wrangler secret put TURSO_AUTH_TOKEN
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 4. Build and Deploy

```bash
npm run build:cf
npm run deploy:cf
```

## Database Setup (Turso)

### 1. Create Turso Database

```bash
turso db create saas-tanstack
```

### 2. Get Database URL

```bash
turso db show saas-tanstack --url
```

### 3. Create Auth Token

```bash
turso db tokens create saas-tanstack
```

### 4. Run Migrations

```bash
npm run db:generate
npm run db:push
```

## Stripe Setup

### 1. Get API Keys

- Go to Stripe Dashboard → Developers → API Keys
- Copy `Secret Key` and `Publishable Key`

### 2. Create Products and Prices

- Go to Stripe Dashboard → Products
- Create products for each plan
- Note the price IDs

### 3. Setup Webhooks

- Go to Stripe Dashboard → Developers → Webhooks
- Add endpoint: `https://your-domain.com/api/webhook/stripe`
- Select events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### 4. Update Environment Variables

```bash
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

## Google OAuth Setup

### 1. Create Google Cloud Project

- Go to Google Cloud Console
- Create a new project

### 2. Enable Google+ API

- Go to APIs & Services → Library
- Search for "Google+ API" and enable it

### 3. Create OAuth Credentials

- Go to APIs & Services → Credentials
- Click "Create Credentials" → "OAuth client ID"
- Application type: "Web application"
- Authorized redirect URIs:
  - `http://localhost:3000/auth/callback` (development)
  - `https://your-domain.com/auth/callback` (production)

### 4. Update Environment Variables

```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

## Custom Domain

### 1. Add Domain to Cloudflare

- Go to Cloudflare Dashboard → Workers & Pages
- Select your worker
- Go to Settings → Domains & Routes
- Add your custom domain

### 2. Update Environment Variables

Update `VITE_APP_URL` in your environment variables:

```bash
wrangler secret put VITE_APP_URL
# Enter: https://your-domain.com
```

## Monitoring

### 1. View Logs

```bash
wrangler tail
```

### 2. Check Analytics

- Go to Cloudflare Dashboard → Workers & Pages
- Select your worker
- View Analytics tab

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Clear build cache: `rm -rf dist .vinxi`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Rebuild: `npm run build:cf`

### Database Connection Issues

1. Verify `TURSO_DATABASE_URL` is correct
2. Verify `TURSO_AUTH_TOKEN` is valid
3. Check Turso dashboard for database status

### Stripe Webhook Issues

1. Verify webhook endpoint is correct
2. Check webhook signature verification
3. View Stripe webhook logs for errors

### Google OAuth Issues

1. Verify redirect URI matches exactly
2. Check Google Cloud Console for API enabled
3. Verify client ID and secret are correct

## Performance Optimization

### 1. Enable Caching

Cloudflare Workers automatically caches static assets. For dynamic content, use Cloudflare KV or D1 for caching.

### 2. Optimize Images

Use Cloudflare Images for image optimization and delivery.

### 3. Enable Compression

Cloudflare automatically compresses responses. Verify in Cloudflare Dashboard → Speed → Optimization.

## Security Best Practices

1. **Keep secrets secure:** Never commit secrets to version control
2. **Use HTTPS:** Always use HTTPS in production
3. **Regular updates:** Keep dependencies updated
4. **Monitor logs:** Regularly check for suspicious activity
5. **Backup database:** Regularly backup your Turso database

## Cost Optimization

### Cloudflare Workers

- Free tier: 100,000 requests/day
- Paid tier: $0.50 per million requests

### Turso

- Free tier: 9GB storage, 1 billion row reads
- Paid tier: Pay as you go

### Stripe

- No monthly fees
- 2.9% + 30¢ per transaction

## Support

For issues or questions:

1. Check the [documentation](./docs/)
2. Search [GitHub Issues](https://github.com/yourusername/saas-tanstack/issues)
3. Join our [Discord community](https://discord.gg/your-server)
