// app/g/[slug]/join/[code]/page.tsx
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { groupsFetch, getToken } from '@/lib/groups/client';
import type { PublicGroup } from '@/lib/types/groups';

export default function JoinByCodePage({ params }: { params: Promise<{ slug: string, code: string }> }) {
  const { slug, code } = use(params);
  const router = useRouter();
  
  const [group, setGroup] = useState<PublicGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!getToken()) {
      // إذا لم يسجل، نوجهه للتسجيل ثم يعود لهذه الصفحة
      router.replace(`/g/${slug}/register?next=/g/${slug}/join/${code}`);
      return;
    }
    fetchGroup();
  }, [slug, code, router]);

  async function fetchGroup() {
    try {
      const data = await groupsFetch<{ group: PublicGroup }>('/api/groups/by-code', { code });
      setGroup(data.group);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'فشل جلب الكروب' });
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!group) return;
    setJoining(true);
    try {
      await groupsFetch('/api/groups/join-request', { group_id: group.id });
      setMsg({ type: 'success', text: 'تم إرسال طلب الانضمام بنجاح! بانتظار موافقة القائد.' });
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'فشل الطلب' });
    } finally {
      setJoining(false);
    }
  }

  if (loading) return <div className="py-20 text-center text-ink-muted">جارٍ التحميل...</div>;

  if (msg.type === 'error' && !group) {
    return (
      <div className="mx-auto max-w-md text-center py-20">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-ink mb-2">الكروب غير موجود</h2>
        <p className="text-ink-soft mb-6">{msg.text}</p>
        <button onClick={() => router.push(`/g/${slug}`)} className="rounded-lg bg-teal px-6 py-2 text-white font-bold">العودة للرئيسية</button>
      </div>
    );
  }

  if (!group) return null;

  const isFull = group.spots_left === 0;

  return (
    <div className="mx-auto max-w-md mt-10">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm text-center">
        <div className="text-sm font-bold text-teal mb-2">دعوة للانضمام</div>
        <h1 className="text-2xl font-bold text-ink mb-1">{group.name || `كروب #${group.serial}`}</h1>
        <p className="text-sm text-ink-soft">القائد: {group.leader_name}</p>

        <div className="my-6 grid grid-cols-3 gap-2 rounded-xl bg-paper-soft p-4">
          <div>
            <div className="text-xl font-bold text-ink">{group.male_count + group.female_count}/{group.target_size}</div>
            <div className="text-[10px] text-ink-muted">الأعضاء</div>
          </div>
          <div>
            <div className="text-xl font-bold text-teal">👨 {group.male_count}</div>
            <div className="text-[10px] text-ink-muted">ذكور</div>
          </div>
          <div>
            <div className="text-xl font-bold text-gold-ink">👩 {group.female_count}</div>
            <div className="text-[10px] text-ink-muted">إناث</div>
          </div>
        </div>

        {msg.text && (
          <div className={`mb-4 rounded-lg p-3 text-sm font-semibold ${msg.type === 'success' ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-600'}`}>
            {msg.text}
          </div>
        )}

        {msg.type === 'success' ? (
          <button onClick={() => router.push(`/g/${slug}`)} className="w-full rounded-lg border border-teal text-teal py-3 font-bold hover:bg-teal/5">
            العودة للرئيسية
          </button>
        ) : isFull ? (
          <div className="rounded-lg bg-ink/5 p-3 text-sm font-bold text-ink-muted">عذراً، هذا الكروب مكتمل العدد.</div>
        ) : (
          <button onClick={handleJoin} disabled={joining} className="w-full rounded-lg bg-teal py-3 font-bold text-white transition hover:bg-teal/90 disabled:opacity-50">
            {joining ? 'جارٍ الإرسال...' : 'طلب انضمام للكروب'}
          </button>
        )}
      </div>
    </div>
  );
}