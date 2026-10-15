// app/histology/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { HISTOLOGY_CATEGORIES } from '@/lib/histology-seed';
import {
  IconArrowLeft,
  IconWarning,
} from '@/components/ui/Icons';

// ==================== Types ====================
interface Category {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description: string | null;
  icon_emoji: string | null;
  display_order: number;
}

interface CategoryWithCount extends Category {
  slideCount: number;
}

// ==================== Helpers ====================
function slugToSeed(slug: string) {
  return HISTOLOGY_CATEGORIES.find((c) => c.slug === slug);
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-48 skeleton-shimmer rounded-card motion-reduce:animate-none"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

// ==================== Category Card ====================
function CategoryCard({ category }: { category: CategoryWithCount }) {
  return (
    <Link
      href={`/histology/${category.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-paper-soft p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 block h-[3px] origin-center scale-x-0 bg-teal transition-transform duration-500 group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
      />

      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-card bg-teal-soft text-3xl"
        >
          {category.icon_emoji ?? '🔬'}
        </span>
        <span className="rounded-chip bg-ink/5 px-2.5 py-1 font-mono text-xs font-bold text-ink-muted">
          {category.slideCount} شريحة
        </span>
      </div>

      <h2 className="mt-4 font-display text-lg font-bold text-ink transition-colors group-hover:text-teal sm:text-xl">
        {category.name_ar}
      </h2>
      <p className="mt-1 font-mono text-xs text-ink-muted">
        {category.name_en}
      </p>
      {category.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-soft">
          {category.description}
        </p>
      )}

      <div className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-semibold text-teal">
        <span>استعرض الشرائح</span>
        <IconArrowLeft
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        />
      </div>
    </Link>
  );
}

// ==================== Page ====================
export default function HistologyPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        // 1. اجلب الفئات
        const { data: cats, error: catsErr } = await supabase
          .from('histology_categories')
          .select('*')
          .order('display_order', { ascending: true });

        if (cancelled) return;

        if (catsErr) {
          // جدول فارغ → استخدم البذرة
          if (catsErr.code === 'PGRST116' || catsErr.code === '42P01') {
            setCategories(
              HISTOLOGY_CATEGORIES.map((c) => ({
                id: c.slug,
                slug: c.slug,
                name_ar: c.name_ar,
                name_en: c.name_en,
                description: c.description,
                icon_emoji: c.icon_emoji,
                display_order: c.display_order,
                slideCount: 0,
              })),
            );
            setLoading(false);
            return;
          }
          setError(catsErr.message);
          setLoading(false);
          return;
        }

        // جدول موجود لكن فارغ → استخدم البذرة
        if (!cats || cats.length === 0) {
          setCategories(
            HISTOLOGY_CATEGORIES.map((c) => ({
              id: c.slug,
              slug: c.slug,
              name_ar: c.name_ar,
              name_en: c.name_en,
              description: c.description,
              icon_emoji: c.icon_emoji,
              display_order: c.display_order,
              slideCount: 0,
            })),
          );
          setLoading(false);
          return;
        }

        // 2. اجلب عدد الشرائح لكل فئة
        const { data: slides } = await supabase
          .from('histology_slides')
          .select('category_id');

        const counts = new Map<string, number>();
        for (const s of (slides ?? []) as Array<{ category_id: string }>) {
          counts.set(s.category_id, (counts.get(s.category_id) ?? 0) + 1);
        }

        setCategories(
          (cats as Category[]).map((c) => ({
            ...c,
            slideCount: counts.get(c.id) ?? 0,
          })),
        );
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'خطأ غير معروف');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
      <Link
        href="/"
        className="group inline-flex items-center gap-1.5 rounded-field text-sm font-semibold text-teal transition-colors hover:text-teal-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
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
          أطلس نسيجي
        </span>

        <h1 className="mt-3 flex items-center gap-2.5 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field bg-teal-soft text-teal"
          >
            🔬
          </span>
          الأنسجة الأساسية
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
          استعرض الشرائح النسيجية التفاعلية لكل نوع من الأنسجة الأربعة الأساسية.
          اضغط على أي صورة للتكبير والتنقل فيها.
        </p>
      </header>

      {loading && <Skeleton />}

      {!loading && error && (
        <div
          role="alert"
          className="mt-8 flex items-start gap-3 rounded-card border border-coral/30 bg-coral/5 p-4"
        >
          <IconWarning
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-coral-ink"
          />
          <div>
            <p className="text-sm font-bold text-coral-ink">
              تعذّر تحميل الأطلس
            </p>
            <p className="mt-1 break-anywhere text-xs text-ink-soft">
              {error}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && categories.length === 0 && (
        <div className="mt-8 rounded-card border border-line bg-paper-soft p-12 text-center">
          <p className="text-3xl">🔬</p>
          <p className="mt-3 font-bold text-ink-soft">
            الأطلس قيد الإعداد
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            سنضيف الأنسجة قريباً
          </p>
        </div>
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-slide-up motion-reduce:animate-none">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      )}

      {/* ملاحظة سفلية */}
      <div className="mt-10 rounded-card border border-gold/30 bg-gold-tint/40 p-4 text-xs leading-relaxed text-ink-soft">
        <p>
          <strong className="font-bold text-gold-ink">💡 ملاحظة:</strong>{' '}
          الصور من مصادر أكاديمية مفتوحة (CC0). هذا الأطلس مساعد دراسي — راجع
          دائماً الشرائح الرسمية في المختبر.
        </p>
      </div>
    </main>
  );
}