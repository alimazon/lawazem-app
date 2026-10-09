// components/TrendingNotes.tsx
'use client';

import { useEffect, useState } from 'react';
import { postJson } from '@/lib/api-client';
import { useRecentViews } from '@/hooks/useRecentViews';
import type { Stage } from '@/lib/types';

// ==================== Types ====================
interface TopNote {
  id: string;
  title: string;
  professor_name: string | null;
  subject_name: string;
  file_path: string;
  week_views: number;
  views: number;
}

interface Props {
  stage: Stage;
}

// ==================== Icons ====================
function IconFire() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2c1 4 4 5 4 9a4 4 0 11-8 0c0-1 .5-2 1-2.5C8 10 7 12 7 14a5 5 0 1010 0c0-5-5-6-5-12z" />
    </svg>
  );
}
function IconTrend() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
function IconTelegram() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
function IconDoctor() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

// ==================== Rank Badge ====================
function RankBadge({ rank }: { rank: number }) {
  const styles =
    rank === 1
      ? 'bg-amber text-ink shadow-[0_2px_8px_rgba(224,166,58,0.35)]'
      : rank === 2
      ? 'bg-ink/15 text-ink dark:bg-white/15'
      : rank === 3
      ? 'bg-amber-700/15 text-amber-800 dark:bg-amber-700/25 dark:text-amber-300'
      : 'bg-ink/5 text-ink/50 dark:bg-white/5';

  return (
    <span
      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-mono text-sm font-black ${styles}`}
    >
      {rank}
    </span>
  );
}

// ==================== Component ====================
export function TrendingNotes({ stage }: Props) {
  const { addView } = useRecentViews();
  const [items, setItems] = useState<TopNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await postJson<{ items: TopNote[] }>('/api/views', {
          action: 'top',
          stage,
        });
        if (cancelled) return;
        setItems(data.items ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'فشل التحميل');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [stage]);

  function handleClick(item: TopNote) {
    addView({
      id: item.id,
      title: item.title,
      subject_name: item.subject_name,
      file_path: item.file_path,
    });
  }

  // Skeleton
  if (loading) {
    return (
      <div className="rounded-3xl border border-line bg-white/70 p-4 backdrop-blur-sm dark:bg-paper/70">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-7 w-7 skeleton-shimmer rounded-lg" />
          <div className="h-5 w-32 skeleton-shimmer rounded" />
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 skeleton-shimmer rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return null; // نافذة صامتة عند الخطأ
  }

  // Empty — لا نعرض شيئاً (لا نُزعج الطالب)
  if (items.length === 0) return null;

  return (
    <div className="rounded-3xl border border-line bg-white/70 p-4 backdrop-blur-sm dark:bg-paper/70">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-2 px-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber/15 text-amber-800 dark:bg-amber/25 dark:text-amber-300">
            <IconFire />
          </span>
          <h2 className="text-base font-extrabold text-ink">الأكثر إقبالاً هذا الأسبوع</h2>
        </div>
        <span className="hidden items-center gap-1 rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-black text-teal dark:bg-teal/20 sm:inline-flex">
          <IconTrend />
          مباشر
        </span>
      </div>

      {/* List */}
      <div className="space-y-1">
        {items.map((item, idx) => (
          <a
            key={item.id}
            href={item.file_path}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleClick(item)}
            className="group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition-all duration-200 hover:border-teal/20 hover:bg-white hover:shadow-[0_2px_8px_rgba(14,74,74,0.06)] dark:hover:bg-paper"
          >
            <RankBadge rank={idx + 1} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink transition-colors group-hover:text-teal">
                {item.title}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink/50">
                <span className="truncate font-bold text-teal/80">
                  {item.subject_name}
                </span>
                {item.professor_name && (
                  <>
                    <span className="text-ink/30">·</span>
                    <span className="inline-flex items-center gap-0.5 truncate">
                      <IconDoctor />
                      د. {item.professor_name}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-black text-amber-800 dark:bg-amber/25 dark:text-amber-300">
                {item.week_views} هذا الأسبوع
              </span>
              <span className="hidden text-ink/20 transition-colors group-hover:text-teal sm:inline">
                <IconTelegram />
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}