'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

const COMPONENTS = [
  { key: 'first', label: 'الفصل الأول', defaultMax: 10 },
  { key: 'mid', label: 'المد', defaultMax: 20 },
  { key: 'second', label: 'الفصل الثاني', defaultMax: 10 },
  { key: 'finalTheory', label: 'الفاينل (نظري)', defaultMax: 40 },
  { key: 'finalPractical', label: 'الفاينل (عملي)', defaultMax: 20 },
];

type ComponentData = { max: string; score: string };
type SubjectScores = Record<string, ComponentData>;

function defaultSubjectScores(): SubjectScores {
  const obj: SubjectScores = {};
  COMPONENTS.forEach((c) => {
    obj[c.key] = { max: String(c.defaultMax), score: '' };
  });
  return obj;
}

export default function GpaPage() {
  const router = useRouter();
  const [stage, setStage] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, SubjectScores>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('student_stage');
    if (!saved) {
      router.push('/');
      return;
    }
    setStage(saved);

    async function loadData() {
      const { data } = await supabase.from('subjects').select('id, name, units').eq('stage', saved).order('name');
      const subjectList = data || [];
      setSubjects(subjectList);

      const savedScoresRaw = localStorage.getItem(`gpa_scores_${saved}`);
      let savedScores: Record<string, SubjectScores> = {};
      if (savedScoresRaw) {
        try {
          savedScores = JSON.parse(savedScoresRaw);
        } catch {
          savedScores = {};
        }
      }

      const merged: Record<string, SubjectScores> = {};
      subjectList.forEach((s: any) => {
        merged[s.id] = { ...defaultSubjectScores(), ...(savedScores[s.id] || {}) };
      });
      setScores(merged);
      setLoading(false);
    }
    loadData();
  }, [router]);

  function updateComponent(subjectId: string, componentKey: string, field: 'max' | 'score', value: string) {
    const updated = {
      ...scores,
      [subjectId]: {
        ...scores[subjectId],
        [componentKey]: {
          ...scores[subjectId][componentKey],
          [field]: value,
        },
      },
    };
    setScores(updated);
    if (stage) {
      localStorage.setItem(`gpa_scores_${stage}`, JSON.stringify(updated));
    }
  }

  function toggleExpand(subjectId: string) {
    setExpanded((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  }

  function resetScores() {
    const confirmed = window.confirm('حذف كل الدرجات المدخلة لهذي المرحلة. متأكد؟');
    if (!confirmed) return;
    const cleared: Record<string, SubjectScores> = {};
    subjects.forEach((s: any) => {
      cleared[s.id] = defaultSubjectScores();
    });
    setScores(cleared);
    if (stage) {
      localStorage.setItem(`gpa_scores_${stage}`, JSON.stringify(cleared));
    }
  }

  function subjectPercentage(subjectId: string): number | null {
    const subjectScores = scores[subjectId];
    if (!subjectScores) return null;

    let totalMax = 0;
    let totalScore = 0;
    let anyEntered = false;

    COMPONENTS.forEach((c) => {
      const comp = subjectScores[c.key];
      if (comp && comp.score !== '') {
        anyEntered = true;
        totalMax += Number(comp.max || 0);
        totalScore += Number(comp.score || 0);
      }
    });

    if (!anyEntered || totalMax === 0) return null;
    return (totalScore / totalMax) * 100;
  }

  const subjectsWithPercentage = subjects
    .map((s: any) => ({ ...s, percentage: subjectPercentage(s.id) }))
    .filter((s: any) => s.percentage !== null);

  const totalUnitsEntered = subjectsWithPercentage.reduce((sum: number, s: any) => sum + Number(s.units || 0), 0);
  const weightedSum = subjectsWithPercentage.reduce((sum: number, s: any) => sum + Number(s.units || 0) * s.percentage, 0);
  const average = totalUnitsEntered > 0 ? weightedSum / totalUnitsEntered : null;
  const allFilled = subjects.length > 0 && subjectsWithPercentage.length === subjects.length;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/" className="text-sm text-teal hover:underline">
        ← رجوع للوحة الأقسام
      </Link>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-teal">{stage}</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">المعدل</h1>
      <p className="mt-2 text-sm text-ink/60">افتح كل مادة وأدخل درجاتك أول بأول على مدار السنة (الفصل الأول، المد، الفصل الثاني، الفاينل). تقدر تعدّل "من كم" لكل محطة إذا كانت تختلف بمادتك. الدرجات تنحفظ بمتصفحك بس.</p>

      {loading && <p className="mt-6 text-ink/50">جاري التحميل...</p>}

      {!loading && subjects.length === 0 && (
        <p className="mt-6 rounded-lg border border-line bg-white/70 p-4 text-sm text-ink/60">ما فيه مواد مضافة لمرحلتك لسا.</p>
      )}

      {!loading && subjects.length > 0 && (
        <>
          <div className="mt-6 space-y-2">
            {subjects.map((s: any) => {
              const percentage = subjectPercentage(s.id);
              const isOpen = !!expanded[s.id];
              return (
                <div key={s.id} className="rounded-lg border border-line bg-white/70">
                  <button
                    onClick={() => toggleExpand(s.id)}
                    className="flex w-full items-center justify-between p-3 text-right"
                  >
                    <div>
                      <span className="font-bold">{s.name}</span>
                      <span className="mr-2 text-xs text-ink/40">({s.units} وحدة)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {percentage !== null ? (
                        <span className="rounded-full bg-teal/10 px-3 py-1 text-sm font-bold text-teal">{percentage.toFixed(1)}%</span>
                      ) : (
                        <span className="text-sm text-ink/40">لا توجد درجات</span>
                      )}
                      <span className="text-ink/40">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="space-y-2 border-t border-line p-3">
                      {COMPONENTS.map((c) => (
                        <div key={c.key} className="flex items-center justify-between gap-2">
                          <span className="w-28 text-sm text-ink/70">{c.label}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={scores[s.id]?.[c.key]?.score ?? ''}
                              onChange={(e) => updateComponent(s.id, c.key, 'score', e.target.value)}
                              placeholder="درجتك"
                              className="w-20 rounded-lg border border-line bg-white px-2 py-1.5 text-center text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                            />
                            <span className="text-sm text-ink/40">من</span>
                            <input
                              type="number"
                              min={0}
                              value={scores[s.id]?.[c.key]?.max ?? ''}
                              onChange={(e) => updateComponent(s.id, c.key, 'max', e.target.value)}
                              className="w-16 rounded-lg border border-line bg-white px-2 py-1.5 text-center text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-line bg-teal/5 p-5 text-center">
            {average !== null ? (
              <>
                <p className="text-sm text-ink/60">{allFilled ? 'معدلك النهائي' : 'معدلك الحالي (جزئي، لسا ما خلصت كل المواد)'}</p>
                <p className="mt-1 text-4xl font-black text-teal">{average.toFixed(2)}</p>
              </>
            ) : (
              <p className="text-sm text-ink/50">أدخل درجاتك حتى يظهر معدلك.</p>
            )}
          </div>

          <button onClick={resetScores} className="mt-4 text-sm text-red-600 hover:underline">
            مسح كل الدرجات
          </button>
        </>
      )}
    </main>
  );
}