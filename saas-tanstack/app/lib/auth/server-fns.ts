import { createServerFn } from '@tanstack/react-start';
import {
  deleteCookie,
  getCookie,
  getRequestUrl,
  setCookie,
} from '@tanstack/react-start/server';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSession,
  deleteSession,
  generateRandomToken,
  getSession,
  sha256Base64Url,
  timingSafeEqual,
  upsertUserFromGoogle,
  type User,
} from '~/lib/auth';
import { SITE_URL } from '~/lib/site-config';
import { AuthError, changePassword, loginWithPassword, registerWithPassword } from './credentials';
import { checkPasswordPolicy, hashPassword } from './password';

const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_VERIFIER_COOKIE = 'oauth_verifier';
/** OAuth 往返给 10 分钟，足够用户完成授权 */
const OAUTH_FLOW_MAX_AGE = 10 * 60;

/** 回调路径必须和 Google 控制台里登记的完全一致 */
export const OAUTH_CALLBACK_PATH = '/auth-callback';

function isSecureRequest(): boolean {
  try {
    return getRequestUrl().protocol === 'https:';
  } catch {
    return SITE_URL.startsWith('https:');
  }
}

/** 会话 cookie 的统一属性：HttpOnly 防 XSS 窃取，SameSite=Lax 防 CSRF */
function sessionCookieOptions(maxAge: number) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isSecureRequest(),
    maxAge,
  };
}

function appBaseUrl(): string {
  return (process.env.VITE_APP_URL || SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function redirectUri(): string {
  return `${appBaseUrl()}${OAUTH_CALLBACK_PATH}`;
}

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<User | null> => {
    const sessionToken = getCookie(SESSION_COOKIE);
    if (!sessionToken) return null;

    const session = await getSession(sessionToken);
    return session?.user ?? null;
  }
);

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const sessionToken = getCookie(SESSION_COOKIE);

  if (sessionToken) {
    await deleteSession(sessionToken);
  }

  // 无论 session 是否存在都清 cookie，保证前端状态一致
  deleteCookie(SESSION_COOKIE, { path: '/' });

  return { success: true };
});

/**
 * 发起 Google 登录。
 * 这里生成 state（防登录 CSRF）和 PKCE verifier，都写进 HttpOnly cookie，
 * 回调时再比对——没有 state 的 OAuth 流程等于把登录入口敞开给攻击者。
 */
export const googleLoginRedirectFn = createServerFn({ method: 'POST' }).handler(async () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  const state = generateRandomToken();
  const codeVerifier = generateRandomToken();
  const codeChallenge = await sha256Base64Url(codeVerifier);

  const cookieOptions = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isSecureRequest(),
    maxAge: OAUTH_FLOW_MAX_AGE,
  };
  setCookie(OAUTH_STATE_COOKIE, state, cookieOptions);
  setCookie(OAUTH_VERIFIER_COOKIE, codeVerifier, cookieOptions);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
});

/**
 * 处理 Google 回调：校验 state → 换 token → upsert 用户 → 建会话。
 * 会话令牌只通过 Set-Cookie 下发，不会出现在响应体里。
 */
export const googleCallbackFn = createServerFn({ method: 'POST' })
  .validator((data: { code: string; state: string }) => {
    if (!data?.code || typeof data.code !== 'string') {
      throw new Error('Missing authorization code');
    }
    if (!data?.state || typeof data.state !== 'string') {
      throw new Error('Missing OAuth state');
    }
    return { code: data.code, state: data.state };
  })
  .handler(async ({ data }): Promise<{ user: User }> => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials are not configured');
    }

    const expectedState = getCookie(OAUTH_STATE_COOKIE);
    const codeVerifier = getCookie(OAUTH_VERIFIER_COOKIE);

    if (!expectedState || !timingSafeEqual(expectedState, data.state)) {
      throw new Error('Invalid OAuth state');
    }

    // 一次性使用，校验完立刻作废
    deleteCookie(OAUTH_STATE_COOKIE, { path: '/' });
    deleteCookie(OAUTH_VERIFIER_COOKIE, { path: '/' });

    const body = new URLSearchParams({
      code: data.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
    });
    if (codeVerifier) body.set('code_verifier', codeVerifier);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };

    const user = await upsertUserFromGoogle(
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in,
      tokens.scope
    );

    const { token } = await createSession(user.id);

    setCookie(SESSION_COOKIE, token, sessionCookieOptions(SESSION_MAX_AGE_SECONDS));

    return { user };
  });


/** 登录/注册共用的响应形状，错误码由前端映射成本地化文案 */
export interface CredentialResult {
  ok: boolean;
  error?: string;
  detail?: string;
}

function toResult(error: unknown): CredentialResult {
  if (error instanceof AuthError) return { ok: false, error: error.code, detail: error.detail };
  console.error('Credential auth error:', error);
  return { ok: false, error: 'UNKNOWN' };
}

function validateCredentials(data: { email?: string; password?: string; name?: string }) {
  const email = typeof data?.email === 'string' ? data.email.trim() : '';
  const password = typeof data?.password === 'string' ? data.password : '';
  if (!email || !email.includes('@') || email.length > 254) throw new Error('Invalid email');
  if (!password) throw new Error('Missing password');
  const name = typeof data?.name === 'string' ? data.name.slice(0, 80) : undefined;
  return { email, password, name };
}

export const registerFn = createServerFn({ method: 'POST' })
  .validator(validateCredentials)
  .handler(async ({ data }): Promise<CredentialResult> => {
    try {
      const user = await registerWithPassword(data);
      const { token } = await createSession(user.id);
      setCookie(SESSION_COOKIE, token, sessionCookieOptions(SESSION_MAX_AGE_SECONDS));

      // 发验证信。发信失败不该让注册失败 —— 用户可以在设置页重发。
      try {
        const { issueToken } = await import('./tokens');
        const { sendVerificationEmail } = await import('~/lib/mail');
        if (user.email) {
          const verifyToken = await issueToken('verify', user.id);
          await sendVerificationEmail({
            to: user.email,
            url: `${appBaseUrl()}/verify-email?token=${encodeURIComponent(verifyToken)}`,
          });
        }
      } catch (mailError) {
        console.error('Failed to send verification email:', mailError);
      }

      return { ok: true };
    } catch (error) {
      return toResult(error);
    }
  });

export const loginFn = createServerFn({ method: 'POST' })
  .validator(validateCredentials)
  .handler(async ({ data }): Promise<CredentialResult> => {
    try {
      const user = await loginWithPassword(data);
      const { token } = await createSession(user.id);
      setCookie(SESSION_COOKIE, token, sessionCookieOptions(SESSION_MAX_AGE_SECONDS));
      return { ok: true };
    } catch (error) {
      return toResult(error);
    }
  });

// ============================================
// 找回密码 / 邮箱验证
// ============================================

function appOrigin(): string {
  return appBaseUrl();
}

/**
 * 发起找回密码。
 *
 * **无论邮箱是否存在都返回成功** —— 否则这个接口就变成了账号枚举器，
 * 攻击者可以用它批量探测哪些邮箱注册过本站。
 */
export const requestPasswordResetFn = createServerFn({ method: 'POST' })
  .validator((data: { email?: string; locale?: string }) => {
    const email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
    if (!email || !email.includes('@') || email.length > 254) throw new Error('Invalid email');
    const locale = data?.locale === 'zh' ? 'zh' : 'en';
    return { email, locale: locale as 'en' | 'zh' };
  })
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { db } = await import('~/lib/db');
    const { users } = await import('~/lib/db/schema');
    const { eq } = await import('drizzle-orm');
    const record = await db.query.users.findFirst({ where: eq(users.email, data.email) });

    // 只有「存在且设过密码」的账号才真的发信；其余静默跳过
    if (record?.passwordHash) {
      const { issueToken } = await import('./tokens');
      const { sendPasswordResetEmail } = await import('~/lib/mail');
      const token = await issueToken('reset', record.id);
      await sendPasswordResetEmail({
        to: data.email,
        url: `${appOrigin()}/reset-password?token=${encodeURIComponent(token)}`,
        locale: data.locale,
      });
    }

    return { ok: true };
  });

/** 用令牌重置密码。成功后会踢掉该用户所有旧会话。 */
export const resetPasswordFn = createServerFn({ method: 'POST' })
  .validator((data: { token?: string; password?: string }) => {
    const token = typeof data?.token === 'string' ? data.token : '';
    const password = typeof data?.password === 'string' ? data.password : '';
    if (!token) throw new Error('Missing token');
    if (!password) throw new Error('Missing password');
    return { token, password };
  })
  .handler(async ({ data }): Promise<CredentialResult> => {
    // 先校验密码强度，再消费令牌。
    // 反过来的话，用户第一次输了个弱密码就会把重置链接烧掉，
    // 只能回去重新收一封邮件 —— 这是个很容易踩的顺序问题。
    const policy = checkPasswordPolicy(data.password);
    if (!policy.ok) return { ok: false, error: 'WEAK_PASSWORD', detail: policy.error };

    const { consumeToken } = await import('./tokens');
    const userId = await consumeToken('reset', data.token);
    if (!userId) return { ok: false, error: 'INVALID_TOKEN' };

    const { db } = await import('~/lib/db');
    const { users, sessions } = await import('~/lib/db/schema');
    const { eq } = await import('drizzle-orm');

    await db
      .update(users)
      .set({
        passwordHash: await hashPassword(data.password),
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 改密后所有旧会话作废 —— 万一账号已被他人登录，改密码必须能把人踢出去
    await db.delete(sessions).where(eq(sessions.userId, userId));

    return { ok: true };
  });

/** 给当前登录用户发验证信 */
export const sendVerificationEmailFn = createServerFn({ method: 'POST' })
  .validator((data: { locale?: string }) => ({
    locale: (data?.locale === 'zh' ? 'zh' : 'en') as 'en' | 'zh',
  }))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const sessionToken = getCookie(SESSION_COOKIE);
    if (!sessionToken) return { ok: false };
    const session = await getSession(sessionToken);
    if (!session?.user?.email) return { ok: false };

    const { issueToken } = await import('./tokens');
    const { sendVerificationEmail } = await import('~/lib/mail');
    const token = await issueToken('verify', session.user.id);
    await sendVerificationEmail({
      to: session.user.email,
      url: `${appOrigin()}/verify-email?token=${encodeURIComponent(token)}`,
      locale: data.locale,
    });

    return { ok: true };
  });

/** 用令牌确认邮箱 */
export const verifyEmailFn = createServerFn({ method: 'POST' })
  .validator((data: { token?: string }) => {
    const token = typeof data?.token === 'string' ? data.token : '';
    if (!token) throw new Error('Missing token');
    return { token };
  })
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { consumeToken } = await import('./tokens');
    const userId = await consumeToken('verify', data.token);
    if (!userId) return { ok: false };

    const { db } = await import('~/lib/db');
    const { users } = await import('~/lib/db/schema');
    const { eq } = await import('drizzle-orm');
    await db
      .update(users)
      .set({ emailVerified: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { ok: true };
  });


/** 已登录用户修改密码。必须验证旧密码，防会话被劫持后直接改密。 */
export const changePasswordFn = createServerFn({ method: 'POST' })
  .validator((data: { currentPassword?: string; newPassword?: string }) => {
    const currentPassword = typeof data?.currentPassword === 'string' ? data.currentPassword : '';
    const newPassword = typeof data?.newPassword === 'string' ? data.newPassword : '';
    if (!currentPassword || !newPassword) throw new Error('Missing password');
    return { currentPassword, newPassword };
  })
  .handler(async ({ data }): Promise<CredentialResult> => {
    const sessionToken = getCookie(SESSION_COOKIE);
    if (!sessionToken) return { ok: false, error: 'INVALID_CREDENTIALS' };
    const session = await getSession(sessionToken);
    if (!session?.user) return { ok: false, error: 'INVALID_CREDENTIALS' };

    try {
      await changePassword({
        userId: session.user.id,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return { ok: true };
    } catch (error) {
      return toResult(error);
    }
  });
