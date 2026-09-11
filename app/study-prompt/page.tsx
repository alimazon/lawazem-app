// app/study-prompt/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import { Button } from '@/components/ui/Button';
import { Checkbox, Select } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { postJson } from '@/lib/api-client';
import {
  MATERIAL_METHODS,
  STUDY_FORMATS,
  STUDY_FORMAT_LABELS,
  type StudyFormat,
} from '@/lib/constants';

interface SubjectOption { id: string; name: string }
interface StudyPromptResponse { prompt: string }

// ==================== Icons ====================
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
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
function IconCopy() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="mt-6 space-y-5 rounded-3xl border border-line bg-white/80 p-6 backdrop-blur-sm">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 skeleton-shimmer rounded" />
          <div className="h-12 w-full skeleton-shimmer rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/" className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal">
      <span className="transition-transform duration-200 group-hover:translate-x-1"><IconArrowLeft /></span>
      رجوع للوحة الأقسام
    </Link>
  );
}

// ==================== Page ====================
export default function StudyPromptPage() {
  const { stage, ready } = useStudentStage();
  const toast = useToast();

  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const [subject, setSubject] = useState('');
  const [materialMethod, setMaterialMethod] = useState<string>(MATERIAL_METHODS[0].value);
  const [selectedFormats, setSelectedFormats] = useState<StudyFormat[]>([STUDY_FORMATS[0]]);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!stage) return;
    let cancelled = false;

    async function loadSubjects() {
      setLoadingSubjects(true);
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('stage', stage)
        .order('name');

      if (cancelled) return;
      if (error) {
        toast.show('فشل تحميل المواد', 'error');
        setSubjects([]);
      } else {
        const list = (data ?? []) as SubjectOption[];
        setSubjects(list);
        if (list.length > 0) setSubject((prev) => prev || list[0].name);
      }
      setLoadingSubjects(false);
    }
    loadSubjects();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const toggleFormat = (format: StudyFormat) => {
    setSelectedFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
  };

  const canGenerate = useMemo(
    () => subject.trim() !== '' && selectedFormats.length > 0 && !generating,
    [subject, selectedFormats.length, generating]
  );

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!canGenerate) return;

    setGenerating(true);
    setResult('');
    setCopied(false);

    try {
      const data = await postJson<StudyPromptResponse>('/api/study-prompt', {
        subject,
        materialMethod,
        formats: selectedFormats,
        language,
      });
      setResult(data.prompt);
      toast.show('تم توليد البرومبت', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'صار خطأ، حاول مرة ثانية.';
      toast.show(message, 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast.show('تم النسخ', 'success');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.show('فشل النسخ — انسخ يدويًا', 'error');
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton />
      </main>
    );
  }

  const noSubjects = !loadingSubjects && subjects.length === 0;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <BackLink />

      <div className="mt-6 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">جات الدراسة</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          اختر مادتك وشلون راح تزوّد المحتوى، وراح نصيغ لك برومبت احترافي تنسخه وتستخدمه بأي أداة ذكاء اصطناعي.
        </p>
      </div>

      {loadingSubjects && <Skeleton />}

      {noSubjects && (
        <div className="mt-6 rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber/10 text-amber">
            <IconSparkles />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد مواد مضافة لمرحلتك حاليا.</p>
        </div>
      )}

      {!loadingSubjects && !noSubjects && (
        <form
          onSubmit={handleGenerate}
          className="mt-6 space-y-6 rounded-3xl border border-line bg-white/80 p-6 shadow-[0_2px_8px_rgba(26,33,31,0.04)] backdrop-blur-sm animate-slide-up"
        >
          {/* المادة */}
          <div>
            <label htmlFor="sp-subject" className="mb-2 block text-sm font-bold text-ink/70">
              المادة
            </label>
            <Select
              id="sp-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </Select>
          </div>

          {/* طريقة الإرسال */}
          <div>
            <label htmlFor="sp-method" className="mb-2 block text-sm font-bold text-ink/70">
              شلون راح تزوّد المحتوى للذكاء الاصطناعي؟
            </label>
            <Select
              id="sp-method"
              value={materialMethod}
              onChange={(e) => setMaterialMethod(e.target.value)}
              className="w-full"
            >
              {MATERIAL_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
          </div>

          {/* أشكال الشرح */}
          <fieldset>
            <legend className="mb-3 block text-sm font-bold text-ink/70">
              شكل الشرح المطلوب <span className="text-ink/40">(تكدر تختار أكثر من وحدة)</span>
            </legend>
            <div className="space-y-2">
              {STUDY_FORMATS.map((f) => (
                <Checkbox
                  key={f}
                  checked={selectedFormats.includes(f)}
                  onChange={() => toggleFormat(f)}
                >
                  {STUDY_FORMAT_LABELS[f]}
                </Checkbox>
              ))}
            </div>
            {selectedFormats.length === 0 && (
              <p className="mt-2 text-xs font-bold text-red-600" role="alert">
                اختر طريقة شرح واحدة على الأقل.
              </p>
            )}
          </fieldset>

          {/* اللغة */}
          <div>
            <label htmlFor="sp-lang" className="mb-2 block text-sm font-bold text-ink/70">
              لغة البرومبت
            </label>
            <Select
              id="sp-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
              className="w-full"
            >
              <option value="ar">بالعربي</option>
              <option value="en">بالإنكليزي</option>
            </Select>
          </div>

          <Button
            type="submit"
            size="lg"
            loading={generating}
            disabled={!canGenerate}
            icon={!generating ? <IconSparkles /> : undefined}
            className="w-full"
          >
            {generating ? 'جاري التوليد...' : 'ولّد البرومبت'}
          </Button>
        </form>
      )}

      {result && (
        <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-white/80 shadow-[0_4px_16px_rgba(14,74,74,0.06)] backdrop-blur-sm animate-slide-up">
          <div className="flex items-center justify-between gap-3 border-b border-line/60 bg-gradient-to-l from-teal/5 to-transparent px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-teal">
              <IconSparkles />
              البرومبت جاهز
            </h2>
            <Button variant="secondary" size="sm" onClick={handleCopy} icon={copied ? <IconCheck /> : <IconCopy />}>
              {copied ? 'تم النسخ' : 'نسخ'}
            </Button>
          </div>
          <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words p-6 text-sm leading-relaxed text-ink/80 scrollbar-thin">
            {result}
          </pre>
          <p className="border-t border-line/60 bg-paper/50 px-6 py-3 text-xs text-ink/50">
            انسخ هذا النص والصقه بأي أداة ذكاء اصطناعي تحبها، وابدأ ترسل سلايداتك حسب الطريقة اللي اخترتها.
          </p>
        </div>
      )}
    </main>
  );
}