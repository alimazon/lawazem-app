// app/study-health/page.tsx
'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useStudentStage } from '@/hooks/useStudentStage';
import { useStudyStats, formatHour } from '@/hooks/useStudyStats';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

// ==================== Icons ====================
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconActivity() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l3-9 4 18 3-9h4" />
    </svg>
  );
}
function IconFire() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2c1 4 4 5 4 9a4 4 0 11-8 0c0-1 .5-2 1-2.5C8 10 7 12 7 14a5 5 0 1010 0c0-5-5-6-5-12z" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
function IconTrophy() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21l4-4 4 4M12 17a5 5 0 01-5-5V4h10v8a5 5 0 01-5 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 4H3v2a3 3 0 003 3M19 4h2v2a3 3 0 01-3 3" />
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
function IconWarning() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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

// ==================== Stat Box ====================
function StatBox({
  icon,
  label,
  value,
  suffix,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
  accent: 'teal' | 'amber' | 'red';
}) {
  const styles = {
    teal: 'bg-teal/10 text-teal dark:bg-teal/20',
    amber: 'bg-amber/15 text-amber-800 dark:bg-amber/25 dark:text-amber-300',
    red: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300',
  }[accent];

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/80 px-4 py-3 dark:bg-paper/80">
      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${styles}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xl font-black leading-none text-ink">
          {value}
          {suffix && <span className="text-sm">{suffix}</span>}
        </p>
        <p className="mt-0.5 truncate text-[11px] font-bold text-ink/50">{label}</p>
      </div>
    </div>
  );
}

// ==================== Weekly Chart ====================
function WeeklyChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end justify-between gap-1.5 rounded-2xl border border-line bg-white/80 p-4 dark:bg-paper/80">
      {data.map((d, i) => {
        const heightPct = (d.count / max) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] font-black text-ink/60">{d.count || ''}</span>
            <div className="flex h-24 w-full items-end rounded-md bg-ink/5 dark:bg-white/5">
              <div
                className="w-full rounded-md bg-gradient-to-t from-teal to-teal-light transition-all duration-500"
                style={{ height: `${Math.max(heightPct, d.count > 0 ? 8 : 0)}%` }}
              />
            </div>
            <span className="truncate text-[9px] font-bold text-ink/50">{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

// ==================== Subject Row ====================
function SubjectRow({
  rank,
  name,
  sub,
  variant,
}: {
  rank: number;
  name: string;
  sub: string;
  variant: 'top' | 'weak';
}) {
  const styles =
    variant === 'top'
      ? 'bg-teal/10 text-teal dark:bg-teal/20'
      : 'bg-amber/15 text-amber-800 dark:bg-amber/25 dark:text-amber-300';
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white/70 px-3 py-2.5 dark:bg-white/[0.03]">
      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-mono text-sm font-black ${styles}`}>
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{name}</p>
        <p className="text-[11px] text-ink/50">{sub}</p>
      </div>
    </div>
  );
}

// ==================== Page ====================
export default function StudyHealthPage() {
  const { stage, ready } = useStudentStage();
  const { analysis, mounted, reset } = useStudyStats();
  const confirm = useConfirm();
  const toast = useToast();

  const hasData = useMemo(() => analysis.totalViews > 0, [analysis.totalViews]);

  async function handleReset() {
    const ok = await confirm(
      'سيتم مسح كل إحصائياتك الدراسية (لا يؤثر على الملازم المحفوظة أو آخر ما زرته). هل أنت متأكد؟',
      { variant: 'danger', confirmLabel: 'مسح' }
    );
    if (!ok) return;
    reset();
    toast.show('تم مسح الإحصائيات', 'success');
  }

  if (!ready || !mounted) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 skeleton-shimmer rounded-3xl" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
      <Link
        href="/"
        className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal"
      >
        <span className="transition-transform duration-200 group-hover:translate-x-1">
          <IconArrowLeft />
        </span>
        رجوع إلى لوحة الأقسام
      </Link>

      {/* ==================== Header ==================== */}
      <div className="mt-6 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 flex items-center gap-2 text-3xl font-black leading-tight text-ink sm:text-4xl">
          <IconActivity />
          صحتك الدراسية
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          تحليل شخصي لعادات مذاكرتك — كل شيء محفوظ على جهازك فقط.
        </p>
      </div>

      {/* ==================== Empty State ==================== */}
      {!hasData && (
        <div className="mt-6 rounded-3xl border border-line bg-white/80 p-10 text-center animate-slide-up dark:bg-paper/80">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-teal/8 text-teal dark:bg-teal/15">
            <IconChart />
          </div>
          <p className="mt-4 font-bold text-ink/70">ما زلنا نجمع بياناتك</p>
          <p className="mt-1 text-sm text-ink/50">
            افتح بعض الملازم، وسنبدأ بتحليل عاداتك الدراسية.
          </p>
          <Link
            href="/lawazem"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-teal px-5 py-2.5 text-sm font-black text-white shadow-[0_2px_10px_rgba(14,74,74,0.28)] transition-all hover:bg-teal-light active:scale-95"
          >
            ابدأ الآن
          </Link>
        </div>
      )}

      {hasData && (
        <>
          {/* ==================== Quick Stats ==================== */}
          <div className="mt-6 grid grid-cols-3 gap-2 animate-slide-up">
            <StatBox
              icon={<IconEye />}
              label="إجمالي الفتحات"
              value={analysis.totalViews}
              accent="teal"
            />
            <StatBox
              icon={<IconFire />}
              label="أيام متتالية"
              value={analysis.currentStreak}
              accent="amber"
            />
            <StatBox
              icon={<IconCalendar />}
              label="أيام نشطة"
              value={analysis.daysActive}
              accent="teal"
            />
          </div>

          {/* ==================== Weekly Chart ==================== */}
          <div className="mt-6 animate-slide-up" style={{ animationDelay: '80ms' }}>
            <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-ink">
              <IconCalendar />
              آخر 7 أيام
            </h2>
            <WeeklyChart data={analysis.weeklyActivity} />
          </div>

          {/* ==================== Top Subjects ==================== */}
          {analysis.topSubjects.length > 0 && (
            <div className="mt-6 animate-slide-up" style={{ animationDelay: '120ms' }}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-ink">
                <IconTrophy />
                أقوى موادك
              </h2>
              <div className="space-y-2">
                {analysis.topSubjects.map((s, i) => (
                  <SubjectRow
                    key={s.name}
                    rank={i + 1}
                    name={s.name}
                    sub={`${s.views} ${s.views === 1 ? 'فتحة' : 'فتحات'} · آخر مرة ${
                      s.daysSince === 0 ? 'اليوم' : `قبل ${s.daysSince} يوم`
                    }`}
                    variant="top"
                  />
                ))}
              </div>
            </div>
          )}

          {/* ==================== Weak Subjects ==================== */}
          {analysis.weakSubjects.length > 0 && (
            <div className="mt-6 animate-slide-up" style={{ animationDelay: '160ms' }}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-ink">
                <IconWarning />
                مواد تحتاج انتباه
              </h2>
              <div className="space-y-2">
                {analysis.weakSubjects.map((s, i) => (
                  <SubjectRow
                    key={s.name}
                    rank={i + 1}
                    name={s.name}
                    sub={`ما لمستها منذ ${s.daysSince} يوم`}
                    variant="weak"
                  />
                ))}
              </div>
            </div>
          )}

          {/* ==================== Best Hour ==================== */}
          {analysis.bestHour !== null && (
            <div className="mt-6 rounded-2xl border border-teal/20 bg-teal/[0.04] p-4 dark:border-teal/30 dark:bg-teal/10">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal/15 text-teal">
                  <IconSparkles />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-ink">
                    وقت ذروتك: {formatHour(analysis.bestHour)}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink/60">
                    هذا الوقت الذي تكون فيه أكثر إنتاجية — استغله للمواد الصعبة.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==================== Badges ==================== */}
          {analysis.badges.length > 0 && (
            <div className="mt-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-ink">
                <IconTrophy />
                شاراتك
              </h2>
              <div className="flex flex-wrap gap-2">
                {analysis.badges.map((b, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/10 px-3 py-1.5 text-xs font-black text-amber-800 dark:border-amber/50 dark:bg-amber/20 dark:text-amber-300"
                  >
                    <span className="text-base leading-none">{b.emoji}</span>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ==================== Reset ==================== */}
          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              مسح كل الإحصائيات
            </Button>
          </div>

          {/* ==================== Disclaimer ==================== */}
          <div className="mt-6 flex items-start gap-2 rounded-2xl border border-amber/30 bg-amber/8 p-4 text-xs text-ink/70 dark:bg-amber/15">
            <span className="text-amber">
              <IconWarning />
            </span>
            <p className="leading-relaxed">
              <strong>ملاحظة:</strong> كل الإحصائيات محفوظة على جهازك فقط ولا تُرسَل
              لأي مكان. مسح بيانات المتصفح يمسحها.
            </p>
          </div>
        </>
      )}
    </main>
  );
}