// app/admin/_components/SchedulesSection.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { postJson, uploadToStorage } from '@/lib/api-client';
import { STAGES, STORAGE_BUCKETS } from '@/lib/constants';
import type { Stage } from '@/lib/types';

interface Props { password: string }
interface ScheduleItem { stage: Stage; image_url: string | null; updated_at?: string | null }

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function safeStageForPath(stage: string): string {
  return stage.replace(/\s/g, '-').replace(/[^\w\-]/g, '');
}
function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  if (parts.length < 2) return 'png';
  return parts[parts.length - 1].toLowerCase();
}

function IconCalendar() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}
function IconImage() {
  return (
    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

interface StageCardProps {
  stage: Stage;
  schedule: ScheduleItem | undefined;
  password: string;
  onUploaded: () => void;
}

function StageCard({ stage, schedule, password, onUploaded }: StageCardProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [imageError, setImageError] = useState(false);

  const currentImageUrl = schedule?.image_url ?? null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.show('نوع الملف غير مدعوم. استخدم PNG أو JPG أو WebP.', 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.show(`حجم الصورة كبير جدًا (الحد ${MAX_FILE_SIZE_MB} ميجا).`, 'error');
      return;
    }

    setUploading(true);
    setProgressLabel('جاري رفع الصورة...');
    setImageError(false);

    try {
      const safeStage = safeStageForPath(stage);
      const ext = getFileExtension(file.name);
      const filePath = `${safeStage}-${Date.now()}.${ext}`;

      const publicUrl = await uploadToStorage(STORAGE_BUCKETS.scheduleImages, filePath, file, { upsert: true });
      setProgressLabel('جاري الحفظ...');

      await postJson('/api/admin/schedules', {
        password, action: 'update', stage, image_url: publicUrl,
      });

      toast.show(`تم رفع جدول ${stage}`, 'success');
      onUploaded();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل رفع الصورة', 'error');
    } finally {
      setUploading(false);
      setProgressLabel('');
    }
  }

  function openFilePicker() { fileInputRef.current?.click(); }

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white/80 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-200 hover:border-teal/20">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/8 text-teal">
            <IconCalendar />
          </span>
          <h3 className="font-bold text-ink">{stage}</h3>
        </div>
        {currentImageUrl && (
          <Button type="button" size="sm" variant="secondary" onClick={openFilePicker} disabled={uploading} icon={<IconUpload />}>
            تغيير
          </Button>
        )}
      </div>

      <div className="p-5">
        {currentImageUrl && !imageError ? (
          <img
            src={currentImageUrl}
            alt={`جدول ${stage}`}
            onError={() => setImageError(true)}
            className="max-h-56 w-full rounded-2xl border border-line object-contain"
          />
        ) : currentImageUrl && imageError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            تعذّر تحميل الصورة الحالية.
            <button type="button" onClick={openFilePicker} className="mr-2 font-bold underline">ارفع صورة جديدة</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            disabled={uploading}
            className="group flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-paper/50 py-10 transition-all duration-200 hover:border-teal/40 hover:bg-teal/[0.03] disabled:opacity-60"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/8 text-teal transition-all group-hover:bg-teal/15">
              <IconImage />
            </span>
            <span className="text-sm font-bold text-ink/70">ارفع صورة الجدول</span>
            <span className="text-xs text-ink/40">PNG / JPG / WebP — حتى {MAX_FILE_SIZE_MB} ميجا</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />

        {uploading && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-teal/5 px-3 py-2 text-sm">
            <svg className="h-4 w-4 animate-spin text-teal" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="font-bold text-teal">{progressLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function SchedulesSection({ password }: Props) {
  const toast = useToast();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await postJson<{ schedules: ScheduleItem[] }>('/api/admin/schedules', { password, action: 'list' });
      setSchedules(data.schedules ?? []);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل تحميل الجداول', 'error');
      setSchedules([]);
    } finally { setLoading(false); }
  }, [password, toast]);

  useEffect(() => { load(); }, [load]);

  const scheduleByStage = useCallback((stage: Stage) => schedules.find((s) => s.stage === stage), [schedules]);

  return (
    <section>
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-teal/20 bg-teal/[0.04] p-4 text-sm">
        <span className="text-teal"><IconCalendar /></span>
        <p className="font-medium text-ink/70">
          ارفع صورة جدول المحاضرات لكل مرحلة، تظهر للطلاب مباشرة بصفحة «الجدول».
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {STAGES.map((st) => <div key={st} className="h-40 skeleton-shimmer rounded-3xl" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {STAGES.map((st) => (
            <StageCard key={st} stage={st} schedule={scheduleByStage(st)} password={password} onUploaded={load} />
          ))}
        </div>
      )}
    </section>
  );
}