'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function GpaPage() {
  const router = useRouter();
  const [stage, setStage] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
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
      setSubjects(data || []);

      const savedScores = localStorage.getItem(`gpa_scores_${saved}`);
      if (savedScores) {
        try {
          setScores(JSON.parse(savedScores));
        } catch {
          setScores({});
        }
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  function updateScore(subjectId: string, value: string) {
    const updated = { ...scores, [subjectId]: value };
    setScores(updated);
    if (stage) {
      localStorage.setItem(`gpa_scores_${stage}`, JSON.stringify(updated));
    }
  }

  function resetScores() {
    const confirmed = window.confirm('حذف كل الدرجات المدخلة لهذي المرحلة. متأكد؟');
    if (!confirmed) return;
    setScores({});
    if (stage) {
      localStorage.removeItem(`gpa_scores_${stage}`);
    }
  }

  const enteredSubjects = subjects.filter((s: any) => scores[s.id] !== undefined && scores[s.id] !== '');
  const totalUnitsEntered = enteredSubjects.reduce((sum: number, s: any) => sum + Number(s.units || 0), 0);
  const weightedSum = enteredSubjects.reduce((sum: number, s: any) => sum + Number(s.units || 0) * Number(scores[s.id] || 0), 0);
  const average = totalUnitsEntered > 0 ? weightedSum / totalUnitsEntered : null;
  const allFilled = subjects.length > 0 && enteredSubjects.length === subjects.length;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/" className="text-sm text-teal hover:underline">
        ← رجوع للوحة الأقسام
      </Link>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-teal">{stage}</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">المعدل</h1>
      <p className="mt-2 text-sm text-ink/60">أدخل درجتك بكل مادة (من 100)، وراح نحسب لك معدلك الموزون حسب وحدات كل مادة. الدرجات تنحفظ بمتصفحك بس، ما ترسل لأي مكان.</p>

      {loading && <p className="mt-6 text-ink/50">جاري التحميل...</p>}

      {!loading && subjects.length === 0 && (
        <p className="mt-6 rounded-lg border border-line bg-white/70 p-4 text-sm text-ink/60">ما فيه مواد مضافة لمرحلتك لسا.</p>
      )}

      {!loading && subjects.length > 0 && (
        <>
          <div className="mt-6 space-y-2">
            {subjects.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/70 p-3">
                <div>
                  <span className="font-bold">{s.name}</span>
                  <span className="mr-2 text-xs text-ink/40">({s.units} وحدة)</span>
                </div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={scores[s.id] ?? ''}
                  onChange={(e) => updateScore(s.id, e.target.value)}
                  placeholder="الدرجة"
                  className="w-24 rounded-lg border border-line bg-white px-3 py-1.5 text-center text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-line bg-teal/5 p-5 text-center">
            {average !== null ? (
              <>
                <p className="text-sm text-ink/60">{allFilled ? 'معدلك النهائي' : 'معدلك الحالي (جزئي، لسا ما أدخلت كل الدرجات)'}</p>
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