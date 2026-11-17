import { getRequestIP } from '@tanstack/react-start/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '~/lib/db';
import { adminAuditLogs } from '~/lib/db/schema';
import { generateId, type User } from '~/lib/auth';
import { hasNoAdminsConfigured, isAdminEmail } from '~/lib/auth/admin';
import { getCurrentUserFn } from '~/lib/auth/server-fns';

/**
 * 后台鉴权。**每一个** admin server function 的第一行都必须调用它。
 *
 * 这里做的是双重校验：
 *  1. 数据库里的 role 必须是 admin；
 *  2. 邮箱必须仍在 ADMIN_EMAILS 名单里。
 *
 * 第 2 条是关键 —— 就算有人通过某种方式把数据库里的 role 改成了 admin，
 * 只要邮箱不在部署配置的名单里，照样进不来。反过来，把某人从名单里删掉
 * 之后，即使他还持有有效 session，下一次请求也会被立刻挡住。
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUserFn();
  if (!user) throw new Error('UNAUTHENTICATED');

  if (hasNoAdminsConfigured()) {
    throw new Error('NO_ADMINS_CONFIGURED');
  }
  if (user.role !== 'admin' || !isAdminEmail(user.email)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

/**
 * 记录后台写操作。
 * 只读的列表查询不用记，会把日志淹掉；任何**改动数据**的操作都必须记。
 */
export async function recordAudit(params: {
  actor: User;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(adminAuditLogs).values({
    id: generateId(),
    actorId: params.actor.id,
    actorEmail: params.actor.email,
    action: params.action,
    targetType: params.targetType ?? null,
    targetId: params.targetId ?? null,
    detail: params.detail ?? null,
    ipAddress: getRequestIP({ xForwardedFor: true }) ?? null,
  });
}

export interface AuditLogRow {
  id: string;
  actorId: string;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  /**
   * jsonb 列推断为 unknown，跨 RPC 边界不可序列化。
   * 审计详情只用于展示，这里直接压成 JSON 字符串。
   */
  detail: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export async function listAuditLogs(limit = 100): Promise<AuditLogRow[]> {
  const rows = await db
    .select()
    .from(adminAuditLogs)
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    actorId: r.actorId,
    actorEmail: r.actorEmail,
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    detail: r.detail == null ? null : JSON.stringify(r.detail),
    ipAddress: r.ipAddress,
    createdAt: r.createdAt.toISOString(),
  }));
}

export { eq };
