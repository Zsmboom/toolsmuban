import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import {
  ENABLED_LOCALES,
  isMultiLocaleEnabled,
  localeNames,
  localizedPath,
  stripLocalePrefix,
  type Locale,
} from '~/lib/i18n';
import { setLocaleFn } from '~/lib/i18n-server';
import { useI18n, useTranslations } from '~/lib/i18n-context';
import { buttonClass } from '~/components/ui/button';

/**
 * 语言切换器。
 *
 * 切换语言 = 跳到同一页面的另一个语言 URL（默认语言无前缀，其它带前缀），
 * 同时把选择写进 cookie 以便下次引导。
 *
 * 只启用一种语言时整个组件不渲染 —— 单语言站点不该出现语言选项。
 */
export default function LanguageSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale: currentLocale } = useI18n();
  const t = useTranslations('nav');
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  if (!isMultiLocaleEnabled) return null;

  const handleLanguageChange = async (locale: Locale) => {
    setIsOpen(false);
    if (locale === currentLocale) return;

    // 当前 URL 剥掉语言前缀，换算成目标语言的地址
    const { path } = stripLocalePrefix(location.pathname);
    const target = localizedPath(path, locale);

    try {
      await setLocaleFn({ data: { locale } });
    } catch (error) {
      console.error('Failed to persist language preference:', error);
    }

    await navigate({ to: target, replace: false });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('changeLanguage')}
        className={buttonClass({ variant: 'secondary', size: 'md' })}
      >
        <span>{localeNames[currentLocale]}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="surface absolute right-0 z-50 mt-2 w-40 overflow-hidden"
          role="menu"
        >
          {ENABLED_LOCALES.map((locale) => (
            <button
              key={locale}
              onClick={() => handleLanguageChange(locale)}
              role="menuitem"
              className={`flex min-h-11 w-full cursor-pointer items-center px-4 text-left text-sm transition-colors ${
                locale === currentLocale
                  ? 'bg-brand-subtle font-medium text-primary'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              {localeNames[locale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
