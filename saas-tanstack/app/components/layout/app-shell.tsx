import { Link, useLocation, useRouter } from '@tanstack/react-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  ScrollText,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { User } from '~/lib/auth';
import { useAuth } from '~/lib/auth/context';
import { useTranslations } from '~/lib/i18n-context';
import ThemeToggle from '~/components/ui/theme-toggle';
import { cn } from '~/lib/utils';

/**
 * 登录后的统一外壳。
 *
 * 重设计之前这里有三份近乎逐字相同的侧栏（桌面 / 移动 / admin），
 * 外加 7 个页面各自手抄一串 `flex-1 p-8 ml-0 md:ml-64 pt-20` ——
 * 而那串 `md:ml-64` 与同一个 flex 行里 `w-64` 的侧栏是**双重偏移**，
 * 宽屏上内容会被推出去 256px。这里用正常的 flex 布局，不再有 margin 补偿。
 */

type NavItem = { key: string; href: string; icon: LucideIcon };

const APP_NAV: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'tools', href: '/tools', icon: Wrench },
  { key: 'settings', href: '/settings', icon: SettingsIcon },
];

const ADMIN_NAV: NavItem[] = [
  { key: 'overview', href: '/admin', icon: LayoutDashboard },
  { key: 'subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { key: 'payments', href: '/admin/payments', icon: Receipt },
  { key: 'users', href: '/admin/users', icon: Users },
  { key: 'logs', href: '/admin/logs', icon: ScrollText },
  { key: 'analytics', href: '/admin/analytics', icon: BarChart3 },
];

const navLinkClass = (active: boolean) =>
  cn(
    'flex min-h-11 items-center gap-3 rounded-[var(--radius)] px-3 text-sm transition-colors',
    active
      ? 'bg-brand-subtle font-medium text-primary'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
  );

function UserCard({ user }: { user: User }) {
  const t = useTranslations('appNav');
  return (
    <div className="flex items-center gap-3 border-b border-border p-4">
      {user.image ? (
        <img src={user.image} alt="" className="h-9 w-9 rounded-full" />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-subtle text-sm font-medium text-primary">
          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '·'}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name || t('anonymous')}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
    </div>
  );
}

function NavBody({
  user,
  variant,
  onNavigate,
}: {
  user: User;
  variant: 'app' | 'admin';
  onNavigate?: () => void;
}) {
  const t = useTranslations('appNav');
  const location = useLocation();
  const { logout } = useAuth();
  const router = useRouter();

  const items = variant === 'admin' ? ADMIN_NAV : APP_NAV;

  /** 真正销毁服务端会话，再回首页；只做跳转的话登出等于没登出 */
  const handleLogout = async () => {
    onNavigate?.();
    await logout();
    await router.invalidate();
    await router.navigate({ to: '/{-$locale}' });
  };

  return (
    <div className="flex h-full flex-col">
      {variant === 'admin' ? (
        <div className="border-b border-border p-4">
          <p className="eyebrow">{t('adminPanel')}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t('adminPanelHint')}</p>
        </div>
      ) : null}

      <UserCard user={user} />

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={navLinkClass(location.pathname === item.href)}
            aria-current={location.pathname === item.href ? 'page' : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t(item.key)}
          </Link>
        ))}

        {variant === 'app' && user.role === 'admin' ? (
          <Link to="/admin" onClick={onNavigate} className={navLinkClass(false)}>
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('admin')}
          </Link>
        ) : null}

        {variant === 'admin' ? (
          <Link to="/dashboard" onClick={onNavigate} className={navLinkClass(false)}>
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('backToApp')}
          </Link>
        ) : null}
      </nav>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={handleLogout}
          className={cn(navLinkClass(false), 'w-full cursor-pointer')}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('logout')}
        </button>
      </div>
    </div>
  );
}

export default function AppShell({
  user,
  variant = 'app',
  title,
  description,
  actions,
  children,
}: {
  user: User;
  variant?: 'app' | 'admin';
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations('appNav');
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // 路由一变就收起抽屉，否则跳过去之后抽屉还盖在内容上
  useEffect(() => setOpen(false), [location.pathname]);

  // 抽屉打开时锁住背景滚动，并支持 Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* 桌面侧栏：正常的 flex 列，不用 fixed + margin 补偿 */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block">
        <div className="sticky top-0 h-screen">
          <NavBody user={user} variant={variant} />
        </div>
      </aside>

      {/* 移动抽屉 */}
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label={t('closeMenu')}
            className="absolute inset-0 bg-overlay/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-border bg-card">
            <NavBody user={user} variant={variant} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 移动顶栏：汉堡不再 fixed 悬在内容上方 */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/90 px-4 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t('openMenu')}
            aria-expanded={open}
            className="-ml-2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[var(--radius)] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="truncate text-sm font-medium">{title}</span>
          <ThemeToggle className="ml-auto -mr-2" />
        </div>

        <main id="main" className="flex-1">
          <div className="shell py-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="display-3 text-foreground">{title}</h1>
                {description ? (
                  <p className="measure mt-2 text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                {actions}
                <ThemeToggle className="hidden md:inline-flex" />
              </div>
            </div>

            <div className="mt-10">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
