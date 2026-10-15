// components/PWAInstallPrompt.tsx
'use client';

import { useEffect, useState } from 'react';

// ==================== Types ====================
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa_prompt_dismissed_at';
const DISMISS_DAYS = 30;

// ==================== Component ====================
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  // ==================== Setup ====================
  useEffect(() => {
    // ✅ إذا كان مثبّتاً أصلاً، لا نعرض
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // ✅ إذا رفض المستخدم خلال آخر 30 يوم، لا نعرض
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const daysSince =
          (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
        if (daysSince < DISMISS_DAYS) return;
      }
    } catch {
      /* تجاهل */
    }

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // ⏱️ ننتظر 12 ثانية قبل العرض (تجربة أفضل)
      setTimeout(() => setShow(true), 12000);
    }

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // ==================== Actions ====================
  async function handleInstall() {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setShow(false);
      }
    } catch {
      /* تجاهل */
    } finally {
      setDeferredPrompt(null);
      setShow(false);
    }
  }

  function handleDismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      /* تجاهل */
    }
  }

  if (!show || !deferredPrompt) return null;

  // ==================== Render ====================
  return (
    <div
      role="dialog"
      aria-label="تثبيت التطبيق"
      className="fixed inset-x-4 bottom-24 z-[80] animate-slide-up motion-reduce:animate-none md:inset-x-auto md:end-4 md:bottom-4 md:max-w-sm"
    >
      <div className="flex items-start gap-3 rounded-card border border-teal/30 bg-paper p-4 shadow-[0_12px_40px_rgba(14,74,74,0.18)] backdrop-blur-sm dark:shadow-[0_12px_40px_rgba(0,0,0,0.50)]">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-field bg-teal/10 text-teal"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">ثبّت لوازم على جهازك</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
            إشعارات مباشرة + وصول سريع بدون متصفح.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-field bg-teal px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-teal-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              تثبيت الآن
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-field border border-line bg-paper-soft px-4 py-2 text-xs font-bold text-ink-soft transition-colors hover:border-teal/40 hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              لاحقاً
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="إغلاق"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-field text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}