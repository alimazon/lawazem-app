// components/ui/Field.tsx
'use client';

import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react';

const BASE =
  'w-full rounded-xl border-2 border-line bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/35 transition-all duration-200 focus:border-teal focus:bg-white focus:outline-none focus:shadow-[0_0_0_4px_rgba(14,74,74,0.10)] hover:border-ink/20 disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-60 dark:bg-white/[0.06] dark:text-ink dark:placeholder:text-ink/40 dark:hover:bg-white/[0.08] dark:hover:border-ink/30 dark:focus:bg-white/[0.08] dark:focus:border-teal dark:focus:shadow-[0_0_0_4px_rgba(77,184,184,0.15)] dark:disabled:bg-white/[0.02]';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...rest }, ref) {
    return <input ref={ref} className={`${BASE} ${className}`} {...rest} />;
  }
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...rest }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`${BASE} cursor-pointer appearance-none pl-10 pr-4 ${className}`}
          {...rest}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={`${BASE} resize-none leading-relaxed ${className}`}
        {...rest}
      />
    );
  }
);

export function FieldGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`space-y-3 rounded-2xl border border-line bg-white/70 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] dark:bg-white/[0.03] ${className}`}
    >
      {children}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
  className = '',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`group flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink/80 transition-all duration-200 hover:border-teal/40 has-[:checked]:border-teal has-[:checked]:bg-teal/5 has-[:checked]:text-ink dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:hover:border-teal/40 dark:has-[:checked]:bg-teal/15 ${className}`}
    >
      <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-line bg-white transition-all duration-200 checked:border-teal checked:bg-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 focus-visible:ring-offset-2 dark:bg-white/[0.06] dark:border-line"
        />
        <svg
          className="pointer-events-none absolute h-3 w-3 scale-0 text-white opacity-0 transition-all duration-150 peer-checked:scale-100 peer-checked:opacity-100"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <span className="flex-1">{children}</span>
    </label>
  );
}