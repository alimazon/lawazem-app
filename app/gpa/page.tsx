// app/gpa/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Field';
import type { Subject } from '@/lib/types';

// ==================== Constants ====================
interface ComponentDef {
  key: string;
  label: string;
  defaultMax: number;
}

const COMPONENTS: readonly ComponentDef[] = [
  { key: 'first', label: 'الفصل الأول', defaultMax: 10 },
  { key: 'mid', label: 'المد', defaultMax: 20 },
  { key: 'second', label: 'الفصل الثاني', defaultMax: 10 },
  { key: 'finalTheory', label: 'الفاينل (نظري)', defaultMax: 40 },
  { key: 'finalPractical', label: 'الفاينل (عملي)', defaultMax: 20 },
] as const;

// أهداف النجاح / التقدير
interface TargetDef {
  value: number;
  label: string;
  short: string;
}

const TARGETS: readonly TargetDef[] = [
  { value: 50, label: 'النجاح', short: 'نجاح' },
  { value: 60, label: 'جيد', short: 'جيد' },
  { value: 70, label: 'جيد جداً', short: 'جيد جداً' },
  { value: 80, label: 'امتياز', short: 'امتياز' },
] as const;

const TARGET_KEY_PREFIX = 'gpa_target_';

// ==================== Types ====================
interface ComponentData {
  max: string;
  score: string;
}
type SubjectScores = Record<string, ComponentData>;
type AllScores = Record<string, SubjectScores>;

interface SubjectWithPercentage extends Subject {
  percentage: number | null;
  targetAnalysis: TargetAnalysis;
}

interface TargetAnalysis {
  currentScore: number;
  totalMax: number;
  remainingMax: number;
  targetScore: number;
  needFromRemaining: number;
  achieved: boolean;
  impossible: boolean;
  noData: boolean;
  allEntered: boolean;
}

// ==================== Helpers ====================
function defaultSubjectScores(): SubjectScores {
  const obj: SubjectScores = {};
  for (const c of COMPONENTS) obj[c.key] = { max: String(c.defaultMax), score: '' };
  return obj;
}

function safeParseScores(raw: string | null): AllScores {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as AllScores;
  } catch {}
  return {};
}

function calculatePercentage(subjectScores: SubjectScores | undefined): number | null {
  if (!subjectScores) return null;
  let totalMax = 0;
  let totalScore = 0;
  let anyEntered = false;

  for (const c of COMPONENTS) {
    const comp = subjectScores[c.key];
    if (!comp || comp.score === '') continue;
    const scoreNum = Number(comp.score);
    const maxNum = Number(comp.max);
    if (Number.isNaN(scoreNum) || Number.isNaN(maxNum) || maxNum <= 0) continue;
    if (scoreNum < 0 || scoreNum > maxNum) continue;
    anyEntered = true;
    totalMax += maxNum;
    totalScore += scoreNum;
  }
  if (!anyEntered || totalMax === 0) return null;
  return (totalScore / totalMax) * 100;
}

// ✅ تحليل الوضع بالنسبة للهدف
function analyzeForTarget(
  subjectScores: SubjectScores | undefined,
  targetPercent: number
): TargetAnalysis {
  const base: TargetAnalysis = {
    currentScore: 0,
    totalMax: 0,
    remainingMax: 0,
    targetScore: 0,
    needFromRemaining: 0,
    achieved: false,
    impossible: false,
    noData: true,
    allEntered: false,
  };

  if (!subjectScores) return base;

  let currentScore = 0;
  let totalMax = 0;
  let remainingMax = 0;
  let enteredCount = 0;

  for (const c of COMPONENTS) {
    const comp = subjectScores[c.key];
    if (!comp) continue;
    const maxNum = Number(comp.max);
    if (Number.isNaN(maxNum) || maxNum <= 0) continue;

    totalMax += maxNum;

    if (comp.score === '') {
      remainingMax += maxNum;
    } else {
      const scoreNum = Number(comp.score);
      if (Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxNum) {
        remainingMax += maxNum;
        continue;
      }
      currentScore += scoreNum;
      enteredCount++;
    }
  }

  if (totalMax === 0) return base;

  const targetScore = (targetPercent / 100) * totalMax;
  const needFromRemaining = targetScore - currentScore;
  const achieved = needFromRemaining <= 0;
  const impossible = !achieved && needFromRemaining > remainingMax;
  const noData = enteredCount === 0;
  const allEntered = remainingMax === 0;

  return {
    currentScore,
    totalMax,
    remainingMax,
    targetScore,
    needFromRemaining,
    achieved,
    impossible,
    noData,
    allEntered,
  };
}

// ==================== Icons ====================
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg className={`h-4 w-4 flex-shrink-0 text-ink/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
function IconTrendingUp() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="mt-6 space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between rounded-2xl border border-line bg-white/80 p-4 backdrop-blur-sm dark:bg-paper/80">
          <div className="h-4 w-40 skeleton-shimmer rounded" />
          <div className="h-6 w-16 skeleton-shimmer rounded-full" />
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

// ==================== Score Color ====================
function getScoreColor(pct: number): string {
  if (pct >= 85) return 'bg-teal/10 text-teal dark:bg-teal/20 dark:text-teal';
  if (pct >= 70) return 'bg-teal/8 text-teal-light dark:bg-teal/15 dark:text-teal';
  if (pct >= 50) return 'bg-amber/15 text-amber-800 dark:bg-amber/25 dark:text-amber-300';
  return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300';
}

// ==================== Target Selector ====================
function TargetSelector({
  target,
  onChange,
}: {
  target: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white/80 p-4 dark:bg-paper/80">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/10 text-teal dark:bg-teal/20">
          <IconTarget />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">هدفي في كل مادة</p>
          <p className="text-[11px] text-ink/50">اختر هدفك، وسنخبرك بكم تحتاج في المتبقي</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {TARGETS.map((t) => {
          const active = target === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange(t.value)}
              className={`rounded-xl border px-2 py-2.5 text-center transition-all duration-200 active:scale-95 ${
                active
                  ? 'border-teal bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)]'
                  : 'border-line bg-white text-ink/70 hover:border-teal/40 dark:bg-white/[0.04]'
              }`}
            >
              <p className={`font-mono text-lg font-black leading-none ${active ? '' : 'text-ink'}`}>
                {t.value}
                <span className="text-xs">%</span>
              </p>
              <p className={`mt-0.5 text-[10px] font-bold ${active ? 'text-white/90' : 'text-ink/50'}`}>
                {t.short}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== Target Analysis Card ====================
function TargetAnalysisCard({
  analysis,
  target,
  subjectName,
}: {
  analysis: TargetAnalysis;
  target: number;
  subjectName: string;
}) {
  // لا درجات مُدخلة
  if (analysis.noData) {
    return (
      <div className="rounded-2xl border border-line bg-paper/60 p-4 text-center dark:bg-white/[0.03]">
        <p className="text-sm text-ink/50">أدخل أي درجة لتظهر لك التوقعات</p>
      </div>
    );
  }

  // حقق الهدف
  if (analysis.achieved) {
    return (
      <div className="rounded-2xl border border-teal/30 bg-teal/[0.04] p-4 dark:border-teal/40 dark:bg-teal/10">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-teal text-white">
            <IconCheck />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-teal">🎉 ضمنت {target}% في {subjectName}</p>
            <p className="mt-0.5 text-xs text-ink/60">
              حتى لو جبت صفر في المتبقي، لسا محقق هدفك.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // مستحيل
  if (analysis.impossible) {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/40">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-500 text-white">
            <IconWarning />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-red-700 dark:text-red-300">
              صعب تحقيق {target}% في {subjectName}
            </p>
            <p className="mt-0.5 text-xs text-ink/60">
              تحتاج {analysis.needFromRemaining.toFixed(1)} درجة، والحد الأقصى المتبقي {analysis.remainingMax} فقط.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // تحتاج نقاط
  return (
    <div className="rounded-2xl border border-amber/30 bg-amber/8 p-4 dark:border-amber/40 dark:bg-amber/15">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber text-ink">
          <IconTrendingUp />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-ink">
            تحتاج <span className="text-lg text-amber-800 dark:text-amber-300">{analysis.needFromRemaining.toFixed(1)}</span> درجة
          </p>
          <p className="mt-0.5 text-xs text-ink/60">
            من أصل <strong>{analysis.remainingMax}</strong> متبقية لتحقق هدف {target}% في {subjectName}
          </p>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-ink/50">
              <span>حالياً: {analysis.currentScore.toFixed(1)}</span>
              <span>الهدف: {analysis.targetScore.toFixed(1)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-l from-amber to-amber-soft transition-all duration-500"
                style={{
                  width: `${Math.min(100, (analysis.currentScore / analysis.targetScore) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Status Chip (للـheader) ====================
function StatusChip({ analysis, target }: { analysis: TargetAnalysis; target: number }) {
  if (analysis.noData) return null;

  if (analysis.achieved) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-black text-teal dark:bg-teal/25">
        <IconCheck />
        ضمنت {target}%
      </span>
    );
  }

  if (analysis.impossible) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-700 dark:bg-red-950/50 dark:text-red-300">
        <IconWarning />
        {target}% صعب
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-black text-amber-800 dark:bg-amber/30 dark:text-amber-300">
      <IconTrendingUp />
      تحتاج {analysis.needFromRemaining.toFixed(1)} لـ{target}%
    </span>
  );
}

// ==================== Page ====================
export default function GpaPage() {
  const { stage, ready } = useStudentStage();
  const confirm = useConfirm();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [scores, setScores] = useState<AllScores>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState<number>(50);

  const storageKey = stage ? `gpa_scores_${stage}` : '';
  const targetKey = stage ? `${TARGET_KEY_PREFIX}${stage}` : '';

  // ===== تحميل =====
  useEffect(() => {
    if (!stage) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');

      // تحميل الهدف
      const savedTarget = Number(localStorage.getItem(`${TARGET_KEY_PREFIX}${stage}`));
      if (!Number.isNaN(savedTarget) && TARGETS.some((t) => t.value === savedTarget)) {
        setTarget(savedTarget);
      }

      const { data, error: fetchError } = await supabase
        .from('subjects')
        .select('id, name, stage, units')
        .eq('stage', stage)
        .order('name');

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const subjectList = (data ?? []) as Subject[];
      setSubjects(subjectList);
      const saved = safeParseScores(localStorage.getItem(`gpa_scores_${stage}`));
      const merged: AllScores = {};
      for (const s of subjectList) {
        merged[s.id] = { ...defaultSubjectScores(), ...(saved[s.id] ?? {}) };
      }
      setScores(merged);
      setLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, [stage]);

  const persistScores = useCallback((next: AllScores) => {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  }, [storageKey]);

  const persistTarget = useCallback((value: number) => {
    if (!targetKey) return;
    try { localStorage.setItem(targetKey, String(value)); } catch {}
  }, [targetKey]);

  const handleTargetChange = useCallback((value: number) => {
    setTarget(value);
    persistTarget(value);
  }, [persistTarget]);

  const updateComponent = useCallback(
    (subjectId: string, componentKey: string, field: 'max' | 'score', value: string) => {
      setScores((prev) => {
        const next: AllScores = {
          ...prev,
          [subjectId]: {
            ...prev[subjectId],
            [componentKey]: {
              ...prev[subjectId]?.[componentKey],
              [field]: value,
            } as ComponentData,
          },
        };
        persistScores(next);
        return next;
      });
    },
    [persistScores]
  );

  const toggleExpand = useCallback((subjectId: string) => {
    setExpanded((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  }, []);

  const resetScores = useCallback(async () => {
    const ok = await confirm(
      'حذف كل الدرجات المدخلة لهذه المرحلة. هل أنت متأكد؟',
      { variant: 'danger', confirmLabel: 'حذف' }
    );
    if (!ok) return;
    const cleared: AllScores = {};
    for (const s of subjects) cleared[s.id] = defaultSubjectScores();
    setScores(cleared);
    persistScores(cleared);
  }, [confirm, subjects, persistScores]);

  // ===== الحسابات =====
  const subjectsWithPercentage: SubjectWithPercentage[] = useMemo(
    () =>
      subjects.map((s) => ({
        ...s,
        percentage: calculatePercentage(scores[s.id]),
        targetAnalysis: analyzeForTarget(scores[s.id], target),
      })),
    [subjects, scores, target]
  );

  const entered = useMemo(
    () => subjectsWithPercentage.filter((s) => s.percentage !== null),
    [subjectsWithPercentage]
  );

  const stats = useMemo(() => {
    let totalUnits = 0;
    let weightedSum = 0;
    for (const s of entered) {
      const units = Number(s.units ?? 0);
      if (!Number.isFinite(units) || units <= 0) continue;
      totalUnits += units;
      weightedSum += units * (s.percentage as number);
    }
    const average = totalUnits > 0 ? weightedSum / totalUnits : null;
    const allFilled = subjects.length > 0 && entered.length === subjects.length;
    const progress = subjects.length > 0 ? (entered.length / subjects.length) * 100 : 0;
    return { average, allFilled, progress, enteredCount: entered.length };
  }, [entered, subjects.length]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
      <BackLink />

      <div className="mt-6 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">المعدل</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          افتح كل مادة وأدخل درجاتك. سنحسب معدلك، وسنخبرك بكم تحتاج في المتبقي لتحقيق هدفك.
        </p>
      </div>

      {loading && <Skeleton />}

      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
          <p className="mt-1 text-red-600/80 dark:text-red-300/80">{error}</p>
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="mt-6 rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up dark:bg-paper/80">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-teal/8 text-teal dark:bg-teal/15">
            <IconChart />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد مواد مضافة لمرحلتك حالياً.</p>
        </div>
      )}

      {!loading && !error && subjects.length > 0 && (
        <>
          {/* ===== الهدف ===== */}
          <div className="mt-6 animate-slide-up" style={{ animationDelay: '80ms' }}>
            <TargetSelector target={target} onChange={handleTargetChange} />
          </div>

          {/* شريط التقدم */}
          {stats.enteredCount > 0 && !stats.allFilled && (
            <div className="mt-6 animate-slide-up">
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-ink/60">
                <span>التقدم</span>
                <span>{stats.enteredCount} من {subjects.length} مادة</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-teal to-teal-light transition-all duration-500"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* قائمة المواد */}
          <div className="mt-6 space-y-2">
            {subjectsWithPercentage.map((s, idx) => {
              const isOpen = !!expanded[s.id];
              const subjectScores = scores[s.id];
              const scoreColor = s.percentage !== null ? getScoreColor(s.percentage) : '';

              return (
                <div
                  key={s.id}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  className="overflow-hidden rounded-2xl border border-line bg-white/80 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-200 animate-slide-up dark:bg-paper/80"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(s.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-3 p-4 text-right transition-colors hover:bg-ink/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink">{s.name}</span>
                        {s.units != null && (
                          <span className="text-xs text-ink/40">({s.units} وحدة)</span>
                        )}
                      </div>
                      {/* Status Chip */}
                      <div className="mt-1">
                        <StatusChip analysis={s.targetAnalysis} target={target} />
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {s.percentage !== null ? (
                        <span className={`rounded-full px-3 py-1 text-sm font-bold ${scoreColor}`}>
                          {s.percentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-sm text-ink/40">—</span>
                      )}
                      <IconChevron open={isOpen} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="space-y-4 border-t border-line/60 bg-paper/40 p-4 dark:bg-white/[0.03]">
                      {/* Target Analysis Card */}
                      <TargetAnalysisCard
                        analysis={s.targetAnalysis}
                        target={target}
                        subjectName={s.name}
                      />

                      {/* Components */}
                      <div className="space-y-3">
                        {COMPONENTS.map((c) => {
                          const comp = subjectScores?.[c.key] ?? { max: '', score: '' };
                          return (
                            <div key={c.key} className="flex flex-wrap items-center justify-between gap-3">
                              <label htmlFor={`${s.id}-${c.key}-score`} className="w-28 text-sm font-medium text-ink/70">
                                {c.label}
                              </label>
                              <div className="flex items-center gap-2">
                                <Input
                                  id={`${s.id}-${c.key}-score`}
                                  type="number"
                                  inputMode="decimal"
                                  min={0}
                                  value={comp.score}
                                  onChange={(e) => updateComponent(s.id, c.key, 'score', e.target.value)}
                                  placeholder="درجتك"
                                  className="w-20 text-center"
                                />
                                <span className="text-sm text-ink/40">من</span>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  min={0}
                                  value={comp.max}
                                  onChange={(e) => updateComponent(s.id, c.key, 'max', e.target.value)}
                                  aria-label={`الدرجة العظمى لـ${c.label}`}
                                  className="w-16 text-center"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* المعدل */}
          <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-gradient-to-bl from-teal/5 via-teal/3 to-amber/5 p-6 text-center shadow-[0_4px_16px_rgba(14,74,74,0.06)] animate-slide-up dark:from-teal/10 dark:via-teal/5 dark:to-amber/10 dark:shadow-[0_4px_16px_rgba(0,0,0,0.30)]">
            {stats.average !== null ? (
              <>
                <p className="text-sm font-bold text-ink/60">
                  {stats.allFilled ? 'معدلك النهائي' : 'معدلك الحالي (جزئي)'}
                </p>
                <p className="mt-2 bg-gradient-to-l from-teal to-teal-light bg-clip-text text-5xl font-black text-transparent">
                  {stats.average.toFixed(2)}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-xs font-bold text-ink/60 dark:bg-white/10">
                  <IconTarget />
                  هدفك: {target}% في كل مادة
                </div>
              </>
            ) : (
              <p className="text-sm text-ink/50">أدخل درجاتك ليظهر معدلك.</p>
            )}
          </div>

          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" onClick={resetScores} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">
              مسح كل الدرجات
            </Button>
          </div>
        </>
      )}
    </main>
  );
}