import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import LanguageSwitcher from '~/components/language/language-switcher';
import ThemeToggle from '~/components/ui/theme-toggle';
import { buttonClass } from '~/components/ui/button';
import { useAuth } from '~/lib/auth/context';
import { useTranslations } from '~/lib/i18n-context';
import { siteConfig } from '~/lib/site-config';
import { cn } from '~/lib/utils';

const NAV_LINKS = [
  { to: '/{-$locale}/features', labelKey: 'features' },
  { to: '/{-$locale}/pricing', labelKey: 'pricing' },
  { to: '/{-$locale}/blog', labelKey: 'blog' },
  { to: '/{-$locale}/about', labelKey: 'about' },
] as const;

/**
 * 导航固定在顶部，靠一条 1px 下边框和半透明底与内容分开 ——
 * 之前那个悬浮的圆角毛玻璃胶囊（glass-strong + rounded-2xl + shadow）
 * 与全站「发丝边框、无阴影」的体系是冲突的。
 *
 * 导航不跟随页面的 data-accent 变色：全站不变的锚点跟着内容变色，
 * 会让人以为跳到别的站去了。
 */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const t = useTranslations('nav');
  const tc = useTranslations('common');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const linkClass =
    'inline-flex min-h-11 items-center rounded-[var(--radius)] px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground';

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link
          to="/{-$locale}"
          className="text-base font-medium tracking-tight text-foreground transition-colors hover:text-primary"
        >
          {siteConfig.name}
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label={t('primary')}>
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={linkClass}>
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <LanguageSwitcher />
          {user ? (
            <Link to="/dashboard" className={buttonClass({ variant: 'primary' })}>
              {tc('dashboard')}
            </Link>
          ) : (
            <>
              <Link to="/login" className={buttonClass({ variant: 'ghost' })}>
                {tc('login')}
              </Link>
              <Link to="/login" className={buttonClass({ variant: 'primary' })}>
                {tc('signup')}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[var(--radius)] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={t('toggleMenu')}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div id="mobile-menu" className="border-t border-border bg-background md:hidden">
          <div className="shell flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={linkClass}
                onClick={() => setIsOpen(false)}
              >
                {t(link.labelKey)}
              </Link>
            ))}
            <div className="mt-3 border-t border-border pt-3">
              <LanguageSwitcher />
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {user ? (
                <Link
                  to="/dashboard"
                  className={cn(buttonClass({ variant: 'primary', block: true }))}
                  onClick={() => setIsOpen(false)}
                >
                  {tc('dashboard')}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={cn(buttonClass({ variant: 'secondary', block: true }))}
                    onClick={() => setIsOpen(false)}
                  >
                    {tc('login')}
                  </Link>
                  <Link
                    to="/login"
                    className={cn(buttonClass({ variant: 'primary', block: true }))}
                    onClick={() => setIsOpen(false)}
                  >
                    {tc('signup')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
