// app/histology/[slug]/page.tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { HISTOLOGY_CATEGORIES, HISTOLOGY_SLIDES } from '@/lib/histology-seed';
import {
  IconArrowLeft,
  IconClose,
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
}

interface Slide {
  id: string;
  title_ar: string;
  title_en: string | null;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  stain: string | null;
  magnification: string | null;
  display_order: number;
}

// ==================== Viewer Component ====================
function SlideViewer({
  slide,
  onClose,
}: {
  slide: Slide;
  onClose: () => void;
}) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const osdRef = useRef<any>(null);
  const [zoomLevel, setZoomLevel] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function initViewer() {
      const OpenSeadragon = (await import('openseadragon')).default;
      if (cancelled || !viewerRef.current) return;

      // ⚠️ مهم: نتأكد من أن الـdiv فارغ قبل التهيئة
      viewerRef.current.innerHTML = '';

      const viewer = OpenSeadragon({
        element: viewerRef.current,
        prefixUrl:
          'https://cdn.jsdelivr.net/npm/openseadragon@4.1.0/build/openseadragon/images/',
        tileSources: {
          type: 'image',
          url: slide.image_url,
        },
        showNavigator: true,
        navigatorPosition: 'BOTTOM_RIGHT',
        navigatorSizeRatio: 0.15,
        showRotationControl: false,
        showFullPageControl: false,
        showHomeControl: true,
        showZoomControl: true,
        gestureSettingsMouse: {
          clickToZoom: false,
          dblClickToZoom: true,
          scrollToZoom: true,
        },
        gestureSettingsTouch: {
          pinchToZoom: true,
          flickEnabled: true,
        },
        visibilityRatio: 0.5,
        minZoomImageRatio: 0.8,
        maxZoomPixelRatio: 4,
        animationTime: 0.6,
      });

      viewer.addHandler('zoom', (event: any) => {
        setZoomLevel(Math.round(event.zoom * 100) / 100);
      });

      osdRef.current = viewer;
    }

    void initViewer();

    return () => {
      cancelled = true;
      if (osdRef.current) {
        osdRef.current.destroy();
        osdRef.current = null;
      }
    };
  }, [slide.image_url]);

  // Escape لإغلاق العارض
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={slide.title_ar}
      className="fixed inset-0 z-[80] flex flex-col bg-[#0B1114] text-white"
    >
      {/* ═══ Top Bar ═══ */}
      <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-base font-bold text-white sm:text-lg">
            {slide.title_ar}
          </h2>
          {slide.title_en && (
            <p className="truncate font-mono text-[11px] text-white/50">
              {slide.title_en}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-3 rounded-chip bg-white/5 px-3 py-1 text-[11px] font-mono text-white/70 sm:flex">
            {slide.stain && <span>🧪 {slide.stain}</span>}
            {slide.magnification && <span>🔍 {slide.magnification}</span>}
            <span>⚡ {zoomLevel.toFixed(1)}×</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق العارض"
            className="flex h-9 w-9 items-center justify-center rounded-field bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ═══ Viewer ═══ */}
      <div
        ref={viewerRef}
        className="min-h-0 flex-1 bg-[#05080A]"
        style={{ cursor: 'grab' }}
      />

      {/* ═══ Bottom Info (mobile) ═══ */}
      {slide.description && (
        <footer className="flex-shrink-0 border-t border-white/10 bg-black/40 px-4 py-3 text-xs leading-relaxed text-white/70 backdrop-blur-sm sm:hidden">
          {slide.description}
        </footer>
      )}
    </div>
  );
}

// ==================== Slide Card ====================
function SlideCard({
  slide,
  index,
  onClick,
}: {
  slide: Slide;
  index: number;
  onClick: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
      className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-paper-soft text-start transition-all duration-300 hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none motion-reduce:hover:translate-y-0 animate-slide-up motion-reduce:animate-none"
    >
      {/* Image Preview */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink/5">
        {!imageError ? (
          <>
            {!loaded && (
              <div
                aria-hidden="true"
                className="absolute inset-0 skeleton-shimmer motion-reduce:animate-none"
              />
            )}
            <img
              src={slide.thumbnail_url ?? slide.image_url}
              alt={slide.title_ar}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              onError={() => setImageError(true)}
              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-muted">
            <span className="text-4xl">🔬</span>
          </div>
        )}

        {/* Zoom hint */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-[11px] font-bold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none">
          <span aria-hidden="true">🔍</span>
          اضغط للاستعراض
        </span>

        {/* Badges */}
        <div className="pointer-events-none absolute start-2 top-2 flex flex-wrap gap-1">
          {slide.stain && (
            <span className="rounded-chip bg-black/60 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-sm">
              {slide.stain}
            </span>
          )}
          {slide.magnification && (
            <span className="rounded-chip bg-black/60 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-sm">
              {slide.magnification}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="text-sm font-bold leading-snug text-ink transition-colors group-hover:text-teal">
          {slide.title_ar}
        </h3>
        {slide.title_en && (
          <p className="mt-0.5 line-clamp-1 font-mono text-[11px] text-ink-muted">
            {slide.title_en}
          </p>
        )}
        {slide.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-soft">
            {slide.description}
          </p>
        )}
      </div>
    </button>
  );
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-card border border-line bg-paper-soft"
          aria-hidden="true"
        >
          <div className="aspect-[4/3] w-full skeleton-shimmer motion-reduce:animate-none" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 skeleton-shimmer rounded motion-reduce:animate-none" />
            <div className="h-3 w-1/2 skeleton-shimmer rounded motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== Page ====================
export default function HistologyCategoryPage() {
  const params = useParams();
  const slug = useMemo<string>(() => {
    const raw = params?.slug;
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
      return raw[0];
    }
    return '';
  }, [params]);

  const [category, setCategory] = useState<Category | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSlide, setActiveSlide] = useState<Slide | null>(null);

  // ==================== Load data ====================
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        // 1. اجلب الفئة
        const { data: cat } = await supabase
          .from('histology_categories')
          .select('*')
          .eq('slug', slug)
          .maybeSingle<Category>();

        if (cancelled) return;

        // ═══ Fallback to seed if empty ═══
        if (!cat) {
          const seedCat = HISTOLOGY_CATEGORIES.find((c) => c.slug === slug);
          if (seedCat) {
            setCategory({
              id: seedCat.slug,
              slug: seedCat.slug,
              name_ar: seedCat.name_ar,
              name_en: seedCat.name_en,
              description: seedCat.description,
              icon_emoji: seedCat.icon_emoji,
            });

            const seedSlides = HISTOLOGY_SLIDES.filter(
              (s) => s.category_slug === slug,
            ).map((s, i) => ({
              id: `${slug}-${i}`,
              title_ar: s.title_ar,
              title_en: s.title_en,
              description: s.description,
              image_url: s.image_url,
              thumbnail_url: s.thumbnail_url,
              stain: s.stain,
              magnification: s.magnification,
              display_order: s.display_order,
            }));

            setSlides(seedSlides);
          } else {
            setError('الفئة غير موجودة');
          }
          return;
        }

        setCategory(cat);

        // 2. اجلب الشرائح
        const { data: slidesData } = await supabase
          .from('histology_slides')
          .select('*')
          .eq('category_id', cat.id)
          .order('display_order', { ascending: true });

        if (cancelled) return;

        if (slidesData && slidesData.length > 0) {
          setSlides(slidesData as Slide[]);
        } else {
          // Fallback to seed slides
          const seedSlides = HISTOLOGY_SLIDES.filter(
            (s) => s.category_slug === slug,
          ).map((s, i) => ({
            id: `${slug}-seed-${i}`,
            title_ar: s.title_ar,
            title_en: s.title_en,
            description: s.description,
            image_url: s.image_url,
            thumbnail_url: s.thumbnail_url,
            stain: s.stain,
            magnification: s.magnification,
            display_order: s.display_order,
          }));
          setSlides(seedSlides);
        }
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
  }, [slug]);

  const closeViewer = useCallback(() => setActiveSlide(null), []);

  // ==================== Render ====================
  if (!slug) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-ink-soft">الرابط غير صالح.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
      {/* ═══ Back Link ═══ */}
      <Link
        href="/histology"
        className="group inline-flex items-center gap-1.5 rounded-field text-sm font-semibold text-teal transition-colors hover:text-teal-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
      >
        <span className="transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
          <IconArrowLeft aria-hidden="true" className="h-4 w-4" />
        </span>
        رجوع إلى الأطلس
      </Link>

      {/* ═══ Header ═══ */}
      {category && (
        <header className="mt-6 animate-slide-up motion-reduce:animate-none">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-card bg-teal-soft text-3xl"
            >
              {category.icon_emoji ?? '🔬'}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
                {category.name_ar}
              </h1>
              <p className="mt-0.5 font-mono text-xs text-ink-muted">
                {category.name_en}
              </p>
            </div>
          </div>
          {category.description && (
            <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
              {category.description}
            </p>
          )}
        </header>
      )}

      {/* ═══ Loading ═══ */}
      {loading && <Skeleton />}

      {/* ═══ Error ═══ */}
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
            <p className="text-sm font-bold text-coral-ink">خطأ</p>
            <p className="mt-1 break-anywhere text-xs text-ink-soft">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ═══ Empty ═══ */}
      {!loading && !error && slides.length === 0 && (
        <div className="mt-8 rounded-card border border-line bg-paper-soft p-12 text-center">
          <p className="text-3xl">🔬</p>
          <p className="mt-3 font-bold text-ink-soft">لا توجد شرائح بعد</p>
          <p className="mt-1 text-sm text-ink-muted">
            سنضيف الشرائح لهذا النسيج قريباً
          </p>
        </div>
      )}

      {/* ═══ Slides Grid ═══ */}
      {!loading && !error && slides.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((s, i) => (
            <SlideCard
              key={s.id}
              slide={s}
              index={i}
              onClick={() => setActiveSlide(s)}
            />
          ))}
        </div>
      )}

      {/* ═══ Viewer Modal ═══ */}
      {activeSlide && (
        <SlideViewer slide={activeSlide} onClose={closeViewer} />
      )}
    </main>
  );
}