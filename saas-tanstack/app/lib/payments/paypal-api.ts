/**
 * PayPal 低层 API 助手。刻意不 import db —— 这样引用它的
 * *-server-fns 模块可以被客户端构建完整剥离。
 */
function isLiveMode(): boolean {
  const mode = process.env.PAYPAL_MODE;
  if (mode) return mode.toLowerCase() === 'live';
  return process.env.NODE_ENV === 'production';
}

export function paypalBaseUrl(): string {
  return isLiveMode() ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

export function paypalWebUrl(): string {
  return isLiveMode() ? 'https://www.paypal.com' : 'https://www.sandbox.paypal.com';
}

export function appUrl(): string {
  return (process.env.VITE_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured');
  }

  // Workers 上没有 Node Buffer 保证，用 btoa
  const auth = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) throw new Error('Failed to get PayPal access token');

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}
