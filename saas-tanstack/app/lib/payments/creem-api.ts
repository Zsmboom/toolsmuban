/**
 * Creem 低层 API 助手。刻意不 import db —— 这样引用它的
 * *-server-fns 模块可以被客户端构建完整剥离。
 */
export function creemApiKey(): string {
  const key = process.env.CREEM_API_KEY;
  if (!key) throw new Error('CREEM_API_KEY is not configured');
  return key;
}

/** 测试密钥走测试域名 */
export function creemBaseUrl(): string {
  return creemApiKey().startsWith('creem_test_')
    ? 'https://test-api.creem.io'
    : 'https://api.creem.io';
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
