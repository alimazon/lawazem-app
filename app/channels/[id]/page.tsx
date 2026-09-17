// app/channels/[id]/page.tsx
'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/Field';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS } from '@/lib/constants';
import type { Channel, ChannelContent, ContentType, FileEntry } from '@/lib/types';

type ChannelInfo = Pick<Channel, 'id' | 'name' | 'description' | 'telegram_link' | 'image_url' | 'stage'>;

interface ContentGroup {
  type: ContentType;
  label: string;
  folders: Array<{ folder: string; items: ChannelContent[] }>;
  noFolderItems: ChannelContent[];
  total: number;
}

// ==================== Icons ====================
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconFolder() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
function IconPin({ className = '' }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 flex-shrink-0 ${className}`} fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 4.5v6.75L6 15v1.5h12V15l-3-3.75V4.5M12 16.5V21" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
function IconTelegram() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

// ==================== Due Date ====================
interface DueInfo { text: string; className: string }
function getDueInfo(dueDateStr: string): DueInfo {
  const due = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (Number.isNaN(diffDays)) return { text: `تسليم: ${dueDateStr}`, className: 'bg-amber/20 text-amber-800 dark:bg-amber/25 dark:text-amber-300' };
  if (diffDays < 0) return { text: 'انتهى الموعد', className: 'bg-ink/10 text-ink/50' };
  if (diffDays === 0) return { text: 'التسليم اليوم!', className: 'bg-red-100 text-red-700 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900/50' };
  if (diffDays <= 3) return { text: `تسليم: ${dueDateStr} (بعد ${diffDays} يوم)`, className: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' };
  return { text: `تسليم: ${dueDateStr}`, className: 'bg-amber/20 text-amber-800 dark:bg-amber/25 dark:text-amber-300' };
}

// ==================== File Links ====================
function FileLinks({ files }: { files: FileEntry[] }) {
  if (!files || files.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {files.map((f, i) => (
        <a
          key={i}
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal/20 bg-teal/5 px-3 py-1.5 text-xs font-bold text-teal transition-all duration-200 hover:border-teal/40 hover:bg-teal/10 active:scale-95 dark:border-teal/30 dark:bg-teal/10 dark:hover:bg-teal/15"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {f.label || (files.length > 1 ? `ملف ${i + 1}` : 'فتح الملف')}
        </a>
      ))}
    </div>
  );
}

// ==================== Content Item ====================
function ContentItem({ item }: { item: ChannelContent }) {
  const dueInfo = item.due_date ? getDueInfo(item.due_date) : null;
  return (
    <div className="group rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-300 hover:border-teal/20 hover:shadow-[0_4px_16px_rgba(14,74,74,0.06)] dark:bg-paper/80 dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.30)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold text-ink">{item.title}</span>
        {dueInfo && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${dueInfo.className}`}>
            {dueInfo.text}
          </span>
        )}
      </div>
      {item.description && <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{item.description}</p>}
      <FileLinks files={item.file_urls} />
    </div>
  );
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 skeleton-shimmer rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-48 skeleton-shimmer rounded" />
          <div className="h-3 w-24 skeleton-shimmer rounded" />
        </div>
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-line bg-white/80 p-4 dark:bg-paper/80">
            <div className="h-4 w-2/3 skeleton-shimmer rounded" />
            <div className="mt-2 h-3 w-full skeleton-shimmer rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-3xl border border-line bg-white/80 p-10 text-center text-sm font-medium text-ink/60 backdrop-blur-sm animate-slide-up dark:bg-paper/80">
      {children}
    </div>
  );
}

// ==================== Page ====================
export default function ChannelPage() {
  const params = useParams();
  const channelId = (params?.id as string) ?? '';

  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [items, setItems] = useState<ChannelContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const deferredSearch = useDeferredValue(searchTerm);
  const term = deferredSearch.trim().toLowerCase();

  useEffect(() => {
    if (!channelId) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');

      const [channelRes, itemsRes] = await Promise.all([
        supabase
          .from('channels')
          .select('id, name, description, telegram_link, image_url, stage')
          .eq('id', channelId)
          .maybeSingle(),
        supabase
          .from('channel_content')
          .select('*')
          .eq('channel_id', channelId)
          .order('created_at', { ascending: false }),
      ]);

      if (cancelled) return;

      if (channelRes.error || !channelRes.data) {
        setError('لم نجد هذه القناة.');
        setLoading(false);
        return;
      }

      setChannel(channelRes.data as ChannelInfo);
      setItems((itemsRes.data ?? []) as ChannelContent[]);
      setLoading(false);

      const viewKey = `viewed_channel_${channelId}`;
      if (!sessionStorage.getItem(viewKey)) {
        sessionStorage.setItem(viewKey, '1');
        fetch('/api/channel/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel_id: channelId }),
        }).catch(() => {});
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [channelId]);

  const filteredItems = useMemo(() => {
    if (!term) return items;
    return items.filter((i) => i.title.toLowerCase().includes(term));
  }, [items, term]);

  const pinnedItems = useMemo(() => filteredItems.filter((i) => i.pinned), [filteredItems]);

  const groups: ContentGroup[] = useMemo(() => {
    const unpinned = filteredItems.filter((i) => !i.pinned);
    return CONTENT_TYPES.map((type) => {
      const typeItems = unpinned.filter((i) => i.content_type === type);
      const folderNames = Array.from(new Set(typeItems.filter((i) => i.folder).map((i) => i.folder as string)));
      return {
        type,
        label: CONTENT_TYPE_LABELS[type],
        folders: folderNames.map((folder) => ({
          folder,
          items: typeItems.filter((i) => i.folder === folder),
        })),
        noFolderItems: typeItems.filter((i) => !i.folder),
        total: typeItems.length,
      };
    });
  }, [filteredItems]);

  if (!channelId || (!loading && error)) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link href="/channels" className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal">
          <span className="transition-transform duration-200 group-hover:translate-x-1"><IconArrowLeft /></span>
          رجوع إلى القنوات
        </Link>
        <h1 className="mt-6 text-2xl font-extrabold text-ink">{error || 'لم نجد هذه القناة.'}</h1>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton />
      </main>
    );
  }

  if (!channel) return null;

  const hasItems = items.length > 0;
  const hasResults = filteredItems.length > 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/channels" className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal">
        <span className="transition-transform duration-200 group-hover:translate-x-1"><IconArrowLeft /></span>
        رجوع إلى القنوات
      </Link>

      {/* Header */}
      <div className="mt-6 flex items-center gap-4 animate-slide-up">
        {channel.image_url ? (
          <img
            src={channel.image_url}
            alt={channel.name}
            className="h-20 w-20 flex-shrink-0 rounded-2xl border border-line/60 object-cover shadow-[0_4px_14px_rgba(26,33,31,0.10)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.40)]"
          />
        ) : (
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal to-teal-light text-2xl font-black text-white shadow-[0_4px_14px_rgba(14,74,74,0.24)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.40)]">
            {channel.name.trim().slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black text-ink sm:text-3xl">{channel.name}</h1>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-2.5 py-0.5 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
            {channel.stage}
          </span>
        </div>
      </div>

      {channel.description && (
        <p className="mt-4 leading-relaxed text-ink/70 animate-slide-up" style={{ animationDelay: '80ms' }}>
          {channel.description}
        </p>
      )}

      <a
        href={channel.telegram_link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-bold text-white shadow-[0_2px_10px_rgba(14,74,74,0.28)] transition-all duration-200 hover:bg-teal-light hover:shadow-[0_4px_16px_rgba(14,74,74,0.34)] active:scale-95 animate-slide-up dark:shadow-[0_2px_10px_rgba(0,0,0,0.30)]"
        style={{ animationDelay: '120ms' }}
      >
        <IconTelegram />
        فتح القناة على تلغرام
      </a>

      {/* Search */}
      {hasItems && (
        <div className="relative mt-6 animate-slide-up" style={{ animationDelay: '160ms' }}>
          <IconSearch />
          <Input
            type="text"
            placeholder="ابحث بعنوان المحتوى..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-3 pr-11 shadow-[0_2px_8px_rgba(26,33,31,0.04)]"
            aria-label="بحث في محتوى القناة"
          />
        </div>
      )}

      {/* Pinned */}
      {pinnedItems.length > 0 && (
        <section className="mt-8 animate-slide-up">
          <h2 className="mb-3 flex items-center gap-2 border-b-2 border-teal/20 pb-2 text-lg font-extrabold text-teal">
            <IconPin className="text-teal" />
            مثبّت
          </h2>
          <div className="space-y-2">
            {pinnedItems.map((item) => <ContentItem key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {/* Groups */}
      {groups.map((group) =>
        group.total > 0 && (
          <section key={group.type} className="mt-8 animate-slide-up">
            <h2 className="mb-3 border-b border-line pb-2 text-lg font-extrabold text-ink">{group.label}</h2>

            {group.noFolderItems.length > 0 && (
              <div className="space-y-2">
                {group.noFolderItems.map((item) => <ContentItem key={item.id} item={item} />)}
              </div>
            )}

            {group.folders.map((f) => (
              <div key={f.folder} className="mt-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink/70">
                  <IconFolder />
                  {f.folder}
                </h3>
                <div className="space-y-2">
                  {f.items.map((item) => <ContentItem key={item.id} item={item} />)}
                </div>
              </div>
            ))}
          </section>
        )
      )}

      {!hasItems && <EmptyState>لا يوجد محتوى مضاف لهذه القناة حالياً.</EmptyState>}
      {hasItems && !hasResults && <EmptyState>لا توجد نتائج مطابقة لبحثك &laquo;{searchTerm}&raquo;.</EmptyState>}
    </main>
  );
}