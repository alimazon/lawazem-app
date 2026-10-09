// app/dictionary/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { postJson } from '@/lib/api-client';

// ==================== Types ====================
interface DictionaryResult {
  id?: string;
  term: string;
  arabic_translation: string;
  meaning: string;
  root_breakdown: string | null;
  clinical_note: string | null;
  similar_terms: string[];
  hit_count: number;
}

interface PopularTerm {
  term: string;
  arabic_translation: string;
  hit_count: number;
}

const RECENT_KEY = 'dictionary_recent_terms';
const MAX_RECENT = 8;

// ==================== Icons ====================
function IconSearch() {
  return (
    <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
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
function IconStethoscope() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6v0a6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3M8 15v1a6 6 0 006 6v0a6 6 0 006-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
function IconTrending() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconCopy() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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

// ==================== Recent Storage ====================
function loadRecent(): string[] {
  try {
    const saved = localStorage.getItem(RECENT_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed.filter((t): t is string => typeof t === 'string').slice(0, MAX_RECENT);
    }
  } catch {}
  return [];
}

function saveRecent(term: string) {
  try {
    const current = loadRecent().filter((t) => t.toLowerCase() !== term.toLowerCase());
    const next = [term, ...current].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

// ==================== Result Card ====================
function ResultCard({ result }: { result: DictionaryResult }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      const text = [
        `📖 ${result.term}`,
        `🇮🇶 ${result.arabic_translation}`,
        `📝 ${result.meaning}`,
        result.root_breakdown ? `🧬 ${result.root_breakdown}` : '',
        result.clinical_note ? `🩺 ${result.clinical_note}` : '',
        result.similar_terms.length > 0
          ? `🔗 مشابهة: ${result.similar_terms.join(' · ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.show('تم نسخ المصطلح', 'success');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.show('فشل النسخ', 'error');
    }
  }

  return (
    <div className="rounded-3xl border border-line bg-white/80 shadow-[0_2px_12px_rgba(26,33,31,0.06)] backdrop-blur-sm dark:bg-paper/80 dark:shadow-[0_2px_12px_rgba(0,0,0,0.30)] animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/60 px-6 py-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal dark:bg-teal/20">
              <IconStethoscope />
            </span>
            <h2 className="text-2xl font-black text-ink">{result.term}</h2>
          </div>
          <p className="mt-2 text-lg font-bold text-teal">{result.arabic_translation}</p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="نسخ المصطلح"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-xs font-bold text-ink/60 transition-all hover:border-teal/30 hover:text-teal active:scale-95 dark:bg-white/[0.06]"
        >
          {copied ? <IconCheck /> : <IconCopy />}
          {copied ? 'تم' : 'نسخ'}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-5 p-6">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/50">
            <IconBook />
            المعنى
          </div>
          <p className="text-sm leading-relaxed text-ink/80">{result.meaning}</p>
        </div>

        {result.root_breakdown && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/50">
              <IconSparkles />
              تفكيك الكلمة
            </div>
            <p className="text-sm leading-relaxed text-ink/80">{result.root_breakdown}</p>
          </div>
        )}

        {result.clinical_note && (
          <div className="rounded-2xl border border-amber/30 bg-amber/8 p-4 dark:bg-amber/15">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              <IconStethoscope />
              ملاحظة سريرية
            </div>
            <p className="text-sm leading-relaxed text-ink/80">{result.clinical_note}</p>
          </div>
        )}

        {result.similar_terms.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/50">
              <IconSparkles />
              مصطلحات مشابهة
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.similar_terms.map((t, i) => (
                <span
                  key={i}
                  className="rounded-full bg-ink/5 px-3 py-1 text-xs font-bold text-ink/70 dark:bg-white/10"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-line/40 pt-3 text-[11px] text-ink/40">
          <IconTrending />
          <span>بُحث عنه {result.hit_count} {result.hit_count === 1 ? 'مرة' : 'مرات'}</span>
        </div>
      </div>
    </div>
  );
}

// ==================== Page ====================
export default function DictionaryPage() {
  const toast = useToast();
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [popular, setPopular] = useState<PopularTerm[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecent(loadRecent());
    setMounted(true);

    async function loadPopular() {
      try {
        const data = await postJson<{ terms: PopularTerm[] }>('/api/dictionary', {
          action: 'popular',
        });
        setPopular(data.terms ?? []);
      } catch {
        /* تجاهل */
      }
    }
    loadPopular();
  }, []);

  const handleLookup = useCallback(
    async (searchTerm: string) => {
      const trimmed = searchTerm.trim();
      if (!trimmed || trimmed.length < 2) {
        toast.show('أدخل مصطلحاً طبياً (حرفان على الأقل)', 'error');
        return;
      }

      setLoading(true);
      setResult(null);

      try {
        const data = await postJson<{ result: DictionaryResult; cached: boolean }>(
          '/api/dictionary',
          { action: 'lookup', term: trimmed }
        );
        setResult(data.result);

        saveRecent(trimmed);
        setRecent(loadRecent());
      } catch (err) {
        toast.show(err instanceof Error ? err.message : 'فشل البحث', 'error');
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleLookup(term);
  }

  function quickSearch(t: string) {
    setTerm(t);
    handleLookup(t);
    inputRef.current?.blur();
  }

  if (!mounted) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="h-32 skeleton-shimmer rounded-3xl" />
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

      <div className="mt-6 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          أداة طبية
        </span>
        <h1 className="mt-3 flex items-center gap-2 text-3xl font-black leading-tight text-ink sm:text-4xl">
          <IconStethoscope />
          قاموس المصطلحات الطبية
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          اكتب أي مصطلح طبي بالعربية أو الإنجليزية، وسنشرحه لك بمستوى طالب الطب:
          المعنى، تفكيك الكلمة، ملاحظة سريرية، ومصطلحات مشابهة.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 animate-slide-up" style={{ animationDelay: '80ms' }}>
        <div className="relative">
          <IconSearch />
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="مثال: Dyspnea, Myocardial, ضيق النفس..."
            maxLength={100}
            autoComplete="off"
            className="w-full rounded-2xl border-2 border-line bg-white py-4 pr-12 pl-32 text-base text-ink placeholder:text-ink/35 transition-all duration-200 focus:border-teal focus:bg-white focus:outline-none focus:shadow-[0_0_0_4px_rgba(14,74,74,0.10)] dark:bg-white/[0.06] dark:focus:bg-white/[0.08] dark:focus:shadow-[0_0_0_4px_rgba(77,184,184,0.15)]"
            dir="auto"
          />
          <button
            type="submit"
            disabled={loading || term.trim().length < 2}
            className="absolute left-2 top-1/2 flex h-12 -translate-y-1/2 items-center gap-1.5 rounded-xl bg-teal px-5 text-sm font-bold text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] transition-all duration-200 hover:bg-teal-light active:scale-95 disabled:opacity-40 disabled:active:scale-100"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                جاري البحث
              </>
            ) : (
              <>
                <IconSearch />
                ابحث
              </>
            )}
          </button>
        </div>
      </form>

      {loading && (
        <div className="mt-6 space-y-3 rounded-3xl border border-line bg-white/80 p-6 dark:bg-paper/80">
          <div className="h-8 w-40 skeleton-shimmer rounded" />
          <div className="h-6 w-32 skeleton-shimmer rounded" />
          <div className="mt-4 h-4 w-full skeleton-shimmer rounded" />
          <div className="h-4 w-3/4 skeleton-shimmer rounded" />
        </div>
      )}

      {result && !loading && (
        <div className="mt-6">
          <ResultCard result={result} />
        </div>
      )}

      {recent.length > 0 && !result && !loading && (
        <div className="mt-6 animate-slide-up" style={{ animationDelay: '120ms' }}>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/50">
            <IconClock />
            آخر ما بحثت عنه
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => quickSearch(t)}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-bold text-ink/70 transition-all hover:border-teal/40 hover:bg-teal/5 hover:text-teal active:scale-95 dark:bg-white/[0.06]"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {popular.length > 0 && !result && !loading && (
        <div className="mt-8 animate-slide-up" style={{ animationDelay: '160ms' }}>
          <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink">
            <IconTrending />
            الأكثر بحثاً على المنصة
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {popular.map((t) => (
              <button
                key={t.term}
                type="button"
                onClick={() => quickSearch(t.term)}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-white/80 px-4 py-3 text-right transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/30 hover:shadow-[0_4px_16px_rgba(14,74,74,0.08)] active:scale-[0.98] dark:bg-paper/80"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink transition-colors group-hover:text-teal">
                    {t.term}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink/50">{t.arabic_translation}</p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink/50 dark:bg-white/10">
                  {t.hit_count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex items-start gap-2 rounded-2xl border border-amber/30 bg-amber/8 p-4 text-xs text-ink/70 dark:bg-amber/15">
        <span className="text-amber">
          <IconWarning />
        </span>
        <p className="leading-relaxed">
          <strong>ملاحظة:</strong> هذا القاموس مساعد دراسي وليس مرجعاً طبياً. 
          الملاحظات السريرية اختيارية، ولا يُنصح بالاعتماد عليه وحده في قرارات سريرية حقيقية.
        </p>
      </div>
    </main>
  );
}