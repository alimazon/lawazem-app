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

/**
 * lg   : 2×2 على lg (2 عمود على الجوال) — للقسم الرئيسي
 * wide : 2×1 — تخطيط أفقي (أيقونة | نص | سهم)
 * sm   : 1×1
 * fill : 1×1 على الجوال/md، و2×1 على lg — يُستخدم لملء الفراغ عند غياب tile
 *        (مثل المرحلة الثالثة بدون تبديل الكروبات)
 */
export type TileSize = 'lg' | 'wide' | 'sm' | 'fill';

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
  /** نص زر الدعوة في البطاقة الكبيرة (lg) */
  ctaLabel?: string;
  /** نص شارة القفل */
  lockedLabel?: string;
  /** يُطبَّق على عنصر <li> */
  className?: string;
}

// ==================== Helpers ====================
function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

// ==================== Styles ====================
interface VariantStyle {
  icon: string;
  kicker: string;
  title: string;
  desc: string;
  /** لون الخط العلوي الذي ينمو عند hover/focus */
  accent: string;
}

const VARIANT_STYLE: Record<TileVariant, VariantStyle> = {
  featured: {
    icon: 'bg-on-teal/15 text-on-teal',
    kicker: 'text-on-teal/80',
    title: 'text-on-teal',
    desc: 'text-on-teal/85',
    accent: '',
  },
  teal: {
    icon: 'bg-teal-soft text-teal',
    kicker: 'text-teal',
    title: 'text-ink',
    desc: 'text-ink-soft',
    accent: 'bg-teal',
  },
  gold: {
    icon: 'bg-gold-soft text-gold-ink',
    kicker: 'text-gold-ink',
    title: 'text-ink',
    desc: 'text-ink-soft',
    accent: 'bg-gold',
  },
  coral: {
    icon: 'bg-coral-soft text-coral-ink',
    kicker: 'text-coral-ink',
    title: 'text-ink',
    desc: 'text-ink-soft',
    accent: 'bg-coral',
  },
  navy: {
    icon: 'bg-navy-soft text-navy-ink',
    kicker: 'text-navy-ink',
    title: 'text-ink',
    desc: 'text-ink-soft',
    accent: 'bg-navy',
  },
  locked: {
    icon: 'bg-ink/5 text-ink-muted',
    kicker: 'text-ink-muted',
    title: 'text-ink-soft',
    desc: 'text-ink-muted',
    accent: '',
  },
};

/** span الخاص بعنصر <li> داخل الشبكة */
const ITEM_SPAN: Record<TileSize, string> = {
  lg: 'col-span-2 lg:row-span-2',
  wide: 'col-span-2',
  sm: 'col-span-1',
  fill: 'col-span-1 lg:col-span-2',
};

const PADDING: Record<TileSize, string> = {
  lg: 'p-5 sm:p-7',
  wide: 'p-4 sm:p-5',
  sm: 'p-4 sm:p-5',
  fill: 'p-4 sm:p-5',
};

// سلّم الخطوط: lg > wide > sm — ويبقى h2 للأقسام (text-xl/2xl) أصغر من عنوان البطاقة الكبيرة
const TITLE_SIZE: Record<TileSize, string> = {
  lg: 'text-2xl sm:text-3xl',
  wide: 'text-lg sm:text-xl',
  sm: 'text-base sm:text-lg',
  fill: 'text-base sm:text-lg',
};

const DESC_SIZE: Record<TileSize, string> = {
  lg: 'text-sm sm:text-base',
  wide: 'text-xs sm:text-sm',
  sm: 'text-xs sm:text-sm',
  fill: 'text-xs sm:text-sm',
};

const FEATURED_SURFACE =
  'bg-teal text-on-teal shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0';

const LINK_BASE =
  'group relative flex min-w-0 flex-1 overflow-hidden rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal';

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
/**
 * حاوية الـbento. SectionTile يُنتج <li> لذلك يجب أن يكون داخل هذه الحاوية.
 * الشبكة: عمودان (جوال/sm/md) ← 4 أعمدة (lg).
 */
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
        'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:auto-rows-[minmax(10rem,auto)]',
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
  size = 'sm',
  badge,
  locked = false,
  ctaLabel = 'افتح',
  lockedLabel = 'مقفل',
  className,
}: SectionTileProps) {
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;
  const lockId = `${uid}-lock`;

  const v: TileVariant = locked ? 'locked' : variant;
  const style = VARIANT_STYLE[v];
  const isFeatured = v === 'featured';
  const isLarge = size === 'lg';
  const isWide = size === 'wide';
  const isStacked = size === 'sm' || size === 'fill';
  const hasTrailing = Boolean(badge) || locked || !isLarge;

  // ---------- Icon ----------
  const iconBox = (
    <span
      aria-hidden="true"
      className={cx(
        'flex flex-shrink-0 items-center justify-center rounded-field transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none',
        isLarge ? 'h-12 w-12' : 'h-10 w-10 sm:h-11 sm:w-11',
        style.icon,
      )}
    >
      {icon}
    </span>
  );

  // ---------- Trailing: badge + arrow / lock ----------
  const trailing = (
    <span className="flex flex-shrink-0 items-center gap-1.5">
      {badge && <span className="badge badge-gold">{badge}</span>}
      {locked ? (
        <span id={lockId} className="badge badge-neutral">
          <LockIcon />
          {lockedLabel}
        </span>
      ) : (
        !isLarge && (
          <ArrowIcon
            className={cx(
              'h-4 w-4 transition-all duration-300 group-hover:-translate-x-1 motion-reduce:transition-none',
              isFeatured
                ? 'text-on-teal/80'
                : 'text-ink-muted group-hover:text-teal',
            )}
          />
        )
      )}
    </span>
  );

  // ---------- Body: kicker + title + description ----------
  const body = (
    <div className="min-w-0">
      <p
        className={cx(
          'text-xs font-semibold',
          style.kicker,
          // على الجوال نُخفي الـkicker في البطاقات الصغيرة لتقليل الضجيج
          isStacked && 'hidden sm:block',
        )}
      >
        {kicker}
      </p>
      <h3
        id={titleId}
        className={cx(
          'mt-1 font-display font-bold leading-tight',
          style.title,
          TITLE_SIZE[size],
        )}
      >
        {title}
      </h3>
      <p
        id={descId}
        className={cx(
          'mt-1.5 leading-relaxed',
          style.desc,
          DESC_SIZE[size],
          isStacked && 'line-clamp-3 sm:line-clamp-none',
        )}
      >
        {description}
      </p>
    </div>
  );

  // ---------- Layout per size ----------
  const inner = isLarge ? (
    <>
      <div className="flex items-start justify-between gap-3">
        {iconBox}
        {hasTrailing && trailing}
      </div>
      <div className="mt-auto pt-10">{body}</div>
      {!locked && (
        <span
          className={cx(
            'mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold',
            isFeatured
              ? 'rounded-chip bg-on-teal px-4 py-2 text-teal'
              : 'text-teal',
          )}
        >
          {ctaLabel}
          <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none" />
        </span>
      )}
    </>
  ) : isWide ? (
    <>
      {iconBox}
      <div className="min-w-0 flex-1">{body}</div>
      {hasTrailing && trailing}
    </>
  ) : (
    <>
      <div className="flex items-start justify-between gap-2">
        {iconBox}
        {hasTrailing && trailing}
      </div>
      <div className="mt-auto pt-3">{body}</div>
    </>
  );

  const surface = (
    <>
      {/* خط علوي ينمو من المنتصف (غير مفعّل في featured/locked) */}
      {style.accent && (
        <span
          aria-hidden="true"
          className={cx(
            'pointer-events-none absolute inset-x-0 top-0 block h-[3px] origin-center scale-x-0 transition-transform duration-500 group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none',
            style.accent,
          )}
        />
      )}

      {/* زخرفة featured: دائرتان متحدتا المركز في الزاوية البعيدة عن النص */}
      {isFeatured && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -end-16 block h-56 w-56 rounded-full border border-on-teal/15"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-8 -end-8 block h-36 w-36 rounded-full border border-on-teal/15"
          />
        </>
      )}

      <div
        className={cx(
          'relative z-10 flex min-w-0 flex-1',
          isWide ? 'flex-row items-center gap-4' : 'flex-col',
          PADDING[size],
        )}
      >
        {inner}
      </div>
    </>
  );

  const itemClass = cx('flex min-w-0', ITEM_SPAN[size], className);

  // ==================== Locked ====================
  // نمط "الرابط المعطّل": role="link" + aria-disabled، بلا href وبلا tabindex.
  if (locked) {
    return (
      <li className={itemClass}>
        <div
          role="link"
          aria-disabled="true"
          aria-labelledby={titleId}
          aria-describedby={`${descId} ${lockId}`}
          className="flex min-w-0 flex-1 cursor-not-allowed overflow-hidden rounded-card border border-dashed border-line bg-paper-soft/60"
        >
          {surface}
        </div>
      </li>
    );
  }

  // ==================== Active Link ====================
  return (
    <li className={itemClass}>
      <Link
        href={href}
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cx(
          LINK_BASE,
          isFeatured ? FEATURED_SURFACE : 'card-editorial card-editorial-hover',
        )}
      >
        {surface}
      </Link>
    </li>
  );
}