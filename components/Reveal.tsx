// components/Reveal.tsx
'use client';

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';

type RevealTag = 'div' | 'li' | 'section' | 'article';

interface RevealProps {
  children: ReactNode;
  as?: RevealTag;
  /** تأخير الظهور بالمللي ثانية (للـ stagger) */
  delay?: number;
  /** مقدار الإزاحة الرأسية للأسفل قبل الظهور */
  y?: number;
  className?: string;
  style?: CSSProperties;
}

export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  y = 12,
  className = '',
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const Component: ElementType = Tag;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // احترم تفضيل تقليل الحركة — أظهر مباشرة
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.dataset.revealed = 'true';
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.revealed = 'true';
          observer.disconnect();
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const combinedStyle = {
    ...style,
    '--reveal-delay': `${delay}ms`,
    '--reveal-y': `${y}px`,
  } as CSSProperties;

  // ✅ الحل: نستخدم callback ref بدل ref object
  // لأن Component قد يكون div / li / section / article
  // وTypeScript لا يستطيع توحيد أنواع الـrefs لهذه الحالات.
  // الـcallback ref يعمل مع جميع الاحتمالات (contravariance).
  const setRef = (el: HTMLElement | null) => {
    ref.current = el;
  };

  return (
    <Component
      ref={setRef}
      className={`reveal-scroll ${className}`.trim()}
      style={combinedStyle}
    >
      {children}
    </Component>
  );
}