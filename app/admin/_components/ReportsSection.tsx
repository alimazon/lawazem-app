// app/admin/_components/ReportsSection.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { postJson } from '@/lib/api-client';
import type { LectureNoteReport, ReportReason } from '@/lib/types';

interface Props {
  password: string;
}

// ==================== Icons ====================
function IconReport() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}
function IconDeadLink() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      <line x1="4" y1="4" x2="20" y2="20" strokeWidth={2.5} />
    </svg>
  );
}
function IconOutdated() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
function IconExternal() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconDoctor() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function IconInbox() {
  return (
    <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

// ==================== Helpers ====================
function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  if (hours < 24) return `قبل ${hours} ساعة`;
  if (days === 1) return 'أمس';
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
  return `قبل ${Math.floor(days / 30)} شهر`;
}

function getReasonLabel(reason: ReportReason): string {
  return reason === 'dead_link' ? 'الرابط لا يعمل' : 'الملزمة قديمة';
}

function getReasonStyles(reason: ReportReason): string {
  return reason === 'dead_link'
    ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
    : 'bg-amber/20 text-amber-800 dark:bg-amber/25 dark:text-amber-300';
}

// ==================== Stat Card ====================
function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: 'red' | 'amber' | 'teal';
}) {
  const styles = {
    red: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    amber: 'bg-amber/15 text-amber-800 dark:bg-amber/25 dark:text-amber-300',
    teal: 'bg-teal/8 text-teal dark:bg-teal/15 dark:text-teal',
  }[accent];

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/70 px-4 py-3 dark:bg-paper/70">
      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-mono text-lg font-black ${styles}`}>
        {value}
      </span>
      <p className="text-xs font-bold text-ink/60">{label}</p>
    </div>
  );
}

// ==================== Report Card ====================
function ReportCard({
  report,
  password,
  onResolved,
}: {
  report: LectureNoteReport;
  password: string;
  onResolved: () => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  const note = report.lecture_notes;
  const reason = report.reason;

  async function handleIgnore() {
    const ok = await confirm(
      'سيتم تجاهل هذا البلاغ فقط. هل أنت متأكد؟',
      { variant: 'primary', confirmLabel: 'تجاهل' }
    );
    if (!ok) return;

    setBusy(true);
    try {
      await postJson('/api/admin/lecture-notes', {
        password,
        action: 'report_resolve',
        id: report.id,
        resolved_action: 'ignored',
      });
      toast.show('تم تجاهل البلاغ', 'success');
      onResolved();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteNote() {
    if (!note) return;

    const ok = await confirm(
      `سيتم حذف الملزمة «${note.title}» نهائياً مع كل البلاغات المرتبطة بها. هل أنت متأكد؟`,
      { variant: 'danger', confirmLabel: 'احذف الملزمة' }
    );
    if (!ok) return;

    setBusy(true);
    try {
      // احذف الملزمة
      await postJson('/api/admin/lecture-notes', {
        password,
        action: 'delete',
        id: note.id,
      });
      // علّم كل البلاغات المرتبطة بأنها عولجت
      await postJson('/api/admin/lecture-notes', {
        password,
        action: 'reports_resolve_all_for_note',
        lecture_note_id: note.id,
        resolved_action: 'deleted',
      });
      toast.show('تم حذف الملزمة ومعالجة البلاغات', 'success');
      onResolved();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحذف', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-200 hover:border-teal/20 dark:bg-paper/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Reason badge */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${getReasonStyles(reason)}`}>
              {reason === 'dead_link' ? <IconDeadLink /> : <IconOutdated />}
              {getReasonLabel(reason)}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-ink/40">
              <IconClock />
              {formatRelativeTime(report.created_at)}
            </span>
          </div>

          {/* Note info */}
          {note ? (
            <div className="mt-3">
              <h3 className="font-bold text-ink">{note.title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink/50">
                <span className="rounded-md bg-teal/8 px-2 py-0.5 font-bold text-teal/80 dark:bg-teal/15">
                  {note.subjects?.name ?? '—'}
                </span>
                {note.professor_name && (
                  <span className="inline-flex items-center gap-1">
                    <IconDoctor />
                    د. {note.professor_name}
                  </span>
                )}
                {note.year != null && (
                  <span className="rounded-md bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink/50 dark:bg-white/10">
                    {note.year}
                  </span>
                )}
              </div>

              {/* File link */}
              <a
                href={note.file_path}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-teal hover:underline"
              >
                <IconExternal />
                فتح الرابط
              </a>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink/50">الملزمة محذوفة</p>
          )}

          {/* Reporter note */}
          {report.note && (
            <p className="mt-2 rounded-lg bg-paper/60 px-3 py-2 text-xs leading-relaxed text-ink/70 dark:bg-white/[0.04]">
              <span className="font-bold text-ink/50">ملاحظة المبلّغ: </span>
              {report.note}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 flex-col gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleIgnore}
            loading={busy}
            icon={<IconCheck />}
          >
            تجاهل
          </Button>
          {note && (
            <Button
              size="sm"
              variant="danger"
              onClick={handleDeleteNote}
              loading={busy}
              icon={<IconTrash />}
            >
              احذف الملزمة
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Main Section ====================
export function ReportsSection({ password }: Props) {
  const toast = useToast();
  const [reports, setReports] = useState<LectureNoteReport[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await postJson<{ reports: LectureNoteReport[] }>(
        '/api/admin/lecture-notes',
        { password, action: 'reports_list' }
      );
      setReports(data.reports ?? []);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل تحميل البلاغات', 'error');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [password, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    let deadLinks = 0;
    let outdated = 0;
    for (const r of reports) {
      if (r.reason === 'dead_link') deadLinks++;
      else outdated++;
    }
    return { total: reports.length, deadLinks, outdated };
  }, [reports]);

  return (
    <section>
      {/* ==================== Description ==================== */}
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-teal/20 bg-teal/[0.04] p-4 text-sm dark:border-teal/30 dark:bg-teal/10">
        <span className="text-teal">
          <IconReport />
        </span>
        <div>
          <p className="font-bold text-ink">بلاغات الطلاب</p>
          <p className="mt-0.5 text-ink/70">
            راقب البلاغات الواردة عن الروابط الميتة أو الملازم القديمة. عند حذف ملزمة، تُعالج كل بلاغاتها تلقائياً.
          </p>
        </div>
      </div>

      {/* ==================== Stats ==================== */}
      {!loading && reports.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-2">
          <StatCard label="إجمالي" value={stats.total} accent="teal" />
          <StatCard label="رابط ميت" value={stats.deadLinks} accent="red" />
          <StatCard label="قديمة" value={stats.outdated} accent="amber" />
        </div>
      )}

      {/* ==================== List ==================== */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 skeleton-shimmer rounded-2xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-3xl border border-line bg-white/80 p-12 text-center backdrop-blur-sm dark:bg-paper/80">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-teal/8 text-teal/50 dark:bg-teal/15">
            <IconInbox />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد بلاغات حالياً</p>
          <p className="mt-1 text-sm text-ink/50">
            عندما يُبلّغ طالب عن ملزمة، سيظهر البلاغ هنا
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              password={password}
              onResolved={load}
            />
          ))}
        </div>
      )}

      {/* ملاحظة سفلية */}
      {!loading && reports.length > 0 && (
        <p className="mt-6 text-center text-[11px] text-ink/40">
          البلاغات تظهر فقط عند وجود شكوى من طالب. إذا رأيت رقم 3 أو أكثر على ملزمة واحدة — فهذا يعني أنها الأكثر إشكالية.
        </p>
      )}
    </section>
  );
}