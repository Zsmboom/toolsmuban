import { timingSafeEqual } from './index';

/**
 * 密码哈希。
 *
 * Cloudflare Workers 上跑不了 bcrypt / argon2（原生模块），能用的只有 WebCrypto。
 * 这里用 PBKDF2-HMAC-SHA256。**绝对不要**退回到裸 SHA-256 —— 那种哈希用 GPU
 * 每秒能试上百亿次。
 *
 * ⚠️ 迭代次数上限是 100,000，这是 Cloudflare Workers 硬性限制，不是我们的选择。
 * Workers 的 WebCrypto 实现在超过该值时直接抛：
 *   NotSupportedError: Pbkdf2 failed: iteration counts above 100000 are not supported
 * 而 Node 的 WebCrypto 没有这个上限 —— 所以调高到 OWASP 建议的 210,000 会
 * 出现「本地注册正常、线上注册必失败」这种只在生产暴露的故障（2026-11-17 实际踩到）。
 *
 * 存储格式：`pbkdf2$<iterations>$<saltHex>$<hashHex>`
 * 迭代次数写进串里，将来平台放宽上限时可以平滑升级老密码。
 *
 * 历史兼容：若库中存在按 >100,000 迭代生成的哈希，在 Workers 上无法校验
 * （算不出来），只能让用户走一次密码重置。
 */

const ALGORITHM = 'pbkdf2';
/** Workers WebCrypto 允许的最大值；改大之前先确认平台上限已放宽 */
const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    key,
    KEY_BITS
  );
  return toHex(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `${ALGORITHM}$${ITERATIONS}$${toHex(salt)}$${hash}`;
}

/**
 * 校验密码。
 *
 * 注意即使用户不存在也要跑一次哈希（见 auth 里的 dummy 校验），
 * 否则「响应快 = 邮箱不存在」会变成一个账号枚举漏洞。
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [algorithm, iterationsRaw, saltHex, expected] = stored.split('$');
    if (algorithm !== ALGORITHM) return false;

    const iterations = Number(iterationsRaw);
    if (!Number.isInteger(iterations) || iterations <= 0) return false;

    const actual = await derive(password, fromHex(saltHex), iterations);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** 存储的哈希是否用的是当前强度；不是就该在用户下次登录时重新哈希 */
export function needsRehash(stored: string): boolean {
  const [algorithm, iterationsRaw] = stored.split('$');
  return algorithm !== ALGORITHM || Number(iterationsRaw) < ITERATIONS;
}

export interface PasswordPolicyResult {
  ok: boolean;
  /** i18n key 后缀，指向 messages.auth.passwordErrors.* */
  error?: 'tooShort' | 'tooLong' | 'tooCommon' | 'needsVariety';
}

/** 最常见的弱密码，注册时直接拒绝 */
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  'qwerty123', 'abc12345', 'iloveyou', 'admin123', 'letmein1', 'welcome1',
  'monkey123', 'football', 'baseball', 'starwars', 'dragon123', 'sunshine',
]);

/**
 * 密码强度校验。
 * 长度是最有效的单一指标，所以门槛设在 8 位并配合字符多样性要求，
 * 而不是搞一堆「必须含特殊字符」的规则（那只会让人用 Passw0rd!）。
 */
export function checkPasswordPolicy(password: string): PasswordPolicyResult {
  if (password.length < 8) return { ok: false, error: 'tooShort' };
  // PBKDF2 对超长输入没有 bcrypt 那样的 72 字节截断问题，但仍要挡住 DoS
  if (password.length > 200) return { ok: false, error: 'tooLong' };
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return { ok: false, error: 'tooCommon' };

  const variety =
    Number(/[a-z]/.test(password)) +
    Number(/[A-Z]/.test(password)) +
    Number(/[0-9]/.test(password)) +
    Number(/[^a-zA-Z0-9]/.test(password));
  // 12 位以上放宽多样性要求：长口令本身就够安全
  if (password.length < 12 && variety < 2) return { ok: false, error: 'needsVariety' };

  return { ok: true };
}
