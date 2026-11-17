import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from '~/lib/i18n-context';
import { cn } from '~/lib/utils';

export type ThemeChoice = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'theme';

/**
 * 在页面渲染**之前**执行的脚本，由 __root.tsx 内联注入。
 * 不这么做，深色模式用户每次进站都会先闪一下白屏。
 *
 * 只写 data-theme；跟随系统的情况什么都不写，交给
 * globals.css 里的 prefers-color-scheme 处理。
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})()`;

function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === 'system') {
    root.removeAttribute('data-theme');
    localStorage.removeItem(THEME_STORAGE_KEY);
  } else {
    root.setAttribute('data-theme', choice);
    localStorage.setItem(THEME_STORAGE_KEY, choice);
  }
}

const ORDER: ThemeChoice[] = ['light', 'dark', 'system'];
const ICON = { light: Sun, dark: Moon, system: Monitor } as const;

/**
 * 浅色 / 深色 / 跟随系统三态循环。
 *
 * 服务端渲染时读不到 localStorage，所以先渲染一个占位的同尺寸按钮，
 * 挂载后再显示真实状态 —— 否则 hydration 会不匹配。
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations('theme');
  const [choice, setChoice] = useState<ThemeChoice>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') setChoice(stored);
  }, []);

  const next = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length];
  const Icon = ICON[choice];

  return (
    <button
      type="button"
      onClick={() => {
        setChoice(next);
        applyTheme(next);
      }}
      aria-label={t(`switchTo.${next}`)}
      title={mounted ? t(`current.${choice}`) : undefined}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius)]',
        'text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer',
        className,
      )}
    >
      {mounted ? <Icon className="h-4 w-4" aria-hidden="true" /> : <span className="h-4 w-4" />}
    </button>
  );
}
