// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { STAGES, STORAGE_KEYS } from '@/lib/constants';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { RecentViewsCard } from '@/components/RecentViewsCard';   // ✅ جديد
import type { Stage } from '@/lib/types';

// ==================== Icons ====================
function IconBook() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
function IconCheck() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ==================== Section Config ====================
interface Section {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accent: 'teal' | 'amber';
}

const SECTIONS: Section[] = [
  { title: 'الملازم', description: 'ملازم الدكاترة مرتبة حسب المادة', href: '/lawazem', icon: <IconBook />, accent: 'teal' },
  { title: 'القنوات الدراسية', description: 'دليل قنوات التليكرام الدراسية', href: '/channels', icon: <IconChat />, accent: 'teal' },
  { title: 'الجدول', description: 'جدول المحاضرات الأسبوعي لمرحلتك', href: '/schedule', icon: <IconCalendar />, accent: 'amber' },
  { title: 'جات الدراسة', description: 'برومبت ذكي يدرس معك بالـAI', href: '/study-prompt', icon: <IconSparkles />, accent: 'amber' },
  { title: 'المعدل', description: 'احفظ درجاتك واحسب معدلك الموزون حسب وحدات موادك', href: '/gpa', icon: <IconChart />, accent: 'teal' },
];

// ==================== Stage Card ====================
function StageCard({ stage, index, onClick }: { stage: string; index: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${index * 80}ms` }}
      className="group relative w-full overflow-hidden rounded-2xl border-2 border-line bg-white/80 p-6 text-right shadow-[0_2px_8px_rgba(26,33,31,0.05)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal hover:shadow-[0_12px_30px_rgba(14,74,74,0.15)] active:scale-[0.98] animate-slide-up dark:bg-paper/80"
    >
      <div className="absolute inset-x-0 top-0 h-1 origin-right scale-x-0 bg-gradient-to-l from-teal via-teal-light to-teal transition-transform duration-500 group-hover:scale-x-100" />
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/8 text-teal transition-all duration-300 group-hover:bg-teal group-hover:text-white group-hover:shadow-[0_4px_14px_rgba(14,74,74,0.30)]">
          <IconBook />
        </span>
        <span className="font-mono text-xs uppercase tracking-widest text-ink/30">0{index + 1}</span>
      </div>
      <h3 className="mt-4 text-lg font-black text-ink">{stage}</h3>
      <div className="mt-2 flex items-center gap-1 text-sm font-bold text-teal opacity-70 transition-all duration-300 group-hover:gap-2 group-hover:opacity-100">
        <span>اختر</span>
        <span className="transition-transform duration-300 group-hover:-translate-x-1"><IconArrowLeft /></span>
      </div>
    </button>
  );
}

// ==================== Section Card ====================
function SectionCard({ section, index }: { section: Section; index: number }) {
  const isTeal = section.accent === 'teal';
  const gradient = isTeal
    ? 'from-teal/8 to-teal/4 group-hover:from-teal/12 group-hover:to-teal/6'
    : 'from-amber/12 to-amber/6 group-hover:from-amber/18 group-hover:to-amber/10';
  const iconBg = isTeal
    ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] group-hover:shadow-[0_6px_18px_rgba(14,74,74,0.34)]'
    : 'bg-amber text-ink shadow-[0_2px_8px_rgba(224,166,58,0.30)] group-hover:shadow-[0_6px_18px_rgba(224,166,58,0.42)]';
  const accentText = isTeal ? 'text-teal' : 'text-amber-700';

  return (
    <Link
      href={section.href}
      style={{ animationDelay: `${index * 60}ms` }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal/30 hover:shadow-[0_12px_30px_rgba(14,74,74,0.10)] active:scale-[0.99] animate-slide-up dark:bg-paper/80"
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-bl opacity-0 transition-opacity duration-300 ${gradient} group-hover:opacity-100`} />
      <div className="relative">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 ${iconBg}`}>
          {section.icon}
        </div>
        <h2 className="mt-4 text-base font-extrabold text-ink">{section.title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink/55">{section.description}</p>
        <div className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold ${accentText} transition-all duration-300 group-hover:gap-2.5`}>
          <span>فتح</span>
          <span className="transition-transform duration-300 group-hover:-translate-x-1"><IconArrowLeft /></span>
        </div>
      </div>
    </Link>
  );
}

// ==================== Page ====================
export default function HomePage() {
  const [stage, setStage] = useState<Stage | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.studentStage) as Stage | null;
    if (saved) setStage(saved);
    setLoaded(true);
  }, []);

  function chooseStage(s: Stage) {
    localStorage.setItem(STORAGE_KEYS.studentStage, s);
    setStage(s);
  }
  function changeStage() {
    localStorage.removeItem(STORAGE_KEYS.studentStage);
    setStage(null);
  }

  if (!loaded) return <main className="min-h-screen bg-paper" />;

  return (
    <>
      <AnimatedBackground />

      {!stage ? (
        <main className="relative mx-auto flex min-h-[calc(100vh-70px)] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
          <div className="relative animate-slide-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/5 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-teal backdrop-blur-sm">
              <IconCheck />
              منصة لطلبة جامعةالعميد
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-black leading-tight text-ink sm:text-4xl animate-slide-up" style={{ animationDelay: '80ms' }}>
            اختر مرحلتك الدراسية
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-ink/60 animate-slide-up" style={{ animationDelay: '160ms' }}>
            في لوازم نعرض لك المحتوى المناسب لمرحلتك قنوات، جداول، وكل شي.
          </p>

          <div className="relative mt-12 grid w-full gap-4 sm:grid-cols-3">
            {STAGES.map((s, i) => (
              <StageCard key={s} stage={s} index={i} onClick={() => chooseStage(s)} />
            ))}
          </div>

          <p className="mt-10 text-xs text-ink/40 animate-slide-up" style={{ animationDelay: '400ms' }}>
            تكدر تغيّرها لاحقًا
          </p>
        </main>
      ) : (
        <main className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-wrap items-end justify-between gap-3 animate-slide-up">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
                {stage}
              </span>
              <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">شنو تحتاج اليوم؟</h1>
              <p className="mt-2 text-sm text-ink/50">كل شي بمكان واحد — اختر القسم اللي تحتاجه</p>
            </div>
            <button
              onClick={changeStage}
              className="rounded-lg border border-line bg-white/80 px-3.5 py-2 text-xs font-bold text-ink/70 shadow-[0_1px_2px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-200 hover:border-ink/20 hover:bg-paper hover:text-ink active:scale-95 dark:bg-paper/80"
            >
              تغيير المرحلة
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((sec, i) => (
              <SectionCard key={sec.href} section={sec} index={i} />
            ))}
          </div>

          {/* ✅ جديد: آخر ما زرته */}
          <div className="mt-8">
            <RecentViewsCard />
          </div>

          <p className="mt-12 text-center text-xs text-ink/40 animate-slide-up" style={{ animationDelay: '400ms' }}>
            صُنع بكل حب لطلاب كلية الطب · جامعةالعميد · برمجة واعدادالطالب : علي مازن @E_W_9
          </p>
        </main>
      )}
    </>
  );
}