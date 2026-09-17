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

// ==================== Types ====================
interface ComponentData {
  max: string;
  score: string;
}
type SubjectScores = Record<string, ComponentData>;
type AllScores = Record<string, SubjectScores>;
interface SubjectWithPercentage extends Subject {
  percentage: number | null;
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

// ==================== Page ====================
export default function GpaPage() {
  const { stage, ready } = useStudentStage();
  const confirm = useConfirm();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [scores, setScores] = useState<AllScores>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const storageKey = stage ? `gpa_scores_${stage}` : '';

  useEffect(() => {
    if (!stage) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');
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

  const subjectsWithPercentage: SubjectWithPercentage[] = useMemo(
    () => subjects.map((s) => ({ ...s, percentage: calculatePercentage(scores[s.id]) })),
    [subjects, scores]
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
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <BackLink />

      <div className="mt-6 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">المعدل</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          افتح كل مادة وأدخل درجاتك أولاً بأول على مدار السنة. يمكنك تعديل «من كم» لكل محطة إذا كانت تختلف بكل مادة. الدرجات تُحفظ في متصفحك فقط.
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
                    <div className="min-w-0">
                      <span className="font-bold text-ink">{s.name}</span>
                      {s.units != null && (
                        <span className="mr-2 text-xs text-ink/40">({s.units} وحدة)</span>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {s.percentage !== null ? (
                        <span className={`rounded-full px-3 py-1 text-sm font-bold ${scoreColor}`}>
                          {s.percentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-sm text-ink/40">لا توجد درجات</span>
                      )}
                      <IconChevron open={isOpen} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="space-y-3 border-t border-line/60 bg-paper/40 p-4 dark:bg-white/[0.03]">
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