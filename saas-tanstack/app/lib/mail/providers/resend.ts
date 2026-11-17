import type { MailProvider } from '../index';

/**
 * Resend。
 *
 * 纯 HTTP API，在 Workers 上没有任何兼容性问题（不需要 SMTP，
 * 而 Workers 跑不了 Node 的 SMTP 库）。
 *
 * 使用前提：
 *  1. `wrangler secret put RESEND_API_KEY`
 *  2. 在 Resend 后台验证发信域名（SPF / DKIM）
 *  3. MAIL_FROM 用该域名下的地址
 */
export const resendProvider: MailProvider = {
  name: 'resend',
  async send(message) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY 未配置。执行 `wrangler secret put RESEND_API_KEY`。');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: message.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!response.ok) {
      // 不要把响应体原样抛给用户 —— 里面可能含有配置细节
      const detail = await response.text();
      console.error('[resend] send failed:', response.status, detail.slice(0, 300));
      throw new Error(`Resend 发信失败（HTTP ${response.status}）`);
    }

    const result = (await response.json()) as { id?: string };
    return { id: result.id };
  },
};
