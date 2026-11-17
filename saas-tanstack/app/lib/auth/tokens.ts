import { and, eq, lt } from 'drizzle-orm';
import { db } from '~/lib/db';
import { verificationTokens } from '~/lib/db/schema';
import { generateRandomToken } from './index';

/**
 * 一次性令牌（密码重置 / 邮箱验证）。
 *
 * 关键安全点：**数据库里存的是令牌的哈希，不是令牌本身**。
 * 邮件里发出去的是原始值，只有用户手上有。这样即使数据库被读取，
 * 攻击者也无法拿库里的值去重置任何人的密码 —— 和存密码是一个道理。
 *
 * 复用已有的 verification_tokens 表：
 *   identifier = `${purpose}:${userId}`
 *   token      = sha256(原始令牌)
 *   expires    = 过期时间
 */

export type TokenPurpose = 'reset' | 'verify';

/** 有效期：重置给 1 小时，验证给 24 小时 */
const TTL_MS: Record<TokenPurpose, number> = {
  reset: 60 * 60 * 1000,
  verify: 24 * 60 * 60 * 1000,
};

async function hashToken(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function identifierFor(purpose: TokenPurpose, userId: string): string {
  return `${purpose}:${userId}`;
}

/**
 * 签发令牌，返回**原始值**（只在这一刻存在，之后无法从库里还原）。
 * 同一用途下会先清掉该用户的旧令牌，保证同时只有最新的一个有效。
 */
export async function issueToken(purpose: TokenPurpose, userId: string): Promise<string> {
  const identifier = identifierFor(purpose, userId);

  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier));

  const raw = generateRandomToken();
  await db.insert(verificationTokens).values({
    identifier,
    token: await hashToken(raw),
    expires: new Date(Date.now() + TTL_MS[purpose]),
  });

  return raw;
}

/**
 * 校验并消费令牌。成功返回 userId，失败返回 null。
 * 无论成功与否都是一次性的：命中即删除，防重放。
 */
export async function consumeToken(
  purpose: TokenPurpose,
  raw: string
): Promise<string | null> {
  if (!raw) return null;

  const hashed = await hashToken(raw);
  const row = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.token, hashed),
  });

  if (!row) return null;

  // 先删再判过期：过期的也要清掉，避免表里堆垃圾
  await db
    .delete(verificationTokens)
    .where(
      and(eq(verificationTokens.identifier, row.identifier), eq(verificationTokens.token, hashed))
    );

  if (row.expires < new Date()) return null;

  const [rowPurpose, userId] = row.identifier.split(':');
  if (rowPurpose !== purpose || !userId) return null;

  return userId;
}

/** 可由定时任务调用，清理过期令牌 */
export async function deleteExpiredTokens(): Promise<void> {
  await db.delete(verificationTokens).where(lt(verificationTokens.expires, new Date()));
}
