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

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.id as string;

  const [channel, setChannel] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const channelRes = await supabase.from('channels').select('id, name, description, telegram_link, image_url, subjects(name)').eq('id', channelId).single();
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

  const groups = ['assignment', 'lecture_note', 'summary', 'task'].map((type) => ({
    type,
    label: typeLabels[type],
    items: items.filter((i: any) => i.content_type === type),
  }));

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
          <p className="font-mono text-xs uppercase tracking-widest text-teal">{channel.subjects?.name}</p>
        </div>
      </div>

      {channel.description && <p className="mt-4 text-ink/70">{channel.description}</p>}

      <a href={channel.telegram_link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded-lg bg-teal px-5 py-2.5 text-sm font-bold text-white hover:bg-teal/90">فتح القناة بتليجرام</a>

      {groups.map((group) => (
        group.items.length > 0 && (
          <section key={group.type} className="mt-8">
            <h2 className="mb-3 border-b border-line pb-2 text-lg font-extrabold">{group.label}</h2>
            <div className="space-y-2">
              {group.items.map((item: any) => {
                const dueInfo = item.due_date ? getDueInfo(item.due_date) : null;
                return (
                  <div key={item.id} className="rounded-lg border border-line bg-white/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold">{item.title}</span>
                      {dueInfo && <span className={`rounded-full px-3 py-1 text-xs font-bold ${dueInfo.className}`}>{dueInfo.text}</span>}
                    </div>
                    {item.description && <p className="mt-1 text-sm text-ink/60">{item.description}</p>}
                    {item.file_url && <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-teal underline">فتح الرابط</a>}
                  </div>
                );
              })}
            </div>
          </section>
        )
      ))}

      {items.length === 0 && <p className="mt-8 text-ink/50">ما فيه محتوى مضاف لهذي القناة لسا.</p>}
    </main>
  );
}