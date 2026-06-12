/**
 * Creem Payment Integration
 *
 * Creem is a Merchant of Record (MoR) for SaaS and digital businesses.
 * API Reference: https://docs.creem.io/api-reference
 *
 * Architecture follows the same pattern as Stripe (lib/payments/stripe.ts)
 * for consistency across payment providers.
 */

// Types for Creem API interactions
export interface CreemCheckoutParams {
  productId: string;
  userEmail: string;
  userId: string;
  successUrl: string;
  cancelUrl?: string;
  discountCode?: string;
  requestId?: string;
}

export interface CreemCheckoutResult {
  url: string;
  checkoutId: string;
}

export interface CreemBillingPortalParams {
  customerId: string;
  returnUrl: string;
}

export interface CreemBillingPortalResult {
  url: string;
}

// Creem API base URL — auto-detect test mode from API key prefix
function getApiBaseUrl(): string {
  const apiKey = process.env.CREEM_API_KEY || '';
  if (apiKey.startsWith('creem_test_')) {
    return 'https://test-api.creem.io/v1';
  }
  return 'https://api.creem.io/v1';
}

function getApiKey(): string {
  const key = process.env.CREEM_API_KEY;
  if (!key) {
    throw new Error('CREEM_API_KEY is not defined');
  }
  return key;
}

async function creemFetch(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'DELETE';
    body?: Record<string, unknown>;
  } = {}
): Promise<any> {
  const baseUrl = getApiBaseUrl();
  const apiKey = getApiKey();

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    ...(options.body && { body: JSON.stringify(options.body) }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    console.error(`Creem API error [${endpoint}]:`, error);
    throw new Error(error.message || `Creem API error: ${response.status}`);
  }

  return response.json();
}

// ============================================
// Checkout Sessions
// ============================================

/**
 * Generate a unique request ID for idempotency
 * Creem checkout allows a `request_id` for idempotent requests
 */
function generateRequestId(userId: string, productId: string): string {
  return `checkout_${userId}_${productId}_${Date.now()}`;
}

/**
 * Create a Creem checkout session
 * POST /v1/checkouts
 */
export async function createCreemCheckout(
  params: CreemCheckoutParams
): Promise<CreemCheckoutResult> {
  const requestId = generateRequestId(params.userId, params.productId);

  const body: Record<string, unknown> = {
    product_id: params.productId,
    request_id: requestId,
    success_url: params.successUrl,
    metadata: {
      userId: params.userId,
    },
    customer: {
      email: params.userEmail,
    },
  };

  if (params.cancelUrl) {
    body.cancel_url = params.cancelUrl;
  }

  if (params.discountCode) {
    body.discount_code = params.discountCode;
  }

  const result = await creemFetch('/checkouts', {
    method: 'POST',
    body,
  });

  return {
    url: result.checkout_url,
    checkoutId: result.id || requestId,
  };
}

// ============================================
// Customer Billing Portal
// ============================================

/**
 * Create a customer billing portal session
 * POST /v1/customers/billing
 */
export async function createCreemBillingPortal(
  params: CreemBillingPortalParams
): Promise<CreemBillingPortalResult> {
  const result = await creemFetch('/customers/billing', {
    method: 'POST',
    body: {
      customer_id: params.customerId,
    },
  });

  return {
    url: result.portal_url || result.url,
  };
}

// ============================================
// Subscriptions
// ============================================

/**
 * Get subscription details
 * GET /v1/subscriptions?subscription_id=xxx
 */
export async function getCreemSubscription(subscriptionId: string): Promise<any> {
  return creemFetch(`/subscriptions?subscription_id=${subscriptionId}`);
}

/**
 * Cancel subscription at period end (preferred)
 * POST /v1/subscriptions/{id}/cancel
 */
export async function cancelCreemSubscription(subscriptionId: string, mode: 'scheduled' | 'immediate' = 'scheduled'): Promise<any> {
  return creemFetch(`/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    body: {
      mode,
    },
  });
}

/**
 * Pause subscription
 * POST /v1/subscriptions/{id}/pause
 */
export async function pauseCreemSubscription(subscriptionId: string): Promise<any> {
  return creemFetch(`/subscriptions/${subscriptionId}/pause`, {
    method: 'POST',
  });
}

/**
 * Resume subscription
 * POST /v1/subscriptions/{id}/resume
 */
export async function resumeCreemSubscription(subscriptionId: string): Promise<any> {
  return creemFetch(`/subscriptions/${subscriptionId}/resume`, {
    method: 'POST',
  });
}

/**
 * Update subscription (e.g., plan upgrade/downgrade)
 * POST /v1/subscriptions/{id}
 */
export async function updateCreemSubscription(
  subscriptionId: string,
  newProductId: string
): Promise<any> {
  return creemFetch(`/subscriptions/${subscriptionId}`, {
    method: 'POST',
    body: {
      product_id: newProductId,
    },
  });
}

// ============================================
// Plan Mapping
// ============================================

/**
 * Map Creem product ID to plan name
 */
export function getPlanFromCreemProductId(
  productId: string
): 'basic' | 'pro' | 'enterprise' | 'free' {
  if (productId === process.env.NEXT_PUBLIC_CREEM_PRODUCT_BASIC) return 'basic';
  if (productId === process.env.NEXT_PUBLIC_CREEM_PRODUCT_PRO) return 'pro';
  if (productId === process.env.NEXT_PUBLIC_CREEM_PRODUCT_ENTERPRISE) return 'enterprise';
  return 'free';
}

/**
 * Map plan name to Creem product ID
 */
export function getCreemProductIdFromPlan(plan: string): string {
  switch (plan) {
    case 'basic':
      return process.env.NEXT_PUBLIC_CREEM_PRODUCT_BASIC || '';
    case 'pro':
      return process.env.NEXT_PUBLIC_CREEM_PRODUCT_PRO || '';
    case 'enterprise':
      return process.env.NEXT_PUBLIC_CREEM_PRODUCT_ENTERPRISE || '';
    default:
      return '';
  }
}
