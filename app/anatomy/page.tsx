// app/anatomy/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { BackgroundPattern } from '@/components/BackgroundPattern';
import { IconArrowLeft, IconLock } from '@/components/ui/Icons';
import { MUSCLES } from '@/lib/anatomy-data';

export const metadata: Metadata = {
  title: 'الأطالس التفاعلية — لوازم',
  description: 'مجموعة من الأطالس التشريحية والنسيجية التفاعلية لطلاب كلية الطب.',
};

// ==================== Icons (محلية) ====================
function IconFace({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="9.5" cy="10" r="0.5" fill="currentColor" />
      <circle cx="14.5" cy="10" r="0.5" fill="currentColor" />
      <path d="M8.5 14.5c1 0.9 2.2 1.5 3.5 1.5s2.5-0.6 3.5-1.5" />
    </svg>
  );
}

function IconMicroscope() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 18h8" />
      <path d="M3 22h18" />
      <path d="M14 22a7 7 0 100-14h-1" />
      <path d="M9 14h2" />
      <path d="M9 12a2 2 0 01-2-2V6h6v4a2 2 0 01-2 2z" />
      <path d="M12 6V3a1 1 0 00-1-1H9a1 1 0 00-1 1v3" />
    </svg>
  );
}

// ==================== Atlas Card ====================
interface AtlasCardProps {
  href: string | null;
  titleEn: string;
  titleAr: string;
  description: string;
  icon: React.ReactNode;
  accent: 'teal' | 'gold' | 'coral';
  available: boolean;
}

function AtlasCard({
  href,
  titleEn,
  titleAr,
  description,
  icon,
  accent,
  available,
}: AtlasCardProps) {
  const accentClass = {
    teal: 'bg-teal-soft text-teal',
    gold: 'bg-gold-soft text-gold-ink',
    coral: 'bg-coral-soft text-coral-ink',
  }[accent];

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden="true"
          className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-card ${accentClass}`}
        >
          {icon}
        </span>
        {available ? (
          <span className="inline-flex items-center rounded-chip bg-gold-tint px-2 py-0.5 text-[11px] font-bold text-gold-ink ring-1 ring-gold/30">
            جديد
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-chip bg-ink/5 px-2 py-0.5 text-[11px] font-bold text-ink-muted">
            <IconLock aria-hidden="true" className="h-3 w-3" />
            قيد التطوير
          </span>
        )}
      </div>

      <h3
        dir="ltr"
        className="mt-4 text-start font-display text-xl font-bold leading-tight text-ink group-hover:text-teal"
      >
        {titleEn}
      </h3>
      <p className="mt-0.5 text-sm font-semibold text-ink-muted">{titleAr}</p>

      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{description}</p>

      {available && (
        <span className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-bold text-teal">
          <span>افتح الأطلس</span>
          <IconArrowLeft
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none"
          />
        </span>
      )}
    </>
  );

  if (!available || !href) {
    return (
      <div
        aria-disabled="true"
        className="flex cursor-not-allowed flex-col rounded-card border border-dashed border-line bg-paper-soft/60 p-5 opacity-70"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-card border border-line bg-paper-soft p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {content}
    </Link>
  );
}

// ==================== Page ====================
export default function AnatomyHubPage() {
  return (
    <>
      <BackgroundPattern />
      <main className="relative mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 rounded-field text-sm font-semibold text-teal transition-colors hover:text-teal-hover motion-reduce:transition-none"
        >
          <span className="transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
            <IconArrowLeft aria-hidden="true" className="h-4 w-4" />
          </span>
          رجوع إلى لوحة الأقسام
        </Link>

        <header className="mt-6 animate-slide-up motion-reduce:animate-none">
          <span className="inline-flex items-center gap-1.5 rounded-chip border border-teal/20 bg-teal-tint px-3 py-1 font-mono text-xs text-teal">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal motion-reduce:animate-none"
            />
            مراجع تفاعلية
          </span>

          <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
            الأطالس التفاعلية
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
            رسوم تشريحية ونسيجية تفاعلية — تستكشفها بيدك لتثبيت المعلومة. جميع
            المصطلحات العلمية بالإنجليزية كما تُدرَّس.
          </p>
        </header>

        <section aria-labelledby="atlases-heading" className="mt-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-slide-up motion-reduce:animate-none">
            <AtlasCard
              href="/anatomy/face"
              titleEn="Facial Muscles"
              titleAr="أطلس التشريح"
              description={`${MUSCLES.length} عضلة تفاعلية مع الحركات التعبيرية — ابتسامة، عبوس، رفع الحاجب، وغيرها.`}
              icon={<IconFace />}
              accent="teal"
              available
            />

            <AtlasCard
              href={null}
              titleEn="Histology"
              titleAr="أطلس الأنسجة"
              description="شرائح نسيجية تفاعلية للأنسجة الأساسية الأربعة (الطلائية، الضامة، العضلية، العصبية)."
              icon={<IconMicroscope />}
              accent="coral"
              available={false}
            />
          </div>
        </section>
      </main>
    </>
  );
}