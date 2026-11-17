import { siteConfig } from '~/lib/site-config';
import type { Locale } from '~/lib/i18n';

/**
 * 发信层。
 *
 * 业务代码只调这里的 sendMail / sendXxxEmail，不直接碰任何服务商 SDK。
 * 换服务商 = 加一个 providers/*.ts 并改 MAIL_PROVIDER 环境变量，
 * 上层一行都不用动 —— 和数据库的 db:use 是同一个思路。
 *
 * 之所以做成可替换的：各家免费额度经常变，而且额度多半按**账号**算而不是
 * 按站点算。你用这个模板开多个站时，很可能需要给不同站点配不同服务商。
 */

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface MailProvider {
  readonly name: string;
  send(message: MailMessage & { from: string }): Promise<{ id?: string }>;
}

export type MailProviderName = 'console' | 'cloudflare' | 'resend';

function providerName(): MailProviderName {
  const raw = (process.env.MAIL_PROVIDER ?? 'console').toLowerCase();
  if (raw === 'cloudflare' || raw === 'resend' || raw === 'console') return raw;
  throw new Error(
    `未知的 MAIL_PROVIDER: "${raw}"。可选值：console | cloudflare | resend`
  );
}

async function loadProvider(): Promise<MailProvider> {
  switch (providerName()) {
    case 'cloudflare': {
      const { cloudflareProvider } = await import('./providers/cloudflare');
      return cloudflareProvider;
    }
    case 'resend': {
      const { resendProvider } = await import('./providers/resend');
      return resendProvider;
    }
    default: {
      const { consoleProvider } = await import('./providers/console');
      return consoleProvider;
    }
  }
}

/** 发信地址。必须是已完成 SPF/DKIM 验证的域名，否则会进垃圾箱。 */
function fromAddress(): string {
  const configured = process.env.MAIL_FROM;
  if (configured) return configured;
  // 没配就用一个明显是占位的地址，让人一眼看出还没配置
  return `${siteConfig.name} <noreply@example.com>`;
}

export async function sendMail(message: MailMessage): Promise<{ id?: string }> {
  const provider = await loadProvider();
  return provider.send({ ...message, from: fromAddress() });
}

// ============================================
// 邮件模板
// ============================================

/**
 * 极简的 HTML 骨架。
 * 邮件客户端对 CSS 支持极差 —— 不要用 flex/grid/外部样式表，
 * 一律内联样式 + table 布局才能在 Outlook 里正常显示。
 */
function layout(opts: { heading: string; body: string; cta?: { label: string; url: string }; footer: string }): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f3ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;padding:32px;">
          <tr><td>
            <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#4f46e5;">${escapeHtml(siteConfig.name)}</p>
            <h1 style="margin:0 0 16px;font-size:20px;color:#1e1b4b;">${escapeHtml(opts.heading)}</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">${opts.body}</p>
            ${
              opts.cta
                ? `<p style="margin:0 0 24px;"><a href="${opts.cta.url}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:15px;font-weight:600;">${escapeHtml(opts.cta.label)}</a></p>
            <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#6b7280;word-break:break-all;">按钮打不开就复制这个链接：<br/>${opts.cta.url}</p>`
                : ''
            }
            <p style="margin:0;font-size:13px;line-height:1.6;color:#9ca3af;">${escapeHtml(opts.footer)}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[<>&"']/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}

const COPY = {
  reset: {
    en: {
      subject: 'Reset your password',
      heading: 'Reset your password',
      body: 'We received a request to reset your password. This link expires in 1 hour and can only be used once.',
      cta: 'Choose a new password',
      footer: "If you didn't request this, you can safely ignore this email — your password won't change.",
    },
    zh: {
      subject: '重置密码',
      heading: '重置你的密码',
      body: '我们收到了重置密码的请求。这个链接 1 小时后失效，且只能使用一次。',
      cta: '设置新密码',
      footer: '如果这不是你发起的，忽略这封邮件即可，密码不会有任何变化。',
    },
  },
  verify: {
    en: {
      subject: 'Confirm your email address',
      heading: 'Confirm your email',
      body: 'Please confirm this email address to finish setting up your account. This link expires in 24 hours.',
      cta: 'Confirm email address',
      footer: "If you didn't create an account, you can ignore this email.",
    },
    zh: {
      subject: '验证你的邮箱',
      heading: '验证你的邮箱',
      body: '请确认这个邮箱地址以完成账号设置。链接 24 小时后失效。',
      cta: '验证邮箱',
      footer: '如果你没有注册过账号，忽略这封邮件即可。',
    },
  },
} as const;

function toText(copy: { heading: string; body: string; cta: string; footer: string }, url: string): string {
  return `${copy.heading}\n\n${copy.body}\n\n${copy.cta}: ${url}\n\n${copy.footer}`;
}

export async function sendPasswordResetEmail(params: {
  to: string;
  url: string;
  locale?: Locale;
}): Promise<void> {
  const copy = COPY.reset[params.locale ?? 'en'] ?? COPY.reset.en;
  await sendMail({
    to: params.to,
    subject: copy.subject,
    html: layout({
      heading: copy.heading,
      body: escapeHtml(copy.body),
      cta: { label: copy.cta, url: params.url },
      footer: copy.footer,
    }),
    text: toText(copy, params.url),
  });
}

export async function sendVerificationEmail(params: {
  to: string;
  url: string;
  locale?: Locale;
}): Promise<void> {
  const copy = COPY.verify[params.locale ?? 'en'] ?? COPY.verify.en;
  await sendMail({
    to: params.to,
    subject: copy.subject,
    html: layout({
      heading: copy.heading,
      body: escapeHtml(copy.body),
      cta: { label: copy.cta, url: params.url },
      footer: copy.footer,
    }),
    text: toText(copy, params.url),
  });
}

export { providerName };
