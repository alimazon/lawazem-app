// app/admin/_components/MaterialsSection.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { TagInput } from '@/components/ui/TagInput';
import { DropZone } from '@/components/ui/DropZone';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { postJson, uploadToStorage } from '@/lib/api-client';
import { GROUPS, GROUP_LABELS } from '@/lib/constants';
import type { Group, LectureNote, Subject, Track } from '@/lib/types';

interface Props { password: string }

interface MaterialForm {
  subject_id: string;
  title: string;
  professor_name: string;
  lecture_number: string;
  track: Track | '';
  year: string;
  group_name: Group | '';
  file_path: string;
  tags: string[];
}

function emptyForm(): MaterialForm {
  return {
    subject_id: '',
    title: '',
    professor_name: '',
    lecture_number: '',
    track: '',
    year: '',
    group_name: '',
    file_path: '',
    tags: [],
  };
}

function formFromNote(n: LectureNote): MaterialForm {
  return {
    subject_id: n.subject_id,
    title: n.title,
    professor_name: n.professor_name ?? '',
    lecture_number: n.lecture_number != null ? String(n.lecture_number) : '',
    track: n.track ?? '',
    year: n.year != null ? String(n.year) : '',
    group_name: n.group_name ?? '',
    file_path: n.file_path,
    tags: Array.isArray(n.tags) ? n.tags : [],
  };
}

function formFromDuplicate(n: LectureNote): MaterialForm {
  const f = formFromNote(n);
  return { ...f, title: `${n.title} (نسخة)`, lecture_number: '' };
}

function isFormValid(f: MaterialForm): boolean {
  return (
    f.subject_id.trim() !== '' &&
    f.title.trim() !== '' &&
    f.track !== '' &&
    f.file_path.trim() !== ''
  );
}

// ===== مساعدات بناء المسار =====
function slugify(value: string): string {
  if (!value) return 'general';
  const slug = value.trim().replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '');
  return slug || 'general';
}

function safeFileName(name: string): string {
  return name.replace(/[^\w.\-]/g, '_');
}

function stripExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

const TAG_SUGGESTIONS = [
  'نظري', 'عملي', 'محاضرة', 'ملخص', 'أساسيات',
  'مراجعة', 'سلايدات', 'امتحان', 'واجب', 'فاينل',
];

// ==================== Icons ====================
function IconDoc() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
function IconClose() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3" />
    </svg>
  );
}
function IconDuplicate() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

// ==================== Group Badge ====================
function GroupBadge({ group }: { group: Group | null }) {
  if (!group) {
    return (
      <span className="rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[10px] font-bold text-ink/50 dark:bg-white/10">
        كل الكروبات
      </span>
    );
  }
  const styles =
    group === 'A'
      ? 'bg-teal/10 text-teal dark:bg-teal/20'
      : 'bg-amber/15 text-amber-800 dark:bg-amber/25 dark:text-amber-300';
  return (
    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${styles}`}>
      👥 {GROUP_LABELS[group]}
    </span>
  );
}

// ==================== Tags Preview ====================
function TagsPreview({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {tags.map((tag, i) => (
        <span key={i} className="rounded-md bg-teal/8 px-1.5 py-0.5 text-[10px] font-bold text-teal/80 dark:bg-teal/15 dark:text-teal">
          #{tag}
        </span>
      ))}
    </div>
  );
}

// ==================== File Preview ====================
function FilePathPreview({ url, onRemove }: { url: string; onRemove: () => void }) {
  const fileName = url.split('/').pop() || url;
  const isTelegram = url.includes('t.me');
  return (
    <div className="flex items-center gap-2 rounded-xl border border-teal/20 bg-teal/5 px-3 py-2.5 dark:border-teal/30 dark:bg-teal/15">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-teal text-white text-xs font-bold">
        {isTelegram ? '📨' : '✓'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-teal">
          {isTelegram ? 'رابط تلغرام' : 'الملف جاهز'}
        </p>
        <p className="truncate font-mono text-[10px] text-teal/70">{fileName}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="إزالة الرابط"
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-teal/60 transition-colors hover:bg-teal/15 hover:text-teal"
      >
        <IconClose />
      </button>
    </div>
  );
}

// ==================== Bulk Upload ====================
interface BulkFile {
  file: File;
  title: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

function BulkUploadZone({
  subjectId,
  professorName,
  track,
  year,
  group,
  lectureStart,
  tags,
  password,
  subjectNameById,
  onComplete,
}: {
  subjectId: string;
  professorName: string;
  track: Track | '';
  year: string;
  group: Group | '';
  lectureStart: string;
  tags: string[];
  password: string;
  subjectNameById: Map<string, string>;
  onComplete: () => void;
}) {
  const toast = useToast();
  const [files, setFiles] = useState<BulkFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canUpload = files.length > 0 && subjectId.trim() !== '' && track !== '' && !busy;

  function addFiles(list: FileList | File[]) {
    const incoming: BulkFile[] = [];
    for (const f of Array.from(list)) {
      if (f.size > 50 * 1024 * 1024) {
        incoming.push({ file: f, title: f.name, status: 'error', error: 'أكبر من 50MB' });
        continue;
      }
      incoming.push({ file: f, title: stripExtension(f.name), status: 'pending' });
    }
    setFiles((prev) => [...prev, ...incoming]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }

  function updateTitle(i: number, title: string) {
    setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, title } : f)));
  }
  function removeAt(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function uploadAll() {
    if (!canUpload) return;
    setBusy(true);
    const startNum = lectureStart ? Number(lectureStart) : null;

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if (item.status === 'done') continue;
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f)),
      );
      try {
        const subjectName = subjectNameById.get(subjectId) || 'general';
        const subjectSlug = slugify(subjectName);
        const doctorSlug = professorName.trim() ? slugify(professorName) : 'no-doctor';
        const fileName = `${Date.now()}-${i}-${safeFileName(item.file.name)}`;
        const filePath = `${subjectSlug}/${doctorSlug}/${fileName}`;
        const url = await uploadToStorage('lecture-notes', filePath, item.file);

        const lectureNum = startNum != null ? startNum + i : null;

        await postJson('/api/admin/lecture-notes', {
          password,
          action: 'add',
          subject_id: subjectId,
          title: item.title.trim() || stripExtension(item.file.name),
          professor_name: professorName.trim() || null,
          lecture_number: lectureNum,
          track,
          year: year ? Number(year) : null,
          group_name: group || null,
          file_path: url,
          tags,
        });

        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'done' } : f)),
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: 'error',
                  error: err instanceof Error ? err.message : 'فشل',
                }
              : f,
          ),
        );
      }
    }

    setBusy(false);
    toast.show('انتهى الرفع المتعدد', 'success');
    onComplete();
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200',
          dragOver
            ? 'border-teal bg-teal/5'
            : 'border-line bg-paper/50 hover:border-teal/40 hover:bg-teal/[0.03] dark:bg-paper-deep/40 dark:hover:bg-teal/5',
        ].join(' ')}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/8 text-teal">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </span>
        <p className="text-sm font-bold text-ink/80">
          اسحب عدة ملفات هنا، أو اضغط للاختيار
        </p>
        <p className="text-xs text-ink/50">
          سيتم إنشاء ملزمة لكل ملف. عدّل العناوين قبل الرفع.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li
              key={`${f.file.name}-${i}`}
              className={[
                'flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2',
                f.status === 'done'
                  ? 'border-teal/30 bg-teal/5'
                  : f.status === 'error'
                    ? 'border-coral/30 bg-coral/5'
                    : 'border-line bg-paper-soft',
              ].join(' ')}
            >
              <span className="shrink-0 text-xs font-mono text-ink-muted">
                {f.status === 'done' ? '✓' : f.status === 'error' ? '✗' : '⏳'}
              </span>
              <Input
                type="text"
                value={f.title}
                onChange={(e) => updateTitle(i, e.target.value)}
                disabled={f.status !== 'pending'}
                className="min-w-0 flex-1 basis-full text-sm sm:basis-auto"
              />
              <span className="hidden shrink-0 font-mono text-[10px] text-ink-muted sm:block">
                {(f.file.size / 1024 / 1024).toFixed(1)}MB
              </span>
              {f.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label="إزالة"
                  className="shrink-0 text-ink-muted hover:text-coral"
                >
                  <IconClose />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-ink-muted">
            المجموع: {files.length}
            {files.filter((f) => f.status === 'done').length > 0 &&
              ` · تم: ${files.filter((f) => f.status === 'done').length}`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setFiles([])}
              disabled={busy}
            >
              مسح القائمة
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={uploadAll}
              loading={busy}
              disabled={!canUpload}
              icon={<IconSparkles />}
            >
              رفع الكل ({files.filter((f) => f.status === 'pending').length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Main ====================
export function MaterialsSection({ password }: Props) {
  const toast = useToast();
  const confirm = useConfirm();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<LectureNote[]>([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [newForm, setNewForm] = useState<MaterialForm>(emptyForm());
  const [adding, setAdding] = useState(false);
  const [uploadingNew, setUploadingNew] = useState(false);

  // bulk fields
  const [bulkProfessor, setBulkProfessor] = useState('');
  const [bulkTrack, setBulkTrack] = useState<Track | ''>('');
  const [bulkYear, setBulkYear] = useState('');
  const [bulkGroup, setBulkGroup] = useState<Group | ''>('');
  const [bulkLectureStart, setBulkLectureStart] = useState('');
  const [bulkTags, setBulkTags] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MaterialForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploadingEdit, setUploadingEdit] = useState(false);

  const [search, setSearch] = useState('');

  // ===== تحميل =====
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [subjectsRes, materialsRes] = await Promise.all([
        postJson<{ subjects: Subject[] }>('/api/admin/subjects', { password, action: 'list' }),
        postJson<{ materials: LectureNote[] }>('/api/admin/lecture-notes', { password, action: 'list' }),
      ]);
      setSubjects(subjectsRes.subjects ?? []);
      setMaterials(materialsRes.materials ?? []);
      setNewForm((prev) => {
        if (prev.subject_id || !subjectsRes.subjects?.length) return prev;
        return { ...prev, subject_id: subjectsRes.subjects[0].id };
      });
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل تحميل البيانات', 'error');
      setSubjects([]);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [password, toast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const subjectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of subjects) map.set(s.id, s.name);
    return map;
  }, [subjects]);

  // ===== فلترة =====
  const filteredMaterials = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return materials;
    return materials.filter((m) => {
      const subjName = m.subjects?.name ?? subjectNameById.get(m.subject_id) ?? '';
      const haystack = [
        m.title,
        m.professor_name ?? '',
        subjName,
        ...(Array.isArray(m.tags) ? m.tags : []),
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [materials, search, subjectNameById]);

  // ===== رفع =====
  async function uploadFile(file: File, form: MaterialForm): Promise<string> {
    const subjectName = subjectNameById.get(form.subject_id) || 'general';
    const subjectSlug = slugify(subjectName);
    const doctorSlug = form.professor_name.trim() ? slugify(form.professor_name) : 'no-doctor';
    const fileName = `${Date.now()}-${safeFileName(file.name)}`;
    const filePath = `${subjectSlug}/${doctorSlug}/${fileName}`;
    return uploadToStorage('lecture-notes', filePath, file);
  }

  async function handleNewUpload(file: File) {
    setUploadingNew(true);
    try {
      const url = await uploadFile(file, newForm);
      setNewForm((prev) => ({ ...prev, file_path: url }));
      toast.show('تم رفع الملف', 'success');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل رفع الملف', 'error');
    } finally {
      setUploadingNew(false);
    }
  }

  async function handleEditUpload(file: File) {
    setUploadingEdit(true);
    try {
      const url = await uploadFile(file, editForm);
      setEditForm((prev) => ({ ...prev, file_path: url }));
      toast.show('تم رفع الملف', 'success');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل رفع الملف', 'error');
    } finally {
      setUploadingEdit(false);
    }
  }

  // ===== إضافة (single) =====
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid(newForm)) return;
    setAdding(true);
    try {
      await postJson('/api/admin/lecture-notes', {
        password, action: 'add',
        subject_id: newForm.subject_id,
        title: newForm.title.trim(),
        professor_name: newForm.professor_name.trim() || null,
        lecture_number: newForm.lecture_number ? Number(newForm.lecture_number) : null,
        track: newForm.track,
        year: newForm.year ? Number(newForm.year) : null,
        group_name: newForm.group_name || null,
        file_path: newForm.file_path.trim(),
        tags: newForm.tags,
      });
      const keptSubject = newForm.subject_id;
      setNewForm({ ...emptyForm(), subject_id: keptSubject });
      toast.show('تمت إضافة الملزمة', 'success');
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الإضافة', 'error');
    } finally {
      setAdding(false);
    }
  }

  // ===== تعديل =====
  function startEdit(n: LectureNote) { setEditingId(n.id); setEditForm(formFromNote(n)); }
  function cancelEdit() { setEditingId(null); setEditForm(emptyForm()); }

  async function saveEdit(id: string) {
    if (!isFormValid(editForm)) return;
    setSaving(true);
    try {
      await postJson('/api/admin/lecture-notes', {
        password, action: 'edit', id,
        subject_id: editForm.subject_id,
        title: editForm.title.trim(),
        professor_name: editForm.professor_name.trim() || null,
        lecture_number: editForm.lecture_number ? Number(editForm.lecture_number) : null,
        track: editForm.track,
        year: editForm.year ? Number(editForm.year) : null,
        group_name: editForm.group_name || null,
        file_path: editForm.file_path.trim(),
        tags: editForm.tags,
      });
      cancelEdit();
      toast.show('تم الحفظ', 'success');
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  }

  // ===== نسخ =====
  async function handleDuplicate(n: LectureNote) {
    const form = formFromDuplicate(n);
    if (!isFormValid(form)) {
      toast.show('لا يمكن نسخ هذه الملزمة (بيانات ناقصة)', 'error');
      return;
    }
    try {
      await postJson('/api/admin/lecture-notes', {
        password, action: 'add',
        subject_id: form.subject_id,
        title: form.title,
        professor_name: form.professor_name.trim() || null,
        lecture_number: null,
        track: form.track,
        year: form.year ? Number(form.year) : null,
        group_name: form.group_name || null,
        file_path: form.file_path,
        tags: form.tags,
      });
      toast.show('تم إنشاء نسخة — عدّلها الآن', 'success');
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل النسخ', 'error');
    }
  }

  // ===== حذف =====
  async function handleDelete(n: LectureNote) {
    const ok = await confirm(`حذف الملزمة «${n.title}» نهائياً. هل أنت متأكد؟`, {
      variant: 'danger', confirmLabel: 'حذف',
    });
    if (!ok) return;
    try {
      await postJson('/api/admin/lecture-notes', { password, action: 'delete', id: n.id });
      toast.show('تم الحذف', 'success');
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحذف', 'error');
    }
  }

  // ===== Render =====
  return (
    <section>
      {subjects.length === 0 && !loading && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber/8 p-4 text-sm dark:bg-amber/15">
          <span className="text-amber"><IconAlert /></span>
          <p className="font-medium text-ink/70">
            أضف مادة أولاً من تبويب «المواد» حتى تستطيع إضافة الملازم.
          </p>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="mb-4 inline-flex rounded-2xl border border-line bg-white/60 p-1 dark:bg-white/[0.04]">
        <button
          type="button"
          onClick={() => setMode('single')}
          className={[
            'rounded-xl px-4 py-2 text-sm font-bold transition-colors',
            mode === 'single' ? 'bg-teal text-white' : 'text-ink/60 hover:bg-ink/5',
          ].join(' ')}
        >
          إضافة واحدة
        </button>
        <button
          type="button"
          onClick={() => setMode('bulk')}
          className={[
            'rounded-xl px-4 py-2 text-sm font-bold transition-colors',
            mode === 'bulk' ? 'bg-teal text-white' : 'text-ink/60 hover:bg-ink/5',
          ].join(' ')}
        >
          ✨ رفع متعدد
        </button>
      </div>

      {/* Single Form */}
      {mode === 'single' && (
        <form
          onSubmit={handleAdd}
          className="mb-5 space-y-3 rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm dark:bg-paper/80"
        >
          <div className="flex flex-wrap gap-2">
            <Select
              value={newForm.subject_id}
              onChange={(e) => setNewForm({ ...newForm, subject_id: e.target.value })}
              required
              className="w-full sm:w-44"
              disabled={subjects.length === 0}
              aria-label="المادة"
            >
              <option value="">اختر المادة</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select
              value={newForm.track}
              onChange={(e) => setNewForm({ ...newForm, track: e.target.value as Track })}
              required
              className="w-full sm:w-36"
              aria-label="نظري أو عملي"
            >
              <option value="">نظري / عملي</option>
              <option value="نظري">نظري</option>
              <option value="عملي">عملي</option>
            </Select>
            <Select
              value={newForm.group_name}
              onChange={(e) => setNewForm({ ...newForm, group_name: e.target.value as Group | '' })}
              className="w-full sm:w-44"
              aria-label="الكروب"
            >
              <option value="">كل الكروبات</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>{GROUP_LABELS[g]}</option>
              ))}
            </Select>
            <Input
              type="text"
              value={newForm.title}
              onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
              placeholder="اسم الملزمة / المحاضرة"
              required
              maxLength={300}
              className="min-w-0 flex-1 basis-full sm:basis-auto"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Input
              type="text"
              value={newForm.professor_name}
              onChange={(e) => setNewForm({ ...newForm, professor_name: e.target.value })}
              placeholder="اسم الدكتور (اختياري)"
              maxLength={200}
              className="min-w-0 flex-1 basis-full sm:basis-auto"
            />
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={newForm.lecture_number}
              onChange={(e) => setNewForm({ ...newForm, lecture_number: e.target.value })}
              placeholder="رقم المحاضرة"
              className="w-full sm:w-32"
            />
            <Input
              type="number"
              inputMode="numeric"
              min={1990}
              max={2100}
              value={newForm.year}
              onChange={(e) => setNewForm({ ...newForm, year: e.target.value })}
              placeholder="سنة الملزمة"
              className="w-full sm:w-32"
            />
          </div>

          <div className="space-y-2 rounded-2xl border border-dashed border-line bg-paper/40 p-4 dark:bg-white/[0.03]">
            <p className="text-sm font-bold text-ink/70">ملف الملزمة</p>
            {newForm.file_path ? (
              <FilePathPreview
                url={newForm.file_path}
                onRemove={() => setNewForm({ ...newForm, file_path: '' })}
              />
            ) : (
              <>
                <DropZone onFileSelected={handleNewUpload} uploading={uploadingNew} maxSizeMB={50} />
                <p className="text-center text-xs text-ink/50">أو</p>
                <Input
                  type="url"
                  value={newForm.file_path}
                  onChange={(e) => setNewForm({ ...newForm, file_path: e.target.value })}
                  placeholder="الصق رابط تلغرام أو Supabase يدوياً"
                  maxLength={2000}
                />
              </>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-ink/70">الوسوم</label>
            <TagInput
              tags={newForm.tags}
              onChange={(tags) => setNewForm({ ...newForm, tags })}
              suggestions={TAG_SUGGESTIONS}
            />
          </div>

          <Button
            type="submit"
            loading={adding}
            disabled={!isFormValid(newForm) || subjects.length === 0 || uploadingNew}
            className="w-full sm:w-auto"
          >
            إضافة ملزمة
          </Button>
        </form>
      )}

      {/* Bulk Form */}
      {mode === 'bulk' && (
        <div className="mb-5 space-y-4 rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm dark:bg-paper/80">
          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              value={newForm.subject_id}
              onChange={(e) => setNewForm({ ...newForm, subject_id: e.target.value })}
              className="w-full"
              disabled={subjects.length === 0}
              aria-label="المادة"
            >
              <option value="">اختر المادة</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select
              value={bulkTrack}
              onChange={(e) => setBulkTrack(e.target.value as Track | '')}
              className="w-full"
              aria-label="نظري أو عملي"
            >
              <option value="">نظري / عملي</option>
              <option value="نظري">نظري</option>
              <option value="عملي">عملي</option>
            </Select>
          </div>

          <div className="grid gap-2 sm:grid-cols-4">
            <Input
              type="text"
              value={bulkProfessor}
              onChange={(e) => setBulkProfessor(e.target.value)}
              placeholder="اسم الدكتور"
              maxLength={200}
              className="sm:col-span-2"
            />
            <Input
              type="number"
              inputMode="numeric"
              min={1990}
              max={2100}
              value={bulkYear}
              onChange={(e) => setBulkYear(e.target.value)}
              placeholder="السنة"
            />
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={bulkLectureStart}
              onChange={(e) => setBulkLectureStart(e.target.value)}
              placeholder="رقم المحاضرة الأول"
            />
          </div>

          <Select
            value={bulkGroup}
            onChange={(e) => setBulkGroup(e.target.value as Group | '')}
            className="w-full"
            aria-label="الكروب"
          >
            <option value="">كل الكروبات (بدون تحديد)</option>
            {GROUPS.map((g) => (
              <option key={g} value={g}>{GROUP_LABELS[g]}</option>
            ))}
          </Select>

          <div>
            <label className="mb-2 block text-sm font-bold text-ink/70">
              وسوم مشتركة (تُطبَّق على كل الملفات)
            </label>
            <TagInput tags={bulkTags} onChange={setBulkTags} suggestions={TAG_SUGGESTIONS} />
          </div>

          <BulkUploadZone
            subjectId={newForm.subject_id}
            professorName={bulkProfessor}
            track={bulkTrack}
            year={bulkYear}
            group={bulkGroup}
            lectureStart={bulkLectureStart}
            tags={bulkTags}
            password={password}
            subjectNameById={subjectNameById}
            onComplete={loadAll}
          />
        </div>
      )}

      {/* Search */}
      {!loading && materials.length > 0 && (
        <div className="relative mb-4">
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-ink-muted">
            <IconSearch />
          </span>
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالعنوان، الدكتور، المادة، أو وسم…"
            className="pe-10"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute end-10 top-1/2 -translate-y-1/2 rounded text-ink-muted hover:text-ink"
              aria-label="مسح البحث"
            >
              <IconClose />
            </button>
          )}
          {search && (
            <p className="mt-1.5 text-xs text-ink-muted">
              {filteredMaterials.length} من {materials.length}
            </p>
          )}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 skeleton-shimmer rounded-2xl" />)}
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-3xl border border-line bg-white/80 p-12 text-center backdrop-blur-sm dark:bg-paper/80">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/8 text-teal">
            <IconDoc />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد ملازم مضافة حالياً.</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="rounded-3xl border border-line bg-white/80 p-8 text-center dark:bg-paper/80">
          <p className="font-bold text-ink/70">لا نتائج مطابقة لـ «{search}»</p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="mt-2 text-xs font-bold text-teal hover:underline"
          >
            مسح البحث
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMaterials.map((m) => {
            const isEditing = editingId === m.id;
            const noteTags = Array.isArray(m.tags) ? m.tags : [];
            const subjName = m.subjects?.name ?? subjectNameById.get(m.subject_id) ?? '—';

            if (isEditing) {
              return (
                <div key={m.id} className="rounded-2xl border border-teal/30 bg-paper-soft p-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Select
                        value={editForm.subject_id}
                        onChange={(e) => setEditForm({ ...editForm, subject_id: e.target.value })}
                        className="w-full sm:w-44"
                      >
                        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </Select>
                      <Select
                        value={editForm.track}
                        onChange={(e) => setEditForm({ ...editForm, track: e.target.value as Track })}
                        className="w-full sm:w-36"
                      >
                        <option value="">نظري / عملي</option>
                        <option value="نظري">نظري</option>
                        <option value="عملي">عملي</option>
                      </Select>
                      <Select
                        value={editForm.group_name}
                        onChange={(e) => setEditForm({ ...editForm, group_name: e.target.value as Group | '' })}
                        className="w-full sm:w-44"
                      >
                        <option value="">كل الكروبات</option>
                        {GROUPS.map((g) => (
                          <option key={g} value={g}>{GROUP_LABELS[g]}</option>
                        ))}
                      </Select>
                      <Input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        maxLength={300}
                        className="min-w-0 flex-1 basis-full sm:basis-auto"
                        autoFocus
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Input
                        type="text"
                        value={editForm.professor_name}
                        onChange={(e) => setEditForm({ ...editForm, professor_name: e.target.value })}
                        placeholder="اسم الدكتور"
                        maxLength={200}
                        className="min-w-0 flex-1 basis-full sm:basis-auto"
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={editForm.lecture_number}
                        onChange={(e) => setEditForm({ ...editForm, lecture_number: e.target.value })}
                        placeholder="رقم المحاضرة"
                        className="w-full sm:w-32"
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1990}
                        max={2100}
                        value={editForm.year}
                        onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                        placeholder="سنة الملزمة"
                        className="w-full sm:w-32"
                      />
                    </div>
                    <div className="space-y-2 rounded-2xl border border-dashed border-line bg-paper/40 p-4 dark:bg-white/[0.03]">
                      <p className="text-sm font-bold text-ink/70">ملف الملزمة</p>
                      {editForm.file_path ? (
                        <FilePathPreview
                          url={editForm.file_path}
                          onRemove={() => setEditForm({ ...editForm, file_path: '' })}
                        />
                      ) : (
                        <>
                          <DropZone onFileSelected={handleEditUpload} uploading={uploadingEdit} maxSizeMB={50} />
                          <p className="text-center text-xs text-ink/50">أو</p>
                          <Input
                            type="url"
                            value={editForm.file_path}
                            onChange={(e) => setEditForm({ ...editForm, file_path: e.target.value })}
                            placeholder="الصق رابطاً"
                            maxLength={2000}
                          />
                        </>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-ink/70">الوسوم</label>
                      <TagInput
                        tags={editForm.tags}
                        onChange={(tags) => setEditForm({ ...editForm, tags })}
                        suggestions={TAG_SUGGESTIONS}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveEdit(m.id)}
                        loading={saving}
                        disabled={!isFormValid(editForm) || uploadingEdit}
                      >
                        حفظ
                      </Button>
                      <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={saving}>
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-paper-soft p-4 transition-all duration-200 hover:border-teal/25 dark:bg-paper/80"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-bold text-ink">{m.title}</span>
                    <span className="rounded-full bg-teal/8 px-2 py-0.5 font-mono text-xs text-teal/70 dark:bg-teal/15 dark:text-teal">
                      {subjName}
                    </span>
                    {m.track && (
                      <span className="rounded-full bg-amber/15 px-2 py-0.5 font-mono text-xs text-amber-800 dark:bg-amber/25 dark:text-amber-300">
                        {m.track}
                      </span>
                    )}
                    <GroupBadge group={m.group_name} />
                    {m.year != null && (
                      <span className="rounded-md bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink/50 dark:bg-white/10">
                        {m.year}
                      </span>
                    )}
                  </div>
                  {(m.professor_name || m.lecture_number != null) && (
                    <p className="mt-1 text-sm text-ink/50">
                      {m.professor_name && `د. ${m.professor_name}`}
                      {m.professor_name && m.lecture_number != null && ' · '}
                      {m.lecture_number != null && `محاضرة ${m.lecture_number}`}
                    </p>
                  )}
                  <TagsPreview tags={noteTags} />
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => handleDuplicate(m)} icon={<IconDuplicate />}>
                    نسخ
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => startEdit(m)} icon={<IconEdit />}>
                    تعديل
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(m)} icon={<IconTrash />}>
                    حذف
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}