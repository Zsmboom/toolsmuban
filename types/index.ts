// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  country: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
  lastLoginAt: Date | null;
}

// Subscription types
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused' | 'expired';
export type PaymentProvider = 'stripe' | 'paypal';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider: PaymentProvider | null;
  providerId: string | null;
  priceId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

// Payment types
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded' | 'canceled';

export interface Payment {
  id: string;
  userId: string;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerId: string | null;
  description: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date | null;
}

// Tool usage types
export interface ToolUsageLog {
  id: string;
  userId: string;
  toolName: string;
  action: string;
  metadata: Record<string, any> | null;
  duration: number | null;
  ipAddress: string | null;
  country: string | null;
  createdAt: Date;
}

// Analytics types
export interface CountryStats {
  id: string;
  country: string;
  userCount: number;
  toolUsageCount: number;
  lastUpdated: Date;
}

// Credits types
export interface Credits {
  id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  monthlyQuota: number;
  monthlyUsed: number;
  quotaResetAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export type CreditTransactionType = 'earn' | 'spend' | 'refund' | 'adjustment' | 'bonus' | 'monthly_quota';
export type CreditTransactionSource = 'subscription' | 'tool_usage' | 'purchase' | 'referral' | 'promotion' | 'admin' | 'system';

export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  source: CreditTransactionSource;
  sourceId: string | null;
  toolUsageLogId: string | null;
  subscriptionId: string | null;
  description: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

// User tracking types
export interface UserTracking {
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  signupIp?: string;
  signupCountry?: string;
}

// Credit statistics
export interface CreditStats {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  monthlyQuota: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  quotaResetAt: Date | null;
  hasUnlimited: boolean;
}
