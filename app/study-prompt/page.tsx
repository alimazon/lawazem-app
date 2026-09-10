'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

const FORMATS = [
  'شرح مبسط وواضح لمحتوى السلايد خطوة بخطوة',
  'أسئلة اختيار من متعدد (MCQ) للمراجعة مع الإجابات الصحيحة وتوضيح كل خيار',
  'فلاش كاردز (سؤال وجواب) للحفظ السريع',
  'ملخص نقطي سريع ومركز',
  'أسئلة نقاش عميقة تساعد على الفهم لا الحفظ',
  'مراجعة شاملة وتجميعية آخر المحاضرة بعد إرسال كل السلايدات',
];

const FORMAT_LABELS: any = {
  'شرح مبسط وواضح لمحتوى السلايد خطوة بخطوة': 'شرح مبسط',
  'أسئلة اختيار من متعدد (MCQ) للمراجعة مع الإجابات الصحيحة وتوضيح كل خيار': 'أسئلة اختيار من متعدد (MCQ)',
  'فلاش كاردز (سؤال وجواب) للحفظ السريع': 'فلاش كاردز',
  'ملخص نقطي سريع ومركز': 'ملخص نقطي',
  'أسئلة نقاش عميقة تساعد على الفهم لا الحفظ': 'أسئلة نقاش عميقة',
  'مراجعة شاملة وتجميعية آخر المحاضرة بعد إرسال كل السلايدات': 'مراجعة شاملة آخر المحاضرة',
};

const MATERIAL_METHODS = [
  { value: 'الطالب راح يرسل صورة سلايد واحد بكل رسالة، سلايد بعد سلايد لين نهاية المحاضرة', label: 'إرسال صور السلايدات (سلايد بكل رسالة)' },
  { value: 'الطالب راح يرسل ملف الملزمة (PDF) كامل دفعة وحدة برسالة وحدة', label: 'إرسال ملف الملزمة كامل دفعة وحدة' },
  { value: 'الطالب راح ينسخ نص جزء من الملزمة ويلصقه بكل رسالة، جزء بعد جزء', label: 'نسخ ولصق نص الملزمة على أجزاء' },
];

export default function StudyPromptPage() {
  const router = useRouter();
  const [stage, setStage] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const [subject, setSubject] = useState('');
  const [materialMethod, setMaterialMethod] = useState(MATERIAL_METHODS[0].value);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([FORMATS[0]]);
  const [language, setLanguage] = useState('ar');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('student_stage');
    if (!saved) {
      router.push('/');
      return;
    }
    setStage(saved);

    async function loadSubjects() {
      const { data } = await supabase.from('subjects').select('id, name').eq('stage', saved).order('name');
      setSubjects(data || []);
      if (data && data.length > 0) setSubject(data[0].name);
      setLoadingSubjects(false);
    }
    loadSubjects();
  }, [router]);

  function toggleFormat(format: string) {
    setSelectedFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
  }

  async function handleGenerate(e: any) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');

    try {
      const res = await fetch('/api/study-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, materialMethod, formats: selectedFormats, language }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'صار خطأ، حاول مرة ثانية.');
      } else {
        setResult(json.prompt);
      }
    } catch (err) {
      setError('فشل الاتصال بالسيرفر.');
    }
    setLoading(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/" className="text-sm text-teal hover:underline">
        ← رجوع للوحة الأقسام
      </Link>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-teal">{stage}</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">جات الدراسة</h1>
      <p className="mt-2 text-sm text-ink/60">اختر مادتك وشلون راح تزوّد المحتوى، وراح نصيغ لك برومبت احترافي تنسخه وتستخدمه بأي أداة ذكاء اصطناعي (ChatGPT، Claude، أو غيرها).</p>

      {!loadingSubjects && subjects.length === 0 && (
        <p className="mt-6 rounded-lg border border-line bg-white/70 p-4 text-sm text-ink/60">ما فيه مواد مضافة لمرحلتك لسا.</p>
      )}

      {!loadingSubjects && subjects.length > 0 && (
        <form onSubmit={handleGenerate} className="mt-6 space-y-5 rounded-xl border border-line bg-white/70 p-5">
          <div>
            <label className="mb-1 block text-sm font-bold text-ink/70">المادة</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20">
              {subjects.map((s: any) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-ink/70">شلون راح تزوّد المحتوى للذكاء الاصطناعي؟</label>
            <select value={materialMethod} onChange={(e) => setMaterialMethod(e.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20">
              {MATERIAL_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-ink/70">شكل الشرح المطلوب لكل سلايد (تقدر تختار أكثر من وحدة)</label>
            <div className="space-y-2">
              {FORMATS.map((f) => (
                <label key={f} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm hover:bg-ink/5">
                  <input type="checkbox" checked={selectedFormats.includes(f)} onChange={() => toggleFormat(f)} className="h-4 w-4 accent-teal" />
                  {FORMAT_LABELS[f]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-ink/70">لغة البرومبت</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20">
              <option value="ar">بالعربي</option>
              <option value="en">بالإنكليزي</option>
            </select>
          </div>

          <button type="submit" disabled={loading || selectedFormats.length === 0} className="w-full rounded-lg bg-teal px-4 py-2.5 text-sm font-bold text-white hover:bg-teal/90 disabled:opacity-50">
            {loading ? 'جاري التوليد...' : 'ولّد البرومبت'}
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}

      {result && (
        <div className="mt-6 rounded-xl border border-line bg-white/70 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-teal">البرومبت جاهز</h2>
            <button onClick={handleCopy} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-ink/5">
              {copied ? 'تم النسخ!' : 'نسخ'}
            </button>
          </div>
          <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-paper p-3 text-sm text-ink/80">{result}</pre>
          <p className="mt-3 text-sm text-ink/50">انسخ هذا النص والصقه بأي أداة ذكاء اصطناعي تحبها (ChatGPT، Claude، Gemini...)، وابدأ ترسل سلايداتك حسب الطريقة اللي اخترتها.</p>
        </div>
      )}
    </main>
  );
}