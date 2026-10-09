// components/ui/Field.tsx
'use client';

import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react';
import { IconChevronDown } from '@/components/ui/Icons';

// ==================== Shared Base ====================
const BASE = 'field-editorial';

// أنماط مشتركة لبطاقة Checkbox / Radio
const CHOICE_LABEL = [
  'flex cursor-pointer items-center gap-3',
  'rounded-field border border-field-border bg-paper-soft px-4 py-3',
  'text-sm font-medium text-ink-soft',
  'transition-colors duration-200',
  'hover:border-teal/40 hover:bg-paper',
  'has-[:checked]:border-teal/60 has-[:checked]:bg-teal/5 has-[:checked]:text-ink',
  'has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-disabled has-[:disabled]:text-disabled-ink has-[:disabled]:hover:border-field-border',
].join(' ');

const CHOICE_INPUT =
  'peer h-5 w-5 cursor-pointer appearance-none border-2 border-field-border bg-paper-soft ' +
  'transition-all duration-200 focus-visible:outline-offset-2 disabled:cursor-not-allowed';

// ==================== Input ====================
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...rest }, ref) {
    return <input ref={ref} className={`${BASE} ${className}`} {...rest} />;
  }
);

// ==================== Select ====================
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...rest }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`${BASE} cursor-pointer appearance-none ps-4 pe-10 ${className}`}
          {...rest}
        >
          {children}
        </select>
        <IconChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      </div>
    );
  }
);

// ==================== Textarea ====================
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={`${BASE} resize-none leading-[1.8] ${className}`}
        {...rest}
      />
    );
  }
);

// ==================== FieldGroup ====================
export function FieldGroup({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`space-y-3 rounded-card border border-line bg-paper-soft p-5 ${className}`}
    >
      {children}
    </div>
  );
}

// ==================== Label ====================
export function Label({
  htmlFor,
  children,
  hint,
  required,
  className = '',
}: {
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-2 flex items-baseline gap-1.5 text-sm font-bold text-ink ${className}`}
    >
      <span>{children}</span>
      {required && (
        <span className="text-coral-strong" aria-hidden="true">
          *
        </span>
      )}
      {hint && (
        <span className="text-xs font-normal text-ink-muted">— {hint}</span>
      )}
    </label>
  );
}

// ==================== Checkbox ====================
type ChoiceProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'checked' | 'type'
>;

export const Checkbox = forwardRef<
  HTMLInputElement,
  ChoiceProps & {
    checked: boolean;
    onChange: (v: boolean) => void;
    children: ReactNode;
  }
>(function Checkbox({ checked, onChange, children, className = '', ...rest }, ref) {
  return (
    <label className={`${CHOICE_LABEL} ${className}`}>
      <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={`${CHOICE_INPUT} rounded-[6px] checked:border-teal checked:bg-teal`}
          {...rest}
        />
        <svg
          className="pointer-events-none absolute h-3 w-3 scale-0 text-on-teal opacity-0 transition-all duration-150 peer-checked:scale-100 peer-checked:opacity-100"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>

      <span className="flex-1 leading-relaxed">{children}</span>
    </label>
  );
});

// ==================== Radio ====================
export function Radio<T extends string>({
  name,
  value,
  checked,
  onChange,
  children,
  className = '',
  ...rest
}: Omit<ChoiceProps, 'name' | 'value'> & {
  name: string;
  value: T;
  checked: boolean;
  onChange: (v: T) => void;
  children: ReactNode;
}) {
  return (
    <label className={`${CHOICE_LABEL} ${className}`}>
      <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className={`${CHOICE_INPUT} rounded-full checked:border-[6px] checked:border-teal`}
          {...rest}
        />
      </span>

      <span className="flex-1 leading-relaxed">{children}</span>
    </label>
  );
}