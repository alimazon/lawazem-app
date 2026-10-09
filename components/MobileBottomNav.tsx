// components/MobileBottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useDismissable } from '@/hooks/useDismissable';
import {
  IconBook,
  IconCalendar,
  IconChannels,
  IconGpa,
  IconHealth,
  IconHome,
  IconMore,
  IconSearch,
  IconSwap,
} from '@/components/ui/Icons';

// ==================== Types ====================
interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  accent?: 'gold';
  isNew?: boolean;
}

interface MobileBottomNavProps {
  reserveSpace?: boolean;
}

// ==================== Constants ====================
const STAGE_KEY = 'student_stage';
const STAGE_2_VALUE = 'المرحلة الثانية';
const STAGE_EVENT = 'student-stage-change';

const HIDDEN_PREFIXES: readonly string[] = ['/admin', '/channel-portal', '/publisher'];

// ==================== Items ====================
const BASE_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'الرئيسية', icon: <IconHome /> },
  { href: '/lawazem', label: 'الملازم', icon: <IconBook /> },
  { href: '/dictionary', label: 'القاموس', icon: <IconSearch /> },
  { href: '/schedule', label: 'الجدول', icon: <IconCalendar /> },
];

const MORE_ITEMS: readonly NavItem[] = [
  { href: '/channels', label: 'القنوات', icon: <IconChannels /> },
  { href: '/gpa', label: 'المعدل', icon: <IconGpa /> },
  { href: '/study-health', label: 'صحتك', icon: <IconHealth /> },
];

const STAGE_2_ITEM: NavItem = {
  href: '/group-swap',
  label: 'تبديل',
  icon: <IconSwap />,
  accent: 'gold',
};

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

function haptic(): void {
  try {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      navigator.vibrate(8);
    }
  } catch {
    /* تجاهل */
  }
}

function subscribeStage(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(STAGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(STAGE_EVENT, onChange);
  };
}
function readStage(): string | null {
  try {
    return localStorage.getItem(STAGE_KEY);
  } catch {
    return null;
  }
}
function readServerStage(): string | null {
  return null;
}

// ==================== Styles ====================
function tabClass(active: boolean): string {
  return [
    'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 py-1.5',
    'text-[11px] font-medium',
    'transition-colors duration-200 ease-[var(--ease-editorial)]',
    'active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100',
    'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal',
    active ? 'text-teal' : 'text-ink-muted hover:text-ink',
  ].join(' ');
}

function sheetLinkClass(active: boolean, isGold: boolean): string {
  return [
    isGold ? 'col-span-3 flex flex-row gap-2' : 'flex flex-col gap-1',
    'min-h-16 items-center justify-center rounded-field px-2 py-2 text-xs font-medium',
    'transition-colors duration-200 ease-[var(--ease-editorial)] motion-reduce:transition-none',
    'active:scale-95 motion-reduce:active:scale-100',
    'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal',
    active
      ? isGold
        ? 'bg-gold/15 text-gold-ink'
        : 'bg-teal/10 text-teal'
      : isGold
        ? 'text-gold-ink hover:bg-gold/10'
        : 'text-ink-muted hover:bg-teal/5 hover:text-ink',
  ].join(' ');
}

// ==================== Small Parts ====================
function TabContent({
  icon,
  label,
  active,
  isNew,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  isNew?: boolean;
}) {
  return (
    <>
      <span
        aria-hidden="true"
        className={[
          'absolute inset-x-5 top-0 h-[2px] origin-center rounded-b-full bg-gold',
          'transition-transform duration-300 ease-[var(--ease-editorial)] motion-reduce:transition-none',
          active ? 'scale-x-100' : 'scale-x-0',
        ].join(' ')}
      />
      <span
        className={[
          'relative flex h-7 w-12 items-center justify-center rounded-full',
          'transition-colors duration-200 ease-[var(--ease-editorial)] motion-reduce:transition-none',
          active ? 'bg-teal/10' : 'bg-transparent',
        ].join(' ')}
      >
        {icon}
        {isNew ? (
          <>
            <span
              aria-hidden="true"
              className="absolute end-1.5 top-0.5 h-2 w-2 rounded-full bg-coral"
            />
            <span className="sr-only">جديد</span>
          </>
        ) : null}
      </span>
      <span className="leading-none">{label}</span>
    </>
  );
}

// ==================== Component ====================
export function MobileBottomNav({
  reserveSpace = false,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const currentPath = pathname ?? '';

  const stage = useSyncExternalStore(
    subscribeStage,
    readStage,
    readServerStage
  );

  const [openPath, setOpenPath] = useState<string | null>(null);
  const moreOpen = openPath !== null && openPath === currentPath;

  const navRef = useRef<HTMLElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  useDismissable(moreOpen, navRef, (viaKeyboard) => {
    setOpenPath(null);
    if (viaKeyboard) moreButtonRef.current?.focus();
  });

  if (isPathHidden(pathname)) return null;

  const showSwap = stage === STAGE_2_VALUE;
  const sheetItems: readonly NavItem[] = showSwap
    ? [STAGE_2_ITEM, ...MORE_ITEMS]
    : MORE_ITEMS;
  const moreActive = sheetItems.some((item) =>
    isPathActive(pathname, item.href)
  );

  return (
    <>
      <nav
        ref={navRef}
        className="nav-glass fixed inset-x-0 bottom-0 z-[var(--z-nav)] md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="التنقل السفلي"
      >
        <div
          id="mobile-more-sheet"
          inert={!moreOpen}
          className={[
            'card-editorial absolute inset-x-3 bottom-full mx-auto mb-2 max-w-md p-2 shadow-md',
            'transition-[opacity,transform] duration-200 ease-[var(--ease-editorial)] motion-reduce:transition-none',
            moreOpen
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-2 opacity-0',
          ].join(' ')}
        >
          <ul className="grid grid-cols-3 gap-1">
            {sheetItems.map((item) => {
              const active = isPathActive(pathname, item.href);
              const isGold = item.accent === 'gold';
              return (
                <li
                  key={item.href}
                  className={isGold ? 'col-span-3' : undefined}
                >
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => {
                      haptic();
                      setOpenPath(null);
                    }}
                    className={sheetLinkClass(active, isGold)}
                  >
                    <span className="flex h-6 items-center justify-center">
                      {item.icon}
                    </span>
                    <span className="leading-none">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mx-auto flex max-w-md items-stretch justify-around px-1">
          {BASE_ITEMS.map((item) => {
            const active = isPathActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  haptic();
                  setOpenPath(null);
                }}
                className={tabClass(active)}
              >
                <TabContent
                  icon={item.icon}
                  label={item.label}
                  active={active}
                  isNew={item.isNew}
                />
              </Link>
            );
          })}

          <button
            ref={moreButtonRef}
            type="button"
            aria-expanded={moreOpen}
            aria-controls="mobile-more-sheet"
            onClick={() => {
              haptic();
              setOpenPath(moreOpen ? null : currentPath);
            }}
            className={tabClass(moreActive || moreOpen)}
          >
            <TabContent
              icon={<IconMore />}
              label="المزيد"
              active={moreActive || moreOpen}
            />
          </button>
        </div>
      </nav>

      {reserveSpace ? (
        <div
          aria-hidden="true"
          className="md:hidden"
          style={{ height: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
        />
      ) : null}
    </>
  );
}