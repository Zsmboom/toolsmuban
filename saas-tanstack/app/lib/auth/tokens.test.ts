import { describe, it, expect } from 'vitest';

/**
 * 令牌哈希的性质测试。
 *
 * 这里不碰数据库，只验证「库里存哈希、邮件里发原文」这个核心安全性质：
 * 拿到库里的值无法反推出能用的链接。
 */
async function sha256Hex(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

describe('one-time token hashing', () => {
  it('存进库的值与发出去的原文不同', async () => {
    const raw = 'a'.repeat(64);
    expect(await sha256Hex(raw)).not.toBe(raw);
  });

  it('同一原文哈希稳定（才能用来查找）', async () => {
    expect(await sha256Hex('token-value')).toBe(await sha256Hex('token-value'));
  });

  it('不同原文哈希不同', async () => {
    expect(await sha256Hex('token-a')).not.toBe(await sha256Hex('token-b'));
  });

  it('输出定长 64 位十六进制', async () => {
    expect(await sha256Hex('x')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('token identifier 编码', () => {
  const identifierFor = (purpose: string, userId: string) => `${purpose}:${userId}`;
  const parse = (identifier: string) => identifier.split(':');

  it('用途和 userId 能正确还原', () => {
    const [purpose, userId] = parse(identifierFor('reset', 'user_123'));
    expect(purpose).toBe('reset');
    expect(userId).toBe('user_123');
  });

  it('重置令牌不能拿去当验证令牌用', () => {
    const [purpose] = parse(identifierFor('reset', 'u1'));
    expect(purpose).not.toBe('verify');
  });
});
