import type { Locale } from './i18n';

/**
 * 确定性的日期/数字格式化。
 *
 * 为什么不能直接用 `toLocaleDateString()` / `toLocaleString()`：
 * 它们依赖运行环境的时区和默认语言。SSR 在 Cloudflare Workers 上跑，时区恒为
 * UTC；浏览器则是用户本地时区。同一个时间点会被渲染成不同文本，React водом
 * 水合时发现服务端和客户端不一致，会直接丢弃服务端 HTML 重新渲染整棵子树 ——
 * 轻则闪烁，重则事件处理器挂不上去、按钮点了没反应。
 *
 * 所以这里一律显式指定 timeZone 和 locale，保证两端输出完全一致。
 */

const LOCALE_TAG: Record<Locale, string> = {
  en: 'en-US',
  zh: 'zh-CN',
};

/** 展示用时区。想按用户本地时区显示，见文件末尾的 useLocalTime 说明。 */
const DISPLAY_TIME_ZONE = 'UTC';

function tag(locale: Locale | undefined): string {
  return locale ? (LOCALE_TAG[locale] ?? 'en-US') : 'en-US';
}

/** 2026年8月17日 / August 17, 2026 */
export function formatDate(value: Date | string | number, locale?: Locale): string {
  return new Intl.DateTimeFormat(tag(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(value));
}

/** 2026-08-17，用于表格等紧凑场景 */
export function formatDateShort(value: Date | string | number | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(value));
}

/** 2026-08-17 13:26 UTC */
export function formatDateTime(value: Date | string | number | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  // 日期和时间分开取再自己拼，避免不同 locale 插入逗号等分隔符
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: DISPLAY_TIME_ZONE,
  }).format(date);
  return `${formatDateShort(date)} ${time} UTC`;
}

/** 千分位。固定用 en-US，避免不同环境分隔符不一致 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/** 金额，入参单位为分 */
export function formatMoney(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/**
 * 版权年份。
 *
 * `new Date().getFullYear()` 在跨年那一刻服务端和客户端也可能不同，
 * 而且会让页面 HTML 每年变一次却拿不到构建标记。这里取构建时的年份，
 * 由 Vite 在构建阶段静态替换。
 */
export const BUILD_YEAR = new Date().getUTCFullYear();

/**
 * 想按用户本地时区显示时间，不要改上面的函数 —— 那会重新引入水合不一致。
 * 正确做法是先渲染 UTC，挂载后再切成本地时区：
 *
 *   const [local, setLocal] = useState(false);
 *   useEffect(() => setLocal(true), []);
 *   return <time>{local ? d.toLocaleString() : formatDateTime(d)}</time>;
 */
