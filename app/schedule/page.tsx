// app/schedule/page.tsx
'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import {
  IconArrowLeft,
  IconCalendar,
  IconExternal,
  IconExpand,
  IconWarning,
  IconClose,
} from '@/components/ui/Icons';
import type { Schedule } from '@/lib/types';

// ==================== Types ====================
type ScheduleImage = Pick<Schedule, 'image_url'>;

type LoadError = {
  message: string; // رسالة عربية مفهومة للطالب
  detail: string; // تفاصيل تقنية (قد تكون فارغة)
};

const MAIN_CLASS =
  'mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10';

// ==================== Helpers ====================
// لا نقبل إلا روابط http/https (حماية من javascript: وروابط فاسدة)
function toSafeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? trimmed
      : null;
  } catch {
    return null;
  }
}

// رسالة خطأ عربية بدل عرض نص إنجليزي تقني للطالب
function buildError(detail: string): LoadError {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  return {
    message: offline
      ? 'يبدو أن الإنترنت مقطوع عندك. سنعيد المحاولة تلقائياً عند رجوعه.'
      : 'تعذّر جلب الجدول الآن. جرّب مرة ثانية بعد قليل.',
    detail,
  };
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div
      role="status"
      aria-label="جارٍ التحميل"
      className="mt-8 space-y-4"
    >
      <div className="h-4 w-40 skeleton-shimmer rounded motion-reduce:animate-none" />
      <div className="aspect-[3/4] w-full skeleton-shimmer rounded-card motion-reduce:animate-none sm:aspect-[4/3]" />
    </div>
  );
}

// ==================== Back Link ====================
function BackLink() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-1.5 rounded-field text-sm font-semibold text-teal transition-colors hover:text-teal-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
    >
      <span className="transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
        <IconArrowLeft aria-hidden="true" className="h-4 w-4" />
      </span>
      رجوع إلى لوحة الأقسام
    </Link>
  );
}

// ==================== Stage Badge ====================
function StageBadge({ stage }: { stage: string }) {
  return <span className="stage-badge">{stage}</span>;
}

// ==================== Fullscreen Viewer ====================
function FullscreenViewer({
  imageUrl,
  stage,
  onClose,
}: {
  imageUrl: string;
  stage: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [zoomed, setZoomed] = useState(false);

  // عند الفتح: نركّز على زر الإغلاق ونمنع تمرير الخلفية
  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Escape يغلق العارض
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // حبس Tab داخل النافذة (Focus trap)
  function handleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab') return;
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], [tabindex]:not([tabindex="-1"])',
    );
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`عرض جدول ${stage} بحجم كامل`}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-overlay p-4 pt-16 animate-fade-in motion-reduce:animate-none"
    >
      {/* زر تكبير/تصغير: مهم لجداول فيها خط صغير على الموبايل */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setZoomed((z) => !z);
        }}
        className="absolute start-4 top-4 inline-flex h-10 items-center rounded-field bg-paper-soft/95 px-4 text-sm font-semibold text-ink transition-colors hover:bg-paper-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
      >
        {zoomed ? 'تصغير' : 'تكبير'}
      </button>

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="إغلاق"
        className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-field bg-paper-soft/95 text-ink transition-colors hover:bg-paper-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
      >
        <IconClose aria-hidden="true" className="h-4 w-4" />
      </button>

      {/* tabIndex=0 ليتمكن مستخدم الكيبورد من تحريك الصورة عند التكبير */}
      <div
        tabIndex={0}
        onClick={(e) => e.stopPropagation()}
        className="max-h-full max-w-6xl overflow-auto overscroll-contain rounded-card border border-line bg-paper-soft p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        <img
          src={imageUrl}
          alt={`جدول ${stage}`}
          decoding="async"
          className={`block h-auto ${zoomed ? 'w-[200%] max-w-none' : 'w-full'}`}
        />
      </div>
    </div>
  );
}

// ==================== Schedule Card ====================
function ScheduleCard({
  imageUrl,
  stage,
}: {
  imageUrl: string;
  stage: string;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  // إذا كانت الصورة محمّلة مسبقاً (cache) قد لا يعمل onLoad
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setImageLoaded(true);
    }
  }, []);

  // نتذكر الزر الذي فتح العارض لنرجع التركيز له عند الإغلاق
  function openViewer(e: ReactMouseEvent<HTMLButtonElement>) {
    lastTriggerRef.current = e.currentTarget;
    setViewerOpen(true);
  }

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    requestAnimationFrame(() => lastTriggerRef.current?.focus());
  }, []);

  if (imageError) {
    return (
      <div
        role="alert"
        className="mt-6 flex items-start gap-3 rounded-card border border-coral/30 bg-coral/5 p-4 animate-slide-up motion-reduce:animate-none"
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field bg-coral text-on-coral"
        >
          <IconWarning className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-coral-ink">
            تعذّر تحميل صورة الجدول
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            جرّب تحديث الصفحة، أو افتح الصورة مباشرة من الرابط أدناه.
          </p>
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-coral-ink underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            <IconExternal aria-hidden="true" className="h-3.5 w-3.5" />
            فتح الرابط مباشرة
            <span className="sr-only"> (يفتح في تبويب جديد)</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 card-editorial overflow-hidden p-2 animate-slide-up motion-reduce:animate-none">
        {!imageLoaded && (
          <div
            aria-hidden="true"
            className="aspect-[3/4] w-full skeleton-shimmer rounded-field motion-reduce:animate-none sm:aspect-[4/3]"
          />
        )}

        <button
          type="button"
          onClick={openViewer}
          aria-label={`عرض جدول ${stage} بحجم كامل`}
          aria-haspopup="dialog"
          className={`block w-full cursor-zoom-in rounded-field focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${
            imageLoaded ? '' : 'hidden'
          }`}
        >
          {/* الجدول هو محتوى الصفحة الرئيسي */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt={`جدول ${stage}`}
            fetchPriority="high"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className="block h-auto w-full rounded-field"
          />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 animate-slide-up motion-reduce:animate-none">
        <button
          type="button"
          onClick={openViewer}
          aria-haspopup="dialog"
          className="inline-flex h-10 items-center gap-2 rounded-field border border-teal/25 bg-teal-tint px-4 text-sm font-semibold text-teal transition-colors hover:border-teal/50 hover:bg-teal-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
        >
          <IconExpand aria-hidden="true" className="h-4 w-4" />
          عرض بحجم كامل
        </button>

        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-field border border-line bg-paper-soft px-4 text-sm font-semibold text-ink-soft transition-colors hover:border-teal/40 hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
        >
          <IconExternal aria-hidden="true" className="h-4 w-4" />
          فتح في تبويب جديد
          <span className="sr-only"> (يفتح في تبويب جديد)</span>
        </a>
      </div>

      {viewerOpen && (
        <FullscreenViewer
          imageUrl={imageUrl}
          stage={stage}
          onClose={closeViewer}
        />
      )}
    </>
  );
}

// ==================== Empty State ====================
function EmptyState() {
  return (
    <div
      role="status"
      className="mt-6 card-editorial p-10 text-center animate-slide-up motion-reduce:animate-none"
    >
      <div
        aria-hidden="true"
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-gold-tint text-gold-ink"
      >
        <IconCalendar className="h-8 w-8" />
      </div>
      <p className="mt-4 font-bold text-ink-soft">
        لا يوجد جدول مرفوع لمرحلتك حالياً.
      </p>
      <p className="mt-1 text-sm text-ink-muted">يرجى العودة لاحقاً</p>
    </div>
  );
}

// ==================== No Stage State ====================
function NoStageState() {
  return (
    <div
      role="status"
      className="mt-6 card-editorial p-10 text-center animate-slide-up motion-reduce:animate-none"
    >
      <div
        aria-hidden="true"
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-gold-tint text-gold-ink"
      >
        <IconWarning className="h-8 w-8" />
      </div>
      <p className="mt-4 font-bold text-ink-soft">
        لم نعرف مرحلتك الدراسية بعد.
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        اختر مرحلتك من لوحة الأقسام ثم ارجع لهذه الصفحة.
      </p>
    </div>
  );
}

// ==================== Error State ====================
function ErrorState({
  error,
  onRetry,
}: {
  error: LoadError;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mt-6 flex items-start gap-3 rounded-card border border-coral/30 bg-coral/5 p-4 animate-slide-up motion-reduce:animate-none"
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field bg-coral text-on-coral"
      >
        <IconWarning className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-coral-ink">تعذّر تحميل الجدول</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
          {error.message}
        </p>
        {error.detail && (
          <p
            dir="ltr"
            className="mt-1 break-anywhere text-end font-mono text-[11px] text-ink-muted"
          >
            {error.detail}
          </p>
        )}
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex h-10 items-center rounded-field border border-line bg-paper-soft px-4 text-xs font-semibold text-ink-soft transition-colors hover:border-teal/40 hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}

// ==================== Page ====================
export default function SchedulePage() {
  const { stage, ready } = useStudentStage();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<LoadError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!stage) return;
    const currentStage = stage;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('schedules')
          .select('image_url')
          .eq('stage', currentStage)
          .limit(1)
          .maybeSingle<ScheduleImage>();

        if (cancelled) return;

        if (fetchError) {
          setError(buildError(fetchError.message));
          setImageUrl(null);
        } else {
          setImageUrl(toSafeUrl(data?.image_url));
        }
      } catch (e: unknown) {
        if (cancelled) return;
        setError(buildError(e instanceof Error ? e.message : ''));
        setImageUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [stage, reloadKey]);

  const handleRetry = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  // إعادة محاولة تلقائية عند رجوع الإنترنت
  useEffect(() => {
    if (!error) return;
    function onOnline() {
      setReloadKey((k) => k + 1);
    }
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [error]);

  // ==================== Loading (stage not ready) ====================
  if (!ready) {
    return (
      <main className={MAIN_CLASS} aria-busy="true">
        <Skeleton />
      </main>
    );
  }

  // ==================== No stage ====================
  if (!stage) {
    return (
      <main className={MAIN_CLASS}>
        <BackLink />
        <NoStageState />
      </main>
    );
  }

  return (
    <main className={MAIN_CLASS} aria-labelledby="schedule-title">
      {/* ==================== Back ==================== */}
      <BackLink />

      {/* ==================== Header ==================== */}
      <header className="mt-6 animate-slide-up motion-reduce:animate-none">
        <StageBadge stage={stage} />

        <h1
          id="schedule-title"
          className="mt-3 flex items-center gap-2.5 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl"
        >
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field bg-teal-soft text-teal"
          >
            <IconCalendar className="h-5 w-5" />
          </span>
          جدول المحاضرات
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          جدول محاضرات الأسبوع لمرحلتك. اضغط على الصورة لعرضها بحجم كامل.
        </p>
      </header>

      {/* ==================== Content ==================== */}
      <div aria-busy={loading}>
        {loading && <Skeleton />}

        {!loading && error && (
          <ErrorState error={error} onRetry={handleRetry} />
        )}

        {!loading && !error && !imageUrl && <EmptyState />}

        {!loading && !error && imageUrl && (
          <ScheduleCard key={imageUrl} imageUrl={imageUrl} stage={stage} />
        )}
      </div>

      {/* ==================== Footer Note ==================== */}
      {!loading && !error && imageUrl && (
        <p className="mt-6 text-center text-xs leading-relaxed text-ink-muted">
          في حال وجود خطأ في الجدول، يرجى التواصل مع إدارة المرحلة.
        </p>
      )}
    </main>
  );
}