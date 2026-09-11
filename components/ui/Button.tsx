// components/ui/Button.tsx
'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'amber';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] hover:bg-teal-light hover:shadow-[0_4px_14px_rgba(14,74,74,0.30)]',
  secondary:
    'bg-white text-ink border border-line shadow-[0_1px_2px_rgba(26,33,31,0.04)] hover:bg-paper hover:border-ink/20',
  outline:
    'bg-transparent text-teal border-2 border-teal/30 hover:bg-teal/5 hover:border-teal/60',
  danger:
    'bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300',
  ghost: 'bg-transparent text-ink/70 hover:bg-ink/5 hover:text-ink',
  amber:
    'bg-amber text-ink shadow-[0_2px_8px_rgba(224,166,58,0.28)] hover:bg-amber-soft',
};

const SIZES: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-md',
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-13 px-7 text-base gap-2.5 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, disabled, children, className = '', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex select-none items-center justify-center font-bold tracking-tight transition-all duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <svg className="h-4 w-4 flex-shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
});