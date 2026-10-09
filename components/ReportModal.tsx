// components/ReportModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { postJson } from '@/lib/api-client';
import type { LectureNote, ReportReason } from '@/lib/types';

const FP_KEY = 'device_fingerprint';

function getFingerprint(): string {
  try {
    let fp = localStorage.getItem(FP_KEY);
    if (!fp) {
      fp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(FP_KEY, fp);
    }
    return fp;
  } catch {
    return '';
  }
}

interface ReportModalProps {
  note: LectureNote | null;
  onClose: () => void;
  onReported?: () => void;
}

export function ReportModal({ note, onClose, onReported }: ReportModalProps) {
  const toast = useToast();
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (note) {
      setReason('');
      setNoteText('');
      setDone(false);
    }
  }, [note]);

  useEffect(() => {
    if (!note) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [note, onClose]);

  if (!note) return null;

  // ✅ حفظ المرجع لتضييق النوع داخل الـclosures
  const currentNote = note;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      toast.show('اختر سبب البلاغ', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await postJson<{ success: boolean; duplicate: boolean }>(
        '/api/reports',
        {
          action: 'create',
          lecture_note_id: currentNote.id,
          reason,
          note: noteText.trim() || null,
          fingerprint: getFingerprint(),
        }
      );
      setDone(true);
      toast.show(
        res.duplicate ? 'سبق أن أبلغت عن هذه الملزمة' : 'شكراً، وصلنا بلاغك',
        'success'
      );
      onReported?.();
      setTimeout(onClose, 1400);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل إرسال البلاغ', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-line bg-paper p-6 shadow-[0_24px_60px_rgba(26,33,31,0.30)] animate-scale-in dark:shadow-[0_24px_60px_rgba(0,0,0,0.60)]"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/10 text-teal dark:bg-teal/20">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-black text-ink">شكراً لك</h3>
            <p className="mt-1 text-sm text-ink/60">وصلنا بلاغك وسيراجعه المشرف قريباً.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber/15 text-amber-700 dark:bg-amber/25 dark:text-amber-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-black text-ink">الإبلاغ عن مشكلة</h3>
                <p className="mt-0.5 truncate text-xs text-ink/50">{currentNote.title}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm font-bold text-ink/70">ما المشكلة؟</legend>
                <div className="space-y-2">
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                    reason === 'dead_link'
                      ? 'border-teal bg-teal/5 text-ink dark:bg-teal/15'
                      : 'border-line bg-white text-ink/80 hover:border-teal/40 dark:bg-white/[0.03]'
                  }`}>
                    <input
                      type="radio"
                      name="reason"
                      value="dead_link"
                      checked={reason === 'dead_link'}
                      onChange={() => setReason('dead_link')}
                      className="h-4 w-4 accent-teal"
                    />
                    <span className="flex-1">
                      <span className="block font-bold">الرابط لا يعمل</span>
                      <span className="text-xs text-ink/50">الرابط لا يفتح أو محذوف من تيليكرام</span>
                    </span>
                  </label>

                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                    reason === 'outdated'
                      ? 'border-teal bg-teal/5 text-ink dark:bg-teal/15'
                      : 'border-line bg-white text-ink/80 hover:border-teal/40 dark:bg-white/[0.03]'
                  }`}>
                    <input
                      type="radio"
                      name="reason"
                      value="outdated"
                      checked={reason === 'outdated'}
                      onChange={() => setReason('outdated')}
                      className="h-4 w-4 accent-teal"
                    />
                    <span className="flex-1">
                      <span className="block font-bold">الملزمة قديمة</span>
                      <span className="text-xs text-ink/50">المحتوى قديم أو من سنة سابقة</span>
                    </span>
                  </label>
                </div>
              </fieldset>

              <div>
                <label htmlFor="report-note" className="mb-2 block text-sm font-bold text-ink/70">
                  ملاحظة إضافية <span className="text-ink/40">(اختياري)</span>
                </label>
                <Textarea
                  id="report-note"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="أي تفاصيل تساعد المشرف..."
                  rows={2}
                  maxLength={300}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={!reason}
                  className="flex-1"
                >
                  إرسال البلاغ
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={submitting}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}