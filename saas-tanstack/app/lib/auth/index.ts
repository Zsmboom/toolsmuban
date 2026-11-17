import { db } from '~/lib/db';
import { users, sessions, accounts, credits } from '~/lib/db/schema';
import { and, eq, lt } from 'drizzle-orm';
import { PLANS } from '~/lib/payments/plans';
import { resolveRole } from './admin';

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

export interface Session {
  sessionToken: string;
  userId: string;
  expires: Date;
  user: User;
}

/** session 有效期 30 天 */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_COOKIE = 'session_token';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomHex(byteLength: number): string {
  const array = new Uint8Array(byteLength);
  crypto.getRandomValues(array);
  return toHex(array);
}

/** 256 bit 的会话令牌 */
export function generateSessionToken(): string {
  return randomHex(32);
}

export function generateId(): string {
  return randomHex(16);
}

/** OAuth state / PKCE verifier 用 */
export function generateRandomToken(): string {
  return randomHex(32);
}

/** PKCE: code_challenge = BASE64URL(SHA256(code_verifier)) */
export async function sha256Base64Url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  let binary = '';
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** 定长比较，避免通过耗时差异泄漏信息 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function createSession(userId: string): Promise<{ token: string; expires: Date }> {
  const sessionToken = generateSessionToken();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await db.insert(sessions).values({ sessionToken, userId, expires });

  return { token: sessionToken, expires };
}

export async function getSession(sessionToken: string): Promise<Session | null> {
  if (!sessionToken) return null;

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.sessionToken, sessionToken),
    with: { user: true },
  });

  if (!session) return null;

  if (session.expires < new Date()) {
    // 顺手清掉过期会话，避免表无限增长
    await deleteSession(sessionToken);
    return null;
  }

  return session as Session;
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}

/** 可由定时任务调用，批量清理过期会话 */
export async function deleteExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expires, new Date()));
}

interface GoogleProfile {
  id: string;
  email?: string;
  verified_email?: boolean;
  name?: string;
  picture?: string;
}

/**
 * 用 access token 换取 Google 用户资料，并把用户 upsert 进库。
 * 注意：这里要求 Google 已验证过邮箱，否则拒绝登录——否则一个未验证邮箱
 * 可能被用来顶替掉已有账号。
 */
export async function upsertUserFromGoogle(
  accessToken: string,
  refreshToken: string | undefined,
  expiresIn: number | undefined,
  scope: string | undefined
): Promise<User> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google user profile');
  }

  const profile = (await response.json()) as GoogleProfile;

  if (!profile.email) {
    throw new Error('Google account has no email address');
  }
  if (profile.verified_email === false) {
    throw new Error('Google account email is not verified');
  }

  const email = profile.email.toLowerCase();

  // users.email 上有唯一约束，用 upsert 避免并发登录插出两个用户
  const [user] = await db
    .insert(users)
    .values({
      id: generateId(),
      email,
      name: profile.name ?? null,
      image: profile.picture ?? null,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
      // 角色由 ADMIN_EMAILS 名单决定，不由数据库里的旧值决定
      role: resolveRole(email),
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: profile.name ?? null,
        image: profile.picture ?? null,
        lastLoginAt: new Date(),
        role: resolveRole(email),
        updatedAt: new Date(),
      },
    })
    .returning();

  // 免费额度：只在账号第一次出现时建，已有则不动
  await db
    .insert(credits)
    .values({
      id: generateId(),
      userId: user.id,
      balance: PLANS.free.credits,
      totalEarned: PLANS.free.credits,
      monthlyQuota: PLANS.free.credits,
      quotaResetAt: nextMonthlyReset(),
    })
    .onConflictDoNothing({ target: credits.userId });

  // OAuth 账号信息 upsert，避免每次登录都插一行
  await db
    .insert(accounts)
    .values({
      id: generateId(),
      userId: user.id,
      type: 'oauth',
      provider: 'google',
      providerAccountId: profile.id,
      access_token: accessToken,
      refresh_token: refreshToken ?? null,
      expires_at: expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : null,
      token_type: 'Bearer',
      scope: scope ?? null,
    })
    .onConflictDoUpdate({
      target: [accounts.provider, accounts.providerAccountId],
      set: {
        userId: user.id,
        access_token: accessToken,
        // Google 只在首次授权时给 refresh_token，后续为空时不要覆盖掉已有值
        ...(refreshToken ? { refresh_token: refreshToken } : {}),
        expires_at: expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : null,
        scope: scope ?? null,
      },
    });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
  };
}

/** 下一个自然月 1 号 00:00 UTC，用作额度重置时间 */
export function nextMonthlyReset(from: Date = new Date()): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
}

/** 从任意 Request 里取当前用户（供 API route handler 使用） */
export async function getCurrentUserFromRequest(request: Request): Promise<User | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const sessionToken = parseCookie(cookieHeader, SESSION_COOKIE);
  if (!sessionToken) return null;

  const session = await getSession(sessionToken);
  return session?.user ?? null;
}

/**
 * 从 Cookie 头里取值。用 indexOf 而不是 split('=')，
 * 否则 base64 之类含 '=' 的值会被截断。
 */
export function parseCookie(cookieHeader: string, name: string): string | undefined {
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === name) {
      return decodeURIComponent(trimmed.slice(eq + 1));
    }
  }
  return undefined;
}

/** 供后台接口做鉴权 */
export function assertAdmin(user: User | null): asserts user is User {
  if (!user) throw new Error('UNAUTHENTICATED');
  if (user.role !== 'admin') throw new Error('FORBIDDEN');
}

export { and, eq };
