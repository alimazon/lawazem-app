// components/RecentViewsCard.tsx
'use client';

import { useRecentViews, formatRelativeTime } from '@/hooks/useRecentViews';
import {
  IconClock,
  IconDoc,
  IconTelegram,
  IconExternal,
} from '@/components/ui/Icons';

// ==================== Component ====================
export function RecentViewsCard() {
  const { recent, clearAll, mounted } = useRecentViews();

  if (!mounted) return null;
  if (recent.length === 0) return null;

  return (
    <section className="animate-slide-up">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-field bg-gold/15 text-gold-ink">
            <IconClock className="h-4 w-4" />
          </span>
          آخر ما زرته
        </h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-bold text-ink-muted transition-colors hover:text-coral"
        >
          مسح
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {recent.map((view) => {
          const isTelegram = view.file_path.includes('t.me');
          return (
            <a
              key={view.id}
              href={view.file_path}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-card border border-line bg-paper-soft p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal hover:shadow-md active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-field bg-teal/10 text-teal transition-all duration-200 group-hover:bg-teal group-hover:text-on-teal">
                <IconDoc className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink transition-colors group-hover:text-teal">
                  {view.title}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <span className="truncate">{view.subject_name}</span>
                  <span>·</span>
                  <span className="flex-shrink-0">
                    {formatRelativeTime(view.viewed_at)}
                  </span>
                </div>
              </div>

              <span className="flex-shrink-0 text-ink-muted transition-colors group-hover:text-teal">
                {isTelegram ? (
                  <IconTelegram className="h-4 w-4" />
                ) : (
                  <IconExternal className="h-4 w-4" />
                )}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}