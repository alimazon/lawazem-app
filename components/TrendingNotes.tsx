// components/TrendingNotes.tsx
'use client';

import { useEffect, useState } from 'react';
import { postJson } from '@/lib/api-client';
import { useRecentViews } from '@/hooks/useRecentViews';
import {
  IconFire,
  IconTrending,
  IconTelegram,
  IconDoctor,
} from '@/components/ui/Icons';
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

// ==================== Rank Badge ====================
function RankBadge({ rank }: { rank: number }) {
  const styles =
    rank === 1
      ? 'bg-gold text-on-gold shadow-sm'
      : rank === 2
        ? 'bg-ink/15 text-ink dark:bg-white/15'
        : rank === 3
          ? 'bg-gold/15 text-gold-ink dark:bg-gold/25'
          : 'bg-ink/5 text-ink-muted dark:bg-white/5';

  return (
    <span
      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-field font-mono text-sm font-bold ${styles}`}
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
      <div className="card-editorial p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-7 w-7 skeleton-shimmer rounded-field" />
          <div className="h-5 w-32 skeleton-shimmer rounded" />
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 skeleton-shimmer rounded-field" />
          ))}
        </div>
      </div>
    );
  }

  // Error — silent
  if (error) return null;

  // Empty — silent
  if (items.length === 0) return null;

  return (
    <div className="card-editorial p-4">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-2 px-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-field bg-gold/15 text-gold-ink">
            <IconFire className="h-4 w-4" />
          </span>
          <h2 className="text-base font-bold text-ink">الأكثر إقبالاً</h2>
        </div>
        <span className="hidden items-center gap-1 rounded-chip bg-teal/10 px-2 py-0.5 text-[10px] font-bold text-teal sm:inline-flex">
          <IconTrending className="h-3 w-3" />
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
            className="group flex items-center gap-3 rounded-field border border-transparent p-2.5 transition-all duration-200 hover:border-teal/20 hover:bg-paper hover:shadow-sm dark:hover:bg-paper-soft"
          >
            <RankBadge rank={idx + 1} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink transition-colors group-hover:text-teal">
                {item.title}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
                <span className="truncate font-bold text-teal">
                  {item.subject_name}
                </span>
                {item.professor_name && (
                  <>
                    <span className="text-ink/30">·</span>
                    <span className="inline-flex items-center gap-0.5 truncate">
                      <IconDoctor className="h-3 w-3" />
                      د. {item.professor_name}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="rounded-chip bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold-ink">
                {item.week_views}
              </span>
              <span className="hidden text-ink/20 transition-colors group-hover:text-teal sm:inline">
                <IconTelegram className="h-3.5 w-3.5" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}