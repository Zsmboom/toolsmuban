import { pgTable, text, integer, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// Users Table
// ============================================
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  name: text('name'),
  image: text('image'),
  country: text('country'),
  role: text('role', { enum: ['user', 'admin'] }).default('user').notNull(),

  // User tracking fields
  referrer: text('referrer'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmTerm: text('utm_term'),
  utmContent: text('utm_content'),
  signupIp: text('signup_ip'),
  signupCountry: text('signup_country'),
  lastLoginIp: text('last_login_ip'),
  lastLoginCountry: text('last_login_country'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
  lastLoginAt: timestamp('last_login_at'),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
  countryIdx: index('country_idx').on(table.country),
  roleIdx: index('role_idx').on(table.role),
  utmSourceIdx: index('utm_source_idx').on(table.utmSource),
  signupCountryIdx: index('signup_country_idx').on(table.signupCountry),
}));

// ============================================
// Accounts Table (OAuth)
// ============================================
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  userIdIdx: index('account_user_id_idx').on(table.userId),
}));

// ============================================
// Sessions Table
// ============================================
export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  userIdIdx: index('session_user_id_idx').on(table.userId),
}));

// ============================================
// Verification Tokens Table
// ============================================
export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  tokenIdx: index('token_idx').on(table.token),
}));

// ============================================
// Subscriptions Table
// ============================================
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  plan: text('plan', { enum: ['free', 'basic', 'pro', 'enterprise'] }).default('free').notNull(),
  status: text('status', {
    enum: ['active', 'canceled', 'past_due', 'trialing', 'paused', 'expired']
  }).default('active').notNull(),
  provider: text('provider', { enum: ['stripe', 'paypal', 'creem'] }),
  providerId: text('provider_id'),
  customerId: text('customer_id'),
  priceId: text('price_id'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  canceledAt: timestamp('canceled_at'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),

  // Subscription source tracking
  source: text('source'),
  referrer: text('referrer'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
}, (table) => ({
  userIdIdx: index('subscription_user_id_idx').on(table.userId),
  statusIdx: index('subscription_status_idx').on(table.status),
  providerIdx: index('subscription_provider_idx').on(table.provider),
  sourceIdx: index('subscription_source_idx').on(table.source),
  utmSourceIdx: index('subscription_utm_source_idx').on(table.utmSource),
}));

// ============================================
// Payments Table
// ============================================
export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: text('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
  amount: integer('amount').notNull(),
  currency: text('currency').default('usd').notNull(),
  status: text('status', {
    enum: ['pending', 'succeeded', 'failed', 'refunded', 'canceled']
  }).default('pending').notNull(),
  provider: text('provider', { enum: ['stripe', 'paypal', 'creem'] }).notNull(),
  providerId: text('provider_id'),
  description: text('description'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
}, (table) => ({
  userIdIdx: index('payment_user_id_idx').on(table.userId),
  statusIdx: index('payment_status_idx').on(table.status),
  providerIdx: index('payment_provider_idx').on(table.provider),
  createdAtIdx: index('payment_created_at_idx').on(table.createdAt),
}));

// ============================================
// Tool Usage Logs Table
// ============================================
export const toolUsageLogs = pgTable('tool_usage_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  toolName: text('tool_name').notNull(),
  action: text('action').notNull(),
  metadata: jsonb('metadata'),
  duration: integer('duration'),
  ipAddress: text('ip_address'),
  country: text('country'),

  // Credit consumption tracking
  creditsUsed: integer('credits_used').default(0).notNull(),
  creditTransactionId: text('credit_transaction_id'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('log_user_id_idx').on(table.userId),
  toolNameIdx: index('log_tool_name_idx').on(table.toolName),
  createdAtIdx: index('log_created_at_idx').on(table.createdAt),
  countryIdx: index('log_country_idx').on(table.country),
  creditTxIdx: index('log_credit_tx_idx').on(table.creditTransactionId),
}));

// ============================================
// Country Stats Table
// ============================================
export const countryStats = pgTable('country_stats', {
  id: text('id').primaryKey(),
  country: text('country').notNull().unique(),
  userCount: integer('user_count').default(0).notNull(),
  toolUsageCount: integer('tool_usage_count').default(0).notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  countryIdx: index('country_stats_country_idx').on(table.country),
}));

// ============================================
// Credits Table (User Credit Accounts)
// ============================================
export const credits = pgTable('credits', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),

  // Credit balance
  balance: integer('balance').default(0).notNull(),
  totalEarned: integer('total_earned').default(0).notNull(),
  totalSpent: integer('total_spent').default(0).notNull(),

  // Monthly quota management
  monthlyQuota: integer('monthly_quota').default(0).notNull(),
  monthlyUsed: integer('monthly_used').default(0).notNull(),
  quotaResetAt: timestamp('quota_reset_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
}, (table) => ({
  userIdIdx: index('credit_user_id_idx').on(table.userId),
}));

// ============================================
// Credit Transactions Table
// ============================================
export const creditTransactions = pgTable('credit_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Transaction type and amount
  type: text('type', {
    enum: ['earn', 'spend', 'refund', 'adjustment', 'bonus', 'monthly_quota']
  }).notNull(),
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),

  // Related information
  source: text('source', {
    enum: ['subscription', 'tool_usage', 'purchase', 'referral', 'promotion', 'admin', 'system']
  }).notNull(),
  sourceId: text('source_id'),
  toolUsageLogId: text('tool_usage_log_id').references(() => toolUsageLogs.id, { onDelete: 'set null' }),
  subscriptionId: text('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),

  // Description and metadata
  description: text('description'),
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('credit_tx_user_id_idx').on(table.userId),
  typeIdx: index('credit_tx_type_idx').on(table.type),
  sourceIdx: index('credit_tx_source_idx').on(table.source),
  createdAtIdx: index('credit_tx_created_at_idx').on(table.createdAt),
  toolUsageLogIdIdx: index('credit_tx_tool_log_idx').on(table.toolUsageLogId),
}));

// ============================================
// Relations
// ============================================
export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  subscriptions: many(subscriptions),
  payments: many(payments),
  toolUsageLogs: many(toolUsageLogs),
  credits: one(credits),
  creditTransactions: many(creditTransactions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  payments: many(payments),
  creditTransactions: many(creditTransactions),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const toolUsageLogsRelations = relations(toolUsageLogs, ({ one }) => ({
  user: one(users, {
    fields: [toolUsageLogs.userId],
    references: [users.id],
  }),
  creditTransaction: one(creditTransactions, {
    fields: [toolUsageLogs.creditTransactionId],
    references: [creditTransactions.id],
  }),
}));

export const creditsRelations = relations(credits, ({ one }) => ({
  user: one(users, {
    fields: [credits.userId],
    references: [users.id],
  }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
  toolUsageLog: one(toolUsageLogs, {
    fields: [creditTransactions.toolUsageLogId],
    references: [toolUsageLogs.id],
  }),
  subscription: one(subscriptions, {
    fields: [creditTransactions.subscriptionId],
    references: [subscriptions.id],
  }),
}));
