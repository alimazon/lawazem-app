// components/ContinueCard.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRecentViews, formatRelativeTime } from '@/hooks/useRecentViews';

// ==================== Icons ====================
function IconBookmark() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
function IconTelegram() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ==================== Component ====================
export function ContinueCard() {
  const { recent, addView, mounted } = useRecentViews();
  const [dismissed, setDismissed] = useState(false);

  // لا تظهر قبل mount (تجنّب hydration mismatch)
  if (!mounted) return null;

  // لا تظهر لو مافيه سجل أو تم الإخفاء
  if (recent.length === 0 || dismissed) return null;

  const last = recent[0];
  const isTelegram = last.file_path.includes('t.me');
  const hasMore = recent.length > 1;

  return (
    <div className="group relative overflow-hidden rounded-3xl border-2 border-amber/40 bg-gradient-to-bl from-amber/12 via-amber/6 to-transparent shadow-[0_4px_20px_rgba(224,166,58,0.12)] backdrop-blur-sm animate-slide-up dark:border-amber/50 dark:from-amber/20 dark:via-amber/10">
      {/* زر إغلاق */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="إخفاء"
        className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink dark:hover:bg-white/10"
      >
        <IconClose />
      </button>

      <div className="flex flex-col gap-4 p-5 pr-14 sm:flex-row sm:items-center sm:justify-between">
        {/* المحتوى */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber text-ink shadow-[0_4px_14px_rgba(224,166,58,0.30)]">
            <IconBookmark />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              تابع من حيث توقفت
            </p>
            <h3 className="mt-0.5 truncate text-base font-black text-ink sm:text-lg">
              {last.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink/55">
              <span className="font-bold text-teal">{last.subject_name}</span>
              <span className="text-ink/30">·</span>
              <span className="inline-flex items-center gap-1">
                <IconClock />
                {formatRelativeTime(last.viewed_at)}
              </span>
            </div>
          </div>
        </div>

        {/* الأزرار */}
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          <a
            href={last.file_path}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              addView({
                id: last.id,
                title: last.title,
                subject_name: last.subject_name,
                file_path: last.file_path,
              })
            }
            className="inline-flex items-center gap-2 rounded-xl bg-amber px-5 py-2.5 text-sm font-black text-ink shadow-[0_2px_10px_rgba(224,166,58,0.30)] transition-all duration-200 hover:bg-amber-soft active:scale-95"
          >
            {isTelegram ? <IconTelegram /> : <IconPlay />}
            متابعة القراءة
          </a>

          {hasMore && (
            <Link
              href="/lawazem"
              className="inline-flex items-center rounded-xl border border-line bg-white/80 px-4 py-2.5 text-sm font-bold text-ink/70 transition-all hover:border-ink/20 hover:bg-paper active:scale-95 dark:bg-white/[0.06]"
            >
              كل الملازم
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}