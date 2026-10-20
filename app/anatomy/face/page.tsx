// app/anatomy/face/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { BackgroundPattern } from '@/components/BackgroundPattern';
import { IconArrowLeft } from '@/components/ui/Icons';
import FaceAtlas from '@/components/anatomy/FaceAtlas';
import { MUSCLES } from '@/lib/anatomy-data';

export const metadata: Metadata = {
  title: 'Facial Muscles — لوازم',
  description:
    'Interactive facial muscle atlas: origin, insertion, nerve supply and action, with expressions and a self-test.',
};

export default function FaceAtlasPage() {
  return (
    <>
      <BackgroundPattern />
      <main className="relative mx-auto max-w-6xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
        <Link
          href="/#atlases"
          className="group inline-flex items-center gap-1.5 rounded-field text-sm font-semibold text-teal transition-colors hover:text-teal-hover motion-reduce:transition-none"
        >
          <span className="transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
            <IconArrowLeft aria-hidden="true" className="h-4 w-4" />
          </span>
          رجوع إلى قائمة الأطالس
        </Link>

        <header className="mt-6 mb-6 animate-slide-up motion-reduce:animate-none">
          <span className="inline-flex items-center gap-1.5 rounded-chip border border-teal/20 bg-teal-tint px-3 py-1 font-mono text-xs text-teal">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal" />
            {MUSCLES.length} muscles · عضلة
          </span>
          <h1 dir="ltr" className="mt-3 text-start font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Facial Muscles
          </h1>
          <p className="mt-1 text-sm font-semibold text-ink-muted sm:text-base">
            أطلس عضلات الوجه
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
            اضغط أي عضلة على الوجه أو اخترها من القائمة. جرّب التعابير لترى العضلات تعمل معاً، ثم اختبر نفسك.
            الواجهة بالعربية، والمصطلحات العلمية بالإنجليزية كما تُدرَّس.
          </p>
        </header>

        <FaceAtlas />
      </main>
    </>
  );
}