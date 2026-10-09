// components/ui/Card.tsx
import {
  type ElementType,
  type ReactNode,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react';

type Variant = 'default' | 'featured' | 'flat';
type Padding = 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'article' | 'section' | 'li';
  variant?: Variant;
  padding?: Padding;
  hoverable?: boolean;
  children: ReactNode;
}

const PADDING: Record<Padding, string> = {
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const VARIANT: Record<Variant, string> = {
  // العادية — سطح فاتح، حد خفيف
  default: 'bg-paper-soft border border-line shadow-xs',

  // المميزة — مسطّحة: حد ذهبي عند بداية السطر (يمين في RTL) بدل التدرّج
  featured:
    'bg-paper-soft border border-teal/20 border-s-[3px] border-s-gold shadow-sm',

  // بدون خلفية — للقوائم داخل بطاقة موجودة
  flat: 'bg-transparent border border-transparent',
};

export function Card({
  as: Tag = 'div',
  variant = 'default',
  padding = 'md',
  hoverable = false,
  children,
  className = '',
  onKeyDown,
  ...rest
}: CardProps) {
  const Component: ElementType = Tag;

  // بطاقة قابلة للنقر: تصير قابلة للوصول بالكيبورد (Tab + Enter/Space)
  const clickable = typeof rest.onClick === 'function';

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(e);
    if (
      clickable &&
      e.target === e.currentTarget &&
      (e.key === 'Enter' || e.key === ' ')
    ) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).click();
    }
  };

  const finalClassName = [
    'rounded-card',
    VARIANT[variant],
    PADDING[padding],
    hoverable ? 'card-editorial-hover' : 'transition-colors duration-300',
    clickable ? 'cursor-pointer' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      onKeyDown={handleKeyDown}
      className={finalClassName}
      {...rest}
    >
      {children}
    </Component>
  );
}

// ==================== Card.Header ====================
export function CardHeader({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-3 flex items-start justify-between gap-3 ${className}`}>
      {children}
    </div>
  );
}

// ==================== Card.Title ====================
export function CardTitle({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-base font-bold leading-snug text-ink sm:text-lg ${className}`}>
      {children}
    </h3>
  );
}

// ==================== Card.Description ====================
export function CardDescription({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-sm leading-relaxed text-ink-soft ${className}`}>
      {children}
    </p>
  );
}