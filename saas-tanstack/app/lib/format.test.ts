import { describe, it, expect } from 'vitest';
import { formatDate, formatDateShort, formatDateTime, formatMoney, formatNumber } from './format';

/**
 * 这些函数存在的唯一理由就是「服务端和客户端必须输出完全一样的字符串」。
 * 之前用 toLocaleDateString() 时，SSR 在 UTC、浏览器在本地时区，
 * 同一时间点渲染出不同文本，直接导致 React 水合失败、页面失去交互。
 */
describe('deterministic formatting', () => {
  const t = '2026-08-17T02:30:00Z';

  it('日期不随运行环境时区变化', () => {
    expect(formatDateShort(t)).toBe('2026-08-17');
    expect(formatDateTime(t)).toBe('2026-08-17 02:30 UTC');
  });

  it('临近午夜的时间点也不会跨天漂移', () => {
    // 东八区看是 8/17 07:50，UTC 是 8/16 23:50 —— 必须稳定输出 UTC 那个
    expect(formatDateShort('2026-08-16T23:50:00Z')).toBe('2026-08-16');
  });

  it('同一输入多次调用结果一致', () => {
    expect(formatDateTime(t)).toBe(formatDateTime(new Date(t)));
    expect(formatDateShort(t)).toBe(formatDateShort(new Date(t).getTime()));
  });

  it('空值渲染成占位符而不是 Invalid Date', () => {
    expect(formatDateShort(null)).toBe('—');
    expect(formatDateShort(undefined)).toBe('—');
    expect(formatDateTime(null)).toBe('—');
  });

  it('按语言输出长日期', () => {
    expect(formatDate(t, 'en')).toBe('August 17, 2026');
    expect(formatDate(t, 'zh')).toContain('2026');
  });

  it('数字与金额使用固定分隔符', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatMoney(2999)).toBe('$29.99');
    expect(formatMoney(0)).toBe('$0.00');
  });
});
