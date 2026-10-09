// app/admin/_components/AnnouncementsSection.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { postJson } from '@/lib/api-client';
import { STAGES } from '@/lib/constants';
import type { Stage } from '@/lib/types';

interface Props {
  password: string;
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
  reviewed_by: string | null;
  reviewed_note: string | null;
  sent_at: string | null;
  sent_count: number;
  sent_error: string | null;
}

type Tab = 'pending' | 'history';
type Role = 'super_admin' | 'admin' | 'publisher';

// ==================== Icons ====================
function IconMegaphone() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l18-8v18l-18-8v-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l18-8-8 18-2-8-8-2z" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M5.618 4.618A2 2 0 017 4h10a2 2 0 011.382.618l.618.618A2 2 0 0120 6.618V12a8 8 0 11-16 0V6.618a2 2 0 011-1.236l.618-.764z" />
    </svg>
  );
}

// ==================== Helpers ====================
function formatDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('ar-IQ-u-nu-latn-ca-gregory', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function StatusBadge({ status }: { status: Announcement['status'] }) {
  const styles: Record<Announcement['status'], { label: string; cls: string }> = {
    pending: { label: 'قيد المراجعة', cls: 'bg-amber/15 text-amber-800 dark:bg-amber/25 dark:text-amber-300' },
    approved: { label: 'تمت الموافقة', cls: 'bg-teal/10 text-teal dark:bg-teal/20' },
    rejected: { label: 'مرفوض', cls: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
    sent: { label: 'أُرسل', cls: 'bg-teal text-white' },
    failed: { label: 'فشل الإرسال', cls: 'bg-red-600 text-white' },
  };
  const s = styles[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.label}</span>;
}

// ==================== Role Badge ====================
function RoleBadge({ role }: { role: Role | null }) {
  if (role === 'super_admin') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold-tint px-2.5 py-0.5 text-[11px] font-bold text-gold-ink">
        <IconShield />
        مشرف أعلى — يمكنك الموافقة على التبليغات
      </span>
    );
  }
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal-tint px-2.5 py-0.5 text-[11px] font-bold text-teal">
        مشرف — التبليغات تُرسل للمشرف الأعلى للموافقة
      </span>
    );
  }
  return null;
}

// ==================== Edit Form ====================
interface EditFormState {
  title: string;
  body: string;
  stage: Stage | '';
  link_url: string;
  link_label: string;
}

function formFromAnnouncement(a: Announcement): EditFormState {
  return {
    title: a.title,
    body: a.body,
    stage: (a.stage as Stage | null) ?? '',
    link_url: a.link_url ?? '',
    link_label: a.link_label ?? '',
  };
}

// ==================== Card ====================
function AnnouncementCard({
  item,
  password,
  role,
  onChanged,
}: {
  item: Announcement;
  password: string;
  role: Role | null;
  onChanged: () => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditFormState>(formFromAnnouncement(item));
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);

  const isPending = item.status === 'pending';
  const canApprove = role === 'super_admin';
  const canEdit = role === 'super_admin';
  const canDelete = role === 'super_admin';

  async function handleApprove() {
    const ok = await confirm(
      'سيتم إرسال التبليغ لكل المشتركين المُفعّلين. هل أنت متأكد؟',
      { variant: 'primary', confirmLabel: 'إرسال الآن' }
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await postJson<{ sent: number; failed: number }>(
        '/api/admin/announcements',
        { password, action: 'approve', id: item.id }
      );
      toast.show(
        `تم الإرسال لـ ${res.sent} مشترك${res.failed > 0 ? ` (فشل: ${res.failed})` : ''}`,
        'success'
      );
      onChanged();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الإرسال', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    try {
      await postJson('/api/admin/announcements', {
        password, action: 'reject', id: item.id,
        note: rejectNote.trim() || null,
      });
      toast.show('تم الرفض', 'success');
      onChanged();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الرفض', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit() {
    if (!form.title.trim() || !form.body.trim()) {
      toast.show('العنوان والنص مطلوبان', 'error');
      return;
    }
    setBusy(true);
    try {
      await postJson('/api/admin/announcements', {
        password, action: 'edit', id: item.id,
        title: form.title.trim(),
        body: form.body.trim(),
        stage: form.stage || null,
        link_url: form.link_url.trim() || null,
        link_label: form.link_label.trim() || null,
      });
      toast.show('تم التعديل', 'success');
      setEditing(false);
      onChanged();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل التعديل', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm('حذف التبليغ نهائياً. هل أنت متأكد؟', {
      variant: 'danger', confirmLabel: 'حذف',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await postJson('/api/admin/announcements', {
        password, action: 'delete', id: item.id,
      });
      toast.show('تم الحذف', 'success');
      onChanged();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحذف', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    const ok = await confirm('إعادة إرسال التبليغ لكل المشتركين؟', {
      variant: 'primary', confirmLabel: 'إعادة الإرسال',
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await postJson<{ sent: number; failed: number }>(
        '/api/admin/announcements',
        { password, action: 'resend', id: item.id }
      );
      toast.show(`أُعيد الإرسال لـ ${res.sent} مشترك`, 'success');
      onChanged();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الإعادة', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm dark:bg-paper/80">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={item.status} />
        {item.stage ? (
          <span className="rounded-full bg-teal/8 px-2 py-0.5 text-[11px] font-bold text-teal/80 dark:bg-teal/15">
            {item.stage}
          </span>
        ) : (
          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-bold text-ink/60 dark:bg-white/10">
            كل المراحل
          </span>
        )}
        <span className="text-[11px] text-ink/40">
          بواسطة {item.created_by} — {formatDate(item.created_at)}
        </span>
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          <Input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={200}
            placeholder="العنوان"
          />
          <Select
            value={form.stage}
            onChange={(e) => setForm({ ...form, stage: e.target.value as Stage | '' })}
            aria-label="المرحلة"
          >
            <option value="">كل المراحل</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={4}
            maxLength={2000}
            placeholder="نص التبليغ"
          />
          <div className="flex flex-wrap gap-2">
            <Input
              type="url"
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="رابط (اختياري)"
              maxLength={1000}
              className="min-w-0 flex-1 basis-full sm:basis-auto"
            />
            <Input
              type="text"
              value={form.link_label}
              onChange={(e) => setForm({ ...form, link_label: e.target.value })}
              placeholder="نص الزر"
              maxLength={60}
              className="w-full sm:w-40"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleSaveEdit} loading={busy}>
              حفظ التعديل
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditing(false);
                setForm(formFromAnnouncement(item));
              }}
              disabled={busy}
            >
              إلغاء
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="mt-2 break-anywhere font-bold text-ink">{item.title}</h3>
          <p className="mt-1 whitespace-pre-line break-anywhere text-sm leading-relaxed text-ink/70">
            {item.body}
          </p>

          {item.link_url && (
            <a
              href={item.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 break-anywhere text-xs font-bold text-teal hover:underline"
            >
              🔗 {item.link_label || item.link_url}
            </a>
          )}

          {item.reviewed_note && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <span className="font-bold">سبب الرفض: </span>
              {item.reviewed_note}
            </p>
          )}

          {item.status === 'sent' && (
            <p className="mt-2 text-xs font-bold text-teal">
              ✅ أُرسل لـ {item.sent_count} مشترك
              {item.sent_error && ` (${item.sent_error})`}
            </p>
          )}

          {item.status === 'failed' && item.sent_error && (
            <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400">
              ❌ {item.sent_error}
            </p>
          )}
        </>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {isPending && !editing && (
          <>
            {canApprove && (
              <Button size="sm" onClick={handleApprove} loading={busy} icon={<IconSend />}>
                موافقة وإرسال
              </Button>
            )}
            {canEdit && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditing(true)}
                disabled={busy}
                icon={<IconEdit />}
              >
                تعديل
              </Button>
            )}
            {canApprove && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => setShowReject(true)}
                disabled={busy}
                icon={<IconClose />}
              >
                رفض
              </Button>
            )}
            {canDelete && (
              <Button size="sm" variant="ghost" onClick={handleDelete} disabled={busy} icon={<IconTrash />}>
                حذف
              </Button>
            )}
            {!canApprove && (
              <p className="self-center text-[11px] text-ink/50">
                ⏳ بانتظار موافقة المشرف الأعلى
              </p>
            )}
          </>
        )}

        {item.status === 'failed' && !editing && canApprove && (
          <>
            <Button size="sm" onClick={handleResend} loading={busy} icon={<IconSend />}>
              إعادة الإرسال
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDelete} disabled={busy} icon={<IconTrash />}>
              حذف
            </Button>
          </>
        )}

        {(item.status === 'sent' || item.status === 'rejected') && !editing && canDelete && (
          <Button size="sm" variant="ghost" onClick={handleDelete} disabled={busy} icon={<IconTrash />}>
            حذف من السجل
          </Button>
        )}
      </div>

      {/* Reject inline form */}
      {showReject && (
        <div className="mt-3 space-y-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
          <Input
            type="text"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="سبب الرفض (اختياري، يظهر للناشر)"
            maxLength={500}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="danger" onClick={handleReject} loading={busy}>
              تأكيد الرفض
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setShowReject(false);
                setRejectNote('');
              }}
              disabled={busy}
            >
              إلغاء
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Main Section ====================
export function AnnouncementsSection({ password }: Props) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('pending');
  const [role, setRole] = useState<Role | null>(null);
  const [pending, setPending] = useState<Announcement[]>([]);
  const [history, setHistory] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const whoamiRes = await postJson<{ role: Role }>('/api/admin/announcements', {
        password, action: 'whoami',
      });
      setRole(whoamiRes.role);

      const [pRes, hRes] = await Promise.all([
        postJson<{ items: Announcement[] }>('/api/admin/announcements', {
          password, action: 'list_pending',
        }),
        postJson<{ items: Announcement[] }>('/api/admin/announcements', {
          password, action: 'list_history',
        }),
      ]);
      setPending(pRes.items ?? []);
      setHistory(hRes.items ?? []);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل التحميل', 'error');
    } finally {
      setLoading(false);
    }
  }, [password, toast]);

  useEffect(() => { load(); }, [load]);

  return (
    <section>
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-teal/20 bg-teal/[0.04] p-4 text-sm dark:border-teal/30 dark:bg-teal/10">
        <span className="text-teal"><IconMegaphone /></span>
        <div className="min-w-0">
          <p className="font-bold text-ink">تبليغات البوت</p>
          <p className="mt-0.5 text-ink/70">
            راجع التبليغات الواردة. الموافقة والإرسال تحتاج صلاحية المشرف الأعلى
            (<code className="break-anywhere rounded bg-ink/5 px-1 font-mono text-[11px]">SUPER_ADMIN_PASSWORD</code>).
          </p>
        </div>
      </div>

      {role && (
        <div className="mb-4">
          <RoleBadge role={role} />
        </div>
      )}

      <div className="scrollbar-none mb-4 -mx-4 flex gap-1 overflow-x-auto rounded-xl border border-line bg-white/60 p-1 sm:mx-0 dark:bg-white/[0.04]">
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === 'pending' ? 'bg-teal text-white' : 'text-ink/60 hover:bg-ink/5'
          }`}
        >
          <span className="whitespace-nowrap">قيد المراجعة</span>
          {pending.length > 0 && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 font-mono text-[10px]">
              {pending.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === 'history' ? 'bg-teal text-white' : 'text-ink/60 hover:bg-ink/5'
          }`}
        >
          <span className="whitespace-nowrap">السجل</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-32 skeleton-shimmer rounded-2xl" />)}
        </div>
      ) : tab === 'pending' ? (
        pending.length === 0 ? (
          <div className="rounded-3xl border border-line bg-white/80 p-12 text-center dark:bg-paper/80">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/8 text-teal">
              <IconCheck />
            </div>
            <p className="mt-4 font-bold text-ink/70">لا توجد تبليغات بانتظار المراجعة</p>
            <p className="mt-1 text-sm text-ink/50">كل شيء تحت السيطرة ✨</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((a) => (
              <AnnouncementCard key={a.id} item={a} password={password} role={role} onChanged={load} />
            ))}
          </div>
        )
      ) : history.length === 0 ? (
        <div className="rounded-3xl border border-line bg-white/80 p-12 text-center dark:bg-paper/80">
          <p className="font-bold text-ink/70">لا يوجد سجل بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((a) => (
            <AnnouncementCard key={a.id} item={a} password={password} role={role} onChanged={load} />
          ))}
        </div>
      )}
    </section>
  );
}