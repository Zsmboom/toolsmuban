import type { MailProvider } from '../index';

/**
 * 开发用 provider：不真的发信，把内容打到控制台。
 *
 * 默认就是它 —— 这样克隆下来不配任何邮件服务也能把「找回密码」「验证邮箱」
 * 两条流程完整跑通，链接直接从终端里复制。
 * 生产环境务必换成 cloudflare 或 resend。
 */
export const consoleProvider: MailProvider = {
  name: 'console',
  async send(message) {
    // 把链接单独打一行，方便本地开发直接点/复制
    const link = message.text.match(/https?:\/\/\S+/)?.[0];
    console.log(
      [
        '',
        '─'.repeat(72),
        '📧 [console mail provider] 邮件未真实发送',
        `   收件人: ${message.to}`,
        `   发件人: ${message.from}`,
        `   主题:   ${message.subject}`,
        link ? `   链接:   ${link}` : '',
        '─'.repeat(72),
        '',
      ]
        .filter(Boolean)
        .join('\n')
    );
    return { id: `console-${Date.now()}` };
  },
};
