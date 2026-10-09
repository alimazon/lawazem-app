// components/NavBar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

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
        <Link href="/" className="group flex flex-shrink-0 items-center gap-2 transition-transform active:scale-95">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </span>
          <span className="text-base font-black text-ink sm:text-lg">لوازم</span>
        </Link>

        <div className="hidden flex-1 items-center justify-end gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
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