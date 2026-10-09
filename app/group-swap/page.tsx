// app/group-swap/page.tsx
'use client';

import Link from 'next/link';
import { useStudentStage } from '@/hooks/useStudentStage';

// ==================== Icons ====================
function IconArrowLeft() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 17l-5-5m0 0l5-5m-5 5h12"
      />
    </svg>
  );
}

function IconClock() {
  return (
    <svg
      className="h-10 w-10"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  );
}

// ==================== Page ====================
export default function GroupSwapPage() {
  const { stage, ready } = useStudentStage();

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="h-64 skeleton-shimmer rounded-card" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-teal/80 transition-colors hover:text-teal"
      >
        <span className="transition-transform duration-200 group-hover:translate-x-1">
          <IconArrowLeft />
        </span>
        رجوع إلى لوحة الأقسام
      </Link>

      <div className="mt-8 ink-reveal">
        <div className="card-editorial overflow-hidden">
          {/* Banner */}
          <div className="border-b border-line bg-teal px-6 py-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-chip border-2 border-gold/40 bg-teal-hover text-gold">
              <IconClock />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center sm:p-8">
            <p className="kicker justify-center">قريباً</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
              تبديل الكروبات
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
              هذه الميزة ستتيح للطلاب تبديل كروبات العملي بسهولة تامة.
              نعمل حالياً على تجهيزها، وستكون متاحة قريباً لكل المراحل.
            </p>

            <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-chip border border-gold/40 bg-gold-soft px-4 py-2 text-xs font-semibold text-gold-ink">
              <span aria-hidden="true">◆</span>
              المرحلة الحالية: {stage}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Link
                href="/lawazem"
                className="inline-flex items-center gap-1.5 rounded-field bg-teal px-5 py-2.5 text-sm font-semibold text-on-teal transition-colors hover:bg-teal-hover active:scale-[0.98]"
              >
                تصفح الملازم
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-field border border-line-strong bg-paper-soft px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-gold/40 hover:bg-paper-deep hover:text-ink active:scale-[0.98]"
              >
                العودة للرئيسية
              </Link>
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="mt-6 text-center text-xs leading-relaxed text-ink-muted">
          سنعلن عن إطلاق الميزة عبر قنوات المنصة الرسمية.
        </p>
      </div>
    </main>
  );
}