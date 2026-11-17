import Stripe from 'stripe';

/**
 * Stripe 客户端与 URL 助手。刻意不 import db —— 这样只导出 createServerFn
 * 的模块可以被客户端构建整体剥离。
 */
let stripeClient: Stripe | null = null;

/** 延迟实例化：模块加载时 process.env 可能还没就绪（Workers 是懒填充的） */
export function stripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
    stripeClient = new Stripe(key, { apiVersion: '2023-10-16' });
  }
  return stripeClient;
}

export function appUrl(): string {
  return (process.env.VITE_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}
