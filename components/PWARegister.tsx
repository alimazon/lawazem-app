// components/PWARegister.tsx
'use client';

import { useEffect, useState } from 'react';

export function PWARegister() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    // لا تسجّل SW في التطوير (يسبب مشاكل مع HMR)
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        if (cancelled) return;

        // مراقبة تحديثات الـSW
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setUpdateReady(true);
            }
          });
        });
      })
      .catch((err) => {
        console.error('[PWA] فشل تسجيل Service Worker:', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!updateReady) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-[80] md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-center gap-3 rounded-2xl border border-teal/30 bg-white p-3 shadow-[0_12px_40px_rgba(14,74,74,0.18)] backdrop-blur-sm animate-slide-up dark:bg-paper dark:shadow-[0_12px_40px_rgba(0,0,0,0.50)]">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-ink">تحديث متوفر</p>
          <p className="text-[11px] leading-tight text-ink/55">
            نسخة جديدة من لوازم جاهزة
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex-shrink-0 rounded-lg bg-teal px-3 py-1.5 text-xs font-black text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] transition-all hover:bg-teal-light active:scale-95"
        >
          تحديث
        </button>
      </div>
    </div>
  );
}