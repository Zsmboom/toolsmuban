import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import { locales, type Locale, defaultLocale } from '~/lib/i18n';

export default function LanguageSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
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

  const getCurrentLocale = (): Locale => {
    const segments = location.pathname.split('/');
    const potentialLocale = segments[1];
    if (locales.includes(potentialLocale as Locale)) {
      return potentialLocale as Locale;
    }
    return defaultLocale;
  };

  const currentLocale = getCurrentLocale();

  const handleLanguageChange = (locale: Locale) => {
    const segments = location.pathname.split('/');
    let newPath: string;
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = locale;
      newPath = segments.join('/');
    } else {
      newPath = `/${locale}${location.pathname}`;
    }
    navigate({ to: newPath });
    setIsOpen(false);
  };

  const languageNames: Record<Locale, string> = {
    en: 'English',
    zh: '中文',
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-xl hover:bg-accent hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 cursor-pointer"
      >
        <span>{languageNames[currentLocale]}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden" role="menu">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => handleLanguageChange(locale)}
              role="menuitem"
              className={`block w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${
                locale === currentLocale
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              {languageNames[locale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
