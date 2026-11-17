import { env } from 'cloudflare:workers';
import type { MailProvider } from '../index';

interface SendEmailBinding {
  send(message: {
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<{ messageId?: string }>;
}

/**
 * Cloudflare Email Service（Email Sending）。
 *
 * 优点是不用引入第三方：你如果本来就为了 D1 写入额度上了 Workers Paid，
 * 发信是顺带的。
 *
 * 使用前提：
 *  1. **Workers Paid 计划**（发信功能仅付费计划可用，公测中）
 *  2. 域名接入 Cloudflare Email Service 并配好 SPF / DKIM
 *  3. wrangler.toml 里加绑定：
 *       [[send_email]]
 *       name = "EMAIL"
 *       remote = true      # 让 wrangler dev 也能调真实 API
 *
 * 注意：发给账号内**已验证的目标地址**在所有计划都免费，但那只够做告警，
 * 给任意用户发密码重置需要付费计划。
 */
export const cloudflareProvider: MailProvider = {
  name: 'cloudflare',
  async send(message) {
    const binding = (env as { EMAIL?: SendEmailBinding }).EMAIL;
    if (!binding) {
      throw new Error(
        'Email binding "EMAIL" 未配置。在 wrangler.toml 里加 [[send_email]] name = "EMAIL"，' +
          '并确认账号已开通 Workers Paid（发信功能仅付费计划可用）。'
      );
    }

    const result = await binding.send({
      from: message.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    return { id: result?.messageId };
  },
};
