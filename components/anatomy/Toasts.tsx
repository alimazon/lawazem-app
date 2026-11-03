'use client';

// components/anatomy/Toasts.tsx
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export type ToastTone = 'info' | 'success' | 'error';
interface ToastItem { id: number; message: string; tone: ToastTone }
interface Ctx { notify: (message: string, tone?: ToastTone) => void }

const ToastCtx = createContext<Ctx>({ notify: () => {} });
export const useToast = (): Ctx => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const notify = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = ++idRef.current;
    setItems((prev) => [...prev.slice(-2), { id, message, tone }]);
    timers.current.push(window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2600));
  }, []);

  return (
    <ToastCtx.Provider value={{ notify }}>
      {children}
      <div className="fa-toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`fa-toast fa-toast-${t.tone}`}>{t.message}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
