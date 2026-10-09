// app/channels/page.tsx
'use client';

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import { PullToRefresh } from '@/components/PullToRefresh';
import { Reveal } from '@/components/Reveal';
import {
  IconArrowLeft,
  IconChannels,
  IconSearch,
  IconClose,
  IconWarning,
} from '@/components/ui/Icons';
import type { Channel } from '@/lib/types';

// ==================== Types ====================
type ChannelListItem = Pick<
  Channel,
  'id' | 'name' | 'description' | 'image_url'
>;

type LoadError = {
  message: string;
  detail: string;
};

type IndexedChannel = {
  channel: ChannelListItem;
  haystack: string;
};

const MAIN_CLASS =
  'mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10';

// ==================== Helpers ====================
function toSafeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? trimmed
      : null;
  } catch {
    return null;
  }
}

function buildError(detail: string): LoadError {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  return {
    message: offline
      ? 'يبدو أن الإنترنت مقطوع عندك. سنعيد المحاولة تلقائياً عند رجوعه.'
      : 'تعذّر جلب القنوات الآن. جرّب مرة ثانية بعد قليل.',
    detail,
  };
}

function normalizeArabic(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ئ/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/^ال/, '') || w);

  if (words.length === 0) return '؟';

  const first = Array.from(words[0]);
  const chars =
    words.length >= 2
      ? [first[0] ?? '', Array.from(words[1])[0] ?? '']
      : first.slice(0, 2);

  return chars.join('\u200C').toUpperCase();
}

function ChannelsCount({ count }: { count: number }) {
  if (count === 1) return <>قناة واحدة متاحة لمرحلتك</>;
  if (count === 2) return <>قناتان متاحتان لمرحلتك</>;
  return (
    <>
      <span className="num-inline font-mono">{count}</span>{' '}
      {count >= 3 && count <= 10 ? 'قنوات' : 'قناة'} متاحة لمرحلتك
    </>
  );
}

// ==================== Back Link ====================
function BackLink() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-1.5 rounded-field text-sm font-semibold text-teal transition-colors hover:text-teal-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
    >
      <span className="transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
        <IconArrowLeft aria-hidden="true" className="h-4 w-4" />
      </span>
      رجوع إلى لوحة الأقسام
    </Link>
  );
}

// ==================== Avatar ====================
function ChannelAvatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const safeUrl = toSafeUrl(imageUrl);

  if (safeUrl && !failed) {
    return (
      <Image
        src={safeUrl}
        alt=""
        width={48}
        height={48}
        onError={() => setFailed(true)}
        className="h-12 w-12 shrink-0 rounded-field border border-line object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-field bg-teal-soft text-base font-bold text-teal"
    >
      {getInitials(name)}
    </div>
  );
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div role="status" aria-label="جارٍ تحميل القنوات" className="mt-6">
      <div aria-hidden="true" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-card border border-line bg-paper-soft p-4 animate-slide-up motion-reduce:animate-none sm:p-5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 skeleton-shimmer rounded-field motion-reduce:animate-none" />
              <div className="h-4 flex-1 skeleton-shimmer rounded motion-reduce:animate-none" />
            </div>
            <div className="mt-4 h-3 w-3/4 skeleton-shimmer rounded motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Empty State ====================
function EmptyState() {
  return (
    <div
      role="status"
      className="mt-6 card-editorial p-10 text-center animate-slide-up motion-reduce:animate-none"
    >
      <div
        aria-hidden="true"
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-teal-soft text-teal"
      >
        <IconChannels className="h-8 w-8" />
      </div>
      <p className="mt-4 font-bold text-ink-soft">
        لا توجد قنوات مضافة لمرحلتك حالياً.
      </p>
      <p className="mt-1 text-sm text-ink-muted">يرجى العودة لاحقاً</p>
    </div>
  );
}

// ==================== No Stage State ====================
function NoStageState() {
  return (
    <div
      role="status"
      className="mt-6 card-editorial p-10 text-center animate-slide-up motion-reduce:animate-none"
    >
      <div
        aria-hidden="true"
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-gold-tint text-gold-ink"
      >
        <IconWarning className="h-8 w-8" />
      </div>
      <p className="mt-4 font-bold text-ink-soft">
        لم نعرف مرحلتك الدراسية بعد.
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        اختر مرحلتك من لوحة الأقسام ثم ارجع لهذه الصفحة.
      </p>
    </div>
  );
}

// ==================== No Search Results ====================
function NoResults({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div
      role="status"
      className="mt-6 card-editorial p-10 text-center animate-slide-up motion-reduce:animate-none"
    >
      <div
        aria-hidden="true"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-field bg-ink/5 text-ink-muted"
      >
        <IconSearch className="h-6 w-6" />
      </div>
      <p className="mt-4 font-bold text-ink-soft">لا توجد نتائج مطابقة</p>
      <p dir="auto" className="mt-1 break-anywhere text-sm text-ink-muted">
        «{query}»
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 inline-flex h-10 items-center rounded-field border border-line bg-paper-soft px-4 text-sm font-semibold text-ink-soft transition-colors hover:border-teal/40 hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
      >
        مسح البحث
      </button>
    </div>
  );
}

// ==================== Error State ====================
function ErrorState({
  error,
  onRetry,
}: {
  error: LoadError;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mt-6 flex items-start gap-3 rounded-card border border-coral/30 bg-coral/5 p-4 animate-slide-up motion-reduce:animate-none"
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field bg-coral text-on-coral"
      >
        <IconWarning className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-coral-ink">تعذّر تحميل القنوات</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
          {error.message}
        </p>
        {error.detail && (
          <p
            dir="ltr"
            className="mt-1 break-anywhere text-end font-mono text-[11px] text-ink-muted"
          >
            {error.detail}
          </p>
        )}
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex h-10 items-center rounded-field border border-line bg-paper-soft px-4 text-xs font-semibold text-ink-soft transition-colors hover:border-teal/40 hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}

// ==================== Channel Card ====================
function ChannelCard({ channel }: { channel: ChannelListItem }) {
  const titleId = `channel-title-${channel.id}`;
  const descId = `channel-desc-${channel.id}`;
  const description = channel.description?.trim() ?? '';

  return (
    <Link
      href={`/channels/${encodeURIComponent(channel.id)}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-line bg-paper-soft p-4 transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-teal/40 hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 block h-[3px] origin-center scale-x-0 bg-teal transition-transform duration-500 group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
      />

      <div className="flex items-center gap-3">
        <ChannelAvatar name={channel.name} imageUrl={channel.image_url} />

        <h2
          id={titleId}
          className="min-w-0 flex-1 break-anywhere line-clamp-2 font-display text-base font-bold leading-snug text-ink transition-colors group-hover:text-teal motion-reduce:transition-none sm:text-lg"
        >
          {channel.name}
        </h2>
      </div>

      {description && (
        <p
          id={descId}
          className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-soft"
        >
          {description}
        </p>
      )}

      <div className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-semibold text-teal">
        <span>فتح صفحة القناة</span>
        <span className="transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
          <IconArrowLeft aria-hidden="true" className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

// ==================== Search Bar ====================
function SearchBar({
  value,
  onChange,
  onClear,
  resultCount,
  totalCount,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  resultCount: number;
  totalCount: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const showCount = value.trim() !== '';

  function clearAndFocus() {
    onClear();
    inputRef.current?.focus();
  }

  return (
    <div className="mt-6 animate-slide-up motion-reduce:animate-none">
      <label htmlFor="channels-search" className="sr-only">
        ابحث باسم القناة أو وصفها
      </label>

      <div className="relative">
        <IconSearch
          aria-hidden="true"
          className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        />
        <input
          ref={inputRef}
          id="channels-search"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && value) {
              e.preventDefault();
              onClear();
            }
          }}
          placeholder="ابحث باسم القناة أو وصفها..."
          maxLength={100}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby="channels-search-status"
          className="field-editorial w-full ps-10 pe-11 text-base [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={clearAndFocus}
            aria-label="مسح البحث"
            className="absolute end-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-field text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
          >
            <IconClose aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <p
        id="channels-search-status"
        aria-live="polite"
        className="mt-1.5 min-h-4 text-xs text-ink-muted"
      >
        {showCount && (
          <>
            النتائج: <span className="num-inline font-mono">{resultCount}</span>
            {' من '}
            <span className="num-inline font-mono">{totalCount}</span>
          </>
        )}
      </p>
    </div>
  );
}

// ==================== Page ====================
export default function ChannelsPage() {
  const { stage, ready } = useStudentStage();
  const [channels, setChannels] = useState<ChannelListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<LoadError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Pull-to-refresh state
  const [reloadKey, setReloadKey] = useState(0);
  const [silentReload, setSilentReload] = useState(false);
  const refreshResolverRef = useRef<(() => void) | null>(null);

  const deferredSearch = useDeferredValue(searchTerm);
  const isStale = searchTerm !== deferredSearch;

  // ==================== Load data ====================
  useEffect(() => {
    if (!stage) return;
    const currentStage = stage;
    const isSilent = silentReload;
    let cancelled = false;

    async function loadData() {
      if (!isSilent) setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('channels')
          .select('id, name, description, image_url')
          .eq('stage', currentStage);

        if (cancelled) return;

        if (fetchError) {
          setError(buildError(fetchError.message));
          setChannels([]);
        } else {
          const list = (data ?? []) as ChannelListItem[];
          setChannels(
            [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar')),
          );
        }
      } catch (e: unknown) {
        if (cancelled) return;
        setError(buildError(e instanceof Error ? e.message : ''));
        setChannels([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSilentReload(false);
          if (refreshResolverRef.current) {
            const resolve = refreshResolverRef.current;
            refreshResolverRef.current = null;
            resolve();
          }
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
      if (refreshResolverRef.current) {
        const resolve = refreshResolverRef.current;
        refreshResolverRef.current = null;
        resolve();
      }
    };
  }, [stage, reloadKey, silentReload]);

  // ==================== Pull-to-refresh ====================
  const handleRefresh = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      refreshResolverRef.current = resolve;
      setSilentReload(true);
      setReloadKey((k) => k + 1);
    });
  }, []);

  // إعادة محاولة تلقائية عند رجوع الإنترنت
  useEffect(() => {
    if (!error) return;
    function onOnline() {
      setReloadKey((k) => k + 1);
    }
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [error]);

  const handleRetry = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // ==================== Filter ====================
  const indexed = useMemo<IndexedChannel[]>(
    () =>
      channels.map((channel) => ({
        channel,
        haystack: normalizeArabic(
          `${channel.name} ${channel.description ?? ''}`,
        ),
      })),
    [channels],
  );

  const term = useMemo(() => normalizeArabic(deferredSearch), [deferredSearch]);

  const visibleChannels = useMemo(() => {
    if (!term) return channels;
    return indexed
      .filter((item) => item.haystack.includes(term))
      .map((item) => item.channel);
  }, [channels, indexed, term]);

  // ==================== Loading (stage not ready) ====================
  if (!ready) {
    return (
      <main className={MAIN_CLASS} aria-busy="true">
        <Skeleton />
      </main>
    );
  }

  // ==================== No stage ====================
  if (!stage) {
    return (
      <main className={MAIN_CLASS}>
        <BackLink />
        <NoStageState />
      </main>
    );
  }

  const hasChannels = channels.length > 0;
  const hasResults = visibleChannels.length > 0;

  return (
    <main className={MAIN_CLASS} aria-labelledby="channels-title">
      <PullToRefresh onRefresh={handleRefresh}>
        <BackLink />

        <header className="mt-6 animate-slide-up motion-reduce:animate-none">
          <span className="stage-badge">{stage}</span>

          <h1
            id="channels-title"
            className="mt-3 flex items-center gap-2.5 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl"
          >
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field bg-teal-soft text-teal"
            >
              <IconChannels className="h-5 w-5" />
            </span>
            قنوات الدراسة
          </h1>

          {!loading && !error && hasChannels && (
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              <ChannelsCount count={channels.length} />
            </p>
          )}
        </header>

        {!loading && !error && hasChannels && (
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={handleClearSearch}
            resultCount={visibleChannels.length}
            totalCount={channels.length}
          />
        )}

        <div aria-busy={loading}>
          {loading && <Skeleton />}

          {!loading && error && (
            <ErrorState error={error} onRetry={handleRetry} />
          )}

          {!loading && !error && !hasChannels && <EmptyState />}

          {!loading && !error && hasChannels && !hasResults && (
            <NoResults
              query={deferredSearch.trim()}
              onClear={handleClearSearch}
            />
          )}

          {!loading && !error && hasResults && (
            <ul
              role="list"
              className={`mt-6 grid gap-3 transition-opacity duration-150 motion-reduce:transition-none sm:grid-cols-2 lg:grid-cols-3 ${
                isStale ? 'opacity-60' : 'opacity-100'
              }`}
            >
              {visibleChannels.map((c, idx) => (
                <Reveal
                  key={c.id}
                  as="li"
                  delay={Math.min(idx * 40, 300)}
                  className="min-w-0 defer-item"
                >
                  <ChannelCard channel={c} />
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </PullToRefresh>
    </main>
  );
}
