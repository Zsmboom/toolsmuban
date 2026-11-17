/**
 * 管理员名单。
 *
 * ## 为什么不直接改数据库的 role 字段
 *
 * 改库当然也能提权，但它有两个问题：
 *  1. 谁都可能在某次误操作 / SQL 注入 / 后台 bug 里把自己变成 admin，
 *     而且事后很难发现；
 *  2. 换服务商、重建库、跑迁移之后，权限状态可能丢失或漂移。
 *
 * 所以这里把「谁是管理员」定义为**部署配置**而不是数据：
 * 名单写在 ADMIN_EMAILS 这个 secret 里，只有能改 Cloudflare secret 的人
 * （也就是你）才能增删管理员。数据库里的 role 字段只是这个名单的投影，
 * 每次登录时同步一次。
 *
 * ## 怎么配置
 *
 * ```bash
 * wrangler secret put ADMIN_EMAILS
 * # 输入：you@example.com,partner@example.com
 * ```
 * 本地开发写进 .env.local 即可。
 *
 * 从名单里移除某个邮箱后，该用户**下次登录时**会自动降级为普通用户；
 * 想立刻生效就把他的 session 删掉（后台的用户管理页有这个操作）。
 */

export type Role = 'user' | 'admin';

/** 解析 ADMIN_EMAILS，全部转小写去空白 */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** 这个邮箱是否应该拥有管理员权限 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/** 根据名单决定用户应有的角色。登录时调用，保证 role 与配置一致。 */
export function resolveRole(email: string | null | undefined): Role {
  return isAdminEmail(email) ? 'admin' : 'user';
}

/**
 * 名单没配置时的行为。
 *
 * 返回 true 表示「一个管理员都没有」——此时后台完全不可进入，这是**故意的**：
 * 宁可锁死也不能默认放行。首次部署忘了配 ADMIN_EMAILS 时，
 * 后台会提示你去配置，而不是让任何人都能进。
 */
export function hasNoAdminsConfigured(): boolean {
  return getAdminEmails().length === 0;
}
