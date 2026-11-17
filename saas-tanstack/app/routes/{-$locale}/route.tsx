import { createFileRoute, Outlet, notFound } from '@tanstack/react-router';
import { isEnabledLocale, normalizeLocale } from '~/lib/i18n';
import Navbar from '~/components/layout/navbar';
import Footer from '~/components/layout/footer';

/**
 * 所有公开页面的语言外层路由。
 *
 * `{-$locale}` 是可选路径段：
 *   /pricing     → params.locale === undefined → 默认语言
 *   /zh/pricing  → params.locale === 'zh'
 *
 * 未启用或不认识的前缀一律 404，避免 /fr/pricing 这类地址被当成有效页面
 * 收录，也防止把任意首段当成语言吞掉真实路由。
 */
export const Route = createFileRoute('/{-$locale}')({
  beforeLoad: ({ params }) => {
    const raw = (params as { locale?: string }).locale;
    if (raw !== undefined && !isEnabledLocale(raw)) {
      throw notFound();
    }
    return { locale: normalizeLocale(raw) };
  },
  component: LocaleLayout,
});

/**
 * 公开页面的统一页框。
 *
 * 之前 8 个叶子路由各自抄了一遍 `<Navbar/> + <main id="main"> + <Footer/>`，
 * 于是 main 的上边距、区块的纵向节奏、容器宽度各写各的 —— 页面之间对不齐
 * 的根源就在这里。页框收到这一层之后，叶子路由只负责自己的内容。
 *
 * pt-16 是给固定导航栏留的位置（导航高度 h-16），不要在子页面里再补一次。
 */
function LocaleLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
