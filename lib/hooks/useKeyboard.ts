'use client';

// lib/hooks/useKeyboard.ts
import { useEffect, useRef } from 'react';

export interface Shortcut {
  /** الحرف أو اسم المفتاح: 'k' أو '?' أو 'Escape' أو '1' */
  key: string;
  /** ⌘ أو Ctrl */
  meta?: boolean;
  alt?: boolean;
  /** إن لم يُحدَّد يُتجاهل Shift (مفيد لـ ؟ / ?) */
  shift?: boolean;
  /** يعمل أثناء الكتابة في حقل إدخال */
  allowInInput?: boolean;
  handler: () => void;
  description: string;
}

/** يطابق المفتاح الفعلي أو موضعه على الكيبورد، فيعمل مع التخطيط العربي (الحرف F = ب) */
function matchKey(e: KeyboardEvent, want: string): boolean {
  const w = want.toLowerCase();
  if (e.key.toLowerCase() === w) return true;
  if (/^[a-z]$/.test(w)) return e.code === `Key${w.toUpperCase()}`;
  if (/^[0-9]$/.test(w)) return e.code === `Digit${w}`;
  return false;
}

function match(e: KeyboardEvent, s: Shortcut): boolean {
  if (!matchKey(e, s.key)) return false;
  if (!!s.meta !== (e.metaKey || e.ctrlKey)) return false;
  if (!!s.alt !== e.altKey) return false;
  if (s.shift !== undefined && s.shift !== e.shiftKey) return false;
  return true;
}

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

export function useKeyboard(shortcuts: readonly Shortcut[], enabled = true): void {
  const ref = useRef(shortcuts);
  ref.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.isComposing) return;
      for (const s of ref.current) {
        if (isEditable(e.target) && !s.allowInInput) continue;
        if (match(e, s)) {
          e.preventDefault();
          s.handler();
          return;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
