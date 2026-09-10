'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

const typeLabels: any = {
  assignment: 'واجب',
  lecture_note: 'ملزمة',
  summary: 'ملخص',
  task: 'مهمة',
};

function getDueInfo(dueDateStr: string) {
  const due = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return { text: 'انتهى الموعد', className: 'bg-ink/10 text-ink/50' };
  }
  if (diffDays <= 3) {
    return { text: `تسليم: ${dueDateStr} (قريب!)`, className: 'bg-red-100 text-red-700' };
  }
  return { text: `تسليم: ${dueDateStr}`, className: 'bg-amber/20 text-ink' };
}

function ContentItem({ item }: { item: any }) {
  const dueInfo = item.due_date ? getDueInfo(item.due_date) : null;
  return (
    <div className="rounded-lg border border-line bg-white/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold">{item.title}</span>
        {dueInfo && <span className={`rounded-full px-3 py-1 text-xs font-bold ${dueInfo.className}`}>{dueInfo.text}</span>}
      </div>
      {item.description && <p className="mt-1 text-sm text-ink/60">{item.description}</p>}
      {item.file_url && <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-teal underline">فتح الرابط</a>}
    </div>
  );
}

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.id as string;

  const [channel, setChannel] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      const channelRes = await supabase.from('channels').select('id, name, description, telegram_link, image_url, stage').eq('id', channelId).single();
      const itemsRes = await supabase.from('channel_content').select('*').eq('channel_id', channelId).order('created_at', { ascending: false });

      if (channelRes.error) {
        setError('ما لقينا هذي القناة.');
      } else {
        setChannel(channelRes.data);
        setItems(itemsRes.data || []);
      }
      setLoading(false);
    }
    loadData();
  }, [channelId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-ink/50">جاري التحميل...</p>
      </main>
    );
  }

  if (error || !channel) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-extrabold">{error || 'ما لقينا هذي القناة.'}</h1>
      </main>
    );
  }

  const term = searchTerm.trim().toLowerCase();
  const filteredItems = term ? items.filter((i: any) => i.title.toLowerCase().includes(term)) : items;

  const groups = ['assignment', 'lecture_note', 'summary', 'task'].map((type) => {
    const typeItems = filteredItems.filter((i: any) => i.content_type === type);
    const folderNames = Array.from(new Set(typeItems.filter((i: any) => i.folder).map((i: any) => i.folder)));
    const noFolderItems = typeItems.filter((i: any) => !i.folder);

    return {
      type,
      label: typeLabels[type],
      folders: folderNames.map((folder: any) => ({ folder, items: typeItems.filter((i: any) => i.folder === folder) })),
      noFolderItems,
      total: typeItems.length,
    };
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center gap-4">
        {channel.image_url ? (
          <img src={channel.image_url} alt={channel.name} className="h-16 w-16 flex-shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-teal/10 text-xl font-bold text-teal">{channel.name.slice(0, 2)}</div>
        )}
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">{channel.name}</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-teal">{channel.stage}</p>
        </div>
      </div>

      {channel.description && <p className="mt-4 text-ink/70">{channel.description}</p>}

      <a href={channel.telegram_link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded-lg bg-teal px-5 py-2.5 text-sm font-bold text-white hover:bg-teal/90">فتح القناة بتليجرام</a>

      {items.length > 0 && (
        <div className="relative mt-6">
          <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="ابحث بعنوان المحتوى..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-line bg-white px-4 py-3 pr-11 placeholder:text-ink/40 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
        </div>
      )}

      {groups.map((group) => (
        group.total > 0 && (
          <section key={group.type} className="mt-8">
            <h2 className="mb-3 border-b border-line pb-2 text-lg font-extrabold">{group.label}</h2>

            {group.noFolderItems.length > 0 && (
              <div className="space-y-2">
                {group.noFolderItems.map((item: any) => <ContentItem key={item.id} item={item} />)}
              </div>
            )}

            {group.folders.map((f: any) => (
              <div key={f.folder} className="mt-4">
                <h3 className="mb-2 text-sm font-bold text-ink/60">📁 {f.folder}</h3>
                <div className="space-y-2">
                  {f.items.map((item: any) => <ContentItem key={item.id} item={item} />)}
                </div>
              </div>
            ))}
          </section>
        )
      ))}

      {items.length === 0 && <p className="mt-8 text-ink/50">ما فيه محتوى مضاف لهذي القناة لسا.</p>}
      {items.length > 0 && filteredItems.length === 0 && <p className="mt-8 text-ink/50">لا نتائج مطابقة لبحثك.</p>}
    </main>
  );
}