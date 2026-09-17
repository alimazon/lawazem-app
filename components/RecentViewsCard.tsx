// components/RecentViewsCard.tsx
'use client';

import { useRecentViews, formatRelativeTime } from '@/hooks/useRecentViews';

function IconClock() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconTelegram() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function RecentViewsCard() {
  const { recent, clearAll, mounted } = useRecentViews();

  // لا تظهر شيئًا قبل mount (تجنب hydration mismatch)
  if (!mounted) return null;

  // لا تظهر شيئًا إن كانت فارغة
  if (recent.length === 0) return null;

  return (
    <section className="animate-slide-up">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber/15 text-amber-800">
            <IconClock />
          </span>
          آخر ما زرته
        </h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-bold text-ink/40 transition-colors hover:text-red-600"
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
              className="group flex items-center gap-3 rounded-2xl border border-line bg-white/80 p-3 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/30 hover:shadow-[0_4px_16px_rgba(14,74,74,0.08)] active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal/8 text-teal transition-all duration-200 group-hover:bg-teal group-hover:text-white">
                <IconDoc />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink transition-colors group-hover:text-teal">
                  {view.title}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink/50">
                  <span className="truncate">{view.subject_name}</span>
                  <span>·</span>
                  <span className="flex-shrink-0">{formatRelativeTime(view.viewed_at)}</span>
                </div>
              </div>

              <span className="flex-shrink-0 text-ink/30 transition-colors group-hover:text-teal">
                {isTelegram ? <IconTelegram /> : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}