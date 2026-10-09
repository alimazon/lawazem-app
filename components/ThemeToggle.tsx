// components/ThemeToggle.tsx
'use client';

import { useTheme } from './ThemeProvider';
import { IconSun, IconMoon } from '@/components/ui/Icons';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === 'light' ? 'التحويل إلى الوضع الليلي' : 'التحويل إلى الوضع النهاري'
      }
      title={theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}
      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-field text-ink-soft transition-all duration-200 hover:bg-ink/5 hover:text-ink active:scale-95"
    >
      {/* الشمس */}
      <IconSun
        className={`absolute h-4 w-4 transition-all duration-300 ${
          theme === 'light'
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0'
        }`}
      />

      {/* القمر */}
      <IconMoon
        className={`absolute h-4 w-4 transition-all duration-300 ${
          theme === 'dark'
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        }`}
      />
    </button>
  );
}