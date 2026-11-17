import { afterEach, describe, it, expect } from 'vitest';
import { checkPasswordPolicy, hashPassword, needsRehash, verifyPassword } from './password';
import { isAdminEmail, resolveRole, hasNoAdminsConfigured } from './admin';

describe('password hashing', () => {
  it('每次哈希都带不同的盐', async () => {
    const a = await hashPassword('correct horse battery');
    const b = await hashPassword('correct horse battery');
    expect(a).not.toBe(b);
  });

  it('存储格式包含算法和迭代次数，便于将来提升强度', async () => {
    const h = await hashPassword('correct horse battery');
    const [algo, iterations] = h.split('$');
    expect(algo).toBe('pbkdf2');
    // Cloudflare Workers 的 PBKDF2 上限是 100,000，超了线上注册会直接抛错
    expect(Number(iterations)).toBe(100_000);
  });

  it('正确密码通过，错误密码不通过', async () => {
    const h = await hashPassword('correct horse battery');
    await expect(verifyPassword('correct horse battery', h)).resolves.toBe(true);
    await expect(verifyPassword('correct horse batteru', h)).resolves.toBe(false);
    await expect(verifyPassword('', h)).resolves.toBe(false);
  });

  it('损坏或伪造的哈希串一律拒绝，不抛异常', async () => {
    for (const bad of ['', 'garbage', 'pbkdf2$abc$de$ff', 'sha256$1$aa$bb', 'pbkdf2$0$aa$bb']) {
      await expect(verifyPassword('x', bad)).resolves.toBe(false);
    }
  });

  it('识别出需要提升强度的旧哈希', () => {
    expect(needsRehash('pbkdf2$1000$aa$bb')).toBe(true);
    expect(needsRehash('sha256$210000$aa$bb')).toBe(true);
    expect(needsRehash('pbkdf2$210000$aa$bb')).toBe(false);
  });
});

describe('password policy', () => {
  it('拒绝过短的密码', () => {
    expect(checkPasswordPolicy('short1').error).toBe('tooShort');
  });

  it('拒绝超长输入（防 DoS）', () => {
    expect(checkPasswordPolicy('a'.repeat(201) + 'A1').error).toBe('tooLong');
  });

  it('拒绝常见弱密码', () => {
    for (const p of ['password123', 'PASSWORD123', '12345678', 'qwerty123']) {
      expect(checkPasswordPolicy(p).ok, p).toBe(false);
    }
  });

  it('短密码要求字符多样性', () => {
    expect(checkPasswordPolicy('abcdefgh').error).toBe('needsVariety');
    expect(checkPasswordPolicy('abcdefg1').ok).toBe(true);
  });

  it('长口令放宽多样性要求', () => {
    expect(checkPasswordPolicy('correct horse battery staple').ok).toBe(true);
  });
});

describe('admin allowlist', () => {
  const original = process.env.ADMIN_EMAILS;
  afterEach(() => { process.env.ADMIN_EMAILS = original; });

  it('没配置时一个管理员都没有（宁可锁死也不默认放行）', () => {
    process.env.ADMIN_EMAILS = '';
    expect(hasNoAdminsConfigured()).toBe(true);
    expect(isAdminEmail('anyone@example.com')).toBe(false);
    expect(resolveRole('anyone@example.com')).toBe('user');
  });

  it('名单内的邮箱是管理员，大小写和空格不敏感', () => {
    process.env.ADMIN_EMAILS = ' Owner@Example.com , partner@example.com ';
    expect(isAdminEmail('owner@example.com')).toBe(true);
    expect(isAdminEmail('OWNER@EXAMPLE.COM')).toBe(true);
    expect(isAdminEmail('partner@example.com')).toBe(true);
    expect(resolveRole('owner@example.com')).toBe('admin');
  });

  it('名单外的邮箱不是管理员', () => {
    process.env.ADMIN_EMAILS = 'owner@example.com';
    expect(isAdminEmail('attacker@example.com')).toBe(false);
    expect(resolveRole('attacker@example.com')).toBe('user');
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });
});
