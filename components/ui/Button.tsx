// components/ui/Button.tsx
'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconAfter?: ReactNode;
  fullWidth?: boolean;
}

// ==================== Variants ====================
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-teal text-on-teal ' +
    'hover:bg-teal-hover active:bg-teal-active ' +
    'shadow-xs hover:shadow-sm',

  secondary:
    'bg-paper-soft text-ink border border-line-strong ' +
    'hover:border-teal/40 hover:bg-paper-deep ' +
    'active:bg-paper-deep',

  outline:
    'bg-transparent text-teal border-2 border-teal/25 ' +
    'hover:border-teal/60 hover:bg-teal-tint ' +
    'active:bg-teal-soft',

  ghost:
    'bg-transparent text-ink-soft ' +
    'hover:bg-ink/5 hover:text-ink ' +
    'active:bg-ink/10',

  danger:
    'bg-transparent text-coral-ink border border-coral/25 ' +
    'hover:bg-coral-soft hover:border-coral/40 ' +
    'active:bg-coral-soft',

  // text-on-gold: نص داكن في الوضعين (text-ink يصير فاتحاً في الداكن)
  gold:
    'bg-gold text-on-gold ' +
    'hover:bg-gold-light active:brightness-95 ' +
    'shadow-xs hover:shadow-sm',
};

// ==================== Sizes ====================
// md = 44px (حد اللمس الأدنى). xs/sm للواجهات الكثيفة فقط.
const SIZES: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-field',
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-field',
  md: 'h-11 px-5 text-sm gap-2 rounded-field',
  lg: 'h-13 px-7 text-base gap-2.5 rounded-field',
};

// حالة التعطيل بتوكنات النظام (لا opacity). لا تُطبَّق أثناء loading
// حتى يبقى الزر بلونه مع المؤشر الدوّار.
const DISABLED =
  'disabled:pointer-events-none disabled:border-transparent disabled:bg-disabled ' +
  'disabled:text-disabled-ink disabled:shadow-none disabled:active:scale-100';

// ==================== Spinner ====================
function Spinner() {
  return (
    <svg
      className="h-4 w-4 flex-shrink-0 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ==================== Component ====================
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading,
    icon,
    iconAfter,
    fullWidth,
    disabled,
    children,
    className = '',
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        // base — بدون tracking: letter-spacing السالب يقطع اتصال الحروف العربية
        'inline-flex select-none items-center justify-center font-semibold',
        'transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[var(--ease-editorial)]',
        'active:scale-[0.98]',
        VARIANTS[variant],
        SIZES[size],
        loading ? 'pointer-events-none cursor-progress' : DISABLED,
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? (
        <Spinner />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}

      {children && <span className="truncate">{children}</span>}

      {iconAfter && !loading && <span className="flex-shrink-0">{iconAfter}</span>}
    </button>
  );
});