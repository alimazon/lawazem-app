// app/channel-portal/_components/ContentSection.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { buildStoragePath, postJson } from '@/lib/api-client';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS, STORAGE_BUCKETS } from '@/lib/constants';
import type { ChannelContent, ContentType, FileEntry } from '@/lib/types';

// ==================== Constants ====================
const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,image/*,audio/*,video/*';
const MAX_FILE_SIZE_MB = 20;

// ==================== Types ====================
interface Props {
  channelId: string;
  password: string;
}

interface ContentForm {
  content_type: ContentType;
  title: string;
  folder: string;
  description: string;
  due_date: string;
  pinned: boolean;
  files: FileEntry[];
}

function emptyFileEntry(): FileEntry {
  return { label: null, url: '' };
}

function emptyForm(): ContentForm {
  return {
    content_type: 'assignment',
    title: '',
    folder: '',
    description: '',
    due_date: '',
    pinned: false,
    files: [emptyFileEntry()],
  };
}

function formFromItem(item: ChannelContent): ContentForm {
  const files =
    item.file_urls && item.file_urls.length > 0
      ? item.file_urls.map((f) => ({ label: f.label, url: f.url }))
      : [emptyFileEntry()];
  return {
    content_type: item.content_type,
    title: item.title,
    folder: item.folder ?? '',
    description: item.description ?? '',
    due_date: item.due_date ?? '',
    pinned: !!item.pinned,
    files,
  };
}

function isFormValid(f: ContentForm): boolean {
  return f.title.trim() !== '';
}

function cleanFileEntries(files: FileEntry[]): FileEntry[] {
  return files
    .map((f) => ({ url: f.url.trim(), label: f.label?.trim() || null }))
    .filter((f) => f.url !== '');
}

// ==================== Due Date Helpers ====================
type DueKind = 'expired' | 'today' | 'tomorrow' | 'soon' | 'normal';

interface DueInfo {
  kind: DueKind;
  label: string;
  diff: number;
}

function getDueInfo(dateStr: string | null): DueInfo | null {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  if (Number.isNaN(due.getTime())) return null;

  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diff < 0) return { kind: 'expired', label: 'انتهى الموعد', diff };
  if (diff === 0) return { kind: 'today', label: 'التسليم اليوم', diff };
  if (diff === 1) return { kind: 'tomorrow', label: 'التسليم غداً', diff };
  if (diff <= 3) return { kind: 'soon', label: `بعد ${diff} أيام`, diff };
  return { kind: 'normal', label: dateStr, diff };
}

function getDueBadgeClass(kind: DueKind): string {
  switch (kind) {
    case 'expired':
      return 'bg-ink/5 text-ink/40 line-through';
    case 'today':
      return 'bg-red-500 text-white';
    case 'tomorrow':
      return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300';
    case 'soon':
      return 'bg-amber/20 text-amber-800 dark:bg-amber/25 dark:text-amber-300';
    case 'normal':
    default:
      return 'bg-ink/5 text-ink/60';
  }
}

function isUpcoming(dateStr: string | null): boolean {
  const info = getDueInfo(dateStr);
  if (!info) return false;
  return info.kind === 'today' || info.kind === 'tomorrow' || info.kind === 'soon';
}

// ==================== File Type Detection ====================
function detectFileLabel(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.includes('t.me')) return 'تلغرام';
  if (lower.includes('drive.google.com')) return 'Google Drive';
  if (lower.includes('dropbox.com')) return 'Dropbox';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'يوتيوب';
  if (lower.includes('onedrive') || lower.includes('1drv.ms')) return 'OneDrive';
  if (lower.endsWith('.pdf')) return 'PDF';
  if (lower.match(/\.(doc|docx)$/)) return 'Word';
  if (lower.match(/\.(ppt|pptx)$/)) return 'PowerPoint';
  if (lower.match(/\.(png|jpg|jpeg|webp|gif)$/)) return 'صورة';
  if (lower.match(/\.(mp3|wav|m4a)$/)) return 'صوت';
  if (lower.match(/\.(mp4|mov|avi|webm)$/)) return 'فيديو';
  return null;
}

// ==================== Icons ====================
function IconPin({ filled, className = '' }: { filled: boolean; className?: string }) {
  return (
    <svg className={`h-4 w-4 flex-shrink-0 ${className}`} fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 4.5v6.75L6 15v1.5h12V15l-3-3.75V4.5M12 16.5V21" />
    </svg>
  );
}
function IconFolder() {
  return (
    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
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
function IconUpload() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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
function IconTrash() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}
function IconEmpty() {
  return (
    <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10M4 18h10" />
    </svg>
  );
}
function IconCopy() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
function IconCheckSquare() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}
function IconStats() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
function IconFolderStack() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ==================== Stats Bar ====================
function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: 'teal' | 'amber' | 'red' | 'ink';
}) {
  const styles = {
    teal: 'bg-teal/8 text-teal',
    amber: 'bg-amber/15 text-amber-700 dark:text-amber-300',
    red: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300',
    ink: 'bg-ink/5 text-ink/60',
  }[accent];

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-white/70 px-3 py-2.5 dark:bg-paper/70">
      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${styles}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-lg font-black leading-none text-ink">{value}</p>
        <p className="mt-0.5 truncate text-[11px] font-bold text-ink/50">{label}</p>
      </div>
    </div>
  );
}

function StatsBar({ items }: { items: ChannelContent[] }) {
  const stats = useMemo(() => {
    let pinned = 0;
    let upcoming = 0;
    const folders = new Set<string>();

    for (const item of items) {
      if (item.pinned) pinned++;
      if (item.due_date && isUpcoming(item.due_date)) upcoming++;
      if (item.folder) folders.add(item.folder);
    }

    return {
      total: items.length,
      pinned,
      upcoming,
      folders: folders.size,
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <StatCard icon={<IconStats />} label="منشور" value={stats.total} accent="teal" />
      <StatCard icon={<IconPin filled />} label="مثبّت" value={stats.pinned} accent="amber" />
      <StatCard icon={<IconWarning />} label="موعد قريب" value={stats.upcoming} accent="red" />
      <StatCard icon={<IconFolderStack />} label="مجلد" value={stats.folders} accent="ink" />
    </div>
  );
}

// ==================== File Entries Editor ====================
interface FileEntriesEditorProps {
  files: FileEntry[];
  onChange: (files: FileEntry[]) => void;
  channelId: string;
  disabled?: boolean;
}

function FileEntriesEditor({ files, onChange, channelId, disabled }: FileEntriesEditorProps) {
  const toast = useToast();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  function updateSlot(index: number, patch: Partial<FileEntry>) {
    onChange(files.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }
  function addSlot() {
    onChange([...files, emptyFileEntry()]);
  }
  function removeSlot(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  async function handleUpload(index: number, file: File) {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.show(`حجم الملف كبير جداً (بحد أقصى ${MAX_FILE_SIZE_MB} ميجا).`, 'error');
      return;
    }
    setUploadingIndex(index);
    try {
      const filePath = buildStoragePath(channelId, file.name);
      const { supabase } = await import('@/lib/supabaseClient');
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.channelFiles)
        .upload(filePath, file);
      if (uploadError) throw new Error(uploadError.message);
      const { data } = supabase.storage
        .from(STORAGE_BUCKETS.channelFiles)
        .getPublicUrl(filePath);
      updateSlot(index, { url: data.publicUrl, label: files[index]?.label || file.name });
      toast.show('تم رفع الملف', 'success');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل رفع الملف', 'error');
    } finally {
      setUploadingIndex(null);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-line bg-paper/40 p-4 dark:bg-paper-deep/40">
      <p className="flex items-center gap-1.5 text-sm font-bold text-ink/70">
        <IconUpload />
        الملفات والروابط
      </p>

      {files.map((f, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-line bg-white p-3 dark:bg-paper">
          <div className="flex gap-2">
            <Input
              type="text"
              value={f.label ?? ''}
              onChange={(e) => updateSlot(i, { label: e.target.value })}
              placeholder={`اسم الملف ${i + 1} (اختياري)`}
              maxLength={200}
              disabled={disabled}
              className="min-w-0 flex-1 text-sm"
            />
            {files.length > 1 && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => removeSlot(i)}
                disabled={disabled}
              >
                حذف
              </Button>
            )}
          </div>

          <input
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) handleUpload(i, file);
            }}
            disabled={disabled || uploadingIndex === i}
            className="w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-teal file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-teal-light disabled:opacity-60"
          />

          {uploadingIndex === i && (
            <div className="flex items-center gap-2 rounded-lg bg-teal/5 px-2.5 py-1.5 text-xs font-bold text-teal">
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              جاري الرفع...
            </div>
          )}

          <div className="relative">
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/30">
              <IconLink />
            </span>
            <Input
              type="url"
              value={f.url}
              onChange={(e) => {
                const url = e.target.value;
                const auto = detectFileLabel(url);
                updateSlot(i, { url, label: files[i]?.label || auto || undefined });
              }}
              placeholder="أو الصق رابطاً (تلغرام، Drive، ...)"
              maxLength={2000}
              disabled={disabled}
              className="w-full pr-9 text-sm"
            />
          </div>

          {detectFileLabel(f.url) && (
            <p className="text-[10px] font-bold text-ink/40">
              النوع المكتشف: {detectFileLabel(f.url)}
            </p>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addSlot}
        disabled={disabled}
        className="text-sm font-bold text-teal transition-all hover:gap-2 hover:underline disabled:opacity-50"
      >
        + إضافة ملف / رابط
      </button>
    </div>
  );
}

// ==================== Filters Bar ====================
function FiltersBar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  typeFilter: 'all' | ContentType;
  onTypeFilterChange: (v: 'all' | ContentType) => void;
  statusFilter: 'all' | 'pinned' | 'upcoming' | 'expired';
  onStatusFilterChange: (v: 'all' | 'pinned' | 'upcoming' | 'expired') => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <div className="relative min-w-[180px] flex-1">
        <IconSearch />
        <Input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ابحث بعنوان المحتوى..."
          className="pr-11"
        />
      </div>
      <Select
        value={typeFilter}
        onChange={(e) => onTypeFilterChange(e.target.value as 'all' | ContentType)}
        className="w-40"
        aria-label="فلترة حسب النوع"
      >
        <option value="all">كل الأنواع</option>
        {CONTENT_TYPES.map((t) => (
          <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>
        ))}
      </Select>
      <Select
        value={statusFilter}
        onChange={(e) =>
          onStatusFilterChange(
            e.target.value as 'all' | 'pinned' | 'upcoming' | 'expired'
          )
        }
        className="w-40"
        aria-label="فلترة حسب الحالة"
      >
        <option value="all">كل الحالات</option>
        <option value="pinned">المثبتة فقط</option>
        <option value="upcoming">مواعيد قريبة</option>
        <option value="expired">مواعيد منتهية</option>
      </Select>
    </div>
  );
}

// ==================== Bulk Actions Bar ====================
function BulkActionsBar({
  selectedCount,
  operating,
  onPin,
  onUnpin,
  onDelete,
  onCancel,
}: {
  selectedCount: number;
  operating: boolean;
  onPin: () => void;
  onUnpin: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="sticky bottom-4 z-30 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-teal/30 bg-teal/95 px-4 py-3 text-white shadow-[0_12px_30px_rgba(14,74,74,0.25)] backdrop-blur-xl dark:bg-teal/80">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-black">
          {selectedCount}
        </span>
        <span className="text-sm font-bold">محدد</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPin}
          disabled={operating}
          className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold transition-all hover:bg-white/25 active:scale-95 disabled:opacity-50"
        >
          تثبيت
        </button>
        <button
          type="button"
          onClick={onUnpin}
          disabled={operating}
          className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold transition-all hover:bg-white/25 active:scale-95 disabled:opacity-50"
        >
          إلغاء التثبيت
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={operating}
          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold transition-all hover:bg-red-600 active:scale-95 disabled:opacity-50"
        >
          حذف
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={operating}
          aria-label="إلغاء التحديد"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 transition-all hover:bg-white/25 active:scale-95 disabled:opacity-50"
        >
          <IconClose />
        </button>
      </div>
    </div>
  );
}

// ==================== Item Card ====================
interface ItemCardProps {
  item: ChannelContent;
  isEditing: boolean;
  editForm: ContentForm;
  onEditFormChange: (form: ContentForm) => void;
  channelId: string;
  saving: boolean;
  folderSuggestions: string[];
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDuplicate: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

function ItemCard({
  item,
  isEditing,
  editForm,
  onEditFormChange,
  channelId,
  saving,
  folderSuggestions,
  selectionMode,
  isSelected,
  onToggleSelect,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDuplicate,
  onTogglePin,
  onDelete,
}: ItemCardProps) {
  const dueInfo = item.due_date ? getDueInfo(item.due_date) : null;
  const folderListId = `folder-options-${item.id}`;

  if (isEditing) {
    return (
      <div className="space-y-3 rounded-2xl border border-teal/30 bg-white p-4 shadow-[0_2px_8px_rgba(14,74,74,0.06)] dark:bg-paper">
        <div className="flex flex-wrap gap-2">
          <Select
            value={editForm.content_type}
            onChange={(e) =>
              onEditFormChange({ ...editForm, content_type: e.target.value as ContentType })
            }
            className="w-36"
            aria-label="نوع المحتوى"
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>
            ))}
          </Select>
          <Input
            type="text"
            value={editForm.title}
            onChange={(e) => onEditFormChange({ ...editForm, title: e.target.value })}
            maxLength={300}
            className="min-w-[180px] flex-1"
            autoFocus
          />
          <Input
            type="date"
            value={editForm.due_date}
            onChange={(e) => onEditFormChange({ ...editForm, due_date: e.target.value })}
            className="w-40"
            aria-label="تاريخ التسليم"
          />
        </div>

        <div>
          <Input
            type="text"
            value={editForm.folder}
            onChange={(e) => onEditFormChange({ ...editForm, folder: e.target.value })}
            placeholder="اسم المجلد (اختياري)"
            maxLength={200}
            list={folderListId}
          />
          <datalist id={folderListId}>
            {folderSuggestions.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>

        <Textarea
          value={editForm.description}
          onChange={(e) => onEditFormChange({ ...editForm, description: e.target.value })}
          placeholder="تفاصيل إضافية (اختياري)"
          rows={2}
          maxLength={2000}
        />

        <FileEntriesEditor
          files={editForm.files}
          onChange={(files) => onEditFormChange({ ...editForm, files })}
          channelId={channelId}
          disabled={saving}
        />

        <Checkbox
          checked={editForm.pinned}
          onChange={(v) => onEditFormChange({ ...editForm, pinned: v })}
        >
          تثبيت هذا المنشور في أعلى القناة
        </Checkbox>

        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} loading={saving} disabled={!isFormValid(editForm)}>
            حفظ
          </Button>
          <Button size="sm" variant="secondary" onClick={onCancelEdit} disabled={saving}>
            إلغاء
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative rounded-2xl border bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-200 dark:bg-paper/80 ${
        isSelected
          ? 'border-teal bg-teal/5 dark:bg-teal/10'
          : 'border-line hover:border-teal/20 hover:shadow-[0_4px_16px_rgba(14,74,74,0.06)]'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {selectionMode && (
            <button
              type="button"
              onClick={onToggleSelect}
              aria-label={isSelected ? 'إلغاء التحديد' : 'تحديد'}
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all active:scale-90 ${
                isSelected
                  ? 'border-teal bg-teal text-white'
                  : 'border-line bg-white hover:border-teal/40 dark:bg-paper'
              }`}
            >
              {isSelected && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-bold text-teal">
                {CONTENT_TYPE_LABELS[item.content_type]}
              </span>
              {item.folder && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <IconFolder />
                  {item.folder}
                </span>
              )}
              {item.pinned && (
                <span className="rounded-full bg-teal px-2.5 py-0.5 text-xs font-bold text-white">
                  مثبّت
                </span>
              )}
              {dueInfo && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${getDueBadgeClass(
                    dueInfo.kind
                  )}`}
                >
                  {dueInfo.kind === 'today' && (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  )}
                  {dueInfo.kind === 'normal' ? `التسليم: ${dueInfo.label}` : dueInfo.label}
                </span>
              )}
              <span className="font-bold text-ink">{item.title}</span>
            </div>

            {item.description && (
              <p className="mt-1 text-sm leading-relaxed text-ink/60">{item.description}</p>
            )}

            {item.file_urls && item.file_urls.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.file_urls.map((f, i) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal/20 bg-teal/5 px-2.5 py-1 text-xs font-bold text-teal transition-all duration-200 hover:border-teal/40 hover:bg-teal/10"
                  >
                    <IconLink />
                    {f.label || `ملف ${i + 1}`}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {!selectionMode && (
          <div className="flex flex-shrink-0 gap-1.5">
            <button
              type="button"
              onClick={onDuplicate}
              title="نسخ المنشور"
              aria-label="نسخ المنشور"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink/50 transition-all duration-200 hover:border-teal/30 hover:bg-teal/5 hover:text-teal active:scale-95"
            >
              <IconCopy />
            </button>
            <button
              type="button"
              onClick={onTogglePin}
              title={item.pinned ? 'إلغاء التثبيت' : 'تثبيت'}
              aria-label={item.pinned ? 'إلغاء التثبيت' : 'تثبيت'}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 active:scale-95 ${
                item.pinned
                  ? 'border-teal bg-teal/10 text-teal'
                  : 'border-line text-ink/50 hover:border-ink/20 hover:bg-ink/5 hover:text-ink'
              }`}
            >
              <IconPin filled={item.pinned} />
            </button>
            <Button size="sm" variant="secondary" onClick={onStartEdit} icon={<IconEdit />}>
              تعديل
            </Button>
            <Button size="sm" variant="danger" onClick={onDelete} icon={<IconTrash />}>
              حذف
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Main Section ====================
export function ContentSection({ channelId, password }: Props) {
  const toast = useToast();
  const confirm = useConfirm();

  const [items, setItems] = useState<ChannelContent[]>([]);
  const [loading, setLoading] = useState(true);

  const [newForm, setNewForm] = useState<ContentForm>(emptyForm());
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ContentForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ContentType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pinned' | 'upcoming' | 'expired'>('all');

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOperating, setBulkOperating] = useState(false);

  // ===== تحميل =====
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await postJson<{ items: ChannelContent[] }>('/api/channel/content', {
        action: 'list',
        channel_id: channelId,
        password,
      });
      setItems(data.items ?? []);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل تحميل المحتوى', 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [channelId, password, toast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ===== قائمة المجلدات الفريدة (للاقتراحات) =====
  const folderSuggestions = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.folder && item.folder.trim()) set.add(item.folder.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [items]);

  // ===== إضافة =====
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid(newForm)) return;
    setAdding(true);
    try {
      await postJson('/api/channel/content', {
        action: 'add',
        channel_id: channelId,
        password,
        content_type: newForm.content_type,
        title: newForm.title.trim(),
        folder: newForm.folder.trim() || null,
        description: newForm.description.trim() || null,
        due_date: newForm.due_date || null,
        pinned: newForm.pinned,
        file_urls: cleanFileEntries(newForm.files),
      });
      setNewForm(emptyForm());
      toast.show('تمت إضافة المحتوى', 'success');
      loadItems();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الإضافة', 'error');
    } finally {
      setAdding(false);
    }
  }

  // ===== تعديل =====
  function startEdit(item: ChannelContent) {
    setEditingId(item.id);
    setEditForm(formFromItem(item));
  }
  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyForm());
  }

  async function saveEdit(id: string) {
    if (!isFormValid(editForm)) return;
    setSaving(true);
    try {
      await postJson('/api/channel/content', {
        action: 'edit',
        channel_id: channelId,
        password,
        id,
        content_type: editForm.content_type,
        title: editForm.title.trim(),
        folder: editForm.folder.trim() || null,
        description: editForm.description.trim() || null,
        due_date: editForm.due_date || null,
        pinned: editForm.pinned,
        file_urls: cleanFileEntries(editForm.files),
      });
      cancelEdit();
      toast.show('تم الحفظ', 'success');
      loadItems();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  }

  // ===== نسخ =====
  async function handleDuplicate(item: ChannelContent) {
    try {
      await postJson('/api/channel/content', {
        action: 'duplicate',
        channel_id: channelId,
        password,
        id: item.id,
      });
      toast.show('تم نسخ المنشور', 'success');
      loadItems();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل النسخ', 'error');
    }
  }

  // ===== تثبيت =====
  async function togglePin(item: ChannelContent) {
    const nextPinned = !item.pinned;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, pinned: nextPinned } : i)));
    try {
      await postJson('/api/channel/content', {
        action: 'toggle_pin',
        channel_id: channelId,
        password,
        id: item.id,
      });
    } catch (err) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, pinned: item.pinned } : i)));
      toast.show(err instanceof Error ? err.message : 'فشل التثبيت', 'error');
    }
  }

  // ===== حذف =====
  async function handleDelete(item: ChannelContent) {
    const ok = await confirm(`حذف «${item.title}» نهائياً. هل أنت متأكد؟`, {
      variant: 'danger',
      confirmLabel: 'حذف',
    });
    if (!ok) return;
    try {
      await postJson('/api/channel/content', {
        action: 'delete',
        channel_id: channelId,
        password,
        id: item.id,
      });
      toast.show('تم الحذف', 'success');
      loadItems();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحذف', 'error');
    }
  }

  // ===== التحديد المتعدد =====
  function toggleSelectionMode() {
    setSelectionMode((prev) => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ===== العمليات الجماعية =====
  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    const ok = await confirm(
      `حذف ${selectedIds.size} ${selectedIds.size === 1 ? 'منشور' : 'منشورات'} نهائياً. هل أنت متأكد؟`,
      { variant: 'danger', confirmLabel: 'حذف' }
    );
    if (!ok) return;

    setBulkOperating(true);
    try {
      await postJson('/api/channel/content', {
        action: 'bulk_delete',
        channel_id: channelId,
        password,
        ids: Array.from(selectedIds),
      });
      toast.show(`تم حذف ${selectedIds.size} منشور`, 'success');
      setSelectedIds(new Set());
      setSelectionMode(false);
      loadItems();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحذف', 'error');
    } finally {
      setBulkOperating(false);
    }
  }

  async function bulkPin(pinned: boolean) {
    if (selectedIds.size === 0) return;
    setBulkOperating(true);
    try {
      await postJson('/api/channel/content', {
        action: 'bulk_pin',
        channel_id: channelId,
        password,
        ids: Array.from(selectedIds),
        pinned,
      });
      toast.show(
        pinned ? `تم تثبيت ${selectedIds.size} منشور` : `تم إلغاء تثبيت ${selectedIds.size} منشور`,
        'success'
      );
      setSelectedIds(new Set());
      setSelectionMode(false);
      loadItems();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل التحديث', 'error');
    } finally {
      setBulkOperating(false);
    }
  }

  // ===== الفلترة =====
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items
      .filter((i) => typeFilter === 'all' || i.content_type === typeFilter)
      .filter((i) => {
        if (statusFilter === 'pinned') return i.pinned;
        if (statusFilter === 'upcoming') return i.due_date ? isUpcoming(i.due_date) : false;
        if (statusFilter === 'expired') {
          const info = i.due_date ? getDueInfo(i.due_date) : null;
          return info?.kind === 'expired';
        }
        return true;
      })
      .filter((i) => (term ? i.title.toLowerCase().includes(term) : true))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [items, search, typeFilter, statusFilter]);

  return (
    <section>
      {/* شريط الإحصائيات */}
      <StatsBar items={items} />

      {/* نموذج الإضافة */}
      <form
        onSubmit={handleAdd}
        className="mb-6 space-y-3 rounded-3xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm dark:bg-paper/80"
      >
        <div className="flex flex-wrap gap-2">
          <Select
            value={newForm.content_type}
            onChange={(e) => setNewForm({ ...newForm, content_type: e.target.value as ContentType })}
            className="w-36"
            aria-label="نوع المحتوى"
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>
            ))}
          </Select>
          <Input
            type="text"
            value={newForm.title}
            onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
            placeholder="العنوان"
            required
            maxLength={300}
            className="min-w-[180px] flex-1"
          />
          <Input
            type="date"
            value={newForm.due_date}
            onChange={(e) => setNewForm({ ...newForm, due_date: e.target.value })}
            className="w-40"
            aria-label="تاريخ التسليم"
          />
        </div>

        <div>
          <Input
            type="text"
            value={newForm.folder}
            onChange={(e) => setNewForm({ ...newForm, folder: e.target.value })}
            placeholder="اسم المجلد (اختياري) — أو اختر من الموجود"
            maxLength={200}
            list="folder-suggestions-new"
          />
          <datalist id="folder-suggestions-new">
            {folderSuggestions.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>

        <Textarea
          value={newForm.description}
          onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
          placeholder="تفاصيل إضافية (اختياري)"
          rows={2}
          maxLength={2000}
        />

        <FileEntriesEditor
          files={newForm.files}
          onChange={(files) => setNewForm({ ...newForm, files })}
          channelId={channelId}
          disabled={adding}
        />

        <Checkbox
          checked={newForm.pinned}
          onChange={(v) => setNewForm({ ...newForm, pinned: v })}
        >
          تثبيت هذا المنشور في أعلى القناة
        </Checkbox>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" loading={adding} disabled={!isFormValid(newForm)}>
            إضافة
          </Button>
        </div>
      </form>

      {/* أدوات القائمة */}
      {items.length > 0 && (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-ink/50">
              {filteredItems.length} من {items.length} منشور
            </div>
            <button
              type="button"
              onClick={toggleSelectionMode}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                selectionMode
                  ? 'border-teal bg-teal text-white'
                  : 'border-line bg-white text-ink/70 hover:border-teal/30 hover:text-teal dark:bg-paper'
              }`}
            >
              <IconCheckSquare />
              {selectionMode ? 'إلغاء التحديد' : 'تحديد متعدد'}
            </button>
          </div>

          <FiltersBar
            search={search}
            onSearchChange={setSearch}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </>
      )}

      {/* القائمة */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 skeleton-shimmer rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-line bg-white/80 p-12 text-center backdrop-blur-sm dark:bg-paper/80">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/8 text-teal">
            <IconEmpty />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا يوجد محتوى مضاف حالياً.</p>
          <p className="mt-1 text-sm text-ink/50">أضف أول منشور من الأعلى</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-line bg-white/80 p-12 text-center backdrop-blur-sm dark:bg-paper/80">
          <IconSearch />
          <p className="mt-4 font-bold text-ink/70">لا توجد نتائج مطابقة</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isEditing={editingId === item.id}
              editForm={editForm}
              onEditFormChange={setEditForm}
              channelId={channelId}
              saving={saving}
              folderSuggestions={folderSuggestions}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={() => toggleSelect(item.id)}
              onStartEdit={() => startEdit(item)}
              onCancelEdit={cancelEdit}
              onSave={() => saveEdit(item.id)}
              onDuplicate={() => handleDuplicate(item)}
              onTogglePin={() => togglePin(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </div>
      )}

      {/* شريط العمليات الجماعية */}
      {selectionMode && selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          operating={bulkOperating}
          onPin={() => bulkPin(true)}
          onUnpin={() => bulkPin(false)}
          onDelete={bulkDelete}
          onCancel={() => {
            setSelectedIds(new Set());
            setSelectionMode(false);
          }}
        />
      )}
    </section>
  );
}