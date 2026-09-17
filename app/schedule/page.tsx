// app/schedule/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import type { Schedule } from '@/lib/types';

type ScheduleImage = Pick<Schedule, 'image_url'>;

// ==================== Icons ====================
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function IconExternal() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="mt-8 space-y-4">
      <div className="h-4 w-40 skeleton-shimmer rounded" />
      <div className="aspect-[3/4] w-full skeleton-shimmer rounded-3xl sm:aspect-[4/3]" />
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
export default function SchedulePage() {
  const { stage, ready } = useStudentStage();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!stage) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');
      setImageLoaded(false);

      const { data, error: fetchError } = await supabase
        .from('schedules')
        .select('image_url')
        .eq('stage', stage)
        .maybeSingle<ScheduleImage>();

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setImageUrl(null);
      } else {
        setImageUrl(data?.image_url ?? null);
      }
      setLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, [stage]);

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
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">جدول المحاضرات</h1>
      </div>

      {loading && <Skeleton />}

      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
          <p className="mt-1 text-red-600/80 dark:text-red-300/80">{error}</p>
        </div>
      )}

      {!loading && !error && !imageUrl && (
        <div className="mt-6 rounded-3xl border border-line bg-white/80 p-12 text-center backdrop-blur-sm animate-slide-up dark:bg-paper/80">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber/10 text-amber dark:bg-amber/15">
            <IconCalendar />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا يوجد جدول مرفوع لمرحلتك حالياً.</p>
          <p className="mt-1 text-sm text-ink/50">يرجى العودة لاحقاً</p>
        </div>
      )}

      {!loading && !error && imageUrl && (
        <div className="mt-6 animate-slide-up">
          <div className="group relative overflow-hidden rounded-3xl border border-line bg-white/80 p-3 shadow-[0_4px_16px_rgba(26,33,31,0.06)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_12px_30px_rgba(14,74,74,0.10)] dark:bg-paper/80 dark:shadow-[0_4px_16px_rgba(0,0,0,0.30)] dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
            {!imageLoaded && (
              <div className="aspect-[3/4] w-full skeleton-shimmer rounded-2xl sm:aspect-[4/3]" />
            )}
            <img
              src={imageUrl}
              alt={`جدول ${stage}`}
              onLoad={() => setImageLoaded(true)}
              className={`w-full rounded-2xl transition-all duration-500 dark:brightness-90 ${
                imageLoaded ? 'opacity-100' : 'absolute h-0 w-0 opacity-0'
              }`}
            />
          </div>

          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-4 inline-flex items-center gap-2 rounded-xl border border-teal/20 bg-teal/5 px-4 py-2.5 text-sm font-bold text-teal transition-all duration-200 hover:border-teal/40 hover:bg-teal/10 active:scale-95 dark:border-teal/30 dark:bg-teal/10 dark:hover:bg-teal/15"
          >
            <IconExternal />
            فتح الصورة بحجم كامل
          </a>
        </div>
      )}
    </main>
  );
}