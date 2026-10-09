// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import { STAGES, STORAGE_KEYS } from '@/lib/constants';
import { BackgroundPattern } from '@/components/BackgroundPattern';
import { RecentViewsCard } from '@/components/RecentViewsCard';
import { ContinueCard } from '@/components/ContinueCard';
import { TrendingNotes } from '@/components/TrendingNotes';
import { BotChannelCard } from '@/components/BotChannelCard';
import { Masthead } from './_components/Masthead';
import { SectionTile, SectionTileGrid } from './_components/SectionTile';
import type { TileSize, TileVariant } from './_components/SectionTile';
import type { Stage } from '@/lib/types';
import {
  IconArrowLeft,
  IconBook,
  IconCalendar,
  IconChannels,
  IconChart,
  IconHealth,
  IconSparkles,
  IconSwap,
} from '@/components/ui/Icons';

// ==================== Helpers ====================
type RevealStyle = CSSProperties & { '--i'?: number };

function reveal(i: number): RevealStyle {
  return { '--i': i };
}

function isStage(value: string | null): value is Stage {
  return value !== null && (STAGES as readonly string[]).includes(value);
}

// ==================== Section Config ====================
interface Section {
  href: string;
  title: string;
  kicker: string;
  description: string;
  icon: React.ReactNode;
  variant: Exclude<TileVariant, 'locked'>;
  size: TileSize;
  ctaLabel?: string;
  badge?: string;
  /** مقفل دائماً (قريباً) */
  locked?: boolean;
}

const SECTIONS: Section[] = [
  {
    href: '/lawazem',
    title: 'الملازم والمصادر',
    kicker: 'المكتبة',
    description: 'ملازم الدكاترة مرتبة حسب المادة والدكتور، مع وسوم للتصفية السريعة.',
    icon: <IconBook />,
    variant: 'featured',
    size: 'lg',
    ctaLabel: 'تصفّح الملازم',
  },
  {
    href: '/channels',
    title: 'القنوات',
    kicker: 'الانضمام',
    description: 'دليل قنوات التليكرام لكل مادة.',
    icon: <IconChannels />,
    variant: 'teal',
    size: 'sm',
  },
  {
    href: '/schedule',
    title: 'الجدول',
    kicker: 'التنظيم',
    description: 'جدول محاضراتك الأسبوعي.',
    icon: <IconCalendar />,
    variant: 'gold',
    size: 'sm',
  },
  {
    href: '/study-prompt',
    title: 'جات الدراسة',
    kicker: 'أدوات AI',
    description: 'برومبت ذكي يولّد لك شرحاً تفاعلياً لمحاضراتك، مع بطاقات وأسئلة.',
    icon: <IconSparkles />,
    variant: 'navy',
    size: 'wide',
  },
  {
    href: '/gpa',
    title: 'المعدل',
    kicker: 'التتبع',
    description: 'احسب معدلك واعرف كم تحتاج للنجاح.',
    icon: <IconChart />,
    variant: 'coral',
    size: 'sm',
  },
  {
    href: '/study-health',
    title: 'صحتك الدراسية',
    kicker: 'التحليل',
    description: 'تحليل شخصي لعاداتك الدراسية.',
    icon: <IconHealth />,
    variant: 'teal',
    size: 'sm',
  },
];

const GROUP_SWAP_SECTION: Section = {
  href: '/group-swap',
  title: 'تبديل الكروبات',
  kicker: 'العملي',                                          // ← وصف بدل "قريباً"
  description: 'بدّل كروبك العملي بسهولة — مغلق حالياً.',        // ← تصحيح طفيف
  icon: <IconSwap />,
  variant: 'gold',
  size: 'wide',
  // badge: 'قريباً',                                        // ← احذف هذا السطر
  locked: true,
};

// ==================== Section Heading ====================
function SectionHeading({
  id,
  kicker,
  title,
  index,
}: {
  id: string;
  kicker: string;
  title: string;
  index: number;
}) {
  return (
    <div className="mb-5 ink-reveal" style={reveal(index)}>
      <p className="kicker">{kicker}</p>
      <h2
        id={id}
        className="mt-2 font-display text-xl font-bold leading-tight text-ink sm:text-2xl"
      >
        {title}
      </h2>
    </div>
  );
}

// ==================== Stage Card ====================
function StageCard({
  stage,
  index,
  onClick,
}: {
  stage: string;
  index: number;
  onClick: () => void;
}) {
  const number = String(index + 1).padStart(2, '0');

  return (
    <div className="ink-reveal" style={reveal(index + 3)}>
      <button
        type="button"
        onClick={onClick}
        className="group relative block w-full overflow-hidden rounded-card border border-line bg-paper-soft p-6 text-start transition-all duration-200 hover:-translate-y-1 hover:border-teal hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <div className="absolute inset-x-0 top-0 h-[3px] origin-center scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100 motion-reduce:transition-none" />

        <span
          aria-hidden="true"
          className="absolute end-4 top-4 font-mono text-xs font-medium text-ink-muted"
        >
          {number}
        </span>

        <span className="relative block font-display text-2xl font-bold text-ink">
          {stage}
        </span>

        <span className="relative mt-6 flex items-center gap-1.5 text-sm font-semibold text-teal">
          <span>اختر</span>
          <IconArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none" />
        </span>
      </button>
    </div>
  );
}

// ==================== Page ====================
export default function HomePage() {
  const [stage, setStage] = useState<Stage | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.studentStage);
      if (isStage(saved)) setStage(saved);
    } catch {
      /* تجاهل */
    }
    setLoaded(true);
  }, []);

  function chooseStage(s: Stage) {
    try {
      localStorage.setItem(STORAGE_KEYS.studentStage, s);
    } catch {
      /* تجاهل */
    }
    setStage(s);
    window.dispatchEvent(new Event('student-stage-change'));
  }

  function changeStage() {
    try {
      localStorage.removeItem(STORAGE_KEYS.studentStage);
    } catch {
      /* تجاهل */
    }
    setStage(null);
    window.dispatchEvent(new Event('student-stage-change'));
  }

  // ==================== Loading ====================
  if (!loaded) {
    return <main className="min-h-dvh bg-paper" aria-busy="true" />;
  }

  // ==================== Stage Selection ====================
  if (!stage) {
    return (
      <>
        <BackgroundPattern />
        <main className="relative mx-auto flex min-h-[calc(100dvh-var(--nav-h))] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-16">
          <div className="ink-reveal">
            <span className="inline-flex items-center gap-2 rounded-chip border border-line bg-paper-soft px-4 py-1.5 font-mono text-[11px] font-medium uppercase tracking-widest text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" aria-hidden="true" />
              منصة لطلبة جامعة العميد
            </span>
          </div>

          <h1
            id="stage-heading"
            className="mt-8 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl ink-reveal"
            style={reveal(1)}
          >
            اختر مرحلتك الدراسية
          </h1>

          <p
            className="mt-4 max-w-md text-base leading-relaxed text-ink-soft ink-reveal"
            style={reveal(2)}
          >
            في لوازم نعرض لك المحتوى المناسب لمرحلتك — قنوات، جداول، وكل ما تحتاجه.
          </p>

          <div
            role="group"
            aria-labelledby="stage-heading"
            className="relative mt-12 grid w-full gap-4 sm:grid-cols-3"
          >
            {STAGES.map((s, i) => (
              <StageCard key={s} stage={s} index={i} onClick={() => chooseStage(s)} />
            ))}
          </div>

          <p className="mt-10 text-xs text-ink-muted ink-reveal" style={reveal(6)}>
            يمكنك تغييرها لاحقاً
          </p>
        </main>
      </>
    );
  }

  // ==================== Dashboard ====================
  const sections = [...SECTIONS, GROUP_SWAP_SECTION];

  return (
    <>
      <BackgroundPattern />

      <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pb-12 sm:pt-8">
        <h1 className="sr-only">لوازم — الصفحة الرئيسية</h1>

        {/* ==================== Masthead ==================== */}
        <Masthead stage={stage} onChangeStage={changeStage} />

        {/* ==================== Continue Reading ==================== */}
        <div className="mt-2 ink-reveal">
          <ContinueCard />
        </div>

        {/* ==================== Sections (Bento) ==================== */}
        <section aria-labelledby="sections-heading" className="mt-12">
          <SectionHeading
            id="sections-heading"
            kicker="الأقسام"
            title="كل ما تحتاجه في مكان واحد"
            index={1}
          />

          <div className="ink-reveal" style={reveal(2)}>
            <SectionTileGrid>
              {sections.map((sec) => {
                const isLocked = sec.locked === true;
                const size: TileSize = sec.size;

                return (
                  <SectionTile
                    key={sec.href}
                    href={sec.href}
                    title={sec.title}
                    kicker={sec.kicker}
                    description={sec.description}
                    icon={sec.icon}
                    variant={sec.variant}
                    size={size}
                    badge={sec.badge}
                    ctaLabel={sec.ctaLabel}
                    locked={isLocked}
                    lockedLabel={isLocked ? 'قريباً' : undefined}
                  />
                );
              })}
            </SectionTileGrid>
          </div>
        </section>

        {/* ==================== Community: Bot + Trending ==================== */}
        <section aria-labelledby="community-heading" className="mt-20">
          <div
            className="mx-auto mb-10 max-w-2xl text-center ink-reveal"
            style={reveal(3)}
          >
            <div className="flex justify-center">
              <p className="kicker">تابعنا</p>
            </div>

            <h2
              id="community-heading"
              className="mt-3 font-display text-2xl font-bold leading-tight text-ink sm:text-3xl"
            >
              ابقَ على اطلاع
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-soft sm:text-base">
              كل جديد يصلك مباشرة — بدون ما تفتح الموقع كل يوم.
            </p>
          </div>

          <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-4">
            <div className="w-full lg:w-[58%]">
              <BotChannelCard />
            </div>
            <div className="w-full empty:hidden lg:w-[38%]">
              <TrendingNotes stage={stage} />
            </div>
          </div>
        </section>

        {/* ==================== Recent Views ==================== */}
        <div className="mt-16">
          <RecentViewsCard />
        </div>

        {/* ==================== Footer ==================== */}
        <footer className="mt-20 border-t border-line pt-8 pb-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-contain opacity-60"
            />
            <p className="text-xs leading-relaxed text-ink-soft sm:text-sm">
              صُنع بكل حب لطلاب كلية الطب · جامعة العميد
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              علي مازن — @E_W_9
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}