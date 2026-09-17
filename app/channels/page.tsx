// app/channels/page.tsx
'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import { Input } from '@/components/ui/Field';
import type { Channel } from '@/lib/types';

type ChannelListItem = Pick<Channel, 'id' | 'name' | 'description' | 'image_url'>;

// ==================== Icons ====================
function IconSearch() {
  return (
    <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

// ==================== Avatar ====================
function ChannelAvatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="h-12 w-12 flex-shrink-0 rounded-xl border border-line/60 object-cover shadow-[0_2px_6px_rgba(26,33,31,0.06)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.30)]"
        loading="lazy"
      />
    );
  }
  const initials = name.trim().slice(0, 2);
  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-teal-light text-base font-black text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.30)]">
      {initials}
    </div>
  );
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-line bg-white/80 p-5 backdrop-blur-sm dark:bg-paper/80"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl skeleton-shimmer" />
            <div className="h-4 w-24 skeleton-shimmer rounded" />
          </div>
          <div className="mt-3 h-3 w-3/4 skeleton-shimmer rounded" />
          <div className="mt-4 h-3 w-20 skeleton-shimmer rounded" />
        </div>
      ))}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/" className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal">
      <span className="transition-transform duration-200 group-hover:translate-x-1"><IconArrowLeft /></span>
      رجوع إلى لوحة الأقسام
    </Link>
  );
}

// ==================== Page ====================
export default function ChannelsPage() {
  const { stage, ready } = useStudentStage();
  const [channels, setChannels] = useState<ChannelListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const deferredSearch = useDeferredValue(searchTerm);
  const term = deferredSearch.trim().toLowerCase();

  useEffect(() => {
    if (!stage) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('channels')
        .select('id, name, description, image_url')
        .eq('stage', stage)
        .order('name');

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setChannels([]);
      } else {
        setChannels((data ?? []) as ChannelListItem[]);
      }
      setLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, [stage]);

  const visibleChannels = useMemo(() => {
    if (!term) return channels;
    return channels.filter((c) => c.name.toLowerCase().includes(term));
  }, [channels, term]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <BackLink />

      <div className="mt-6 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">قنوات الدراسة</h1>
        {!loading && channels.length > 0 && (
          <p className="mt-2 text-sm text-ink/50">
            <span className="font-bold text-teal">{channels.length}</span> قناة متاحة لمرحلتك
          </p>
        )}
      </div>

      {channels.length > 0 && (
        <div className="relative mt-6 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <IconSearch />
          <Input
            type="text"
            placeholder="ابحث باسم القناة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-3 pr-11 shadow-[0_2px_8px_rgba(26,33,31,0.04)]"
            aria-label="بحث في القنوات"
          />
        </div>
      )}

      {loading && <Skeleton />}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
          <p className="mt-1 text-red-600/80 dark:text-red-300/80">{error}</p>
        </div>
      )}

      {!loading && !error && channels.length === 0 && (
        <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up dark:bg-paper/80">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/8 text-teal">
            <IconChat />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد قنوات مضافة لمرحلتك حالياً.</p>
          <p className="mt-1 text-sm text-ink/50">يرجى العودة لاحقاً</p>
        </div>
      )}

      {!loading && !error && channels.length > 0 && visibleChannels.length === 0 && (
        <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up dark:bg-paper/80">
          <IconSearch />
          <p className="mt-4 font-bold text-ink/70">لا توجد نتائج مطابقة</p>
          <p className="mt-1 text-sm text-ink/50">&laquo;{searchTerm}&raquo;</p>
        </div>
      )}

      {!loading && !error && visibleChannels.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visibleChannels.map((c, idx) => (
            <Link
              key={c.id}
              href={`/channels/${c.id}`}
              style={{ animationDelay: `${idx * 50}ms` }}
              className="group relative overflow-hidden rounded-2xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal/30 hover:shadow-[0_12px_30px_rgba(14,74,74,0.10)] active:scale-[0.99] animate-slide-up dark:bg-paper/80 dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.40)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-teal/0 via-teal/0 to-teal/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <ChannelAvatar name={c.name} imageUrl={c.image_url} />
                  <span className="min-w-0 flex-1 truncate font-bold text-ink">{c.name}</span>
                </div>

                {c.description && (
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink/55">{c.description}</p>
                )}

                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-teal transition-all duration-300 group-hover:gap-2.5">
                  <span>فتح صفحة القناة</span>
                  <span className="transition-transform duration-300 group-hover:-translate-x-1"><IconArrowLeft /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}