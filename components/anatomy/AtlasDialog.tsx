'use client';

// components/anatomy/AtlasDialog.tsx
/** نافذة حوارية بسيطة: Esc للإغلاق، حبس التركيز، وإعادته للعنصر السابق، وقفل تمرير الصفحة. */
import { useEffect, useRef, type ReactNode } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export default function AtlasDialog({
  open, onClose, title, wide, children,
}: { open: boolean; onClose: () => void; title: string; wide?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      const els = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = els[0];
      const last = els[els.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fa-modal-overlay" onClick={onClose}>
      <div
        ref={ref}
        className={`fa-modal${wide ? ' is-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fa-modal-head">
          <h2>{title}</h2>
          <button type="button" className="fa-btn" onClick={onClose}>إغلاق</button>
        </div>
        <div className="fa-modal-body">{children}</div>
      </div>
    </div>
  );
}
