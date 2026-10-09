// components/LiveFeed.tsx
'use client';

import { useEffect, useState } from 'react';
import { postJson } from '@/lib/api-client';
import type { Stage } from '@/lib/types';

// ==================== Types ====================
type FeedType = 'lecture_note' | 'channel' | 'subject' | 'channel_content';

interface FeedItem {
  id: string;
  type: FeedType;
  title: string;
  context: string;
  created_at: string;
  link: string | null;
}

interface Props {
  stage: Stage;
}

// ==================== Icons ====================
function IconDoc() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconChannel() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v6.75L6 15v1.5h12V15l-3-3.75V4.5M12 16.5V21" />
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
function IconExternal() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

// ==================== Helpers ====================
function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'الآن';
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  if (hours < 24) return `قبل ${hours} ساعة`;
  if (days === 1) return 'أمس';
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
  return `قبل ${Math.floor(days / 30)} شهر`;
}

function getTypeConfig(type: FeedType): {
  label: string;
  icon: React.ReactNode;
  styles: string;
} {
  switch (type) {
    case 'lecture_note':
      return {
        label: 'ملزمة جديدة',
        icon: <IconDoc />,
        styles: 'bg-teal/10 text-teal dark:bg-teal/20',
      };
    case 'channel':
      return {
        label: 'قناة جديدة',
        icon: <IconChannel />,
        styles: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
      };
    case 'subject':
      return {
        label: 'مادة جديدة',
        icon: <IconBook />,
        styles: 'bg-amber/15 text-amber-800 dark:bg-amber/25 dark:text-amber-300',
      };
    case 'channel_content':
      return {
        label: 'محتوى جديد',
        icon: <IconPin />,
        styles: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
      };
  }
}

// ==================== Feed Item ====================
function FeedItemRow({ item }: { item: FeedItem }) {
  const cfg = getTypeConfig(item.type);

  const inner = (
    <div className="flex items-start gap-3">
      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${cfg.styles} ${item.link ? 'group-hover:scale-110' : ''}`}>
        {cfg.icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink transition-colors group-hover:text-teal">
          {item.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink/50">
          {item.context && <span className="truncate">{item.context}</span>}
          {item.context && <span className="text-ink/30">·</span>}
          <span className="inline-flex items-center gap-0.5">
            <IconClock />
            {formatRelativeTime(item.created_at)}
          </span>
        </div>
      </div>

      {item.link && (
        <span className="flex-shrink-0 text-ink/20 transition-colors group-hover:text-teal">
          <IconExternal />
        </span>
      )}
    </div>
  );

  if (item.link) {
    return (
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-xl border border-transparent p-2.5 transition-all duration-200 hover:border-teal/20 hover:bg-white hover:shadow-[0_2px_8px_rgba(14,74,74,0.06)] dark:hover:bg-paper"
      >
        {inner}
      </a>
    );
  }

  return (
    <div className="group rounded-xl border border-transparent p-2.5">
      {inner}
    </div>
  );
}

// ==================== Component ====================
export function LiveFeed({ stage }: Props) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await postJson<{ items: FeedItem[] }>('/api/feed', { stage });
        if (cancelled) return;
        setItems(data.items ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'فشل تحميل التحديثات');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [stage]);

  // Skeleton
  if (loading) {
    return (
      <div className="rounded-3xl border border-line bg-white/70 p-5 backdrop-blur-sm dark:bg-paper/70">
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
    return (
      <div className="rounded-3xl border border-line bg-white/70 p-5 backdrop-blur-sm dark:bg-paper/70">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal/10 text-teal">
            <IconSparkles />
          </span>
          <h2 className="text-base font-extrabold text-ink">آخر التحديثات</h2>
        </div>
        <p className="text-sm text-ink/50">تعذّر تحميل التحديثات الآن.</p>
      </div>
    );
  }

  // Empty
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-line bg-white/70 p-6 text-center backdrop-blur-sm dark:bg-paper/70">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/8 text-teal">
          <IconSparkles />
        </div>
        <p className="mt-3 text-sm font-bold text-ink/60">
          لا توجد تحديثات بعد
        </p>
        <p className="mt-1 text-xs text-ink/40">
          كل جديد سيظهر هنا تلقائياً
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-line bg-white/70 p-3 backdrop-blur-sm dark:bg-paper/70">
      <div className="mb-1 flex items-center justify-between gap-2 px-2 pt-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal/10 text-teal">
            <IconSparkles />
          </span>
          <h2 className="text-base font-extrabold text-ink">آخر التحديثات</h2>
        </div>
        <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-black text-teal dark:bg-teal/20">
          مباشر
        </span>
      </div>

      <div className="space-y-0.5">
        {items.map((item) => (
          <FeedItemRow key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  );
}