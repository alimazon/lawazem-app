// components/NavBar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { useDismissable } from '@/hooks/useDismissable';
import { IconChevronDown } from '@/components/ui/Icons';

// ==================== Types ====================
interface NavLinkItem {
  href: string;
  label: string;
  isNew?: boolean;
}

// ==================== Nav Config ====================
const PRIMARY_NAV: readonly NavLinkItem[] = [
  { href: '/lawazem', label: 'الملازم' },
  { href: '/channels', label: 'القنوات' },
  { href: '/schedule', label: 'الجدول' },
  { href: '/dictionary', label: 'القاموس' },
];

const SECONDARY_NAV: readonly NavLinkItem[] = [
  { href: '/gpa', label: 'المعدل' },
  { href: '/study-health', label: 'صحتك' },
];

const HIDDEN_PREFIXES: readonly string[] = ['/admin', '/channel-portal', '/publisher'];

// ==================== Helpers ====================
function matchesPath(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

function isPathActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return matchesPath(pathname, href);
}

function isPathHidden(pathname: string | null): boolean {
  if (!pathname) return false;
  return HIDDEN_PREFIXES.some((prefix) => matchesPath(pathname, prefix));
}

// ==================== Styles ====================
const LINK_BASE = [
  'relative inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-field px-3',
  'text-[13px] font-medium lg:text-sm',
  'transition-colors duration-200 ease-[var(--ease-editorial)] motion-reduce:transition-none',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal',
  'after:absolute after:inset-x-3 after:bottom-1 after:h-[2px] after:rounded-full after:bg-gold',
  'after:origin-center after:transition-transform after:duration-300',
  'after:ease-[var(--ease-editorial)] motion-reduce:after:transition-none',
].join(' ');

function linkClass(active: boolean): string {
  return [
    LINK_BASE,
    active
      ? 'text-teal after:scale-x-100'
      : 'text-ink-muted after:scale-x-0 hover:text-ink hover:after:scale-x-50',
  ].join(' ');
}

function menuLinkClass(active: boolean): string {
  return [
    'flex min-h-11 items-center rounded-field px-3 text-sm font-medium',
    'transition-colors duration-200 ease-[var(--ease-editorial)] motion-reduce:transition-none',
    'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal',
    active
      ? 'bg-teal/10 text-teal'
      : 'text-ink-muted hover:bg-teal/5 hover:text-ink',
  ].join(' ');
}

// ==================== Small Parts ====================
function NewDot() {
  return (
    <>
      <span
        aria-hidden="true"
        className="ms-1.5 inline-block h-1.5 w-1.5 rounded-full bg-coral"
      />
      <span className="sr-only">جديد</span>
    </>
  );
}

// ==================== Component ====================
export function NavBar() {
  const pathname = usePathname();
  const currentPath = pathname ?? '';

  const [openPath, setOpenPath] = useState<string | null>(null);
  const moreOpen = openPath !== null && openPath === currentPath;

  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  useDismissable(moreOpen, moreRef, (viaKeyboard) => {
    setOpenPath(null);
    if (viaKeyboard) moreButtonRef.current?.focus();
  });

  if (isPathHidden(pathname)) return null;

  const moreActive = SECONDARY_NAV.some((item) =>
    isPathActive(pathname, item.href)
  );

  return (
    <header className="nav-glass sticky top-0 z-[var(--z-nav)]">
      <nav
        aria-label="التنقل الرئيسي"
        className="mx-auto flex h-[var(--nav-h)] max-w-6xl items-center justify-between gap-4 ps-[var(--gutter)] pe-[var(--gutter)]"
      >
        <Link
          href="/"
          aria-current={pathname === '/' ? 'page' : undefined}
          className="group flex shrink-0 items-center gap-2.5 rounded-field transition-transform active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            priority
            className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
          />
          <span className="font-display text-xl font-bold text-ink transition-colors group-hover:text-teal">
            لوازم
          </span>
        </Link>

        <div className="hidden flex-1 items-center justify-end gap-0.5 md:flex">
          {PRIMARY_NAV.map((item) => {
            const active = isPathActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={linkClass(active)}
              >
                {item.label}
                {item.isNew ? <NewDot /> : null}
              </Link>
            );
          })}

          <div className="hidden items-center gap-0.5 lg:flex">
            {SECONDARY_NAV.map((item) => {
              const active = isPathActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={linkClass(active)}
                >
                  {item.label}
                  {item.isNew ? <NewDot /> : null}
                </Link>
              );
            })}
          </div>

          <div ref={moreRef} className="relative lg:hidden">
            <button
              ref={moreButtonRef}
              type="button"
              aria-expanded={moreOpen}
              aria-controls="navbar-more-menu"
              onClick={() => setOpenPath(moreOpen ? null : currentPath)}
              className={[linkClass(moreActive || moreOpen), 'gap-1'].join(' ')}
            >
              المزيد
              <IconChevronDown
                className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${
                  moreOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div
              id="navbar-more-menu"
              inert={!moreOpen}
              className={[
                'card-editorial absolute end-0 top-full mt-2 w-48 p-1.5 shadow-md',
                'transition-[opacity,transform] duration-200 ease-[var(--ease-editorial)] motion-reduce:transition-none',
                moreOpen
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none -translate-y-1 opacity-0',
              ].join(' ')}
            >
              <ul className="flex flex-col">
                {SECONDARY_NAV.map((item) => {
                  const active = isPathActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => setOpenPath(null)}
                        className={menuLinkClass(active)}
                      >
                        {item.label}
                        {item.isNew ? <NewDot /> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}