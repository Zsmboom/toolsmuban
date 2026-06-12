# SaaS Template - Complete Next.js 15 Starter

A production-ready SaaS starter template built with Next.js 15, TypeScript, Tailwind CSS, and modern best practices.

## 🚀 Features

- ✅ **Next.js 15** with App Router and Server Components
- ✅ **TypeScript** for type safety
- ✅ **Tailwind CSS** + **Shadcn UI** for beautiful, accessible components
- ✅ **NextAuth.js v5** with Google OAuth
- ✅ **Turso (LibSQL)** database with **Drizzle ORM**
- ✅ **Stripe** + **PayPal** payment integration (ready to implement)
- ✅ **Admin Dashboard** with analytics
- ✅ **User Dashboard** with subscription management
- ✅ **Responsive Design** - Mobile, tablet, and desktop
- ✅ **Framer Motion** animations
- ✅ **Role-based Access Control**
- ✅ **SEO Optimized**

## 📦 Tech Stack

### Frontend
- **Framework**: Next.js 15.1.6
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **Components**: Shadcn UI (Radix UI)
- **Animation**: Framer Motion 12.34
- **Icons**: Lucide React

### Backend
- **Database**: Turso (LibSQL)
- **ORM**: Drizzle ORM 0.45
- **Authentication**: NextAuth.js 5.0.0-beta.30
- **Payments**: Stripe + PayPal (SDK ready)

### DevOps
- **Deployment**: Vercel (recommended)
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript

## 🏗️ Project Structure

```
saas-template/
├── app/
│   ├── (auth)/
│   │   ├── login/              # Login page
│   │   └── layout.tsx
│   ├── (marketing)/
│   │   ├── page.tsx            # Landing page
│   │   ├── about/              # About page
│   │   ├── pricing/            # Pricing page
│   │   ├── terms/              # Terms of Service
│   │   ├── privacy/            # Privacy Policy
│   │   └── layout.tsx
│   ├── dashboard/              # User dashboard (TODO)
│   ├── admin/                  # Admin panel (TODO)
│   ├── api/
│   │   └── auth/[...nextauth]/ # NextAuth API
│   ├── layout.tsx
│   ├── globals.css
│   └── not-found.tsx
├── components/
│   ├── ui/                     # Shadcn UI components (16 components)
│   ├── layout/
│   │   ├── navbar.tsx          # Main navigation
│   │   └── footer.tsx          # Footer
│   └── marketing/
│       ├── hero.tsx
│       ├── features.tsx
│       ├── testimonials.tsx
│       ├── pricing-cards.tsx
│       ├── faq.tsx
│       └── cta.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts            # Database client
│   │   ├── schema.ts           # Complete database schema
│   │   └── queries.ts          # Database queries
│   ├── auth/
│   │   └── config.ts           # NextAuth configuration
│   └── utils.ts
├── hooks/
│   └── use-toast.ts
├── types/
│   └── index.ts                # TypeScript types
├── middleware.ts               # Route protection
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
# Clone the repository
cd saas-template

# Install dependencies
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
- `TURSO_DATABASE_URL` - Your Turso database URL
- `TURSO_AUTH_TOKEN` - Your Turso auth token
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret

### 3. Database Setup

```bash
# Generate migration
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Drizzle Studio
npm run db:studio
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Schema

Complete schema with:
- **Users** - User accounts with roles
- **Accounts** - OAuth provider data
- **Sessions** - Session management
- **Subscriptions** - Subscription plans and status
- **Payments** - Payment records
- **Tool Usage Logs** - Usage tracking
- **Country Stats** - Analytics by country

All tables include proper indexes and relations.

## 🎨 Components

### Shadcn UI Components Installed
- Button, Card, Input, Label
- Tabs, Dialog, Dropdown Menu
- Avatar, Badge, Skeleton
- Toast/Toaster, Select, Table
- Accordion

### Marketing Components
- Hero with animated CTAs
- Features grid (8 features)
- Testimonials carousel
- Pricing cards (3 tiers)
- FAQ accordion
- CTA section

### Layout Components
- Responsive Navbar (desktop + mobile menu)
- Footer (4-column layout)

## 🔐 Authentication

- **Provider**: Google OAuth (easily extensible)
- **Session Strategy**: Database sessions
- **Middleware**: Route protection for `/dashboard` and `/admin`
- **Roles**: `user` and `admin`

## 🚧 TODO - Remaining Phases

### Phase 4: Payment Integration
- [ ] Stripe checkout implementation
- [ ] Stripe webhooks
- [ ] PayPal integration
- [ ] Subscription sync logic

### Phase 5: User Dashboard
- [ ] Dashboard layout with sidebar
- [ ] Stats cards
- [ ] Tools page
- [ ] Usage history
- [ ] Settings page

### Phase 6: Admin Panel
- [ ] Admin layout
- [ ] Users management
- [ ] Subscriptions management
- [ ] Country analytics
- [ ] Usage logs
- [ ] Revenue dashboard

### Phase 7: Testing & Optimization
- [ ] Performance optimization
- [ ] SEO improvements
- [ ] Responsive testing
- [ ] Security audit

### Phase 8: Deployment
- [ ] Vercel configuration
- [ ] Production environment setup
- [ ] Domain configuration

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

The template is optimized for Vercel with:
- Edge middleware
- Image optimization
- Automatic caching
- Fast refresh

## 🔑 Environment Variables Reference

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="SaaS Template"

# Database
TURSO_DATABASE_URL=libsql://[your-database].turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Payments (when implementing Phase 4)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email support@example.com or open an issue.

---

**Built with ❤️ using Next.js 15, TypeScript, and Tailwind CSS**
