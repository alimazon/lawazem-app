// app/channels/[id]/page.tsx
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
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS } from '@/lib/constants';
import {
  IconArrowLeft,
  IconClose,
  IconExternal,
  IconFolder,
  IconInbox,
  IconSearch,
  IconTelegram,
  IconWarning,
} from '@/components/ui/Icons';
import type { Channel, ChannelContent, FileEntry } from '@/lib/types';

// ==================== Types ====================
type ChannelInfo = Pick<
  Channel,
  'id' | 'name' | 'description' | 'telegram_link' | 'image_url' | 'stage'
>;

// نجلب الأعمدة المستخدمة فقط بدل select('*')
type ContentRow = Pick<
  ChannelContent,
  | 'id'
  | 'title'
  | 'description'
  | 'file_urls'
  | 'due_date'
  | 'pinned'
  | 'content_type'
  | 'folder'
>;

type LoadError = {
  message: string; // رسالة عربية مفهومة للطالب
  detail: string; // تفاصيل تقنية (قد تكون فارغة)
};

type NotFound = { reason: 'missing' } | { reason: 'invalid-id' };

interface ContentGroup {
  key: string;
  label: string;
  folders: Array<{ folder: string; items: ContentRow[] }>;
  noFolderItems: ContentRow[];
  total: number;
}

interface IndexedItem {
  item: ContentRow;
  haystack: string;
}

const MAIN_CLASS =
  'mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10';

// رمز خطأ Postgres: "صيغة المعرّف غير صحيحة" (مثل كتابة abc مكان رقم القناة)
const INVALID_TEXT_CODE = '22P02';

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

function buildError(detail: string, what: 'channel' | 'content'): LoadError {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  const noun = what === 'channel' ? 'القناة' : 'محتوى القناة';
  return {
    message: offline
      ? 'يبدو أن الإنترنت مقطوع عندك. سنعيد المحاولة تلقائياً عند رجوعه.'
      : `تعذّر جلب ${noun} الآن. جرّب مرة ثانية بعد قليل.`,
    detail,
  };
}

// توحيد الحروف العربية لبحث ذكي: "الأنسجة" = "الانسجه" ، "٣" = "3"
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

// نفس دالة صفحة القنوات حرفياً، حتى يظهر نفس الحرفين للقناة في الصفحتين
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

// اسم النوع بأمان (لو أضفت نوعاً جديداً في القاعدة ولم تضفه في constants)
function getTypeLabel(type: string): string {
  return (CONTENT_TYPE_LABELS as Record<string, string>)[type] ?? 'أخرى';
}

// عدّاد الزيارات: مرة لكل جلسة، وخارج الـ effect الرئيسي ليبقى نظيفاً
function trackChannelView(channelId: string): void {
  try {
    const viewKey = `viewed_channel_${channelId}`;
    if (sessionStorage.getItem(viewKey)) return;
    sessionStorage.setItem(viewKey, '1');
    void fetch('/api/channel/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: channelId }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* تجاهل: sessionStorage غير متاح */
  }
}

// ==================== Due Date ====================
type DueKind = 'expired' | 'today' | 'tomorrow' | 'soon' | 'normal';

interface DueInfo {
  kind: DueKind;
  text: string;
}

// أرقام لاتينية + شهور عراقية: "15 تشرين الأول"
const dueFormatterShort = new Intl.DateTimeFormat(
  'ar-IQ-u-nu-latn-ca-gregory',
  { day: 'numeric', month: 'long' },
);
const dueFormatterLong = new Intl.DateTimeFormat(
  'ar-IQ-u-nu-latn-ca-gregory',
  { day: 'numeric', month: 'long', year: 'numeric' },
);

// التاريخ "2026-10-15" لا يتحول لتوقيت UTC فيتأخر يوم في بعض الأجهزة
function parseDueDate(raw: string): Date | null {
  const trimmed = raw.trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  const date = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
      )
    : new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDueInfo(dueDateStr: string | null): DueInfo | null {
  if (!dueDateStr) return null;
  const due = parseDueDate(dueDateStr);
  if (!due) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return { kind: 'expired', text: 'انتهى الموعد' };
  if (diffDays === 0) return { kind: 'today', text: 'التسليم اليوم!' };
  if (diffDays === 1) return { kind: 'tomorrow', text: 'التسليم غداً' };

  if (diffDays === 2) return { kind: 'soon', text: 'التسليم بعد يومين' };
  if (diffDays <= 3) {
    return { kind: 'soon', text: `التسليم بعد ${diffDays} أيام` };
  }

  const sameYear = due.getFullYear() === today.getFullYear();
  const formatted = (sameYear ? dueFormatterShort : dueFormatterLong).format(
    due,
  );
  return { kind: 'normal', text: `التسليم: ${formatted}` };
}

function dueBadgeClass(kind: DueKind): string {
  switch (kind) {
    case 'expired':
      return 'bg-ink/5 text-ink-muted';
    case 'today':
      return 'bg-coral text-on-coral';
    case 'tomorrow':
      return 'bg-coral/10 text-coral-ink';
    case 'soon':
      return 'bg-gold/15 text-gold-ink';
    case 'normal':
    default:
      return 'bg-ink/5 text-ink-soft';
  }
}

// ==================== Back Link ====================
function BackLink() {
  return (
    <Link
      href="/channels"
      className="group inline-flex items-center gap-1.5 rounded-field text-sm font-semibold text-teal transition-colors hover:text-teal-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
    >
      <span className="transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
        <IconArrowLeft aria-hidden="true" className="h-4 w-4" />
      </span>
      رجوع إلى القنوات
    </Link>
  );
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div role="status" aria-label="جارٍ تحميل القناة" className="mt-6">
      <div aria-hidden="true" className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 skeleton-shimmer rounded-card motion-reduce:animate-none" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-48 max-w-full skeleton-shimmer rounded motion-reduce:animate-none" />
            <div className="h-3 w-24 skeleton-shimmer rounded motion-reduce:animate-none" />
          </div>
        </div>
        {/* Items skeleton */}
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-card border border-line bg-paper-soft p-4"
            >
              <div className="h-4 w-2/3 skeleton-shimmer rounded motion-reduce:animate-none" />
              <div className="mt-2 h-3 w-full skeleton-shimmer rounded motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== States ====================
function ErrorState({
  title = 'تعذّر تحميل الصفحة',
  error,
  onRetry,
}: {
  title?: string;
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
        <p className="text-sm font-bold text-coral-ink">{title}</p>
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

function NotFoundState({ reason }: { reason: NotFound['reason'] }) {
  const isInvalid = reason === 'invalid-id';
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
        {isInvalid ? 'رابط القناة غير صالح.' : 'لم نجد هذه القناة.'}
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        {isInvalid
          ? 'تأكد من الرابط، أو ارجع إلى قائمة القنوات.'
          : 'قد تكون حُذفت أو الرابط خاطئ.'}
      </p>
      <Link
        href="/channels"
        className="mt-5 inline-flex h-10 items-center rounded-field bg-teal px-4 text-sm font-semibold text-on-teal transition-colors hover:bg-teal-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
      >
        العودة إلى القنوات
      </Link>
    </div>
  );
}

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
        <IconInbox className="h-8 w-8" />
      </div>
      <p className="mt-4 font-bold text-ink-soft">
        لا يوجد محتوى مضاف لهذه القناة حالياً.
      </p>
      <p className="mt-1 text-sm text-ink-muted">يرجى العودة لاحقاً</p>
    </div>
  );
}

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

// ==================== File Links ====================
function FileLinks({ files }: { files: FileEntry[] }) {
  const valid = useMemo(
    () =>
      files
        .map((f, i) => ({
          url: toSafeUrl(f.url),
          label: f.label?.trim() || '',
          idx: i,
        }))
        .filter(
          (f): f is { url: string; label: string; idx: number } => !!f.url,
        ),
    [files],
  );

  if (valid.length === 0) return null;

  const showNumbers = valid.length > 1;

  return (
    <ul role="list" className="mt-3 flex flex-wrap gap-2">
      {valid.map((f) => (
        <li key={f.url + f.idx} className="min-w-0 max-w-full">
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 rounded-field border border-teal/20 bg-teal-tint px-3 py-2 text-xs font-semibold text-teal transition-colors hover:border-teal/40 hover:bg-teal-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
          >
            <IconExternal
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0"
            />
            <span className="min-w-0 break-anywhere">
              {f.label || (showNumbers ? `ملف ${f.idx + 1}` : 'فتح الملف')}
            </span>
            <span className="sr-only"> (يفتح في تبويب جديد)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

// ==================== Content Item ====================
function ContentItem({
  item,
  showType = false,
}: {
  item: ContentRow;
  showType?: boolean;
}) {
  const dueInfo = getDueInfo(item.due_date);
  const description = item.description?.trim() ?? '';
  // file_urls قد تأتي null من القاعدة فكانت الصفحة تنهار
  const files: FileEntry[] = Array.isArray(item.file_urls)
    ? item.file_urls
    : [];

  return (
    <li className="min-w-0 defer-item rounded-card border border-line bg-paper-soft p-4 transition-colors duration-300 hover:border-teal/30 motion-reduce:transition-none">
      {/* العنصر المثبّت يفقد مجموعته، فنكتب نوعه فوقه */}
      {showType && (
        <span className="mb-2 inline-flex rounded-chip bg-teal-tint px-2 py-0.5 text-[11px] font-semibold text-teal">
          {getTypeLabel(item.content_type)}
        </span>
      )}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 break-anywhere font-bold text-ink">
          {item.title}
        </p>
        {dueInfo && (
          <span
            className={`shrink-0 rounded-chip px-2.5 py-0.5 text-xs font-semibold ${dueBadgeClass(
              dueInfo.kind,
            )}`}
          >
            {dueInfo.text}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1.5 break-anywhere whitespace-pre-line text-sm leading-relaxed text-ink-soft">
          {description}
        </p>
      )}

      <FileLinks files={files} />
    </li>
  );
}

function ItemList({
  items,
  showType = false,
}: {
  items: ContentRow[];
  showType?: boolean;
}) {
  return (
    <ul role="list" className="space-y-2">
      {items.map((item) => (
        <ContentItem key={item.id} item={item} showType={showType} />
      ))}
    </ul>
  );
}

// ==================== Header ====================
function ChannelHeader({ channel }: { channel: ChannelInfo }) {
  const [imageFailed, setImageFailed] = useState(false);
  const safeImage = toSafeUrl(channel.image_url);
  const safeTelegram = toSafeUrl(channel.telegram_link);
  const description = channel.description?.trim() ?? '';

  return (
    <header className="mt-6 animate-slide-up motion-reduce:animate-none">
      <div className="flex items-center gap-4">
        {safeImage && !imageFailed ? (
          <Image
            src={safeImage}
            alt=""
            width={80}
            height={80}
            priority
            onError={() => setImageFailed(true)}
            className="h-20 w-20 shrink-0 rounded-card border border-line object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-card bg-teal text-2xl font-bold text-on-teal"
          >
            {getInitials(channel.name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1
            id="channel-title"
            className="break-anywhere font-display text-2xl font-bold leading-tight text-ink sm:text-3xl"
          >
            {channel.name}
          </h1>
          {channel.stage && (
            <span className="stage-badge mt-2 inline-flex">
              {channel.stage}
            </span>
          )}
        </div>
      </div>

      {description && (
        <p className="mt-4 break-anywhere whitespace-pre-line text-sm leading-relaxed text-ink-soft sm:text-base">
          {description}
        </p>
      )}

      {safeTelegram && (
        <a
          href={safeTelegram}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-field bg-teal px-5 text-sm font-semibold text-on-teal transition-colors hover:bg-teal-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
        >
          <IconTelegram aria-hidden="true" className="h-4 w-4" />
          فتح القناة على تلغرام
          <span className="sr-only"> (يفتح في تبويب جديد)</span>
        </a>
      )}
    </header>
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

  // بعد المسح نرجع المؤشر لحقل البحث
  function clearAndFocus() {
    onClear();
    inputRef.current?.focus();
  }

  return (
    <div className="mt-6 animate-slide-up motion-reduce:animate-none">
      <label htmlFor="channel-content-search" className="sr-only">
        ابحث في محتوى القناة
      </label>

      <div className="relative">
        <IconSearch
          aria-hidden="true"
          className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        />
        <input
          ref={inputRef}
          id="channel-content-search"
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
          placeholder="ابحث بالعنوان أو الوصف أو اسم المجلد..."
          maxLength={100}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby="channel-content-search-status"
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
        id="channel-content-search-status"
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

// ==================== Pinned Section ====================
function PinnedSection({ items }: { items: ContentRow[] }) {
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="pinned-heading"
      className="mt-8 animate-slide-up motion-reduce:animate-none"
    >
      <h2
        id="pinned-heading"
        className="mb-3 flex items-center gap-2 border-b-2 border-teal/20 pb-2 font-display text-lg font-bold text-teal"
      >
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full bg-teal"
        />
        مثبّت
      </h2>
      <ItemList items={items} showType />
    </section>
  );
}

// ==================== Content Group Section ====================
function ContentGroupSection({ group }: { group: ContentGroup }) {
  if (group.total === 0) return null;

  const headingId = `group-${group.key}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className="mt-8 animate-slide-up motion-reduce:animate-none"
    >
      <h2
        id={headingId}
        className="mb-3 flex items-baseline gap-2 border-b border-line pb-2 font-display text-lg font-bold text-ink"
      >
        {group.label}
        <span className="num-inline font-mono text-xs font-normal text-ink-muted">
          {group.total}
        </span>
      </h2>

      {group.noFolderItems.length > 0 && (
        <ItemList items={group.noFolderItems} />
      )}

      {group.folders.map((f) => (
        <div key={f.folder} className="mt-4">
          <h3 className="mb-2 flex items-center gap-1.5 break-anywhere text-sm font-bold text-ink-soft">
            <IconFolder
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-gold"
            />
            {f.folder}
          </h3>
          <ItemList items={f.items} />
        </div>
      ))}
    </section>
  );
}

// ==================== Page ====================
export default function ChannelPage() {
  const params = useParams();

  const channelId = useMemo<string>(() => {
    const raw = params?.id;
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
      return raw[0];
    }
    return '';
  }, [params]);

  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [items, setItems] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<LoadError | null>(null);
  const [contentError, setContentError] = useState<LoadError | null>(null);
  const [notFound, setNotFound] = useState<NotFound | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const deferredSearch = useDeferredValue(searchTerm);
  const isStale = searchTerm !== deferredSearch;

  // ==================== Load data ====================
  useEffect(() => {
    if (!channelId) {
      setLoading(false);
      setNotFound({ reason: 'invalid-id' });
      setChannel(null);
      setItems([]);
      setError(null);
      setContentError(null);
      return;
    }

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      setContentError(null);
      setNotFound(null);

      try {
        const [channelRes, itemsRes] = await Promise.all([
          supabase
            .from('channels')
            .select('id, name, description, telegram_link, image_url, stage')
            .eq('id', channelId)
            .maybeSingle(),
          supabase
            .from('channel_content')
            .select(
              'id, title, description, file_urls, due_date, pinned, content_type, folder',
            )
            .eq('channel_id', channelId)
            .order('created_at', { ascending: false }),
        ]);

        if (cancelled) return;

        if (channelRes.error) {
          // معرّف بصيغة خاطئة (مثل /channels/abc) = رابط غير صالح، وليس "خطأ اتصال"
          if (channelRes.error.code === INVALID_TEXT_CODE) {
            setNotFound({ reason: 'invalid-id' });
          } else {
            setError(buildError(channelRes.error.message, 'channel'));
          }
          setChannel(null);
          setItems([]);
          return;
        }

        if (!channelRes.data) {
          setNotFound({ reason: 'missing' });
          setChannel(null);
          setItems([]);
          return;
        }

        setChannel(channelRes.data as ChannelInfo);

        if (itemsRes.error) {
          setContentError(buildError(itemsRes.error.message, 'content'));
          setItems([]);
        } else {
          setItems((itemsRes.data ?? []) as ContentRow[]);
        }

        trackChannelView(channelId);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(buildError(e instanceof Error ? e.message : '', 'channel'));
        setChannel(null);
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [channelId, reloadKey]);

  // إعادة محاولة تلقائية عند رجوع الإنترنت
  useEffect(() => {
    if (!error && !contentError) return;
    function onOnline() {
      setReloadKey((k) => k + 1);
    }
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [error, contentError]);

  // عنوان التبويب باسم القناة
  const channelName = channel?.name;
  useEffect(() => {
    if (channelName) document.title = `${channelName} — لوازم`;
  }, [channelName]);

  const handleRetry = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // ==================== Filter ====================
  // البحث يشمل اسم المجلد أيضاً
  const indexed = useMemo<IndexedItem[]>(
    () =>
      items.map((item) => ({
        item,
        haystack: normalizeArabic(
          `${item.title} ${item.description ?? ''} ${item.folder ?? ''}`,
        ),
      })),
    [items],
  );

  const term = useMemo(() => normalizeArabic(deferredSearch), [deferredSearch]);

  const filteredItems = useMemo(() => {
    if (!term) return items;
    return indexed
      .filter((x) => x.haystack.includes(term))
      .map((x) => x.item);
  }, [items, indexed, term]);

  const pinnedItems = useMemo(
    () => filteredItems.filter((i) => i.pinned),
    [filteredItems],
  );

  const groups = useMemo<ContentGroup[]>(() => {
    const unpinned = filteredItems.filter((i) => !i.pinned);
    const knownTypes = new Set<string>(CONTENT_TYPES);

    const buildGroup = (
      key: string,
      label: string,
      list: ContentRow[],
    ): ContentGroup => {
      const folderNames = Array.from(
        new Set(
          list
            .map((i) => i.folder?.trim())
            .filter((f): f is string => !!f),
        ),
      );
      return {
        key,
        label,
        folders: folderNames.map((folder) => ({
          folder,
          items: list.filter((i) => i.folder?.trim() === folder),
        })),
        noFolderItems: list.filter((i) => !i.folder?.trim()),
        total: list.length,
      };
    };

    const result = CONTENT_TYPES.map((type) =>
      buildGroup(
        type,
        CONTENT_TYPE_LABELS[type],
        unpinned.filter((i) => i.content_type === type),
      ),
    );

    // عنصر نوعه غير معروف كان يختفي بصمت. الآن يظهر تحت "أخرى"
    const others = unpinned.filter((i) => !knownTypes.has(i.content_type));
    if (others.length > 0) {
      result.push(buildGroup('other', 'أخرى', others));
    }

    return result;
  }, [filteredItems]);

  // ==================== Invalid ID / Not Found / Loading ====================
  if (notFound) {
    return (
      <main className={MAIN_CLASS} aria-labelledby="channel-error-heading">
        <BackLink />
        <h1 id="channel-error-heading" className="sr-only">
          خطأ في القناة
        </h1>
        <NotFoundState reason={notFound.reason} />
      </main>
    );
  }

  if (loading) {
    return (
      <main className={MAIN_CLASS} aria-busy="true">
        <BackLink />
        <Skeleton />
      </main>
    );
  }

  if (error || !channel) {
    return (
      <main className={MAIN_CLASS} aria-labelledby="channel-error-heading">
        <BackLink />
        <h1 id="channel-error-heading" className="sr-only">
          خطأ في القناة
        </h1>
        <ErrorState
          error={error ?? buildError('', 'channel')}
          onRetry={handleRetry}
        />
      </main>
    );
  }

  const hasItems = items.length > 0;
  const hasResults = filteredItems.length > 0;
  const visibleGroups = groups.filter((g) => g.total > 0);

  return (
    <main className={MAIN_CLASS} aria-labelledby="channel-title">
      <BackLink />

      <ChannelHeader key={channel.id} channel={channel} />

      {contentError && (
        <ErrorState
          title="تعذّر تحميل محتوى القناة"
          error={contentError}
          onRetry={handleRetry}
        />
      )}

      {!contentError && hasItems && (
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          onClear={handleClearSearch}
          resultCount={filteredItems.length}
          totalCount={items.length}
        />
      )}

      <div aria-busy={isStale} className="mt-2">
        {hasItems && !hasResults && (
          <NoResults
            query={deferredSearch.trim()}
            onClear={handleClearSearch}
          />
        )}

        {hasItems && hasResults && (
          <div
            className={`transition-opacity duration-150 motion-reduce:transition-none ${
              isStale ? 'opacity-60' : 'opacity-100'
            }`}
          >
            <PinnedSection items={pinnedItems} />
            {visibleGroups.map((group) => (
              <ContentGroupSection key={group.key} group={group} />
            ))}
          </div>
        )}

        {!contentError && !hasItems && <EmptyState />}
      </div>
    </main>
  );
}