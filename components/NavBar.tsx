// components/NavBar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { LawazemLogo } from './LawazemLogo';

const NAV = [
  { href: '/lawazem', label: 'الملازم' },
  { href: '/channels', label: 'القنوات' },
  { href: '/schedule', label: 'الجدول' },
  { href: '/dictionary', label: 'القاموس' },
  { href: '/translate', label: 'المترجم' },
  { href: '/gpa', label: 'المعدل' },
  { href: '/study-health', label: 'صحتك' },
] as const;

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-paper/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="group flex flex-shrink-0 items-center gap-2 transition-transform active:scale-95"
        >
          <LawazemLogo className="h-8 w-8 transition-transform group-hover:scale-105" />
          <span className="text-base font-black text-ink sm:text-lg">لوازم</span>
        </Link>

        <div className="hidden flex-1 items-center justify-end gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex-shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all duration-200 lg:px-3 lg:text-sm ${
                  active
                    ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.20)]'
                    : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-shrink-0 items-center md:border-r-0 md:pr-0">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}