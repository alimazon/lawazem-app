// hooks/useDismissable.ts
'use client';

import { useEffect, type RefObject } from 'react';

/**
 * يُغلق أي عنصر عائم (قائمة، ورقة، dropdown) عند:
 *  - الضغط خارج حدوده
 *  - انتقال التركيز (focus) خارجه
 *  - الضغط على Escape
 *
 * الاستخدام:
 *   useDismissable(open, ref, (viaKeyboard) => {
 *     setOpen(false);
 *     if (viaKeyboard) buttonRef.current?.focus();
 *   });
 */
export function useDismissable(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onDismiss: (viaKeyboard: boolean) => void
): void {
  useEffect(() => {
    if (!active) return;

    const handleOutside = (event: Event) => {
      const container = containerRef.current;
      if (
        container &&
        event.target instanceof Node &&
        !container.contains(event.target)
      ) {
        onDismiss(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss(true);
    };

    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('focusin', handleOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('focusin', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, containerRef, onDismiss]);
}