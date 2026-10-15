// app/_components/SectionTile.tsx
import Link from 'next/link';
import { useId } from 'react';
import type { ReactNode } from 'react';

// ==================== Types ====================
export type TileVariant =
  | 'featured'
  | 'teal'
  | 'gold'
  | 'coral'
  | 'navy'
  | 'locked';

export type TileSize =
  | 'hero'
  | 'wide'
  | 'small'
  | 'strip'
  | 'half'
  | 'third';

type Layout = 'hero' | 'wide' | 'small' | 'strip';

export interface SectionTileProps {
  href: string;
  title: string;
  kicker: string;
  description: string;
  icon: ReactNode;
  variant?: TileVariant;
  size?: TileSize;
  badge?: string;
  locked?: boolean;
  ctaLabel?: string;
  lockedLabel?: string;
  className?: string;
}

// ==================== Helpers ====================
function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function normalizeSize(size: TileSize): Layout {
  if (size === 'half') return 'wide';
  if (size === 'third') return 'small';
  return size;
}

// ==================== Styles ====================
interface VariantStyle {
  icon: string;
  kicker: string;
  title: string;
  desc: string;
  accent: string;
  surfaceHover: string;
}

const VARIANT_STYLE: Record<TileVariant, VariantStyle> = {
  featured: {
    icon: 'border border-on-teal/30 bg-on-teal/10 text-on-teal',
    kicker: 'text-on-teal/80',
    title: 'text-on-teal',
    desc: 'text-on-teal/85',
    accent: 'bg-on-teal/50',
    surfaceHover: '',
  },
  teal: {
    icon: 'border border-teal/25 bg-teal-soft text-teal',
    kicker: 'text-teal',
    title: 'text-ink',
    desc: 'text-ink-soft',
    accent: 'bg-teal',
    surfaceHover: 'hover:border-teal/40',
  },
  gold: {
    icon: 'border border-gold/25 bg-gold-soft text-gold-ink',
    kicker: 'text-gold-ink',
    title: 'text-ink',
    desc: 'text-ink-soft',
    accent: 'bg-gold',
    surfaceHover: 'hover:border-gold/40',
  },
  coral: {
    icon: 'border border-coral/25 bg-coral-soft text-coral-ink',
    kicker: 'text-coral-ink',
    title: 'text-ink',
    desc: 'text-ink-soft',
    accent: 'bg-coral',
    surfaceHover: 'hover:border-coral/40',
  },
  navy: {
    icon: 'border border-navy/25 bg-navy-soft text-navy-ink',
    kicker: 'text-navy-ink',
    title: 'text-ink',
    desc: 'text-ink-soft',
    accent: 'bg-navy',
    surfaceHover: 'hover:border-navy/40',
  },
  locked: {
    icon: 'border border-line bg-ink/5 text-ink-muted',
    kicker: 'text-ink-muted',
    title: 'text-ink-soft',
    desc: 'text-ink-muted',
    accent: '',
    surfaceHover: '',
  },
};

const ITEM_SPAN: Record<Layout, string> = {
  hero: 'col-span-2 lg:col-span-2 lg:row-span-2',
  wide: 'col-span-2 lg:col-span-2',
  small: 'col-span-1 lg:col-span-1',
  strip: 'col-span-2 lg:col-span-4',
};

const MIN_HEIGHT: Record<Layout, string> = {
  hero: 'min-h-[260px] sm:min-h-[280px] lg:min-h-[292px]',
  wide: 'min-h-[104px] lg:min-h-[116px]',
  small: 'min-h-[150px] sm:min-h-[160px]',
  strip: 'min-h-[84px]',
};

const PADDING: Record<Layout, string> = {
  hero: 'p-6 sm:p-8',
  wide: 'p-4 sm:p-5',
  small: 'p-4 sm:p-5',
  strip: 'px-4 py-3 sm:px-5',
};

const TITLE_SIZE: Record<Layout, string> = {
  hero: 'text-2xl sm:text-3xl lg:text-4xl',
  wide: 'text-lg sm:text-xl',
  small: 'text-base sm:text-lg',
  strip: 'text-base sm:text-lg',
};

const DESC_SIZE: Record<Layout, string> = {
  hero: 'text-sm sm:text-base',
  wide: 'text-xs sm:text-sm',
  small: 'text-xs sm:text-sm',
  strip: 'text-xs sm:text-sm',
};

const DESC_CLAMP: Record<Layout, string> = {
  hero: 'max-w-md',
  wide: 'line-clamp-2',
  small: 'line-clamp-3',
  strip: 'line-clamp-2',
};

const ICON_SIZE: Record<Layout, string> = {
  hero: 'h-12 w-12 sm:h-14 sm:w-14',
  wide: 'h-10 w-10 sm:h-11 sm:w-11',
  small: 'h-9 w-9 sm:h-10 sm:w-10',
  strip: 'h-9 w-9 sm:h-10 sm:w-10',
};

const LOCKED_HATCH =
  'bg-[repeating-linear-gradient(135deg,transparent_0,transparent_9px,var(--line)_9px,var(--line)_10px)]';

// ==================== Icons ====================
function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  );
}

// ==================== Grid ====================
export function SectionTileGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ul
      role="list"
      className={cx(
        'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-flow-dense',
        className,
      )}
    >
      {children}
    </ul>
  );
}

// ==================== Component ====================
export function SectionTile({
  href,
  title,
  kicker,
  description,
  icon,
  variant = 'teal',
  size = 'small',
  badge,
  locked = false,
  ctaLabel = 'افتح',
  lockedLabel = 'قريباً',
  className,
}: SectionTileProps) {
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;
  const lockId = `${uid}-lock`;

  const layout = normalizeSize(size);
  const v: TileVariant = locked ? 'locked' : variant;
  const style = VARIANT_STYLE[v];
  const isFeatured = v === 'featured';
  const isHero = layout === 'hero';

  // ---------- Icon ----------
  const iconBox = (
    <span
      aria-hidden="true"
      className={cx(
        'flex flex-shrink-0 items-center justify-center rounded-field transition-transform duration-300 motion-reduce:transition-none',
        'group-hover:scale-105 motion-reduce:group-hover:scale-100',
        ICON_SIZE[layout],
        style.icon,
      )}
    >
      {icon}
    </span>
  );

  // ---------- Badges ----------
  const badges =
    badge || locked ? (
      <div className="flex flex-wrap items-center gap-1.5">
        {badge && (
          <span
            className={cx(
              'inline-flex items-center rounded-chip px-2 py-0.5 text-[11px] font-bold',
              isFeatured
                ? 'bg-on-teal text-teal'
                : 'bg-gold-tint text-gold-ink ring-1 ring-gold/30',
            )}
          >
            {badge}
          </span>
        )}
        {locked && (
          <span
            id={lockId}
            className="inline-flex items-center gap-1 rounded-chip bg-ink/8 px-2 py-0.5 text-[11px] font-bold text-ink-soft"
          >
            <LockIcon />
            {lockedLabel}
          </span>
        )}
      </div>
    ) : null;

  // ---------- Arrow ----------
  const arrow = !locked ? (
    <ArrowIcon
      className={cx(
        'h-4 w-4 flex-shrink-0 transition-all duration-300 group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0',
        isFeatured
          ? 'text-on-teal/80'
          : 'text-ink-muted group-hover:text-ink',
      )}
    />
  ) : null;

  // ---------- Body ----------
  const body = (
    <div className="min-w-0">
      <p
        className={cx(
          'flex items-center gap-2 text-xs font-semibold',
          style.kicker,
        )}
      >
        <span
          aria-hidden="true"
          className="block h-px w-4 flex-shrink-0 bg-current opacity-70 transition-[width] duration-500 group-hover:w-8 motion-reduce:transition-none motion-reduce:group-hover:w-4"
        />
        {kicker}
      </p>
      <h3
        id={titleId}
        className={cx(
          'mt-1.5 font-display font-bold leading-tight',
          style.title,
          TITLE_SIZE[layout],
        )}
      >
        {title}
      </h3>
      <p
        id={descId}
        className={cx(
          'mt-1.5 leading-relaxed',
          style.desc,
          DESC_SIZE[layout],
          DESC_CLAMP[layout],
        )}
      >
        {description}
      </p>
    </div>
  );

  // ---------- CTA (hero only) ----------
  const cta =
    isHero && !locked ? (
      <span
        className={cx(
          'mt-6 inline-flex w-fit items-center gap-2 rounded-field px-4 py-2 text-sm font-semibold transition-all duration-300 group-hover:gap-3 motion-reduce:transition-none motion-reduce:group-hover:gap-2',
          isFeatured ? 'bg-on-teal text-teal' : 'bg-teal text-on-teal',
        )}
      >
        {ctaLabel}
        <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
      </span>
    ) : null;

  // ---------- Layout ----------
  let inner: ReactNode;

  if (layout === 'hero') {
    // ═══ Hero ═══
    inner = (
      <>
        <div className="flex items-start justify-between gap-3">
          {iconBox}
          {badges && <div>{badges}</div>}
        </div>
        <div className="mt-auto pt-10">
          {body}
          {cta}
        </div>
      </>
    );
  } else if (layout === 'small') {
    // ═══ Small (عمودي) ═══
    inner = (
      <>
        <div className="flex items-start justify-between gap-2">
          {iconBox}
          <div className="flex items-center gap-2">
            {badges}
            {arrow}
          </div>
        </div>
        <div className="mt-auto pt-5">{body}</div>
      </>
    );
  } else if (layout === 'wide') {
    // ═══ Wide (أفقي) ═══
    inner = (
      <div className="flex flex-1 items-center gap-4">
        {iconBox}
        <div className="min-w-0 flex-1">{body}</div>
        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          {badges}
          {arrow}
        </div>
      </div>
    );
  } else {
    // ═══ Strip (شريط رفيع) ═══
    inner = (
      <div className="flex flex-1 items-center gap-4">
        {iconBox}
        <div className="min-w-0 flex-1">{body}</div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {badges}
        </div>
      </div>
    );
  }

  // ---------- Surface ----------
  const surface = (
    <>
      {/* خط سفلي ينمو من المنتصف عند hover */}
      {style.accent && (
        <span
          aria-hidden="true"
          className={cx(
            'pointer-events-none absolute inset-x-0 bottom-0 block h-[2px] origin-center scale-x-0 transition-transform duration-500',
            'group-hover:scale-x-100 group-focus-visible:scale-x-100',
            'motion-reduce:transition-none',
            style.accent,
          )}
        />
      )}

      {/* إطار داخلي وزخرفة دائرية لبطاقة hero */}
      {isFeatured && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-2 block rounded-[inherit] border border-on-teal/15"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -end-20 block h-64 w-64 rounded-full border border-on-teal/15"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -end-10 block h-40 w-40 rounded-full border border-on-teal/15"
          />
        </>
      )}

      <div
        className={cx(
          'relative z-10 flex min-w-0 flex-1 flex-col',
          PADDING[layout],
        )}
      >
        {inner}
      </div>
    </>
  );

  const itemClass = cx('flex min-w-0', ITEM_SPAN[layout], className);

  // ==================== Locked ====================
  if (locked) {
    return (
      <li className={itemClass}>
        <div
          role="link"
          aria-disabled="true"
          aria-labelledby={titleId}
          aria-describedby={`${descId} ${lockId}`}
          className={cx(
            'relative flex min-w-0 flex-1 cursor-not-allowed overflow-hidden rounded-card border border-dashed border-line bg-paper-soft/60',
            LOCKED_HATCH,
            MIN_HEIGHT[layout],
          )}
        >
          {surface}
        </div>
      </li>
    );
  }

  // ==================== Active Link ====================
  const linkClass = isFeatured
    ? cx(
        'relative flex min-w-0 flex-1 overflow-hidden rounded-card bg-teal text-on-teal shadow-xs transition-all duration-300',
        'hover:-translate-y-px hover:shadow-sm',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        MIN_HEIGHT[layout],
      )
    : cx(
        'card-editorial card-editorial-hover relative flex min-w-0 flex-1 overflow-hidden rounded-card',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal',
        style.surfaceHover,
        MIN_HEIGHT[layout],
      );

  return (
    <li className={itemClass}>
      <Link
        href={href}
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cx('group', linkClass)}
      >
        {surface}
      </Link>
    </li>
  );
}