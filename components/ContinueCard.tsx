// components/ContinueCard.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRecentViews, formatRelativeTime } from '@/hooks/useRecentViews';
import {
  IconBookmark,
  IconPlay,
  IconTelegram,
  IconClock,
  IconClose,
} from '@/components/ui/Icons';

// ==================== Component ====================
export function ContinueCard() {
  const { recent, addView, mounted } = useRecentViews();
  const [dismissed, setDismissed] = useState(false);

  if (!mounted) return null;
  if (recent.length === 0 || dismissed) return null;

  const last = recent[0];
  const isTelegram = last.file_path.includes('t.me');
  const hasMore = recent.length > 1;

  return (
    <div className="group relative overflow-hidden rounded-card border border-gold/30 bg-gradient-to-bl from-gold/8 via-gold/4 to-transparent shadow-sm dark:border-gold/40 dark:from-gold/15 dark:via-gold/8">
      {/* زر إغلاق */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="إخفاء"
        className="absolute end-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-field text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink dark:hover:bg-white/10"
      >
        <IconClose className="h-3.5 w-3.5" />
      </button>

      <div className="flex flex-col gap-4 p-5 pe-14 sm:flex-row sm:items-center sm:justify-between">
        {/* المحتوى */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-field bg-gold text-on-gold shadow-sm">
            <IconBookmark className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold-ink">
              تابع من حيث توقفت
            </p>
            <h3 className="mt-0.5 truncate text-base font-bold text-ink sm:text-lg">
              {last.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
              <span className="font-bold text-teal">{last.subject_name}</span>
              <span className="text-ink/30">·</span>
              <span className="inline-flex items-center gap-1">
                <IconClock className="h-3 w-3" />
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
            className="inline-flex items-center gap-2 rounded-field bg-gold px-5 py-2.5 text-sm font-bold text-on-gold shadow-sm transition-all duration-200 hover:bg-gold-hover active:scale-95"
          >
            {isTelegram ? (
              <IconTelegram className="h-4 w-4" />
            ) : (
              <IconPlay className="h-4 w-4" />
            )}
            متابعة القراءة
          </a>

          {hasMore && (
            <Link
              href="/lawazem"
              className="inline-flex items-center rounded-field border border-line-strong bg-paper-soft px-4 py-2.5 text-sm font-bold text-ink-soft transition-all hover:border-teal hover:bg-paper hover:text-ink active:scale-95"
            >
              كل الملازم
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}