// app/preview/page.tsx
'use client';

import { useState, type ReactNode } from 'react';

// ==================== Preview Component ====================
export default function PreviewPage() {
  const [dark, setDark] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Readex+Pro:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>

      <div className={dark ? 'dark' : ''}>
        <main className="min-h-screen bg-[#F4F2EC] text-[#252B30] dark:bg-[#141A1E] dark:text-[#F1F3F0]" style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}>
          {/* ==================== Top Bar ==================== */}
          <div className="sticky top-0 z-50 flex items-center justify-between border-b border-[#D0D2CC] bg-[#F4F2EC] px-6 py-3 dark:border-[#3B484E] dark:bg-[#141A1E]">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">معاينة الثيم</span>
              <span className="rounded bg-[#8B3E28] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                مطبعة الجامعة
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDark(!dark)}
              className="rounded-md border border-[#D0D2CC] bg-white px-3 py-1.5 text-xs font-medium text-[#252B30] transition-colors hover:border-[#244E63] hover:text-[#244E63] dark:border-[#3B484E] dark:bg-[#1D262B] dark:text-[#F1F3F0] dark:hover:border-[#9CD2E5] dark:hover:text-[#9CD2E5]"
            >
              {dark ? '☀️ فاتح' : '🌙 داكن'}
            </button>
          </div>

          <div className="mx-auto max-w-6xl space-y-16 px-6 py-12">
            <HeaderPreview />
            <TypographyPreview />
            <ButtonPreview />
            <CardPreview />
            <BadgePreview />
            <FormPreview />
            <PalettePreview />
            <HomepagePreview />
          </div>
        </main>
      </div>
    </>
  );
}

// ==================== Section Wrapper ====================
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-6 border-b border-[#D0D2CC] pb-3 dark:border-[#3B484E]">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#4B555B] dark:text-[#BAC4C8]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

// ==================== 1. Header ====================
function HeaderPreview() {
  const nav = [
    { label: 'الملازم', active: true },
    { label: 'القنوات', active: false },
    { label: 'الجدول', active: false },
    { label: 'القاموس', active: false },
    { label: 'المترجم', active: false },
  ];

  return (
    <Section title="Header">
      <div className="overflow-hidden rounded-md border border-[#D0D2CC] dark:border-[#3B484E]">
        <header className="flex items-center justify-between border-b border-[#D0D2CC] bg-white px-6 py-4 dark:border-[#3B484E] dark:bg-[#1D262B]">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#244E63] text-sm font-bold text-white dark:bg-[#9CD2E5] dark:text-[#10232B]">
              ل
            </span>
            <span className="text-lg font-bold">لوازم</span>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <a
                key={item.label}
                href="#"
                className={
                  item.active
                    ? 'rounded-md px-3 py-2 text-sm font-semibold text-[#244E63] dark:text-[#9CD2E5]'
                    : 'rounded-md px-3 py-2 text-sm font-medium text-[#4B555B] transition-colors hover:text-[#252B30] dark:text-[#BAC4C8] dark:hover:text-[#F1F3F0]'
                }
              >
                {item.label}
              </a>
            ))}
          </nav>
          <span className="text-xs font-medium text-[#4B555B] dark:text-[#BAC4C8]">🔔</span>
        </header>
      </div>
    </Section>
  );
}

// ==================== 2. Typography ====================
function TypographyPreview() {
  return (
    <Section title="Typography — Readex Pro + IBM Plex Sans Arabic">
      <div className="space-y-6">
        <div>
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-[#4B555B] dark:text-[#BAC4C8]">
            Display / 48px — Readex Pro
          </span>
          <h1
            className="text-5xl font-bold leading-tight"
            style={{ fontFamily: '"Readex Pro", sans-serif' }}
          >
            دراستك، مرتبة بطريقتك.
          </h1>
        </div>

        <div>
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-[#4B555B] dark:text-[#BAC4C8]">
            H1 / 32px — Readex Pro
          </span>
          <h2
            className="text-3xl font-bold"
            style={{ fontFamily: '"Readex Pro", sans-serif' }}
          >
            الملازم والمصادر
          </h2>
        </div>

        <div>
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-[#4B555B] dark:text-[#BAC4C8]">
            H2 / 24px — Readex Pro
          </span>
          <h3
            className="text-2xl font-semibold"
            style={{ fontFamily: '"Readex Pro", sans-serif' }}
          >
            ملازم الدكاترة
          </h3>
        </div>

        <div>
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-[#4B555B] dark:text-[#BAC4C8]">
            Body / 16px — IBM Plex Sans Arabic
          </span>
          <p className="max-w-2xl text-base leading-relaxed text-[#4B555B] dark:text-[#BAC4C8]">
            منصة تعاونية لملازم ومصادر وجميع احتياجات طلاب كلية الطب. المحتوى
            منظم حسب المرحلة والمادة والدكتور، مع وسوم للتصفية السريعة.
          </p>
        </div>

        <div>
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-[#4B555B] dark:text-[#BAC4C8]">
            Caption / 12px
          </span>
          <p className="text-xs text-[#4B555B] dark:text-[#BAC4C8]">
            آخر تحديث: قبل 5 دقائق · 23 طالب شاهدوا هذا
          </p>
        </div>

        <div>
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-[#4B555B] dark:text-[#BAC4C8]">
            Numbers — tabular-nums
          </span>
          <p className="text-3xl font-bold tabular-nums">3.85</p>
          <p className="mt-1 text-xs text-[#4B555B] dark:text-[#BAC4C8]">
            المعدل التراكمي
          </p>
        </div>
      </div>
    </Section>
  );
}

// ==================== 3. Buttons ====================
function ButtonPreview() {
  const btnBase =
    'inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition-colors';

  return (
    <Section title="Buttons">
      <div className="space-y-6">
        {/* Primary */}
        <div>
          <span className="mb-3 block text-[10px] font-medium uppercase tracking-wider text-[#4B555B] dark:text-[#BAC4C8]">
            Primary — أزرق الحبر
          </span>
          <div className="flex flex-wrap gap-3">
            <button className={`${btnBase} bg-[#244E63] text-white hover:bg-[#1A3A4A] dark:bg-[#9CD2E5] dark:text-[#10232B] dark:hover:bg-[#7ABDD4]`}>
              افتح الملزمة ←
            </button>
            <button className={`${btnBase} bg-[#244E63] text-white hover:bg-[#1A3A4A] dark:bg-[#9CD2E5] dark:text-[#10232B] dark:hover:bg-[#7ABDD4]`}>
              تصفّح
            </button>
          </div>
        </div>

        {/* Accent — Rust */}
        <div>
          <span className="mb-3 block text-[10px] font-medium uppercase tracking-wider text-[#4B555B] dark:text-[#BAC4C8]">
            Accent — طوبي
          </span>
          <div className="flex flex-wrap gap-3">
            <button className={`${btnBase} bg-[#8B3E28] text-white hover:bg-[#6E2F1E] dark:bg-[#F2A18C] dark:text-[#2A1712] dark:hover:bg-[#E88A72]`}>
              إجراء مهم
            </button>
          </div>
        </div>

        {/* Secondary */}
        <div>
          <span className="mb-3 block text-[10px] font-medium uppercase tracking-wider text-[#4B555B] dark:text-[#BAC4C8]">
            Secondary
          </span>
          <div className="flex flex-wrap gap-3">
            <button className={`${btnBase} border border-[#D0D2CC] bg-white text-[#252B30] hover:border-[#244E63] hover:text-[#244E63] dark:border-[#3B484E] dark:bg-[#1D262B] dark:text-[#F1F3F0] dark:hover:border-[#9CD2E5] dark:hover:text-[#9CD2E5]`}>
              إلغاء
            </button>
            <button className={`${btnBase} border border-[#D0D2CC] bg-white text-[#252B30] hover:border-[#244E63] hover:text-[#244E63] dark:border-[#3B484E] dark:bg-[#1D262B] dark:text-[#F1F3F0] dark:hover:border-[#9CD2E5] dark:hover:text-[#9CD2E5]`}>
              تعديل
            </button>
          </div>
        </div>

        {/* Ghost */}
        <div>
          <span className="mb-3 block text-[10px] font-medium uppercase tracking-wider text-[#4B555B] dark:text-[#BAC4C8]">
            Ghost
          </span>
          <div className="flex flex-wrap gap-3">
            <button className={`${btnBase} text-[#4B555B] hover:text-[#252B30] dark:text-[#BAC4C8] dark:hover:text-[#F1F3F0]`}>
              عرض المزيد ←
            </button>
          </div>
        </div>

        {/* Danger */}
        <div>
          <span className="mb-3 block text-[10px] font-medium uppercase tracking-wider text-[#4B555B] dark:text-[#BAC4C8]">
            Danger
          </span>
          <div className="flex flex-wrap gap-3">
            <button className={`${btnBase} border border-[#8B3E28]/30 bg-white text-[#8B3E28] hover:bg-[#8B3E28]/10 dark:border-[#F2A18C]/40 dark:bg-[#1D262B] dark:text-[#F2A18C] dark:hover:bg-[#F2A18C]/10`}>
              حذف
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ==================== 4. Cards ====================
function CardPreview() {
  return (
    <Section title="Cards — زوايا 6px، حدود 1px، ظلال شبه معدومة">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card 1 — Default */}
        <a
          href="#"
          className="group block rounded-md border border-[#D0D2CC] bg-white p-6 transition-colors hover:border-[#244E63] dark:border-[#3B484E] dark:bg-[#1D262B] dark:hover:border-[#9CD2E5]"
        >
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-[#D0D2CC] text-[#252B30] dark:border-[#3B484E] dark:text-[#F1F3F0]">
              📚
            </span>
            <span className="text-[#4B555B] transition-colors group-hover:text-[#244E63] dark:text-[#BAC4C8] dark:group-hover:text-[#9CD2E5]">
              ←
            </span>
          </div>
          <h3 className="mt-6 text-lg font-semibold">الملازم</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#4B555B] dark:text-[#BAC4C8]">
            ملازم الدكاترة مرتبة حسب المادة والدكتور، مع وسوم للتصفية السريعة.
          </p>
        </a>

        {/* Card 2 — Featured (Navy) */}
        <a
          href="#"
          className="group block rounded-md border border-[#244E63] bg-[#244E63] p-6 text-white transition-colors hover:bg-[#1A3A4A] dark:border-[#9CD2E5] dark:bg-[#9CD2E5] dark:text-[#10232B] dark:hover:bg-[#7ABDD4]"
        >
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-white/30 bg-white/10">
              📖
            </span>
            <span className="opacity-70 transition-opacity group-hover:opacity-100">
              ←
            </span>
          </div>
          <h3 className="mt-6 text-lg font-semibold">الملازم والمصادر</h3>
          <p className="mt-2 text-sm leading-relaxed opacity-90">
            ملازم الدكاترة مرتبة حسب المادة والدكتور.
          </p>
          <span className="mt-4 inline-block text-sm font-semibold">
            تصفّح ←
          </span>
        </a>

        {/* Card 3 — Locked */}
        <div className="rounded-md border border-dashed border-[#D0D2CC] bg-[#F4F2EC] p-6 opacity-60 dark:border-[#3B484E] dark:bg-[#202A30]">
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-[#D0D2CC] text-[#4B555B] dark:border-[#3B484E]">
              🔄
            </span>
            <span className="rounded border border-[#D0D2CC] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#4B555B] dark:border-[#3B484E]">
              قريباً
            </span>
          </div>
          <h3 className="mt-6 text-lg font-semibold text-[#4B555B] dark:text-[#BAC4C8]">
            تبديل الكروبات
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#4B555B] dark:text-[#BAC4C8]">
            مغلق حاليا
          </p>
        </div>
      </div>
    </Section>
  );
}

// ==================== 5. Badges ====================
function BadgePreview() {
  const badges = [
    { label: 'نظري', style: 'bg-[#E7E9E3] text-[#252B30] dark:bg-[#202A30] dark:text-[#F1F3F0]' },
    { label: 'عملي', style: 'bg-[#244E63]/10 text-[#244E63] dark:bg-[#9CD2E5]/15 dark:text-[#9CD2E5]' },
    { label: 'جديد', style: 'bg-[#8B3E28]/10 text-[#8B3E28] dark:bg-[#F2A18C]/15 dark:text-[#F2A18C]' },
    { label: 'مؤقت', style: 'bg-[#8B3E28] text-white dark:bg-[#F2A18C] dark:text-[#2A1712]' },
    { label: 'خطأ', style: 'bg-[#8B3E28] text-white dark:bg-[#F2A18C] dark:text-[#2A1712]' },
  ];

  return (
    <Section title="Badges">
      <div className="flex flex-wrap gap-2">
        {badges.map((b) => (
          <span
            key={b.label}
            className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${b.style}`}
          >
            {b.label}
          </span>
        ))}
      </div>
    </Section>
  );
}

// ==================== 6. Form Fields ====================
function FormPreview() {
  const fieldBase =
    'w-full rounded-md border border-[#D0D2CC] bg-white px-3.5 py-2.5 text-sm text-[#252B30] placeholder:text-[#4B555B] transition-colors focus:border-[#244E63] focus:outline-none focus:ring-1 focus:ring-[#244E63] dark:border-[#3B484E] dark:bg-[#202A30] dark:text-[#F1F3F0] dark:focus:border-[#9CD2E5] dark:focus:ring-[#9CD2E5]';

  return (
    <Section title="Form Fields">
      <div className="grid max-w-2xl gap-5">
        <div>
          <label className="mb-2 block text-xs font-semibold text-[#252B30] dark:text-[#F1F3F0]">
            الاسم
          </label>
          <input type="text" placeholder="مثلاً: علي مازن" className={fieldBase} />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold text-[#252B30] dark:text-[#F1F3F0]">
            المرحلة
          </label>
          <select className={fieldBase}>
            <option>المرحلة الأولى</option>
            <option>المرحلة الثانية</option>
            <option>المرحلة الثالثة</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold text-[#252B30] dark:text-[#F1F3F0]">
            ملاحظات
          </label>
          <textarea
            rows={3}
            placeholder="اكتب ملاحظتك..."
            className={`${fieldBase} resize-none`}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="preview-check"
            className="h-4 w-4 rounded border-[#D0D2CC] accent-[#244E63] dark:border-[#3B484E] dark:accent-[#9CD2E5]"
          />
          <label htmlFor="preview-check" className="text-sm text-[#4B555B] dark:text-[#BAC4C8]">
            أريد استقبال الإشعارات
          </label>
        </div>
      </div>
    </Section>
  );
}

// ==================== 7. Palette ====================
function PalettePreview() {
  const colors = [
    { name: 'Background', light: '#F4F2EC' },
    { name: 'Surface', light: '#FFFFFF' },
    { name: 'Background Alt', light: '#E7E9E3' },
    { name: 'Text', light: '#252B30' },
    { name: 'Text Soft', light: '#4B555B' },
    { name: 'Border', light: '#D0D2CC' },
    { name: 'Primary (Navy Ink)', light: '#244E63' },
    { name: 'Accent (Rust)', light: '#8B3E28' },
  ];

  return (
    <Section title="Color Palette — Campus Ink">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {colors.map((c) => (
          <div
            key={c.name}
            className="overflow-hidden rounded-md border border-[#D0D2CC] dark:border-[#3B484E]"
          >
            <div className="h-20" style={{ backgroundColor: c.light }} />
            <div className="border-t border-[#D0D2CC] bg-white p-3 dark:border-[#3B484E] dark:bg-[#1D262B]">
              <p className="text-xs font-semibold">{c.name}</p>
              <p className="mt-1 text-[10px] text-[#4B555B] dark:text-[#BAC4C8]">
                {c.light}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ==================== 8. Homepage Mockup ====================
function HomepagePreview() {
  const cards = [
    { icon: '📚', title: 'الملازم', desc: 'مرتبة حسب المادة والدكتور' },
    { icon: '📻', title: 'القنوات', desc: 'دليل قنوات التليكرام' },
    { icon: '📅', title: 'الجدول', desc: 'محاضرات الأسبوع' },
    { icon: '📖', title: 'القاموس', desc: 'مصطلحات طبية ذكية' },
  ];

  return (
    <Section title="Homepage Mockup">
      <div className="overflow-hidden rounded-md border border-[#D0D2CC] dark:border-[#3B484E]">
        <div className="bg-white dark:bg-[#1D262B]">
          {/* Mini header */}
          <div className="flex items-center justify-between border-b border-[#D0D2CC] px-6 py-3 dark:border-[#3B484E]">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#244E63] text-xs font-bold text-white dark:bg-[#9CD2E5] dark:text-[#10232B]">
                ل
              </span>
              <span className="font-bold">لوازم</span>
            </div>
            <div className="flex gap-3 text-xs text-[#4B555B] dark:text-[#BAC4C8]">
              <span>الملازم</span>
              <span>القنوات</span>
              <span>الجدول</span>
            </div>
          </div>

          {/* Hero */}
          <div className="p-8">
            <span className="mb-3 inline-block rounded bg-[#8B3E28]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8B3E28] dark:bg-[#F2A18C]/15 dark:text-[#F2A18C]">
              مساحة طالب الطب
            </span>
            <h1
              className="mt-3 text-4xl font-bold leading-tight"
              style={{ fontFamily: '"Readex Pro", sans-serif' }}
            >
              دراستك، مرتبة بطريقتك.
            </h1>
            <p className="mt-3 text-sm text-[#4B555B] dark:text-[#BAC4C8]">
              ملازمك وأدواتك الطبية في مكان واحد.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-3 px-8 pb-8 md:grid-cols-2">
            {cards.map((c) => (
              <div
                key={c.title}
                className="group rounded-md border border-[#D0D2CC] p-5 transition-colors hover:border-[#244E63] dark:border-[#3B484E] dark:hover:border-[#9CD2E5]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{c.icon}</span>
                  <span className="text-[#4B555B] transition-colors group-hover:text-[#244E63] dark:text-[#BAC4C8] dark:group-hover:text-[#9CD2E5]">
                    ←
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold">{c.title}</h3>
                <p className="mt-1 text-xs text-[#4B555B] dark:text-[#BAC4C8]">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div className="flex items-center justify-between border-t border-[#D0D2CC] p-6 dark:border-[#3B484E]">
            <p className="text-xs text-[#4B555B] dark:text-[#BAC4C8]">
              صُنع بكل حب لطلاب كلية الطب
            </p>
            <button className="rounded-md bg-[#244E63] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1A3A4A] dark:bg-[#9CD2E5] dark:text-[#10232B] dark:hover:bg-[#7ABDD4]">
              افتح المنصة ←
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}