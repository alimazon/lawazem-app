// components/DailyCompanion.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRecentViews, type RecentView } from '@/hooks/useRecentViews';

// ==================== Types ====================
interface SuggestionAction {
  label: string;
  href: string;
  external?: boolean;
}

interface Suggestion {
  emoji: string;
  title: string;
  description: string;
  primary: SuggestionAction;
  secondary?: SuggestionAction;
}

// ==================== Time Helpers ====================
function getGreeting(): { emoji: string; text: string } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { emoji: '🌅', text: 'صباح الخير' };
  if (h >= 12 && h < 17) return { emoji: '☀️', text: 'نهارك سعيد' };
  if (h >= 17 && h < 22) return { emoji: '🌆', text: 'مساء الخير' };
  return { emoji: '🌙', text: 'ليلة هادئة' };
}

function getDayName(): string {
  const days = [
    'الأحد',
    'الاثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'السبت',
  ];
  return days[new Date().getDay()];
}

function getTimeLabel(): string {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes();
  const period =
    h >= 5 && h < 12
      ? 'صباحاً'
      : h >= 12 && h < 17
      ? 'ظهراً'
      : h >= 17 && h < 21
      ? 'مساءً'
      : 'ليلاً';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

// ==================== Suggestion Logic ====================
function hoursSince(timestamp: number): number {
  return (Date.now() - timestamp) / (1000 * 60 * 60);
}

function getSuggestion(recent: RecentView[]): Suggestion {
  const now = new Date();
  const h = now.getHours();
  const day = now.getDay(); // 0=Sunday, 5=Friday, 6=Saturday

  const last = recent.length > 0 ? recent[0] : null;
  const lastHours = last ? hoursSince(last.viewed_at) : Infinity;

  // 1) زيارة حديثة جداً (< 6 ساعات) → متابعة فورية
  if (last && lastHours < 6) {
    return {
      emoji: '📖',
      title: `تابع ${last.subject_name}`,
      description: last.title,
      primary: {
        label: 'افتح الملزمة',
        href: last.file_path,
        external: true,
      },
      secondary: { label: 'كل الملازم', href: '/lawazem' },
    };
  }

  // 2) الجمعة → يوم هادئ
  if (day === 5) {
    return {
      emoji: '🕌',
      title: 'جمعة مباركة',
      description: 'يوم هادئ للمراجعة الخفيفة أو تصفح القاموس الطبي',
      primary: { label: 'القاموس الطبي', href: '/dictionary' },
      secondary: { label: 'الملازم', href: '/lawazem' },
    };
  }

  // 3) السبت → استعداد للأسبوع
  if (day === 6) {
    return {
      emoji: '📚',
      title: 'استعد للأسبوع',
      description: 'جهّز موادك قبل بدء المحاضرات غداً',
      primary: { label: 'الملازم', href: '/lawazem' },
      secondary: { label: 'الجدول', href: '/schedule' },
    };
  }

  // 4) زيارة خلال آخر 48 ساعة → متابعة
  if (last && lastHours < 48) {
    return {
      emoji: '🔖',
      title: 'تابع من حيث توقفت',
      description: `${last.subject_name} · ${last.title}`,
      primary: {
        label: 'افتح الملزمة',
        href: last.file_path,
        external: true,
      },
      secondary: { label: 'الملازم', href: '/lawazem' },
    };
  }

  // 5) صباح يوم دراسي (6 - 12)
  if (h >= 6 && h < 12) {
    return {
      emoji: '🚀',
      title: 'صباح الإنتاجية',
      description: 'ابدأ يومك بمراجعة مادة أو تصفح ملازمك',
      primary: { label: 'الملازم', href: '/lawazem' },
      secondary: { label: 'الجدول', href: '/schedule' },
    };
  }

  // 6) مساء (17 - 22)
  if (h >= 17 && h < 22) {
    return {
      emoji: '🌙',
      title: 'وقت المراجعة',
      description: 'راجع مادة أو افتح القاموس الطبي',
      primary: { label: 'الملازم', href: '/lawazem' },
      secondary: { label: 'القاموس', href: '/dictionary' },
    };
  }

  // 7) افتراضي
  return {
    emoji: '✨',
    title: 'اكتشف جديد لوازم',
    description: 'تصفح الملازم أو جرّب القاموس الطبي الذكي',
    primary: { label: 'الملازم', href: '/lawazem' },
    secondary: { label: 'القاموس', href: '/dictionary' },
  };
}

// ==================== Icons ====================
function IconArrow() {
  return (
    <svg
      className="h-3.5 w-3.5"
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

function IconExternal() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="rounded-3xl border border-line bg-white/70 p-5 backdrop-blur-sm dark:bg-paper/70">
      <div className="h-6 w-40 skeleton-shimmer rounded" />
      <div className="mt-3 h-3 w-32 skeleton-shimmer rounded" />
      <div className="mt-5 h-4 w-48 skeleton-shimmer rounded" />
      <div className="mt-2 h-3 w-full skeleton-shimmer rounded" />
      <div className="mt-4 h-10 w-36 skeleton-shimmer rounded-xl" />
    </div>
  );
}

// ==================== Component ====================
export function DailyCompanion() {
  const { recent, mounted } = useRecentViews();
  const [tick, setTick] = useState(0);

  // حدّث الوقت كل دقيقة
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!mounted) return <Skeleton />;

  // tick يُستخدم فقط لتحفيز re-render
  void tick;

  const greeting = getGreeting();
  const day = getDayName();
  const time = getTimeLabel();
  const suggestion = getSuggestion(recent);

  const PrimaryTag = suggestion.primary.external ? 'a' : Link;
  const SecondaryTag = suggestion.secondary?.external ? 'a' : Link;

  const primaryProps = suggestion.primary.external
    ? {
        href: suggestion.primary.href,
        target: '_blank',
        rel: 'noopener noreferrer',
      }
    : { href: suggestion.primary.href };

  const secondaryProps = suggestion.secondary
    ? suggestion.secondary.external
      ? {
          href: suggestion.secondary.href,
          target: '_blank',
          rel: 'noopener noreferrer',
        }
      : { href: suggestion.secondary.href }
    : { href: '#' };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-bl from-teal/8 via-teal/4 to-transparent p-5 shadow-[0_2px_14px_rgba(14,74,74,0.06)] backdrop-blur-sm animate-slide-up dark:from-teal/15 dark:via-teal/8 dark:shadow-[0_2px_14px_rgba(0,0,0,0.30)] sm:p-6">
      {/* ==================== Header ==================== */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none" aria-hidden="true">
              {greeting.emoji}
            </span>
            <h2 className="text-xl font-black text-ink sm:text-2xl">
              {greeting.text}
            </h2>
          </div>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-ink/45">
            {day} · {time}
          </p>
        </div>
      </div>

      {/* ==================== Divider ==================== */}
      <div className="my-4 h-px bg-gradient-to-l from-transparent via-line to-transparent" />

      {/* ==================== Suggestion ==================== */}
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-[0_2px_8px_rgba(14,74,74,0.10)] dark:bg-white/[0.08]">
          {suggestion.emoji}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-wider text-teal">
            💡 اقتراحنا لك
          </p>
          <h3 className="mt-0.5 text-base font-black text-ink sm:text-lg">
            {suggestion.title}
          </h3>
          <p className="mt-0.5 text-sm leading-relaxed text-ink/60">
            {suggestion.description}
          </p>
        </div>
      </div>

      {/* ==================== Actions ==================== */}
      <div className="mt-5 flex flex-wrap gap-2">
        <PrimaryTag
          {...primaryProps}
          className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-black text-white shadow-[0_2px_10px_rgba(14,74,74,0.28)] transition-all duration-200 hover:bg-teal-light active:scale-95"
        >
          <span>{suggestion.primary.label}</span>
          {suggestion.primary.external ? <IconExternal /> : <IconArrow />}
        </PrimaryTag>

        {suggestion.secondary && (
          <SecondaryTag
            {...secondaryProps}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/80 px-4 py-2.5 text-sm font-bold text-ink/70 transition-all duration-200 hover:border-teal/30 hover:text-teal active:scale-95 dark:bg-white/[0.06]"
          >
            {suggestion.secondary.label}
          </SecondaryTag>
        )}
      </div>
    </div>
  );
}