# SaaS Template - TanStack Start

A modern SaaS template built with TanStack Start, React, and Tailwind CSS. Deploy to Cloudflare Workers for edge computing.

## Features

- 🔐 Authentication with Google OAuth
- 💳 Dual payment gateways (Stripe + PayPal)
- 📊 Admin dashboard with analytics
- 🌍 Internationalization (English + Chinese)
- 📱 Fully responsive design
- ⚡ Edge deployment with Cloudflare Workers
- 🎨 Beautiful UI with Tailwind CSS

## Tech Stack

- **Framework:** TanStack Start + TanStack Router
- **UI:** React 19 + Tailwind CSS v4
- **Database:** Turso (LibSQL) + Drizzle ORM
- **Payments:** Stripe + PayPal
- **Deployment:** Cloudflare Workers

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/saas-tanstack.git
cd saas-tanstack
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. Run database migrations:
```bash
npm run db:generate
npm run db:push
```

5. Start development server:
```bash
npm run dev
```

6. Open http://localhost:3000 in your browser.

## Deployment

### Cloudflare Workers

1. Install Wrangler:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Deploy:
```bash
npm run build:cf
npm run deploy:cf
```

## Project Structure

```
saas-tanstack/
├── app/
│   ├── routes/           # Route files
│   ├── components/       # UI components
│   ├── lib/              # Business logic
│   │   ├── auth/        # Authentication
│   │   ├── db/          # Database
│   │   └── payments/    # Payments
│   ├── messages/         # Translations
│   └── styles/           # Global styles
├── docs/                 # Documentation
├── tests/                # Tests
├── app.config.ts         # TanStack Start configuration
├── vite.config.ts        # Vite configuration
├── wrangler.toml         # Cloudflare configuration
└── package.json
```

## Documentation

- [Architecture](./docs/architecture.md)
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)

## External Resources

- [TanStack Start Documentation](https://tanstack.com/start/latest)
- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Turso Documentation](https://docs.turso.tech/)

## License

MIT License - see LICENSE for details.
