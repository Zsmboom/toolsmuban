import { and, eq } from 'drizzle-orm';
import { db } from '~/lib/db';
import { users, credits } from '~/lib/db/schema';
import { generateId, nextMonthlyReset, type User } from './index';
import { checkPasswordPolicy, hashPassword, needsRehash, verifyPassword } from './password';
import { resolveRole } from './admin';
import { PLANS } from '~/lib/payments/plans';

/** 连续失败多少次锁定 */
const MAX_FAILED_ATTEMPTS = 5;
/** 锁定时长 */
const LOCKOUT_MS = 15 * 60 * 1000;

/**
 * 一个恒定的假哈希。
 *
 * 邮箱不存在时也要跑一次 verifyPassword，让「账号不存在」和「密码错误」
 * 的响应耗时接近。否则攻击者能靠响应时间枚举出哪些邮箱注册过。
 */
const DUMMY_HASH =
  'pbkdf2$210000$00000000000000000000000000000000$' + '0'.repeat(64);

export type AuthFailure =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'EMAIL_TAKEN'
  | 'OAUTH_ONLY'
  | 'WEAK_PASSWORD';

export class AuthError extends Error {
  constructor(
    public readonly code: AuthFailure,
    /** 密码强度不达标时，指出具体是哪一项 */
    public readonly detail?: string
  ) {
    super(code);
    this.name = 'AuthError';
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** 注册。邮箱已被 OAuth 占用时不允许直接用密码注册，避免账号劫持。 */
export async function registerWithPassword(params: {
  email: string;
  password: string;
  name?: string;
}): Promise<User> {
  const email = normalizeEmail(params.email);

  const policy = checkPasswordPolicy(params.password);
  if (!policy.ok) throw new AuthError('WEAK_PASSWORD', policy.error);

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    // 已存在的账号一律拒绝，并且不区分「已用密码注册」和「已用 Google 注册」，
    // 否则又是一个账号枚举面。真实归属由用户自己走登录/找回流程确认。
    throw new AuthError('EMAIL_TAKEN');
  }

  const passwordHash = await hashPassword(params.password);
  const userId = generateId();

  const [created] = await db
    .insert(users)
    .values({
      id: userId,
      email,
      name: params.name?.trim() || null,
      passwordHash,
      // 邮箱未验证。接入邮件服务后在这里发验证信，见 README。
      emailVerified: null,
      role: resolveRole(email),
      lastLoginAt: new Date(),
    })
    .returning();

  await db
    .insert(credits)
    .values({
      id: generateId(),
      userId: created.id,
      balance: PLANS.free.credits,
      totalEarned: PLANS.free.credits,
      monthlyQuota: PLANS.free.credits,
      quotaResetAt: nextMonthlyReset(),
    })
    .onConflictDoNothing({ target: credits.userId });

  return toUser(created);
}

/** 登录。失败会累加计数，达到阈值后锁定一段时间。 */
export async function loginWithPassword(params: {
  email: string;
  password: string;
}): Promise<User> {
  const email = normalizeEmail(params.email);
  const record = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (!record) {
    // 走一遍假校验，保持与「密码错误」相近的耗时
    await verifyPassword(params.password, DUMMY_HASH);
    throw new AuthError('INVALID_CREDENTIALS');
  }

  if (record.lockedUntil && record.lockedUntil > new Date()) {
    throw new AuthError('ACCOUNT_LOCKED');
  }

  if (!record.passwordHash) {
    // 这个邮箱是用 Google 注册的，没有密码
    await verifyPassword(params.password, DUMMY_HASH);
    throw new AuthError('OAUTH_ONLY');
  }

  const valid = await verifyPassword(params.password, record.passwordHash);

  if (!valid) {
    const attempts = record.failedLoginAttempts + 1;
    await db
      .update(users)
      .set({
        failedLoginAttempts: attempts,
        lockedUntil: attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, record.id));

    throw new AuthError(attempts >= MAX_FAILED_ATTEMPTS ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS');
  }

  // 登录成功：清零计数，同步角色（管理员名单可能变了），必要时升级哈希强度
  const [updated] = await db
    .update(users)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      role: resolveRole(email),
      ...(needsRehash(record.passwordHash)
        ? { passwordHash: await hashPassword(params.password) }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, record.id))
    .returning();

  return toUser(updated);
}

/** 改密码。必须先验证旧密码，防止会话被劫持后直接改密。 */
export async function changePassword(params: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const record = await db.query.users.findFirst({ where: eq(users.id, params.userId) });
  if (!record?.passwordHash) throw new AuthError('OAUTH_ONLY');

  const valid = await verifyPassword(params.currentPassword, record.passwordHash);
  if (!valid) throw new AuthError('INVALID_CREDENTIALS');

  const policy = checkPasswordPolicy(params.newPassword);
  if (!policy.ok) throw new AuthError('WEAK_PASSWORD', policy.error);

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(params.newPassword), updatedAt: new Date() })
    .where(and(eq(users.id, params.userId)));
}

function toUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    role: row.role,
  };
}

export { MAX_FAILED_ATTEMPTS, LOCKOUT_MS };
