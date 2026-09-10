'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STAGES = ['المرحلة الأولى', 'المرحلة الثانية', 'المرحلة الثالثة'];

export default function HomePage() {
  const [stage, setStage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('student_stage');
    if (saved) setStage(saved);
    setLoaded(true);
  }, []);

  function chooseStage(s: string) {
    localStorage.setItem('student_stage', s);
    setStage(s);
  }

  function changeStage() {
    localStorage.removeItem('student_stage');
    setStage(null);
  }

  if (!loaded) {
    return <main className="min-h-screen bg-paper" />;
  }

  if (!stage) {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-teal">الملازم</p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">اختر مرحلتك الدراسية</h1>
        <p className="mt-2 text-sm text-ink/60">حتى نعرض لك المحتوى المناسب لمرحلتك بس</p>

        <div className="mt-10 grid w-full gap-4 sm:grid-cols-3">
          {STAGES.map((s) => (
            <button
              key={s}
              onClick={() => chooseStage(s)}
              className="rounded-xl border border-line bg-white/70 px-6 py-8 text-lg font-bold shadow-sm transition-shadow hover:border-teal hover:shadow-md"
            >
              {s}
            </button>
          ))}
        </div>
      </main>
    );
  }

  const sections = [
    {
      title: 'الملازم',
      description: 'ملازم الدكاترة مرتبة حسب المادة',
      href: '/lawazem',
    },
    {
      title: 'القنوات الدراسية',
      description: 'دليل قنوات تليجرام لكل مادة',
      href: '/channels',
    },
    {
      title: 'الجدول',
      description: 'جدول المحاضرات الأسبوعي لمرحلتك',
      href: '/schedule',
    },
    {
      title: 'جات الدراسة',
      description: 'برومبت جاهز يساعدك تذاكر بالذكاء الاصطناعي',
      href: '/study-prompt',
    },
    {
      title: 'المعدل',
      description: 'احسب معدلك الموزون حسب وحدات موادك',
      href: '/gpa',
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-teal">{stage}</p>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">شنو تحتاج اليوم؟</h1>
        </div>
        <button onClick={changeStage} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-ink/5">
          تغيير المرحلة
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {sections.map((sec) => (
          <Link
            key={sec.title}
            href={sec.href}
            className="rounded-xl border border-line bg-white/70 p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="text-lg font-extrabold text-teal">{sec.title}</h2>
            <p className="mt-1 text-sm text-ink/60">{sec.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}