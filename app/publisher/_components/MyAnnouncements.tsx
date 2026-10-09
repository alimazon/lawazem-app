// app/publisher/_components/MyAnnouncements.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { postJson } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';

interface Props {
  password: string;
  publisherName: string;
  refreshKey: number;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  stage: string | null;
  link_url: string | null;
  link_label: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'sent' | 'failed';
  created_by: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_note: string | null;
  sent_at: string | null;
  sent_count: number;
  sent_error: string | null;
}

function StatusBadge({ status }: { status: Announcement['status'] }) {
  const styles: Record<Announcement['status'], { label: string; cls: string }> = {
    pending: {
      label: 'قيد المراجعة',
      cls: 'bg-amber/15 text-amber-800 dark:bg-amber/25 dark:text-amber-300',
    },
    approved: {
      label: 'تمت الموافقة',
      cls: 'bg-teal/10 text-teal dark:bg-teal/20',
    },
    rejected: {
      label: 'مرفوض',
      cls: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    },
    sent: {
      label: 'أُرسل',
      cls: 'bg-teal text-white',
    },
    failed: {
      label: 'فشل الإرسال',
      cls: 'bg-red-600 text-white',
    },
  };
  const s = styles[status];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ar-IQ-u-nu-latn-ca-gregory', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function MyAnnouncements({ password, publisherName, refreshKey }: Props) {
  const toast = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await postJson<{ items: Announcement[] }>(
        '/api/admin/announcements',
        { password, action: 'list_mine', created_by: publisherName }
      );
      setItems(data.items ?? []);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل التحميل', 'error');
    } finally {
      setLoading(false);
    }
  }, [password, publisherName, toast]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 skeleton-shimmer rounded-2xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-line bg-white/80 p-12 text-center dark:bg-paper/80">
        <p className="font-bold text-ink/70">لم تُرسل أي تبليغ بعد</p>
        <p className="mt-1 text-sm text-ink/50">
          اذهب لتبويب «تبليغ جديد» وابدأ
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((a) => (
        <div
          key={a.id}
          className="rounded-2xl border border-line bg-white/80 p-4 dark:bg-paper/80"
        >
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={a.status} />
            {a.stage && (
              <span className="rounded-full bg-teal/8 px-2 py-0.5 text-[11px] font-bold text-teal/80 dark:bg-teal/15">
                {a.stage}
              </span>
            )}
            <span className="text-[11px] text-ink/40">
              {formatDate(a.created_at)}
            </span>
          </div>

          <h3 className="mt-2 font-bold text-ink">{a.title}</h3>
          <p className="mt-1 whitespace-pre-line text-sm text-ink/70">
            {a.body}
          </p>

          {a.status === 'rejected' && a.reviewed_note && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <span className="font-bold">سبب الرفض: </span>
              {a.reviewed_note}
            </p>
          )}

          {a.status === 'sent' && (
            <p className="mt-2 text-xs font-bold text-teal">
              ✅ أُرسل لـ {a.sent_count} مشترك
            </p>
          )}

          {a.status === 'failed' && a.sent_error && (
            <p className="mt-2 text-xs font-bold text-red-600">
              ❌ فشل: {a.sent_error}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}