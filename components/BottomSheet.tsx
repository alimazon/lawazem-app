// components/BottomSheet.tsx
'use client';

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** أقصى ارتفاع — افتراضي 85dvh */
  maxHeight?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  maxHeight = '85dvh',
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    // منع تمرير الخلفية
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // إظهار بحركة
    const raf = requestAnimationFrame(() => setVisible(true));

    // Escape
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      setVisible(false);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[var(--z-modal)]"
    >
      {/* الخلفية */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-overlay transition-opacity duration-200 motion-reduce:transition-none ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* الورقة */}
      <div
        ref={sheetRef}
        className={`absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border-t border-line bg-paper shadow-xl transition-transform duration-300 ease-[var(--ease-editorial)] motion-reduce:transition-none ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* مقبض السحب */}
        <div className="flex justify-center pt-3 pb-1">
          <span
            aria-hidden="true"
            className="h-1 w-10 rounded-full bg-ink/15 dark:bg-white/15"
          />
        </div>

        {title && (
          <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-3">
            <h2 className="font-display text-base font-bold text-ink">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="flex h-9 w-9 items-center justify-center rounded-field text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
