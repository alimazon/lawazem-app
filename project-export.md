
## AGENTS.md

```
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

```

## app\admin\_components\ChannelsSection.tsx

```
// app/admin/_components/ChannelsSection.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { postJson } from '@/lib/api-client';
import { STAGES } from '@/lib/constants';
import type { Channel, Stage } from '@/lib/types';

interface Props { password: string }

interface ChannelForm {
  name: string;
  stage: Stage | '';
  description: string;
  telegram_link: string;
  channel_password: string;
}

function emptyForm(): ChannelForm {
  return { name: '', stage: '', description: '', telegram_link: '', channel_password: '' };
}
function formFromChannel(c: Channel): ChannelForm {
  return {
    name: c.name,
    stage: c.stage,
    description: c.description ?? '',
    telegram_link: c.telegram_link,
    channel_password: c.channel_password ?? '',
  };
}
function isFormValid(f: ChannelForm): boolean {
  return f.name.trim() !== '' && f.stage !== '' && f.telegram_link.trim() !== '';
}
function generateChannelPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function IconChat() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
function IconSparkles() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.show('فشل النسخ — يرجى النسخ يدوياً', 'error');
    }
  }
  return (
    <Button type="button" variant="secondary" size="xs" onClick={handleCopy} icon={<IconCopy />}>
      {copied ? 'تم' : 'نسخ'}
    </Button>
  );
}

function PasswordField({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={200}
        className="min-w-[160px] flex-1 font-mono"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange(generateChannelPassword())}
        icon={<IconSparkles />}
      >
        توليد
      </Button>
      {value && <CopyButton value={value} />}
    </div>
  );
}

export function ChannelsSection({ password }: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [newForm, setNewForm] = useState<ChannelForm>(emptyForm());
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ChannelForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await postJson<{ channels: Channel[] }>('/api/admin/channels', { password, action: 'list' });
      setChannels(data.channels ?? []);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل تحميل القنوات', 'error');
      setChannels([]);
    } finally { setLoading(false); }
  }, [password, toast]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid(newForm)) return;
    setAdding(true);
    try {
      await postJson('/api/admin/channels', {
        password, action: 'add',
        name: newForm.name.trim(),
        stage: newForm.stage,
        description: newForm.description.trim() || null,
        telegram_link: newForm.telegram_link.trim(),
        channel_password: newForm.channel_password.trim() || null,
      });
      setNewForm(emptyForm());
      toast.show('تمت إضافة القناة', 'success');
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الإضافة', 'error');
    } finally { setAdding(false); }
  }

  function startEdit(c: Channel) { setEditingId(c.id); setEditForm(formFromChannel(c)); }
  function cancelEdit() { setEditingId(null); setEditForm(emptyForm()); }

  async function saveEdit(id: string) {
    if (!isFormValid(editForm)) return;
    setSaving(true);
    try {
      await postJson('/api/admin/channels', {
        password, action: 'edit', id,
        name: editForm.name.trim(),
        stage: editForm.stage,
        description: editForm.description.trim() || null,
        telegram_link: editForm.telegram_link.trim(),
        channel_password: editForm.channel_password.trim() || null,
      });
      cancelEdit();
      toast.show('تم الحفظ', 'success');
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحفظ', 'error');
    } finally { setSaving(false); }
  }

  async function handleDelete(c: Channel) {
    const ok = await confirm(`حذف القناة «${c.name}» نهائياً. هل أنت متأكد؟`, { variant: 'danger', confirmLabel: 'حذف' });
    if (!ok) return;
    try {
      await postJson('/api/admin/channels', { password, action: 'delete', id: c.id });
      toast.show('تم الحذف', 'success');
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحذف', 'error');
    }
  }

  return (
    <section>
      <form
        onSubmit={handleAdd}
        className="mb-5 space-y-3 rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm dark:bg-paper/80"
      >
        <div className="flex flex-wrap gap-2">
          <Input
            type="text"
            value={newForm.name}
            onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
            placeholder="اسم القناة"
            required
            maxLength={200}
            className="min-w-[200px] flex-1"
          />
          <Select
            value={newForm.stage}
            onChange={(e) => setNewForm({ ...newForm, stage: e.target.value as Stage | '' })}
            required
            className="w-44"
            aria-label="المرحلة"
          >
            <option value="">اختر المرحلة</option>
            {STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
          </Select>
        </div>
        <Input
          type="text"
          value={newForm.description}
          onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
          placeholder="وصف قصير (اختياري)"
          maxLength={1000}
        />
        <Input
          type="url"
          value={newForm.telegram_link}
          onChange={(e) => setNewForm({ ...newForm, telegram_link: e.target.value })}
          placeholder="رابط تلغرام (https://t.me/channelname)"
          required
          maxLength={500}
        />
        <PasswordField
          value={newForm.channel_password}
          onChange={(v) => setNewForm({ ...newForm, channel_password: v })}
          placeholder="كلمة مرور القناة"
        />
        <Button type="submit" loading={adding} disabled={!isFormValid(newForm)}>إضافة قناة</Button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-28 skeleton-shimmer rounded-2xl" />)}
        </div>
      ) : channels.length === 0 ? (
        <div className="rounded-3xl border border-line bg-white/80 p-12 text-center backdrop-blur-sm dark:bg-paper/80">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/8 text-teal">
            <IconChat />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد قنوات مضافة حالياً.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {channels.map((c) => {
            const isEditing = editingId === c.id;
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-200 hover:border-teal/20 dark:bg-paper/80 dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.30)]"
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        maxLength={200}
                        className="min-w-[180px] flex-1"
                        autoFocus
                      />
                      <Select
                        value={editForm.stage}
                        onChange={(e) => setEditForm({ ...editForm, stage: e.target.value as Stage | '' })}
                        className="w-44"
                        aria-label="المرحلة"
                      >
                        {STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
                      </Select>
                    </div>
                    <Input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="الوصف"
                      maxLength={1000}
                    />
                    <Input
                      type="url"
                      value={editForm.telegram_link}
                      onChange={(e) => setEditForm({ ...editForm, telegram_link: e.target.value })}
                      placeholder="رابط تلغرام"
                      maxLength={500}
                    />
                    <PasswordField
                      value={editForm.channel_password}
                      onChange={(v) => setEditForm({ ...editForm, channel_password: v })}
                      placeholder="كلمة مرور القناة"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(c.id)} loading={saving} disabled={!isFormValid(editForm)}>حفظ</Button>
                      <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={saving}>إلغاء</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-bold text-ink">{c.name}</span>
                        <span className="rounded-full bg-teal/8 px-2 py-0.5 font-mono text-xs text-teal/70 dark:bg-teal/15 dark:text-teal">
                          {c.stage}
                        </span>
                      </div>
                      {c.description && (
                        <p className="mt-1 text-sm text-ink/55">{c.description}</p>
                      )}
                      <a
                        href={c.telegram_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block break-all text-sm font-medium text-teal underline decoration-teal/40 underline-offset-4 hover:text-teal/80"
                      >
                        {c.telegram_link}
                      </a>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-ink/50">كلمة المرور:</span>
                        <code className="rounded-md bg-ink/5 px-2 py-0.5 font-mono text-ink/80 dark:bg-white/10 dark:text-ink/90">
                          {c.channel_password || 'غير محددة'}
                        </code>
                        {c.channel_password && <CopyButton value={c.channel_password} />}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => startEdit(c)} icon={<IconEdit />}>
                        تعديل
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(c)} icon={<IconTrash />}>
                        حذف
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

## app\admin\_components\MaterialsSection.tsx

```
// app/admin/_components/MaterialsSection.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { TagInput } from '@/components/ui/TagInput';
import { DropZone } from '@/components/ui/DropZone';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { postJson, uploadToStorage } from '@/lib/api-client';
import type { LectureNote, Subject, Track } from '@/lib/types';

interface Props { password: string }

interface MaterialForm {
  subject_id: string;
  title: string;
  professor_name: string;
  lecture_number: string;
  track: Track | '';
  year: string;                    // ← جديد
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
    year: '',                      // ← جديد
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
    year: n.year != null ? String(n.year) : '',   // ← جديد
    file_path: n.file_path,
    tags: Array.isArray(n.tags) ? n.tags : [],
  };
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

const TAG_SUGGESTIONS = [
  'نظري',
  'عملي',
  'محاضرة',
  'ملخص',
  'أساسيات',
  'مراجعة',
  'سلايدات',
  'امتحان',
  'واجب',
  'فاينل',
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

// ==================== Tags Preview ====================
function TagsPreview({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="rounded-md bg-teal/8 px-1.5 py-0.5 text-[10px] font-bold text-teal/80 dark:bg-teal/15 dark:text-teal"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}

// ==================== File Path Preview ====================
function FilePathPreview({
  url,
  onRemove,
}: {
  url: string;
  onRemove: () => void;
}) {
  const fileName = url.split('/').pop() || url;
  const isTelegram = url.includes('t.me');

  return (
    <div className="flex items-center gap-2 rounded-xl border border-teal/20 bg-teal/5 px-3 py-2.5 dark:border-teal/30 dark:bg-teal/15">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-teal text-white">
        {isTelegram ? (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
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

export function MaterialsSection({ password }: Props) {
  const toast = useToast();
  const confirm = useConfirm();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<LectureNote[]>([]);
  const [loading, setLoading] = useState(true);

  const [newForm, setNewForm] = useState<MaterialForm>(emptyForm());
  const [adding, setAdding] = useState(false);
  const [uploadingNew, setUploadingNew] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MaterialForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploadingEdit, setUploadingEdit] = useState(false);

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

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const subjectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of subjects) map.set(s.id, s.name);
    return map;
  }, [subjects]);

  // ===== رفع ملف =====
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

  // ===== إضافة =====
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
        year: newForm.year ? Number(newForm.year) : null,   // ← جديد
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
  function startEdit(n: LectureNote) {
    setEditingId(n.id);
    setEditForm(formFromNote(n));
  }
  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyForm());
  }

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
        year: editForm.year ? Number(editForm.year) : null, // ← جديد
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

  // ===== حذف =====
  async function handleDelete(n: LectureNote) {
    const ok = await confirm(`حذف الملزمة «${n.title}» نهائياً. هل أنت متأكد؟`, {
      variant: 'danger',
      confirmLabel: 'حذف',
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

      {/* ==================== نموذج الإضافة ==================== */}
      <form
        onSubmit={handleAdd}
        className="mb-5 space-y-3 rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm dark:bg-paper/80"
      >
        <div className="flex flex-wrap gap-2">
          <Select
            value={newForm.subject_id}
            onChange={(e) => setNewForm({ ...newForm, subject_id: e.target.value })}
            required
            className="w-44"
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
            className="w-36"
            aria-label="نظري أو عملي"
          >
            <option value="">نظري / عملي</option>
            <option value="نظري">نظري</option>
            <option value="عملي">عملي</option>
          </Select>
          <Input
            type="text"
            value={newForm.title}
            onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
            placeholder="اسم الملزمة / المحاضرة"
            required
            maxLength={300}
            className="min-w-[200px] flex-1"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            type="text"
            value={newForm.professor_name}
            onChange={(e) => setNewForm({ ...newForm, professor_name: e.target.value })}
            placeholder="اسم الدكتور (اختياري)"
            maxLength={200}
            className="min-w-[180px] flex-1"
          />
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={newForm.lecture_number}
            onChange={(e) => setNewForm({ ...newForm, lecture_number: e.target.value })}
            placeholder="رقم المحاضرة"
            className="w-32"
          />
          <Input
            type="number"
            inputMode="numeric"
            min={1990}
            max={2100}
            value={newForm.year}
            onChange={(e) => setNewForm({ ...newForm, year: e.target.value })}
            placeholder="سنة الملزمة"
            className="w-32"
          />
        </div>

        {/* ===== الملف: Drag & Drop أو رابط ===== */}
        <div className="space-y-2 rounded-2xl border border-dashed border-line bg-paper/40 p-4 dark:bg-white/[0.03]">
          <p className="text-sm font-bold text-ink/70">ملف الملزمة</p>

          {newForm.file_path ? (
            <FilePathPreview
              url={newForm.file_path}
              onRemove={() => setNewForm({ ...newForm, file_path: '' })}
            />
          ) : (
            <>
              <DropZone
                onFileSelected={handleNewUpload}
                uploading={uploadingNew}
                maxSizeMB={50}
              />
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

        {/* ===== الوسوم ===== */}
        <div>
          <label className="mb-2 block text-sm font-bold text-ink/70">الوسوم (Tags)</label>
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
        >
          إضافة ملزمة
        </Button>
      </form>

      {/* ==================== قائمة الملازم ==================== */}
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
      ) : (
        <div className="space-y-2">
          {materials.map((m) => {
            const isEditing = editingId === m.id;
            const noteTags = Array.isArray(m.tags) ? m.tags : [];

            return (
              <div
                key={m.id}
                className="rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-200 hover:border-teal/20 dark:bg-paper/80 dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.30)]"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Select
                        value={editForm.subject_id}
                        onChange={(e) => setEditForm({ ...editForm, subject_id: e.target.value })}
                        className="w-44"
                        aria-label="المادة"
                      >
                        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </Select>
                      <Select
                        value={editForm.track}
                        onChange={(e) => setEditForm({ ...editForm, track: e.target.value as Track })}
                        className="w-36"
                        aria-label="نظري أو عملي"
                      >
                        <option value="">نظري / عملي</option>
                        <option value="نظري">نظري</option>
                        <option value="عملي">عملي</option>
                      </Select>
                      <Input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        maxLength={300}
                        className="min-w-[180px] flex-1"
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
                        className="min-w-[180px] flex-1"
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={editForm.lecture_number}
                        onChange={(e) => setEditForm({ ...editForm, lecture_number: e.target.value })}
                        placeholder="رقم المحاضرة"
                        className="w-32"
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1990}
                        max={2100}
                        value={editForm.year}
                        onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                        placeholder="سنة الملزمة"
                        className="w-32"
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
                          <DropZone
                            onFileSelected={handleEditUpload}
                            uploading={uploadingEdit}
                            maxSizeMB={50}
                          />
                          <p className="text-center text-xs text-ink/50">أو</p>
                          <Input
                            type="url"
                            value={editForm.file_path}
                            onChange={(e) => setEditForm({ ...editForm, file_path: e.target.value })}
                            placeholder="الصق رابط تلغرام أو Supabase يدوياً"
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

                    <div className="flex gap-2">
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
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-bold text-ink">{m.title}</span>
                        <span className="rounded-full bg-teal/8 px-2 py-0.5 font-mono text-xs text-teal/70 dark:bg-teal/15 dark:text-teal">
                          {m.subjects?.name ?? subjectNameById.get(m.subject_id) ?? '—'}
                        </span>
                        {m.track && (
                          <span className="rounded-full bg-amber/15 px-2 py-0.5 font-mono text-xs text-amber-800 dark:bg-amber/25 dark:text-amber-300">
                            {m.track}
                          </span>
                        )}
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
                    <div className="flex flex-shrink-0 gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => startEdit(m)} icon={<IconEdit />}>
                        تعديل
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(m)} icon={<IconTrash />}>
                        حذف
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

## app\admin\_components\ReportsSection.tsx

```
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

  // تجميع البلاغات حسب الملزمة (لحساب الأكثر تكراراً)
  const duplicateNoteIds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of reports) {
      counts.set(r.lecture_note_id, (counts.get(r.lecture_note_id) ?? 0) + 1);
    }
    return counts;
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
```

## app\admin\_components\SchedulesSection.tsx

```
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
      toast.show(`حجم الصورة كبير جداً (بحد أقصى ${MAX_FILE_SIZE_MB} ميجا).`, 'error');
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
    <div className="overflow-hidden rounded-3xl border border-line bg-white/80 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-200 hover:border-teal/20 dark:bg-paper/80 dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.30)]">
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
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            تعذّر تحميل الصورة الحالية.
            <button type="button" onClick={openFilePicker} className="mr-2 font-bold underline">
              رفع صورة جديدة
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            disabled={uploading}
            className="group flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-paper/50 py-10 transition-all duration-200 hover:border-teal/40 hover:bg-teal/[0.03] disabled:opacity-60 dark:bg-white/[0.03] dark:hover:bg-teal/10"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/8 text-teal transition-all group-hover:bg-teal/15">
              <IconImage />
            </span>
            <span className="text-sm font-bold text-ink/70">رفع صورة الجدول</span>
            <span className="text-xs text-ink/40">
              PNG / JPG / WebP — بحد أقصى {MAX_FILE_SIZE_MB} ميجا
            </span>
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
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-teal/5 px-3 py-2 text-sm dark:bg-teal/15">
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
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-teal/20 bg-teal/[0.04] p-4 text-sm dark:border-teal/30 dark:bg-teal/10">
        <span className="text-teal"><IconCalendar /></span>
        <p className="font-medium text-ink/70">
          ارفع صورة جدول المحاضرات لكل مرحلة، وستظهر للطلاب مباشرة في صفحة «الجدول».
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
```

## app\admin\_components\SubjectsSection.tsx

```
// app/admin/_components/SubjectsSection.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { postJson } from '@/lib/api-client';
import { STAGES } from '@/lib/constants';
import type { Stage, Subject } from '@/lib/types';

interface Props { password: string }

function IconBook() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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

export function SubjectsSection({ password }: Props) {
  const toast = useToast();
  const confirm = useConfirm();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [stage, setStage] = useState<Stage | ''>('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStage, setEditStage] = useState<Stage | ''>('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await postJson<{ subjects: Subject[] }>('/api/admin/subjects', { password, action: 'list' });
      setSubjects(data.subjects ?? []);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل تحميل المواد', 'error');
      setSubjects([]);
    } finally { setLoading(false); }
  }, [password, toast]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !stage) return;
    setAdding(true);
    try {
      await postJson('/api/admin/subjects', { password, action: 'add', name: name.trim(), stage });
      setName(''); setStage('');
      toast.show('تمت إضافة المادة', 'success');
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الإضافة', 'error');
    } finally { setAdding(false); }
  }

  function startEdit(s: Subject) {
    setEditingId(s.id); setEditName(s.name); setEditStage(s.stage);
  }
  function cancelEdit() {
    setEditingId(null); setEditName(''); setEditStage('');
  }

  async function saveEdit(id: string) {
    if (!editName.trim() || !editStage) return;
    setSaving(true);
    try {
      await postJson('/api/admin/subjects', { password, action: 'edit', id, name: editName.trim(), stage: editStage });
      cancelEdit();
      toast.show('تم الحفظ', 'success');
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحفظ', 'error');
    } finally { setSaving(false); }
  }

  async function handleDelete(s: Subject) {
    const ok = await confirm(`حذف مادة «${s.name}» سيحذف كل الملازم والأسئلة المرتبطة بها نهائيًا. هل أنت متأكد؟`, { variant: 'danger', confirmLabel: 'حذف' });
    if (!ok) return;
    try {
      await postJson('/api/admin/subjects', { password, action: 'delete', id: s.id });
      toast.show('تم الحذف', 'success');
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحذف', 'error');
    }
  }

  return (
    <section>
      <form
        onSubmit={handleAdd}
        className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm dark:bg-paper/80"
      >
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم المادة الجديدة"
          required
          maxLength={200}
          className="min-w-[200px] flex-1"
        />
        <Select
          value={stage}
          onChange={(e) => setStage(e.target.value as Stage | '')}
          required
          className="w-44"
          aria-label="المرحلة"
        >
          <option value="">اختر المرحلة</option>
          {STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
        </Select>
        <Button type="submit" loading={adding} disabled={!name.trim() || !stage}>إضافة</Button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 skeleton-shimmer rounded-2xl" />)}
        </div>
      ) : subjects.length === 0 ? (
        <div className="rounded-3xl border border-line bg-white/80 p-12 text-center backdrop-blur-sm dark:bg-paper/80">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/8 text-teal">
            <IconBook />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد مواد مضافة حالياً.</p>
          <p className="mt-1 text-sm text-ink/50">أضف أول مادة من الأعلى</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subjects.map((s) => {
            const isEditing = editingId === s.id;
            return (
              <div
                key={s.id}
                className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-200 hover:border-teal/20 hover:shadow-[0_4px_16px_rgba(14,74,74,0.06)] dark:bg-paper/80 dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.30)]"
              >
                {isEditing ? (
                  <>
                    <Input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={200}
                      className="min-w-[180px] flex-1"
                      autoFocus
                    />
                    <Select
                      value={editStage}
                      onChange={(e) => setEditStage(e.target.value as Stage | '')}
                      className="w-44"
                      aria-label="المرحلة"
                    >
                      {STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </Select>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(s.id)} loading={saving} disabled={!editName.trim() || !editStage}>حفظ</Button>
                      <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={saving}>إلغاء</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-bold text-ink">{s.name}</span>
                        <span className="rounded-full bg-teal/8 px-2 py-0.5 font-mono text-xs text-teal/70 dark:bg-teal/15 dark:text-teal">{s.stage}</span>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => startEdit(s)} icon={<IconEdit />}>
                        تعديل
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(s)} icon={<IconTrash />}>
                        حذف
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

## app\admin\_components\useAdminAuth.ts

```
// app/admin/_components/useAdminAuth.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { postJson, ApiError } from '@/lib/api-client';
import { STORAGE_KEYS } from '@/lib/constants';

interface UseAdminAuthResult {
  password: string;
  authenticated: boolean;
  loading: boolean;
  error: string;
  login: (pw: string) => Promise<boolean>;
  logout: () => void;
}

export function useAdminAuth(): UseAdminAuthResult {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (pw: string): Promise<boolean> => {
    const trimmed = pw.trim();
    if (!trimmed) {
      setError('أدخل كلمة المرور');
      return false;
    }
    setLoading(true);
    setError('');
    try {
      await postJson('/api/admin/subjects', { password: trimmed, action: 'list' });
      sessionStorage.setItem(STORAGE_KEYS.adminPassword, trimmed);
      setPassword(trimmed);
      setAuthenticated(true);
      return true;
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 401
          ? 'كلمة المرور غير صحيحة'
          : 'صار خطأ، حاول مرة ثانية.';
      setError(message);
      sessionStorage.removeItem(STORAGE_KEYS.adminPassword);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.adminPassword);
    setPassword('');
    setAuthenticated(false);
    setError('');
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.adminPassword);
    if (saved) login(saved);
  }, [login]);

  return { password, authenticated, loading, error, login, logout };
}
```

## app\admin\page.tsx

```
// app/admin/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useAdminAuth } from './_components/useAdminAuth';
import { SubjectsSection } from './_components/SubjectsSection';
import { MaterialsSection } from './_components/MaterialsSection';
import { ChannelsSection } from './_components/ChannelsSection';
import { SchedulesSection } from './_components/SchedulesSection';
import { ReportsSection } from './_components/ReportsSection';

type Tab = 'subjects' | 'materials' | 'channels' | 'schedules' | 'reports';

const TABS: ReadonlyArray<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'subjects', label: 'المواد', icon: <IconBook /> },
  { id: 'materials', label: 'الملازم', icon: <IconDoc /> },
  { id: 'channels', label: 'القنوات', icon: <IconChat /> },
  { id: 'schedules', label: 'الجدول', icon: <IconCalendar /> },
  { id: 'reports', label: 'البلاغات', icon: <IconReport /> },   // ← جديد
];

// ==================== Icons ====================
function IconBook() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function IconReport() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

// ==================== Login Screen ====================
function LoginScreen({
  loading,
  error,
  onLogin,
}: {
  loading: boolean;
  error: string;
  onLogin: (pw: string) => void;
}) {
  const [pw, setPw] = useState('');

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-70px)] max-w-sm flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-3xl border border-line bg-white/80 p-8 shadow-[0_8px_30px_rgba(14,74,74,0.08)] backdrop-blur-sm animate-slide-up dark:bg-paper/80 dark:shadow-[0_8px_30px_rgba(0,0,0,0.40)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-teal">
          <IconLock />
        </div>
        <h1 className="mt-5 text-center text-2xl font-black text-ink">دخول المشرف</h1>
        <p className="mt-2 text-center text-sm text-ink/55">
          أدخل كلمة مرور المشرف للوصول إلى لوحة التحكم
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin(pw);
          }}
          className="mt-6 space-y-4"
        >
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="كلمة المرور"
            autoComplete="current-password"
            required
            autoFocus
            className="text-center"
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-bold text-red-600 dark:bg-red-950/40 dark:text-red-300" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" loading={loading} className="w-full">
            {loading ? 'جاري التحقق...' : 'دخول'}
          </Button>
        </form>
      </div>
    </main>
  );
}

// ==================== Page ====================
export default function AdminPage() {
  const { password, authenticated, loading, error, login, logout } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('subjects');

  if (!authenticated) {
    return <LoginScreen loading={loading} error={error} onLogin={login} />;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 animate-slide-up">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
            مشرف
          </span>
          <h1 className="mt-3 text-3xl font-black text-ink sm:text-4xl">لوحة التحكم</h1>
        </div>
        <Button variant="secondary" size="sm" onClick={logout} icon={<IconLogout />}>
          تسجيل الخروج
        </Button>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="أقسام لوحة التحكم"
        className="mt-6 flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-white/60 p-1.5 backdrop-blur-sm [-ms-overflow-style:none] [scrollbar-width:none] sm:overflow-visible dark:bg-white/[0.04] [&::-webkit-scrollbar]:hidden animate-slide-up"
        style={{ animationDelay: '80ms' }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                active
                  ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.30)]'
                  : 'text-ink/60 hover:bg-ink/5 hover:text-ink dark:hover:bg-white/5'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        className="mt-6 animate-slide-up"
        style={{ animationDelay: '120ms' }}
        aria-label={TABS.find((t) => t.id === tab)?.label}
      >
        {tab === 'subjects' && <SubjectsSection password={password} />}
        {tab === 'materials' && <MaterialsSection password={password} />}
        {tab === 'channels' && <ChannelsSection password={password} />}
        {tab === 'schedules' && <SchedulesSection password={password} />}
        {tab === 'reports' && <ReportsSection password={password} />}
      </div>
    </main>
  );
}
```

## app\api\admin\channels\route.ts

```
// app/api/admin/channels/route.ts
import { NextResponse } from 'next/server';
import { adminGuard, jsonError, safeOptionalString, safeString } from '@/lib/api-server';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const guard = adminGuard(body.password);
  if (!guard.ok) return guard.response;
  const { supabaseAdmin } = guard;

  const action = typeof body.action === 'string' ? body.action : '';

  switch (action) {
    case 'list': {
      const { data, error } = await supabaseAdmin
        .from('channels')
        .select('*')
        .order('created_at');

      if (error) {
        console.error('channels list error:', error.message);
        return jsonError('فشل تحميل القنوات', 500);
      }
      return NextResponse.json({ channels: data ?? [] });
    }

    case 'add': {
      const name = safeString(body.name, 200);
      const stage = safeString(body.stage, 100);
      const description = safeOptionalString(body.description, 1000);
      const telegram_link = safeString(body.telegram_link, 500);
      const channel_password = safeOptionalString(body.channel_password, 200);

      if (!name) return jsonError('اسم القناة مطلوب');
      if (!stage) return jsonError('المرحلة مطلوبة');
      if (!telegram_link) return jsonError('رابط تليكرام مطلوب');

      const { error } = await supabaseAdmin.from('channels').insert({
        name,
        stage,
        description,
        telegram_link,
        channel_password,
      });

      if (error) {
        console.error('channels add error:', error.message);
        return jsonError('فشل إضافة القناة', 500);
      }
      return NextResponse.json({ success: true });
    }

    case 'edit': {
      const id = safeString(body.id, 100);
      const name = safeString(body.name, 200);
      const stage = safeString(body.stage, 100);
      const description = safeOptionalString(body.description, 1000);
      const telegram_link = safeString(body.telegram_link, 500);
      const channel_password = safeOptionalString(body.channel_password, 200);

      if (!id) return jsonError('id مطلوب');
      if (!name) return jsonError('اسم القناة مطلوب');
      if (!stage) return jsonError('المرحلة مطلوبة');
      if (!telegram_link) return jsonError('رابط تليكرام مطلوب');

      const { error } = await supabaseAdmin
        .from('channels')
        .update({
          name,
          stage,
          description,
          telegram_link,
          channel_password,
        })
        .eq('id', id);

      if (error) {
        console.error('channels edit error:', error.message);
        return jsonError('فشل تعديل القناة', 500);
      }
      return NextResponse.json({ success: true });
    }

    case 'delete': {
      const id = safeString(body.id, 100);
      if (!id) return jsonError('id مطلوب');

      const { error } = await supabaseAdmin.from('channels').delete().eq('id', id);

      if (error) {
        console.error('channels delete error:', error.message);
        return jsonError('فشل حذف القناة', 500);
      }
      return NextResponse.json({ success: true });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}
```

## app\api\admin\lecture-notes\route.ts

```
// app/api/admin/lecture-notes/route.ts
import { NextResponse } from 'next/server';
import { adminGuard, jsonError, safeOptionalString, safeString } from '@/lib/api-server';
import type { Track } from '@/lib/types';

function parseLectureNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

function parseYear(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 1990 || n > 2100) return null;
  return Math.floor(n);
}

function parseTrack(value: unknown): Track | null {
  if (value === 'نظري' || value === 'عملي') return value;
  return null;
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const cleaned = value
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= 50)
    .slice(0, 10);
  return Array.from(new Set(cleaned));
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const guard = adminGuard(body.password);
  if (!guard.ok) return guard.response;
  const { supabaseAdmin } = guard;

  const action = typeof body.action === 'string' ? body.action : '';

  switch (action) {
    // ==================== list ====================
    case 'list': {
      const { data, error } = await supabaseAdmin
        .from('lecture_notes')
        .select('*, subjects(name)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('lecture-notes list error:', error.message);
        return jsonError('فشل تحميل الملازم', 500);
      }
      return NextResponse.json({ materials: data ?? [] });
    }

    // ==================== add ====================
    case 'add': {
      const subject_id = safeString(body.subject_id, 100);
      const title = safeString(body.title, 300);
      const professor_name = safeOptionalString(body.professor_name, 200);
      const lecture_number = parseLectureNumber(body.lecture_number);
      const track = parseTrack(body.track);
      const tags = parseTags(body.tags);
      const year = parseYear(body.year);                    // ← جديد
      const file_path = safeString(body.file_path, 2000);

      if (!subject_id) return jsonError('اختر المادة');
      if (!title) return jsonError('عنوان الملزمة مطلوب');
      if (!track) return jsonError('اختر نظري أو عملي');
      if (!file_path) return jsonError('رابط الملف مطلوب');

      const { error } = await supabaseAdmin.from('lecture_notes').insert({
        subject_id,
        title,
        professor_name,
        lecture_number,
        track,
        tags,
        year,                                                // ← جديد
        file_path,
        status: 'approved',
      });

      if (error) {
        console.error('lecture-notes add error:', error.message);
        return jsonError('فشل إضافة الملزمة', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== edit ====================
    case 'edit': {
      const id = safeString(body.id, 100);
      const subject_id = safeString(body.subject_id, 100);
      const title = safeString(body.title, 300);
      const professor_name = safeOptionalString(body.professor_name, 200);
      const lecture_number = parseLectureNumber(body.lecture_number);
      const track = parseTrack(body.track);
      const tags = parseTags(body.tags);
      const year = parseYear(body.year);                    // ← جديد
      const file_path = safeString(body.file_path, 2000);

      if (!id) return jsonError('id مطلوب');
      if (!subject_id) return jsonError('اختر المادة');
      if (!title) return jsonError('عنوان الملزمة مطلوب');
      if (!track) return jsonError('اختر نظري أو عملي');
      if (!file_path) return jsonError('رابط الملف مطلوب');

      const { error } = await supabaseAdmin
        .from('lecture_notes')
        .update({
          subject_id,
          title,
          professor_name,
          lecture_number,
          track,
          tags,
          year,                                              // ← جديد
          file_path,
        })
        .eq('id', id);

      if (error) {
        console.error('lecture-notes edit error:', error.message);
        return jsonError('فشل تعديل الملزمة', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== delete ====================
    case 'delete': {
      const id = safeString(body.id, 100);
      if (!id) return jsonError('id مطلوب');

      const { error } = await supabaseAdmin
        .from('lecture_notes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('lecture-notes delete error:', error.message);
        return jsonError('فشل حذف الملزمة', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== reports_list (جديد) ====================
    case 'reports_list': {
      const { data, error } = await supabaseAdmin
        .from('lecture_note_reports')
        .select(`
          id,
          lecture_note_id,
          reason,
          note,
          created_at,
          resolved_at,
          resolved_action,
          lecture_notes(
            id,
            title,
            subject_id,
            professor_name,
            year,
            file_path,
            subjects(name)
          )
        `)
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('reports_list error:', error.message);
        return jsonError('فشل تحميل البلاغات', 500);
      }
      return NextResponse.json({ reports: data ?? [] });
    }

    // ==================== report_resolve (جديد) ====================
    case 'report_resolve': {
      const id = safeString(body.id, 100);
      const resolved_action = body.resolved_action === 'deleted' ? 'deleted' : 'ignored';

      if (!id) return jsonError('id مطلوب');

      const { error } = await supabaseAdmin
        .from('lecture_note_reports')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_action,
        })
        .eq('id', id);

      if (error) {
        console.error('report_resolve error:', error.message);
        return jsonError('فشل معالجة البلاغ', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== reports_resolve_all_for_note (جديد) ====================
    case 'reports_resolve_all_for_note': {
      const lecture_note_id = safeString(body.lecture_note_id, 100);
      const resolved_action = body.resolved_action === 'deleted' ? 'deleted' : 'ignored';

      if (!lecture_note_id) return jsonError('lecture_note_id مطلوب');

      const { error } = await supabaseAdmin
        .from('lecture_note_reports')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_action,
        })
        .eq('lecture_note_id', lecture_note_id)
        .is('resolved_at', null);

      if (error) {
        console.error('reports_resolve_all_for_note error:', error.message);
        return jsonError('فشل معالجة البلاغات', 500);
      }
      return NextResponse.json({ success: true });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}
```

## app\api\admin\schedules\route.ts

```
// app/api/admin/schedules/route.ts
import { NextResponse } from 'next/server';
import { adminGuard, jsonError, safeString } from '@/lib/api-server';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const guard = adminGuard(body.password);
  if (!guard.ok) return guard.response;
  const { supabaseAdmin } = guard;

  const action = typeof body.action === 'string' ? body.action : '';

  switch (action) {
    case 'list': {
      const { data, error } = await supabaseAdmin
        .from('schedules')
        .select('*')
        .order('stage');

      if (error) {
        console.error('schedules list error:', error.message);
        return jsonError('فشل تحميل الجداول', 500);
      }
      return NextResponse.json({ schedules: data ?? [] });
    }

    case 'update': {
      const stage = safeString(body.stage, 100);
      const image_url = safeString(body.image_url, 2000);

      if (!stage) return jsonError('المرحلة مطلوبة');
      if (!image_url) return jsonError('رابط الصورة مطلوب');

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('schedules')
        .select('stage')
        .eq('stage', stage)
        .maybeSingle();

      if (fetchError) {
        console.error('schedules fetch error:', fetchError.message);
        return jsonError('فشل التحقق من الجدول', 500);
      }

      const payload = { image_url, updated_at: new Date().toISOString() };

      const { error } = existing
        ? await supabaseAdmin.from('schedules').update(payload).eq('stage', stage)
        : await supabaseAdmin.from('schedules').insert({ stage, ...payload });

      if (error) {
        console.error('schedules update error:', error.message);
        return jsonError('فشل تحديث الجدول', 500);
      }
      return NextResponse.json({ success: true });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}
```

## app\api\admin\subjects\route.ts

```
// app/api/admin/subjects/route.ts
import { NextResponse } from 'next/server';
import { adminGuard, jsonError, safeString } from '@/lib/api-server';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const guard = adminGuard(body.password);
  if (!guard.ok) return guard.response;
  const { supabaseAdmin } = guard;

  const action = typeof body.action === 'string' ? body.action : '';

  switch (action) {
    case 'list': {
      const { data, error } = await supabaseAdmin
        .from('subjects')
        .select('*')
        .order('created_at');

      if (error) {
        console.error('subjects list error:', error.message);
        return jsonError('فشل تحميل المواد', 500);
      }
      return NextResponse.json({ subjects: data ?? [] });
    }

    case 'add': {
      const name = safeString(body.name, 200);
      const stage = safeString(body.stage, 100);

      if (!name) return jsonError('اسم المادة مطلوب');
      if (!stage) return jsonError('المرحلة مطلوبة');

      const { error } = await supabaseAdmin
        .from('subjects')
        .insert({ name, stage });

      if (error) {
        console.error('subjects add error:', error.message);
        return jsonError('فشل إضافة المادة', 500);
      }
      return NextResponse.json({ success: true });
    }

    case 'edit': {
      const id = safeString(body.id, 100);
      const name = safeString(body.name, 200);
      const stage = safeString(body.stage, 100);

      if (!id) return jsonError('id مطلوب');
      if (!name) return jsonError('اسم المادة مطلوب');
      if (!stage) return jsonError('المرحلة مطلوبة');

      const { error } = await supabaseAdmin
        .from('subjects')
        .update({ name, stage })
        .eq('id', id);

      if (error) {
        console.error('subjects edit error:', error.message);
        return jsonError('فشل تعديل المادة', 500);
      }
      return NextResponse.json({ success: true });
    }

    case 'delete': {
      const id = safeString(body.id, 100);
      if (!id) return jsonError('id مطلوب');

      const { error } = await supabaseAdmin.from('subjects').delete().eq('id', id);

      if (error) {
        console.error('subjects delete error:', error.message);
        return jsonError('فشل حذف المادة', 500);
      }
      return NextResponse.json({ success: true });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}
```

## app\api\channel\content\route.ts

```
// app/api/channel/content/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { jsonError, safeOptionalString, safeString } from '@/lib/api-server';
import { CONTENT_TYPES } from '@/lib/constants';
import type { ContentType, FileEntry } from '@/lib/types';

// ==================== Types ====================

interface ChannelRow {
  id: string;
  name: string;
  stage: string;
  description: string | null;
  telegram_link: string;
  channel_password: string | null;
  image_url: string | null;
  views: number | null;
}

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

// ==================== Helpers ====================

function parseFileUrls(value: unknown): FileEntry[] {
  if (!Array.isArray(value)) return [];

  const result: FileEntry[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const url = safeString(e.url, 2000);
    if (!url) continue;
    const label = safeOptionalString(e.label, 200);
    result.push({ url, label });
  }
  return result;
}

function parseContentType(value: unknown): ContentType | null {
  if (typeof value !== 'string') return null;
  return (CONTENT_TYPES as readonly string[]).includes(value)
    ? (value as ContentType)
    : null;
}

function parseDueDate(value: unknown): string | null {
  const s = safeOptionalString(value, 20);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return s;
}

async function verifyChannel(
  supabaseAdmin: SupabaseAdmin,
  channelId: string,
  password: string
): Promise<ChannelRow | null> {
  if (!channelId || !password) return null;

  const { data, error } = await supabaseAdmin
    .from('channels')
    .select('id, name, stage, description, telegram_link, channel_password, image_url, views')
    .eq('id', channelId)
    .maybeSingle<ChannelRow>();

  if (error || !data) return null;
  if (!data.channel_password) return null;
  if (data.channel_password !== password) return null;
  return data;
}

async function assertContentOwnership(
  supabaseAdmin: SupabaseAdmin,
  contentId: string,
  channelId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('channel_content')
    .select('channel_id')
    .eq('id', contentId)
    .maybeSingle<{ channel_id: string }>();

  if (error || !data) return false;
  return data.channel_id === channelId;
}

// ==================== Route ====================

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const action = typeof body.action === 'string' ? body.action : '';
  const channel_id = safeString(body.channel_id, 100);
  const password = safeString(body.password, 200);

  const supabaseAdmin = getSupabaseAdmin();

  const channel = await verifyChannel(supabaseAdmin, channel_id, password);
  if (!channel) {
    return jsonError('كلمة المرور غير صحيحة', 401);
  }

  switch (action) {
    // ==================== login ====================
    case 'login': {
      return NextResponse.json({
        channel: {
          id: channel.id,
          name: channel.name,
          stage: channel.stage,
          description: channel.description,
          telegram_link: channel.telegram_link,
          image_url: channel.image_url,
          views: channel.views ?? 0,
        },
      });
    }

    // ==================== list ====================
    case 'list': {
      const { data, error } = await supabaseAdmin
        .from('channel_content')
        .select('*')
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('channel content list error:', error.message);
        return jsonError('فشل تحميل المحتوى', 500);
      }
      return NextResponse.json({ items: data ?? [] });
    }

    // ==================== add ====================
    case 'add': {
      const content_type = parseContentType(body.content_type);
      const title = safeString(body.title, 300);
      const description = safeOptionalString(body.description, 2000);
      const due_date = parseDueDate(body.due_date);
      const folder = safeOptionalString(body.folder, 200);
      const file_urls = parseFileUrls(body.file_urls);
      const pinned = !!body.pinned;

      if (!content_type) return jsonError('نوع المحتوى غير صالح');
      if (!title) return jsonError('العنوان مطلوب');

      const { error } = await supabaseAdmin.from('channel_content').insert({
        channel_id: channel.id,
        content_type,
        title,
        description,
        due_date,
        folder,
        file_urls,
        pinned,
      });

      if (error) {
        console.error('channel content add error:', error.message);
        return jsonError('فشل إضافة المحتوى', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== edit ====================
    case 'edit': {
      const id = safeString(body.id, 100);
      if (!id) return jsonError('id مطلوب');

      const owns = await assertContentOwnership(supabaseAdmin, id, channel.id);
      if (!owns) return jsonError('غير مصرح', 403);

      const content_type = parseContentType(body.content_type);
      const title = safeString(body.title, 300);
      const description = safeOptionalString(body.description, 2000);
      const due_date = parseDueDate(body.due_date);
      const folder = safeOptionalString(body.folder, 200);
      const file_urls = parseFileUrls(body.file_urls);
      const pinned = !!body.pinned;

      if (!content_type) return jsonError('نوع المحتوى غير صالح');
      if (!title) return jsonError('العنوان مطلوب');

      const { error } = await supabaseAdmin
        .from('channel_content')
        .update({
          content_type,
          title,
          description,
          due_date,
          folder,
          file_urls,
          pinned,
        })
        .eq('id', id);

      if (error) {
        console.error('channel content edit error:', error.message);
        return jsonError('فشل تعديل المحتوى', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== toggle_pin ====================
    case 'toggle_pin': {
      const id = safeString(body.id, 100);
      if (!id) return jsonError('id مطلوب');

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('channel_content')
        .select('channel_id, pinned')
        .eq('id', id)
        .maybeSingle<{ channel_id: string; pinned: boolean }>();

      if (fetchError || !existing || existing.channel_id !== channel.id) {
        return jsonError('غير مصرح', 403);
      }

      const { error } = await supabaseAdmin
        .from('channel_content')
        .update({ pinned: !existing.pinned })
        .eq('id', id);

      if (error) {
        console.error('channel content toggle_pin error:', error.message);
        return jsonError('فشل تحديث التثبيت', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== delete ====================
    case 'delete': {
      const id = safeString(body.id, 100);
      if (!id) return jsonError('id مطلوب');

      const owns = await assertContentOwnership(supabaseAdmin, id, channel.id);
      if (!owns) return jsonError('غير مصرح', 403);

      const { error } = await supabaseAdmin
        .from('channel_content')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('channel content delete error:', error.message);
        return jsonError('فشل حذف المحتوى', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== update_channel ====================
    case 'update_channel': {
      const description = safeOptionalString(body.description, 2000);
      const image_url = safeOptionalString(body.image_url, 2000);

      const { error } = await supabaseAdmin
        .from('channels')
        .update({ description, image_url })
        .eq('id', channel.id);

      if (error) {
        console.error('channel update error:', error.message);
        return jsonError('فشل تحديث بيانات القناة', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== change_password ====================
    case 'change_password': {
      const new_password = safeString(body.new_password, 200);

      if (!new_password) return jsonError('كلمة المرور الجديدة مطلوبة');
      if (new_password.length < 4) {
        return jsonError('كلمة المرور الجديدة قصيرة جدًا (4 أحرف على الأقل)');
      }

      const { error } = await supabaseAdmin
        .from('channels')
        .update({ channel_password: new_password })
        .eq('id', channel.id);

      if (error) {
        console.error('channel change_password error:', error.message);
        return jsonError('فشل تغيير كلمة المرور', 500);
      }
      return NextResponse.json({ success: true });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}
```

## app\api\channel\view\route.ts

```
// app/api/channel/view/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { jsonError } from '@/lib/api-server';

/**
 * زيادة عدّاد الزيارات باستخدام RPC atomic.
 * يتطلب دالة SQL على Supabase اسمها increment_channel_views(channel_id uuid)
 * (شوف الملاحظة تحت).
 */
export async function POST(request: Request) {
  let body: { channel_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const channelId = typeof body.channel_id === 'string' ? body.channel_id : '';
  if (!channelId) return jsonError('channel_id مطلوب', 400);

  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin.rpc('increment_channel_views', {
    p_channel_id: channelId,
  });

  if (error) {
    console.error('increment_channel_views error:', error.message);
    // نرجّع 404 لو القناة ما موجودة، وإلا 500
    if (error.code === 'P0002' /* no_data_found */) {
      return jsonError('قناة غير موجودة', 404);
    }
    return jsonError('فشل تحديث العدّاد', 500);
  }

  return NextResponse.json({ success: true, views: data });
}
```

## app\api\dictionary\route.ts

```
// app/api/dictionary/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { jsonError, safeString } from '@/lib/api-server';

// ==================== Normalization ====================
function normalizeTerm(term: string): string {
  return term
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\u0600-\u06FF\s-]/g, '');
}

// ==================== Groq Prompt ====================
function buildSystemPrompt(): string {
  return `You are a medical terminology expert for second-year medical students at an Iraqi university. Students study in English but think and speak in Arabic.

Your task: analyze a medical term and return ONLY a valid JSON object with this exact structure:

{
  "arabic_translation": "الترجمة العربية الدقيقة",
  "meaning": "شرح مختصر بجملة واحدة بالعربية",
  "root_breakdown": "تفكيك الكلمة (prefix + root + suffix) مع معنى كل جزء بالعربية",
  "clinical_note": "ملاحظة سريرية مهمة بجملة واحدة — أو null إن لم تكن متأكداً",
  "similar_terms": ["term1", "term2", "term3"]
}

STRICT RULES:
1. Return ONLY the JSON object — no preamble, no markdown fences, no explanation.
2. If the term is not a recognized medical term, return: {"error": "not_medical"}
3. For clinical_note: if you are not 100% confident about the clinical fact, return null. Do NOT guess. Do NOT fabricate.
4. Keep meaning and clinical_note short — one clear sentence each.
5. similar_terms: 2-4 related terms that students often confuse with this one, or that are commonly studied alongside it. English terms only.
6. root_breakdown: only if the term has Greek/Latin roots. Otherwise null.
7. All Arabic text must be in Modern Standard Arabic (فصحى), clear for a 2nd-year student.`;
}

// ==================== Parse Groq Response ====================
interface DictionaryResult {
  arabic_translation: string;
  meaning: string;
  root_breakdown: string | null;
  clinical_note: string | null;
  similar_terms: string[];
}

function parseGroqResponse(raw: string): DictionaryResult | null {
  try {
    // تنظيف: إزالة أي markdown fences
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');

    const parsed = JSON.parse(cleaned);

    if (parsed.error === 'not_medical') {
      return null;
    }

    if (
      typeof parsed.arabic_translation !== 'string' ||
      typeof parsed.meaning !== 'string'
    ) {
      return null;
    }

    return {
      arabic_translation: String(parsed.arabic_translation).slice(0, 300),
      meaning: String(parsed.meaning).slice(0, 500),
      root_breakdown:
        typeof parsed.root_breakdown === 'string'
          ? parsed.root_breakdown.slice(0, 500)
          : null,
      clinical_note:
        typeof parsed.clinical_note === 'string'
          ? parsed.clinical_note.slice(0, 500)
          : null,
      similar_terms: Array.isArray(parsed.similar_terms)
        ? parsed.similar_terms
            .filter((t: unknown): t is string => typeof t === 'string')
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0 && t.length <= 60)
            .slice(0, 4)
        : [],
    };
  } catch {
    return null;
  }
}

// ==================== Route ====================
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const action = typeof body.action === 'string' ? body.action : 'lookup';

  const supabaseAdmin = getSupabaseAdmin();

  // ==================== popular (الأكثر بحثاً) ====================
  if (action === 'popular') {
    const { data, error } = await supabaseAdmin
      .from('medical_terms_cache')
      .select('term, arabic_translation, hit_count')
      .order('hit_count', { ascending: false })
      .limit(12);

    if (error) {
      console.error('dictionary popular error:', error.message);
      return jsonError('فشل تحميل المصطلحات الشائعة', 500);
    }
    return NextResponse.json({ terms: data ?? [] });
  }

  // ==================== lookup (بحث) ====================
  const term = safeString(body.term, 100);
  if (!term || term.length < 2) {
    return jsonError('أدخل مصطلحاً طبياً (حرفان على الأقل)');
  }

  const normalized = normalizeTerm(term);
  if (!normalized) {
    return jsonError('المصطلح غير صالح');
  }

  // 1. ابحث في الـcache
  const { data: cached } = await supabaseAdmin
    .from('medical_terms_cache')
    .select('*')
    .eq('term_normalized', normalized)
    .maybeSingle();

  if (cached) {
    // زد العدّاد (fire and forget)
    supabaseAdmin
      .from('medical_terms_cache')
      .update({ hit_count: (cached.hit_count ?? 0) + 1 })
      .eq('id', cached.id)
      .then(() => {});

    return NextResponse.json({ result: cached, cached: true });
  }

  // 2. لو ما موجود — استخدم Groq
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY غير مُعد');
    return jsonError('خدمة الذكاء الاصطناعي غير متوفرة', 500);
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: `Medical term: "${term}"` },
        ],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error('Groq error:', groqRes.status, errBody.slice(0, 500));
      return jsonError('فشل الاتصال بخدمة الذكاء الاصطناعي', 502);
    }

    const data = (await groqRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return jsonError('لم نصل رد من الذكاء الاصطناعي', 502);
    }

    const parsed = parseGroqResponse(content);
    if (!parsed) {
      return jsonError(
        'لم نتعرف على هذا المصطلح. تأكد من كتابته بشكل صحيح.',
        404
      );
    }

    // 3. احفظ في الـcache
    const { data: saved, error: saveError } = await supabaseAdmin
      .from('medical_terms_cache')
      .insert({
        term: term.slice(0, 100),
        term_normalized: normalized,
        arabic_translation: parsed.arabic_translation,
        meaning: parsed.meaning,
        root_breakdown: parsed.root_breakdown,
        clinical_note: parsed.clinical_note,
        similar_terms: parsed.similar_terms,
        hit_count: 1,
      })
      .select('*')
      .single();

    if (saveError) {
      console.error('dictionary save error:', saveError.message);
      // نرجع النتيجة حتى لو فشل الحفظ
      return NextResponse.json({
        result: {
          term,
          ...parsed,
          hit_count: 1,
        },
        cached: false,
      });
    }

    return NextResponse.json({ result: saved, cached: false });
  } catch (err) {
    console.error('dictionary error:', err);
    return jsonError('فشل الاتصال بخدمة الذكاء الاصطناعي', 500);
  }
}
```

## app\api\feed\route.ts

```
// app/api/feed/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { jsonError, safeString } from '@/lib/api-server';

// ==================== Types ====================
type FeedType = 'lecture_note' | 'channel' | 'subject' | 'channel_content';

interface FeedItem {
  id: string;
  type: FeedType;
  title: string;
  context: string;
  created_at: string;
  link: string | null;
}

// ==================== Route ====================
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const stage = safeString(body.stage, 100);
  if (!stage) return jsonError('المرحلة مطلوبة');

  const supabaseAdmin = getSupabaseAdmin();
  const items: FeedItem[] = [];

  // ==================== 1. lecture_notes ====================
  const { data: notes } = await supabaseAdmin
    .from('lecture_notes')
    .select('id, title, file_path, created_at, subjects!inner(name, stage)')
    .eq('subjects.stage', stage)
    .order('created_at', { ascending: false })
    .limit(8);

  if (notes) {
    for (const n of notes as Array<{
      id: string;
      title: string;
      file_path: string | null;
      created_at: string;
      subjects?: { name: string } | null;
    }>) {
      if (!n.created_at) continue;
      items.push({
        id: n.id,
        type: 'lecture_note',
        title: n.title,
        context: n.subjects?.name ?? '',
        created_at: n.created_at,
        link: n.file_path ?? null,
      });
    }
  }

  // ==================== 2. channels ====================
  const { data: channels } = await supabaseAdmin
    .from('channels')
    .select('id, name, description, telegram_link, created_at')
    .eq('stage', stage)
    .order('created_at', { ascending: false })
    .limit(5);

  if (channels) {
    for (const c of channels as Array<{
      id: string;
      name: string;
      description: string | null;
      telegram_link: string | null;
      created_at: string;
    }>) {
      if (!c.created_at) continue;
      items.push({
        id: c.id,
        type: 'channel',
        title: c.name,
        context: c.description?.trim() || 'قناة جديدة',
        created_at: c.created_at,
        link: c.telegram_link ?? null,
      });
    }
  }

  // ==================== 3. subjects ====================
  const { data: subjects } = await supabaseAdmin
    .from('subjects')
    .select('id, name, created_at')
    .eq('stage', stage)
    .order('created_at', { ascending: false })
    .limit(3);

  if (subjects) {
    for (const s of subjects as Array<{
      id: string;
      name: string;
      created_at: string | null;
    }>) {
      if (!s.created_at) continue;
      items.push({
        id: s.id,
        type: 'subject',
        title: s.name,
        context: 'مادة جديدة',
        created_at: s.created_at,
        link: null,
      });
    }
  }

  // ==================== 4. channel_content ====================
  const { data: content } = await supabaseAdmin
    .from('channel_content')
    .select('id, title, file_urls, created_at, channels!inner(name, stage)')
    .eq('channels.stage', stage)
    .order('created_at', { ascending: false })
    .limit(5);

  if (content) {
    for (const c of content as Array<{
      id: string;
      title: string;
      file_urls: unknown;
      created_at: string;
      channels?: { name: string } | null;
    }>) {
      if (!c.created_at) continue;
      const files = Array.isArray(c.file_urls) ? c.file_urls : [];
      const first = files[0] as { url?: unknown } | undefined;
      const firstUrl = typeof first?.url === 'string' ? first.url : null;
      items.push({
        id: c.id,
        type: 'channel_content',
        title: c.title,
        context: c.channels?.name ?? '',
        created_at: c.created_at,
        link: firstUrl,
      });
    }
  }

  // ==================== Merge & Sort ====================
  items.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const top = items.slice(0, 12);

  return NextResponse.json({ items: top });
}
```

## app\api\group-swap\route.ts

```
// app/api/group-swap/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { jsonError, safeOptionalString, safeString } from '@/lib/api-server';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function parseGroup(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const upper = v.toUpperCase().trim();
  return GROUPS.includes(upper) ? upper : null;
}

function normalizeUsername(u: string): string {
  return u.trim().replace(/^@/, '').toLowerCase();
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const action = typeof body.action === 'string' ? body.action : '';
  const supabaseAdmin = getSupabaseAdmin();

  switch (action) {
    // ==================== list ====================
    case 'list': {
      const { data, error } = await supabaseAdmin
        .from('group_swap_requests')
        .select('id, student_name, telegram_username, current_group, target_group, notes, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('group-swap list error:', error.message);
        return jsonError('فشل تحميل الطلبات', 500);
      }
      return NextResponse.json({ requests: data ?? [] });
    }

    // ==================== add ====================
    case 'add': {
      const student_name = safeString(body.student_name, 100);
      const rawUsername = safeString(body.telegram_username, 100);
      const telegram_username = normalizeUsername(rawUsername);
      const current_group = parseGroup(body.current_group);
      const target_group = parseGroup(body.target_group);
      const notes = safeOptionalString(body.notes, 300);

      if (!student_name) return jsonError('الاسم مطلوب');
      if (!telegram_username) return jsonError('يوزر التليكرام مطلوب');
      if (!current_group) return jsonError('اختر الكروب الحالي');
      if (!target_group) return jsonError('اختر الكروب المطلوب');
      if (current_group === target_group) {
        return jsonError('الكروب الحالي والكروب المطلوب متطابقان');
      }

      // ✅ منع التكرار: نفس اليوزر عنده طلب مفتوح
      const { data: existing } = await supabaseAdmin
        .from('group_swap_requests')
        .select('id')
        .ilike('telegram_username', telegram_username)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        return jsonError(
          'لديك طلب مفتوح بالفعل بهذا اليوزر. يجب حذفه أولاً قبل إنشاء طلب جديد.'
        );
      }

      const owner_secret = crypto.randomUUID();

      const { data, error } = await supabaseAdmin
        .from('group_swap_requests')
        .insert({
          student_name,
          telegram_username,
          current_group,
          target_group,
          notes,
          owner_secret,
        })
        .select('id')
        .single();

      if (error) {
        console.error('group-swap add error:', error.message);
        return jsonError('فشل إضافة الطلب', 500);
      }

      return NextResponse.json({
        success: true,
        id: data.id,
        owner_secret,
      });
    }

    // ==================== delete ====================
    case 'delete': {
      const id = safeString(body.id, 100);
      const owner_secret = safeString(body.owner_secret, 100);
      const rawUsername = safeString(body.telegram_username, 100);
      const telegram_username = rawUsername ? normalizeUsername(rawUsername) : '';

      if (!id) return jsonError('id مطلوب');

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('group_swap_requests')
        .select('owner_secret, telegram_username')
        .eq('id', id)
        .maybeSingle<{ owner_secret: string; telegram_username: string }>();

      if (fetchError || !existing) {
        return jsonError('الطلب غير موجود', 404);
      }

      // ✅ تحقق: إما owner_secret صحيح، أو telegram_username مطابق
      const isValidSecret = !!owner_secret && existing.owner_secret === owner_secret;
      const isValidUsername =
        !!telegram_username &&
        normalizeUsername(existing.telegram_username) === telegram_username;

      if (!isValidSecret && !isValidUsername) {
        return jsonError('غير مصرح بحذف هذا الطلب', 403);
      }

      const { error } = await supabaseAdmin
        .from('group_swap_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('group-swap delete error:', error.message);
        return jsonError('فشل حذف الطلب', 500);
      }

      return NextResponse.json({ success: true });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}
```

## app\api\reports\route.ts

```
// app/api/reports/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { jsonError, safeOptionalString, safeString } from '@/lib/api-server';

// ==================== Helpers ====================
function parseReason(v: unknown): 'dead_link' | 'outdated' | null {
  if (v === 'dead_link' || v === 'outdated') return v;
  return null;
}

// hash خفيف للحد من البلاغات المكرّرة من نفس الجهاز
function hashReporter(payload: string): string {
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ==================== Route ====================
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const action = typeof body.action === 'string' ? body.action : '';
  const supabaseAdmin = getSupabaseAdmin();

  switch (action) {
    // ==================== create (public) ====================
    case 'create': {
      const lecture_note_id = safeString(body.lecture_note_id, 100);
      const reason = parseReason(body.reason);
      const note = safeOptionalString(body.note, 300);
      const fingerprint = safeString(body.fingerprint, 200);

      if (!lecture_note_id) return jsonError('لم يُحدد المصدر');
      if (!reason) return jsonError('اختر سبباً صالحاً');

      // تحقق من وجود الملزمة
      const { data: noteExists } = await supabaseAdmin
        .from('lecture_notes')
        .select('id')
        .eq('id', lecture_note_id)
        .maybeSingle();

      if (!noteExists) return jsonError('الملزمة غير موجودة', 404);

      const reporter_hash = fingerprint ? hashReporter(fingerprint) : null;

      // منع التكرار: نفس الجهاز + نفس الملزمة + نفس السبب (خلال 24 ساعة)
      if (reporter_hash) {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recent } = await supabaseAdmin
          .from('lecture_note_reports')
          .select('id')
          .eq('lecture_note_id', lecture_note_id)
          .eq('reason', reason)
          .eq('reporter_hash', reporter_hash)
          .gte('created_at', cutoff)
          .maybeSingle();

        if (recent) {
          return NextResponse.json({ success: true, duplicate: true });
        }
      }

      const { error } = await supabaseAdmin
        .from('lecture_note_reports')
        .insert({
          lecture_note_id,
          reason,
          note,
          reporter_hash,
        });

      if (error) {
        console.error('report create error:', error.message);
        return jsonError('فشل إرسال البلاغ', 500);
      }

      return NextResponse.json({ success: true, duplicate: false });
    }

    // ==================== counts (public) ====================
    // يرجع عدد البلاغات لكل ملزمة (للاستخدام في الشارات)
    case 'counts': {
      const ids = Array.isArray(body.lecture_note_ids)
        ? body.lecture_note_ids.filter((id): id is string => typeof id === 'string').slice(0, 200)
        : [];

      if (ids.length === 0) {
        return NextResponse.json({ counts: {} });
      }

      const { data, error } = await supabaseAdmin
        .from('lecture_note_report_counts')
        .select('lecture_note_id, unresolved_count')
        .in('lecture_note_id', ids);

      if (error) {
        console.error('report counts error:', error.message);
        return jsonError('فشل تحميل البلاغات', 500);
      }

      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.lecture_note_id] = row.unresolved_count;
      }

      return NextResponse.json({ counts });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}
```

## app\api\study-prompt\route.ts

```
// app/api/study-prompt/route.ts
import { NextResponse } from 'next/server';
import { jsonError, safeString } from '@/lib/api-server';
import { MATERIAL_METHODS, STUDY_FORMATS, type StudyFormat } from '@/lib/constants';

interface StudyPromptBody {
  subject?: unknown;
  materialMethod?: unknown;
  formats?: unknown;
  language?: unknown;
}

const VALID_FORMATS = new Set<string>(STUDY_FORMATS);
const VALID_METHODS = new Set<string>(MATERIAL_METHODS.map((m) => m.value));

function buildSystemPrompt(
  materialMethod: string,
  formats: string[],
  language: 'ar' | 'en'
): string {
  const isIncremental =
    materialMethod.includes('سلايد بكل رسالة') ||
    materialMethod.includes('جزء بعد جزء');

  const incrementalRules = isIncremental
    ? `
- Treat each message from the student as ONE slide/part, and respond to EACH one individually and immediately — do not wait to accumulate several before responding.
- Keep each requested format's output SMALL per slide/part — around 2 to 3 items only (e.g. 2-3 flashcards, 2-3 MCQ questions), never a large batch. Slides arrive one at a time and a big batch per slide is overwhelming.
- If a comprehensive/final review format is among the requested formats, WAIT until the student explicitly signals they are done sending slides (e.g. says "خلصت" or "that's all" or similar) before producing that comprehensive review. That review alone can be longer/more thorough since it covers the whole lecture.`
    : `
- The student sends the whole material at once, so you can give one normal, appropriately sized response covering everything without per-slide restrictions.`;

  return `You are an expert prompt engineer specializing in medical education. Your ONLY job is to write a single, detailed, professional, ready-to-use prompt that a medical student can paste into any AI assistant (such as ChatGPT or Claude) to study a specific subject effectively.

Context about how the student will interact with the target AI right after pasting your prompt:
- Material delivery method: "${materialMethod}"

If this method is incremental (one slide or one part sent per message, repeated across many messages until the lecture is done), your prompt MUST explicitly instruct the target AI to:${incrementalRules}

The requested response formats the student wants from the target AI (apply the per-slide quantity rule above to each, except any comprehensive-review format):
- ${formats.join('\n- ')}

Rules you must follow strictly:
- Do NOT answer the subject yourself. Do NOT explain the medical content. Do NOT provide any medical information directly — you only produce the prompt text.
- Your entire output is ONLY the prompt text itself — nothing else. No preamble, no quotation marks wrapping it, no meta-commentary, no explanation of what you did.
- The prompt you write should instruct the target AI to act as an expert, patient medical tutor, appropriate in depth and accuracy for a second-year medical student.
- Make the prompt detailed and well-structured: a short role/context line, then clear numbered or bulleted instructions covering the material delivery method, the requested formats with their per-slide quantities, and the waiting/pacing behavior described above. Do not write a single vague sentence — be thorough enough that the target AI has no ambiguity about what to do.
- Write the prompt itself in ${language === 'en' ? 'English' : 'Arabic'}.`;
}

export async function POST(request: Request) {
  let body: StudyPromptBody;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const subject = safeString(body.subject, 200);
  const materialMethod = safeString(body.materialMethod, 500);
  const language = body.language === 'en' ? 'en' : 'ar';

  if (!subject) return jsonError('اختر المادة أول شي.');
  if (!materialMethod) return jsonError('اختر طريقة إرسال المحتوى.');
  if (!VALID_METHODS.has(materialMethod)) return jsonError('طريقة الإرسال غير معروفة.');

  if (!Array.isArray(body.formats) || body.formats.length === 0) {
    return jsonError('اختر طريقة شرح وحدة على الأقل.');
  }

  const formats = body.formats.filter(
    (f): f is StudyFormat => typeof f === 'string' && VALID_FORMATS.has(f)
  );

  if (formats.length === 0) {
    return jsonError('ما يو شكل شرح صالح.');
  }
  if (formats.length > STUDY_FORMATS.length) {
    return jsonError('عدد أشكال الشرح غير صالح.');
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY غير مُعد');
    return jsonError('خدمة الذكاء الاصطناعي غير مُعدّة على السيرفر.', 500);
  }

  const systemPrompt = buildSystemPrompt(materialMethod, formats, language);
  const userMessage = `Subject: ${subject}
Material delivery method: ${materialMethod}
Requested formats: ${formats.join('، ')}`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error('Groq error:', groqRes.status, errBody.slice(0, 500));
      return jsonError(
        `صار خطأ من خدمة الذكاء الاصطناعي (${groqRes.status}). حاول مرة ثانية بعد شوي.`,
        502
      );
    }

    const data = (await groqRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const generatedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      return jsonError('ما وصل رد من الذكاء الاصطناعي. حاول مرة ثانية.', 502);
    }

    return NextResponse.json({ prompt: generatedPrompt });
  } catch (err) {
    console.error('Study prompt error:', err);
    return jsonError('فشل الاتصال بخدمة الذكاء الاصطناعي.', 500);
  }
}
```

## app\apple-icon.png

```
�PNG

   IHDR   �   �   =�2  ~caBX  ~jumb   jumdc2pa  �  � 8�qc2pa   Xjumb   Gjumdc2ma  �  � 8�qurn:c2pa:c502b5dc-3dc4-409e-80ab-8386caf10c6f   �jumb   )jumdc2as  �  � 8�qc2pa.assertions    �jumb   Djumdcbor  �  � 8�qc2pa.ingredient.v3    c2sh�a0��mΏ.4���   lcbor�idc:formatiimage/pngjinstanceIDx,xmp:iid:28e91330-02ab-43db-9813-dc4fc4a58ae2lrelationshiphparentOf  �jumb   Ajumdcbor  �  � 8�qc2pa.actions.v2    c2sh�Z<K��	}W9 ��  �cbor�gactions��factionkc2pa.openedjparameters�kingredients��curlx-self#jumbf=c2pa.assertions/c2pa.ingredient.v3dhashX ����1������G8�!دV�����"~V�factionxcom.anthropic.claude.providedjparameters�xcom.anthropic.origin-confidencegunknownkdescriptionxfClaude provided this file at the request of a user and may have created or modified the file contents.msoftwareAgent�dnamefClauderallActionsIncluded�   �jumb   @jumdcbor  �  � 8�qc2pa.hash.data    c2shH1-xrЈ����Ry�   �cbor�calgfsha256cpadM             dhashX ��Q����'zL�DF�vv�nD�
i�-/��dnamenjumbf manifestjexclusions��estart!flength�  >jumb   'jumdc2cl  �  � 8�qc2pa.claim.v2   cbor�calgfsha256isignaturexMself#jumbf=/c2pa/urn:c2pa:c502b5dc-3dc4-409e-80ab-8386caf10c6f/c2pa.signaturejinstanceIDx,xmp:iid:272e99b5-4291-47f0-947b-a39764af8bf5rcreated_assertions��curlx-self#jumbf=c2pa.assertions/c2pa.ingredient.v3dhashX ����1������G8�!دV�����"~V�curlx*self#jumbf=c2pa.assertions/c2pa.actions.v2dhashX ������Q��@D���_�:�Rty�curlx)self#jumbf=c2pa.assertions/c2pa.hash.datadhashX ��s ��:o�i[m9f:Uc/�&hw"��tclaim_generator_info�dnameoAnthropic Filesgversione1.0.0kspecVersione2.4.0  8jumb   (jumdc2cs  �  � 8�qc2pa.signature   cbor҄Y�&!Y
0�0���@�
��9о���B=gU 0
*�H�=0I10U
Anthropic, PBC1.0,U%Anthropic Content Credentials Root CA0260807184356Z280806194356Z0D10U
Anthropic, PBC1)0'U Anthropic Claude Content Signing0Y0*�H�=*�H�=B �z
k�P�4�B�9[D���ײ�J�з�+3wdw���<Et(�.:}}?�4U��}�J�7���X0V0U��0U%0
+��^0U�0 0U#0��Q��Nd[#���Ϛ>���\�0
*�H�=g 0d01s�z��U��F�=���lNf���O@e�?<E���$���@��U�0p_\��a�bJ�/���P�(��2_��=�Z��,Ï:2��x�S�TQ�G	�cpadY�                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              �X@���a���L�������`d9fqqK�Ϙ�� ׍��~>-�_~�M,'��i#� �R���?�b8��}��  j(IDATx��}{�E���Tu��I2If����$�ٗ�]_h�?t�ou���꺻�!�E��\^���Mvݕ奌���?T\AWv7�� !�@d2�IfnwW�����;3y��ȜO&3�޾����:�=�:LȄLȄLȄLȄLȄLȄLȄLȄLȄLȄLȄLȄLȄ�g�2!2!2!2!2!��&��!#b������N����9��5��2�#c����<��c�}B�t&d����h� ��A��(?�r��w�v�H�L7�0�� �P��LP�}��)��Y���	}��N@���P�ex��Y5z�CB?��u �&{|��,g@0�	��m������t �Y�Þ �˞��%0C~p���m�;.Q�6���O���!��V���*����g�' �{��o����U�쿮*�/!�0�f>��`�&���z�S������{)��5N���
��0�ޝ�a�Ԭqݣ�W�B[�fh~1=�d4�`(\i;4��� X�Y=�;4���{�{k׮͍��i�"�iO���2��e�f^�� `���JL�A�@��8�Q�¾#`��("0k0���xp��?4�͏�+��' �,�=�B+��R;6Q�!ě  �S� "bh�� ���1ܛ�b0,�1��V�I������v��V�=+�L zW���Y�3 �>���Hq�,�@,���DV$ �=5ؚ9x��5 J"��o��<���W�K`���G7�ϟ5�X}C�|�͏8��3U%_I$�f(0���+Hd�2�ß��L�fX�M 4sN$f� ��Ҕ<�h�0��}Uk06���<k�ߞF
5M��g������Yox�J�ۉ���i��9GD� �`�$��0��..!�@L�i����:'@��l��N9����ד�<����0���!9�d����X����^���� �^C%��E[ɷ�0��j]K���\LzxNb�& 0��ɜ��r�(a��b�n��y��`�v���6r���R���>�W�_!��:�A	�zrl� d�m�m�3����p(/.Ȱ�Y3X`w� �[o�"�����!����?HPn�v�t>�]r壏~��t��eZ��d���5�ܬO� ���SȘa?������B��V�&�̚�L�yX}hpÿ�|:?�]�j�1��ԇk��ӕ�0�km>m��g4�L��I�O� �` ��"Hfr''�s@���0`6/�  g<�S��9NhA�8O�������O���`m�y������l�|��U����&�QZyX�͞���?v! >!��y
� 
�U"@ �eeG	��a�3�����{O���zb�&�H"h�GB�g�7�@ 5�Q���v����~6z<��GM�������e�T��	�N�2������~r;��8��ۄWZ����1�.��	���:'�0F|Ѷ�~hh̛cݺ0d���M_v ?��th���K�-���I:O��C���$��:MI�,` ��B
\����c����3�Q�Y�'�{��9jk�P���f�2����X2�`�zk0~�V�>�Ow_��=ïk�Y�)-�A� � ΉY�����0Ma�������y*88���`��cj!%v F�!a6T��D�D���Dk����O�^���Be@�U��u�.�N���q�j� |����S���Dl|�����/���F!�(\t��� 8�ZF�� ��ǹ���m��� C�mLx�
1  �7�G�7����GX��|���l��)������\Y=�S�r��� �Ӥt��pe"A`h�Lf�|(��S�g��>g,����=����v����O��	�  �ФAq̬�R/��M7L�r��e�����C����lw=�=-��*�i�ް�H\I"z��#9 A- &\�Ab�'
x�Ї�M%����@[ �[�қVC20�C\�~�����H*"�D���h.Ǧ[v�c`u�������C	�-*�$��n�N�&	��P�%Ӛh �a!�V)�Ȝ�i���Єe��=c�tc�y�7O\��6IL�j���G����>�B�dpP,�V�MB,|��a\���T�ɡX�UR��4��c�sǭΦ�:��S��6:�I	�*8�F]�!��V
xi�6����c��ts12-��!S���2؀��v� ��~����X����zʹY�P �M�j�־=��߸r(6�ij����f�>�P4l���TH�Ea����n��ҋB3�z2���k�2M}�-�ſ*(`
\�({D��8�[lGk02X%Bku�f���}P{YZ����we�i[ݬ��N���f\A��13�`�T�NX�0D�3��z(��F�&Xk�N��)%��s�|{�LHnȍ7���v�0 �Zk{rff(�8a�7�Ĳ�n��|{��{2r�:��]H��dNm)+\&���u�� ݣ���-(�l4x�iB���aWp��#1��ʎ��㙋�q�=�Q�"y	f&�.�Q�E&$_d6��P`@���s�Z������'�p����R�2wq�	�L?��9��
���PF�`� ��>��pNr�-�@��blY[��&.�G�=".�-�֬<�����K�f��`f�� �����P�l��C���$����ׄm�����I0�6���|�C�����~�>CB�d�3b��D&��|�YPɳ@d��E�
�0�
��5ù%<�?
�W��*�1%C�� ���AB�a�Ş~�A1ش;�W�b�uW�(! �"�����up�|��!���3�CЭmOC�5d������\*�������D�
~�n�f��ɨ/�N�p�Q���1�t{F@P|/t�q�x�o%i�YS.���K�gG}v ���~耠���\K�I�:��f>wh�M?��l�>��[�! ��ǐ�+O�u��A�yr6t�1�X����e#�k��=�C؊�HA<�@�S�@�[�Yv���Ixf!D��@}�uͲ�+{V
��$%#�����g�};g��G�t���n��[� ��[�0tM �.;�����'m� ��f
�`�V��TC~��cF��ف�h9���wQh�2-	�v����kXJZ�D,���&@9�hlnN�ڞ���l�E����)�$A�`�ߎ�Ȕ*���!#�%;k���}6t=g��x�8n}[{��Jd���(�EA-�������&��
']�+h���ȡ�϶
Cs���.$or�].Gq�
n a�٣�I�4 `Y�u�=M"���c��w����}��;�r0=7��1 �j_�����ڷ?�/ � `�QT6��+ǛE�
A�� ��d=4�
bRD�<KG�AҢ:���:t�ўaSy�!Z����6����|��u��.[*�]?���\ &�Ulm��!*�%����l�u��5����3��1~Z�&�>B_O�9���'�S�2��`�!�Oi�$Hx�ʭ��`��!:A W9��Yy=�����7��k2s��j.ZMp�c=Łs��9 ��s8�T����؉�D	�U�,��/��,?�������;�f �c�	ݱ֯7_^����m=��.zv�B�ף�*O?�v��O��u�� "�^#;�͐��r�����9��M�'�j��������Waʛ��O�	4}28K�<P������2��w�T������wv&p�zTO�.ǐB�y��V`(����K�"K�ȷ��^�ı�ס!�Rr��P�6�r�٧M�����R@ǌ<q���[�|�ŽGn�+�!� �6%则X�srh{�,�O!f:�m/>jx�>B�`�PV2#H�,�`�9���V+��qF�Zӎ�QI�%,��]G�Wx�p��� E*j��6���捡ї8�`ﱲ���=0?�ݽT��1���D,,}2=�w�y�C�����f�*ĩ04��m�1sFe������	GBf�#�Eo��3�B�ԁ�g��p:�v/����,��&p�K�@���1���QNDa�Hy;�D�׼�����A����wf�X�u�z���'�CM�K�I�R�,%�Ə�`��I�5���e.�S���fP�4��|mmH��
����dw'��ⳓ������0[��)B�$�w9�]NE�g�J�\�S�z�6���4 `���1a;l�3[0	� 6�X�i���3�C�r�"��|��7�[~
)�`��Yi�\Ov0F��_`��si��#��dA�<�o���թBt̑��3H�t��f�����Q���N;�n"xY��(����G�
ʂV���͞���+��q�.Gm;l���QB,г�o>�y��q�o=�F�3��0y���ڣ��:�_�u��<#RY�%/��f�*3�}��NES�� �n�n�����L!���*���L)��#:���"�fx �8,wP��+9���v����0��8��.�J��\������`e.�m�`���(�Y�My;>�z]`��<z��Q�{F�`���Ҵ�f��A�ρ�]�y
֊���<b��M��H�?�iR�ʡ�p��pm~
���)��Iȳ,�
jΧ��	G� �.th�IPn�w#.�S����ϰ����-
�������6d.a����V�.q��ٺ ��Z�HHP�����1��E{H7�P(�p���p��f�Nxk''�g��?b0�ҩ�l�-�O_�`�S�yA��ͻ5�w�?�"t� ft!yN7�{3BZ) ����  �Z׍@ƣmDQoÙ]v�=Cٱ�4�kuȫ�{@�֩h�����<�)R1a�5.���?p�7oF��`.j �7��!#�r,��g]6u�^ŉ���H�"Gp��G�,1E�,�����>�/{��^;�Z�-�4*t"hR�2�� $H3�ѝLb14_/9�P �<���L?v��9��Pp��v`���[߸|���£�:�<s/�/0�D%fҟ���b��sQ���]R��v*����5��}j1�:�q}�i�j�&���\V͔���ƧM�� -Tm�>5�?ð�U=�4�Ӑ0�(%���$�r+���ft� �: �u J�)�#����$�oC����X��n|�Ǣ��9���t)=�
�ޝ� 1�$f����㘷8Ɣ�͡ժ��أ�0|��ű�%��0M��I�f��"��e�Bp�LHM�\�XDx��d{6*?b���^��_�wf��tSs��4��!Ⱥ�C����AB+=�=Q�@�*GOG��V ���W���N�E�U��p4��ɂ6�E'p����.��bxM��rH_�.7w  )Y���{�P�%�r�Fw7{0��� ��R��)%�ܢh� 0m�>�k�c�:MM�
AV�Z��䞔9�Q|<�蹈Z����ey����BS��D��H1����ՄI�Hm�sș�F��:�иn��C�Jt�R�F;�;���s��\x�]i<P���\����s@��4i&2�G�A,$�7p�5_��%�e4���%�j�������лMc�
w|M 7h���'��G���L W�*# 2�Z�B���>4*_�R��\�Y��`���i;��
Z��xXz�(���a,{�4�ߖ~��I&B�5�刎;$D�#2o�2%h�6s��-miYP�wn��8q��{D.L}n�"�d6�X��[|�5@ H�"�;���:,\R�p�Bww�M,Z�<�d�Q��S�е�=��ɴ���� q;�<����%�B)T���t�`*lp�չ�\�=��(Zr҃A�DЩ&:b�9�i��f��?�oP��V����#����S��s�T�$���(���Q��u�n�x#/�5}t��n�Oo����XF�bR�������ن����3gJ4yۅ/��\ ��{��˷z d���N3�� 2��uٔS^��'x�m��g	z8MIrD�
���
��8(���Ӧ�9x��ɢY���RX��f�&�|%�!�i�R�	q�$�4X�"	�D?F~� t3�S:�GuBL���hF
�d�����c ̊�̽� �a����x6�U���aV�x����1H>Lm�­w}�&���6�ыb�n�q�9Y[��'d�:�G�J��5 �q=c��ˣ�f��1]'1b`m>u�Yo�,~JR��:M�X�V,�,	��K#WU�Kk0�:$��AT ��S��vE3��;�A�R��qR�?9�p(���a䛷�F�$�f�)����9LPW�Ȁ�H�d�������?6G�(z��M�~�A�b�
� �� pb�;'QI4��F���w����w�� ��}挧�a��f�l���:��!�N�	-���q@]z2C�����G@�1oq4m�/t.A�u���)�h�F�od�c���2�;
��{��v7e��l�Q^6��)֒_�}w�щ�i' �$�4�H��W�!���܏�z"81_�#ș���M��j]�p��p+̹ w���)�+,�wQLvt�0�E���E�l�*i��-��6�$��5�m�6p���c��
��3��+ �J��%�ti3Y����⫘х,�, �5�+��J/
�����G��h��'�$�癆V H�H xo	��8����Y�ʃ�u�=3�:i����Tp��,����iV�h�##�gw���&Jb�'�"��&��D�� �fphgь.�����yF��br�]�%j�����0HS2������Aʎ>YP��"�R07	�hR�R�(��^?p�u���<��L3f�$ +�6�������f�U'�A@k���g˖]Q��*��N�ͧ��?��u�d
v���T��)�n��Ž�?!,!�2�Go޲��S������	@0X�p����� ��a��M���!�IP�в7��L%n{o{>*��g&��P������ 49f�-��L(\,(�vV8�3HS��7T�=�'��܁y�c � . � �uj4����$��6T-g֒�6V�C/'z ]'��W��N9�d0}��#�UY|%O�t
Z��~.�t�2ÜO�'�P߳�,8�F��Jp���'W&�3# �����y�L���،?A�z�
(N��o�V�f)�#���Mi�  �[�0��L�Sg0mIMu��3�LU��
�f�,e�e�,���R0c���u������I�u�@�Uoz|��G0oq����)�Z%tuI4��'<�&/�r���Rf]� �k#,4c�y�]{����C�5�H 
�#"1U�f
���ngU�� c����p�`
�T�i�f�Ɂ�jX8Od�����&�&�c�Ԅ0-am�{� BH��@2�ڱ�G���nf�@{��d�l�H��ބ����� �A�]S�<
����X�XÏ�fʀ���jA�h%k��s��R�*��L� �B�GJ��s�N�pq=g$"K%����~���2�qr_�j z#,]:2�_�����[���H!����A�I�������F�h������ a���8#�͸�E�A�#
wX�A�r.1� �A5Q9�XT��OX4���%�`�o�S�0�'�`)����sIV$�{���	��D���O�����m�A"6�ԝ�1��	y��`[!��2k�g!̠'���@׶HH��C��j�qhr(��/��s��4��1����{�?�P��= �p̦��Ȥe_����Z�Ӑ�Ee�;#��
][���w7P:8��^K7֮U�Ο�Mu��51y�l^��HN�8���<vM���yMn?/؅�8\�#Ŵ3���8��(f��T�s�1C�JG�L�p!�6ˏ P�1�F3E��� h��a��?��0 �y��	G��Yr�ah&T�io��5��"Qܼ�f��!.d�����ޖJ;��)H���i�s��ĪPm��	�)�J��_��E�o0�\ڬ\�rA3�7h!�B��"��]$$\>��K��hFYD�K@7�l����PoQ�Vvq_䡱也�:��T���N� $	�3ER=ɻ^����f!��#�+0|+�@�H���%h�6{(���'�A=�(X円D�|�S@���!fv�c	(s>=<�����r���8�����H���ykt����q<��H�y�)X� �F�-�	�cέQ��q��qۯ��1.�j��|ci3��ko���&L�<˴��`@k���X`�T�3�{�E����o^�z]C����!�D3|a�Z�9G���+4���\h hf(�QY0��l+m�L��Ԣ�qB#ty�J3����ʕ7XєI�6#ߺ,5�ʀ:�[w�G2 ���i��s
Ĕ:W���<B���BOj7�5X)�<k�!gX1Xi�<�"�o�g������ڎ���K�=
�Q��X,{ ��H�,���$�Ww[0wt�-`�X�\��(�.���J�Z��NZ�L$]���8��$cS	c�Ӄ,��Ў�ReܲI��'�ٵ�@�OY�&h��ʅv.��W6 ����Jn���v�O��&%�s��H*q�p:��|��c~V�	����2�'�"�HFz� v��P��Ѡ͌!���m∩�M�����?�10}����ѧ��6e��,��aThe�T��7�P�D3塛�;����"[�L`�/�r!�D�z����_]��-��㳞��K�Ӷ�u]|�:���Y� �� \�`��t����MW�@�;��؇Ha��n1 ����7�u��eLv�v�3���ف�ԓ�-�����w�b��w!9��ϰ���r&���G�fh�Ɋ���(�Ȁ�����h�D�s��a��<�ڼ�ǂw�F�'t����&�?��yxp'�a�������+��!�]��6���@J!j���ď<ɢ=*&92�P����)9Q[���q�u�w��d*���)�/9���핗r���Hb]Ќ�
fYf��T�/�C�ɱK@�b
�ר�E��[����I�9�*�d8˅�|U�@6�K��gxyv���<a�R@��7���j�M�������8g��(ǂ��$Ĥ6P[�3 DVM�٣[�X��mm�u#�� �h��YE�| rR;��<��o�n���:26�����a�af"�U :&�u�Ba�`�|`��hOX�O��I�����~�_(�1�����:\��֑|>�#)�"o��kM�N�
�����U�1���hl�O`�д��|�����]d"��'B�m��=��@eE����S��:*f>����@bp,
�X�#ï{G@�%qj����!���i^��AHN�!ꞎ���C�E�(N0�ˇ �v��v����poo�֗� �VA/��ض^��Es��2�o�5�Ƣ�ʥ_=##q$�=�n�z���j�p>B�Q� f���F�o.��˨�i/�f=�2�Q��¼y�����̒/ GD""B�c8�D��3X��v�b�x�Y ���%LU��,�1�87�+��?N��'���Z��JyƤ��vy�z&
)"�ڴ�m$lD�qGC�UP�� 1���	�Co@~�f�Jb����rc�"�Ayn<��F-ہ��.:@����1�z�9G������TJ`޲�P�J4��E+�>�{L|T^����x%�fG��8xx,��5 ��l4�i���죗���|�Ƽ���}7|���m"і0$�II��x�<��� ���>[����Za`�8(r�<�b�`k�1L�)Qy刻��!�o��y�����蚊褣Qy���Yf�l� �#���D&ܭ�
��V��nE�@gק8�"��Z�����'n}Y�y�$�����[���!4���+��$�'�*�V�f8�B��d�q�N��3��P�r���y:��޿5��*��~�j-��[�q�5pHQ1#'�Z�N�ּ7�L�L�C��~�Ha��-����`�ɓ=�c� �3��$����: lb�9�s�#O� �m0B�����A��AP=8��_�"���Y����E��Y{�X�LdGԄ��HD����{�;�K��Qyo}+a��.���9I.F�g�;���E)� ��a�H�J*"J�hh����r`oW��{װ�P�Ւ��o<2p�uK �U ~E'���5��X��rx�@J Z��Q����r.-�vy�B��%CH�_��
�@�}�w��\!~�c�A�-Kb����#��(��+-9�Lvn)M���m��O�d1���y�ctw3�hK@�s2yъ�Qi��Y
!��W,�K�4�wR�`��/�,�i����F�A��q�G���z��+�~�Ǖ��!���q�@O��K�f����j�R]��3���/
��c(�7����ji>���ݝ�}[D�O��Ć+����"R
4��g���xKK'.�u��׾���BI�Y?�#�|��Ĕ����o�F#��x#'�eHӔ�$S@ִ"��|ο*�M_�T<T{�q�ʾi�z��7���W~w��#G��<���ȶ���1=��&�����`!�e�#�}�����`aH��Zo�x�Ύ�IbW��O�h1a�.�z�H*ȷl7E��ZC�teA�1x��w��R���E�,�b?lP֖�A첨H&$��r�_ߊ��G���Q��q�eG0�ϲIFq&��,_vgw��}���H*9�ĶU�l�V\<ò��g�B��6 �����[�V�~s�ӏ�s��2MQF����i�5�.(-m��c��ڍN�N�9��#�%۪e���"о>��#G0��I����)���82
m���b�$d}��O����Ϋ�ی����z�u�o�D1�#9ŷ L;at�D��u�>�-\���g0/�E�KL/��3�o���bw]��$�|�i�P�0������x��̘�nS�ǜn��� ���x����E:p�5RǤ�h�"�E̔�2��
* �5�Mw.��?8�`Ai�}[V%{����y=���T�7��Tc�#� % �_�"r�j�h�W�cinA�yZ����"�a��x��� ��>B�\���H-�\��\GJy.{���K�$��E���N����k�3% H��ꉗ�ٵG��>+�6�  X�r�\(�_#P�%�����~�lN*�f���$&H(k�6e��eza^�«aK���xtj��m,�!��7��#�,�8��
����0�4��@"��|��D�mv�N�=�k={_��/��;���~t���h�J��N��Ej�˦��Щ�(P�܆��E@��ߎ;"T�E�������{�*Nv�q�����_���#�s�Fc�/�`��tw3�B�ZO0{Ie��[���/g�_b� d�,����X1�(՜`�4�W�{v�w��)�w`xb�uq
V{���d����+)�@#w=hV��`��k�V�㩔U�S�Q`�R��`��4������b*r�d)�]x��^��xY�(��!&�ΡI�k&z�����h���̿�:F���Z���K%P�Q�8�Ka���S�<~����p���&��DT�QGڸ�4��q�l#ޏ�rF\��N��o�M��ܱ��}�������+`ټ�aju�ͫf���v�������[PqN?s����U�U��>u2ף����� @�8R�o�r߼f@�V���{v>��ɚ�����A�� ���H	!�����I_��/k��5.1�R, P�j 8�K�M�T��}�m�_F����A2bm3��UXR!@�+�m� �K�a*�?���+~�"Gi�bZf�R0��v��;L�(ȼ�H��?�HD�b��l G5��u�o\k��/�/$���;��]�s��
y�{��R����x�ϰ��(�R[k�(A#ϛ���Jۏ�g��1 �E)���<S�Z�Ǟ2�1ܥ�pIe�����]�Q�\Y�)�Kȶ�YJ����~���l�}����\� 
���@`�'�ƭ��� F�Џ?e�����_�:kP0{������ ˟��f B�BC��j!��"��h�s��e���
%�,y䗯:^s���X�n����M�qA�*c�+,�gE{��e�˯DcQ���d��*\G�w)�Y#0{ae஫~\9f��9�b�ǈ��V�Q6��֧0�H�Q���xBmā�D�5�'�u��\:` x�l�D�jP��F���{�M�Uξ���("o6�_
[��S@A��(�z��S���U��r}�G�M�"��,C�3��գ�o㊄3r �X� �F�L���$?�.���ʅ��.mbk�O"��@Lw�.�'�s����)m/d�jP�D�L9C��#�@ȥͰ���.��a�����?�RETv� ��OL�W���m�ٽ���QWɎ#�y7��u�1�͍º"��-Գ�I���u�"̠V͏�Э���ߺ�T��Z�\�Z��6�v��^p��~Kh,��3/{)l�9M�9��f���Y纒�=�2�q���ʥM4)\v�Z0�z����~l��o��$y����03)ì������<,SJ�w�0SV������&�`����`�������>#Fn�D{�.z5���4x�l��/�\4�4��v��h)��	��N�|F�E�w(�)�� �ƺ�����,?4�le��Yf�e���b��̚L4I�o�+{��NE�1�M3	�f�(â�ۆ�?��ZO���6����B$ ��U�QiSK��cl�[��:t����';��|4/ ��wm�� ���"�,C�㻡�; !]�����䘞02��-�?����ٔNj�59���k�M�=�?�` ����A��4���n�9@�l$�̢8X��FCL%AlTw�3γq�Ƽ��ɥ_]ʫ�ɱ���l�JF�D���QИ����yx���I�F�"�f"�ج�f3�:p�����,�j�Υ;lQ���h}ƍȊ����
���G����j�������x-5M�2�F� &W+���{v���V��ĵ�C�����06�d�wך�+{Xi4g�� ��0meҬ�p`�J��.*f�*$��4e��yR�r|�WoI.�|��2.�@U�Z%�q��ǘ�8��F}|�"��D"����Ja��gĳ�f�{�9��
9����Ii+8���v�]��v9�p��pV�/����7�p�*?!�\��mW�x;��T~��O��8�
O@��~"�+�Y����^F��\�G����V��Gj��זAx�DZ�#�������gⲕ��*��z�L�$� 8�_��~�Z-��㫟�v�7ϡ$�+�HTb����5�JMv 3�G��۾� �"���`q4��i�^�t-�Ў ܁gDm��<;>ZĻ��v!J�>q�QIg �pa������ʓ��k
1�([
�طH�̙G��� �
��5N��7	"�8K3@w!�|^u�񥗡�����T ۉ���1~�j-����wtΘ��3�@�`ʊg�T�m
�ż:r��BI��^��W0��x1���O����
�����0 V�D���r�jh�C���U���)���UȎ��{�~5�{@7���u1U&7S�>H2�`���+)�)NCÄ�)NGR&�:�o�KV^
L���ߎ�2b+�Ԋ)���|^H��<z����o��Y�T^AwB�{[�( i5�%��. Xi1�0�.2,P�g��v��Zd��pʒ��a`Z�59�hc�'���:�Z/���%%�l{�WjX�&ڥ�Gs皳�9�8�Zzw�d�L����~�T��	�IQ�� �HjGp".��BDPyƚ%��Gw$���.�j��ʖ�ƆN���l��W�i'�RE�E�H���S9�H�-.��r�o�f�:��&�y<Zg�"W�)q����@D�X�!0�c+�z�]tNI�)  �$�k�����梮�8�g*�?v���uG=�b��7\R�����y ��S9��{rR�m��٧λJ]��W̬��	�FC�r1c<Z`K!`ΚM�bnɛ�E+��z��f��(ŦM�f�Q����c���Sϛ4<t������,�6q� 	Z脩!��V��0����1�B����<�:��i������"pSK�QC$�����羪����Tp�����DS���&��@��:(
�3��`Q��MX�hq�"{���u�3���5O�����I��1k����L�EB����� ��1+�A�L%�[�����Ko��ՙw�U{G{B��Rش��Z���\s����q�a-�&|�֝����x���0�5tT�(�	v���}�X#�V3:C���ኊ�-Y�$*1�S�W^��{ݧ�n��X���wo��Z�(w3A�TT��Pn��m�(Gu_r�p6.���Ї��������͘��� P�<�|��+IcEIAkE�ٕ�u�����%��:�BB
�<M����_C��򆤾���K��4�lX` ���J5C�� k0�w헸��Zҷ���<����
'k�9~�4T0��dTfZ��=[��=8�P �w1SS�!������\}f/1��p�ڳi����F
.���M�<��+#���ص����vm��Ep��_] ��c�Y�뉪��'/��㯔i�I�s�`(�!���b��9�&#�<��jy�,Z~�GQ�G`��&�2f�Ow}f;��+C뮺o�}ߪi)��"~"JL����V��vӮEdi��{h'�m�/���\x��*H� @�H�=Ԟ�z۽מ�����Tpl��G)��3�}}b`0�?m���	��S@���Dz��=�A��{��i�X!N��X�~C�@��s/I��3E��@RI,���f���x�~f��c@B�Ț)k=M�O���>��M^v�\4#(ז-��TkɎ�~�#z)I�� !�H�X�-d%a�9�]^=��h�����C�����
$"q���G�4��o��%l�M�X�Eq���82���d���rIL"��zF�e5*n��(���2
޳ic��o.���ԍ�o��Q�����ίߐ��?t��N^A����� �qSL��o����ԏ$�����(:c����S_^���34)��$6m�Q���~��PX��2r�u����t%z/�x(��VN����;���Wk�K'��+�y��Y�M�1��h�!��D�r������/�n�ܜ��VՀ-���~1f-��֕��K��ՅKc/��/2F���n�%X1\��5��,B�>�n�d4��R�FC�|9w��ۦb����}���Z=Yw���?�/�4�/4���'`H��� B��@�1f2B�e�u'�U�,.���EW��ҥM����� @�f���[K����I�/�R~�lj���r%�Afq�f��;�4k�}C�~^��nk₉�B�h�9���)S��s�ͨ�̟ow��������X}N���U�q	s�
�`�g�yV� 
o�cK�B*��Q���j0�=��e��;�WN���Ob���݌�Ζs�)t?�X���}�_wo�|�I�)�Bܖ�-va����>��Z[	"��ɿR?�^�'<܆�B�_�����j,\Ri�����w���X��Y�G���� ��O��� 4kVeC�l��&�����4�(�A�f$������׭~����n%wٓ9/O��/�y�c���72p��孌�T�u����9&�Ʀ�����\�>���~�}6
U����}˗p�1V�ΰ}{�u�ʨ�2��f�ףM����k�;ՋD���E#(�C+��l�íP�<
�mI�aSE��+�Ţ�c���+�FcQ����NM�c����d���o��������4$�5���R\����6�ˍ]
�f�6�Ճ�@$4 @rR?�����|/8'¼�񨭉��2 ��]�������(�O����O�D�w��\�#ı&�
� �������*����Wt�a�sR4�d�"�$�32���?z���?�����V��~C���Ƣ���Uq�q�zu���#4�c#m��Tk)kdwq.|fC[1S�dA�ӑ�A�8��'/��kS1+�6Q�D�}4J�9n]�%w_�m���?�&����$1�Mh���Si{b��oNIĬM�~�m�	SD���$�d�s^3p�uf��xU��Y`�h��ri3����F*�����D�r�j2� kM�A1qn3L�[��,%1��d+�LZ.�:"F5�`˾kh�Ak���lA64��is���� �Vg�eS9d]���������;OGּ��(�(�A����Ek킮�c�k""	�欕�q�#��C^t��EcQ��y>o��s�0���%����x�9��3If��Hn���Vv]V��}���/7� R`�$�R��;������>�5k0�V�-�#�E��W̒���My��̓9K�ͽtu�k<��x:�qXD&[<�W�R8�8�O��w܋��QhT�(r�c O��N�g��嵽?�4wџb���T�Y3Z[�A�~C�K?�_�䭢��&�}�T*f�f_ ��_�������Uw��di��|���-t�_�'.=�E)0���f<os�j=������o]D���@��!+����
��g� "�׼�T '�"��/�d����	f/�`hyF(՚Ă5�Ei�����TE�,N�)��I�=�c`�W��5�o�`�{ȻG�71��;�*'B���L;>f8��ֺ�1�4���|j������6ǚ5���1.�ūb�Y��SO_*�ӯ"�%E2"�v�I`��J�;[��$�E�u�9*����i��O�|z����j���3�j-���!_�])!��HH)�ܒg;�Ld��Eі@��E�����t�܎�A��I� <���E�4L�*/��2�n��L�͔E�+I
�S��)n7�Jg��CLO�8�nN�Мw#�o�Z��g��S��
.,l�=	"	�gкC���)�y�����ڵ9zz�(��F�\������e�?Wd�k��n$IB��� ����*k�*�`A���&@�h�ߦK��m\��S�X���_������K�Ւ��}���ޫ?$:��Б�6C�Hb�8�I�4rI�"�8�ݫH|�O;��O���5A�N�᮲;�Z%�VM��\ڔ��_=Gw(}����9E�W��� ���q+Z���n%��WP�F�� �d��k{
�p@D�[�l{�利t��.X%�w$D����9t ACk��BD�b��w�yۊ��%O�|�v��E�{�>(��x�*R�s�W��u�"�8��tdY��#����^t^���|��`� �T�@��O�^q��� �XQ�M[ը(�\(,�/Q������u��;N����rh<�u86�k�d�cD�?�&�3>�۷޺r���ڡ,�����ű���k��(M�,���]�(O�36�f��N�}�na��/���0��~��M��si7��n%��n@��	i\��~���#ψTLZ|��e�_N���t�k~ �� ��:�ƍ@�����/��ė\q���\I^Nͦf����� `z]i.M��*�4G2���X�������/H�.�C����
�ovE����Ph_c�޾��[ ��﬷MypkG�W @wT��w�߆�E�w�0�܎�9:6�se6�d�>g$��k՜ėu,_������b�6+���;ʹ{5�_��mO�E�ؐ�_��Sx6c�ψ�c m4�$�+c���L�����A �n�$䟢�o�v��V�uv,���`����%?f_�^�%+�lٹ���f҇�@�ɜ53�$l�MHv��u�__¸�$k��j�8~]��ˣ���\���˱rQ�����q)7��~������^ �[����'�gƄy�D��$B��X�Ƹ��[��MV.mb��(��f�>	�N4G�,(�Z���=g���D��f&br�"�zv���эR�~�|УJ<�@��AF�ŕrpdOt '���m#B�q5�<Z?O	w�t��ɒy����������к���u0`y͌bZ��clF�ūb��3�-�,�h��?Oq�d)CQ�R�0��ω%��0�;�4c�*I>M�s�Z^����7�,��55*������0G`ޜ�����`�Y�����bxv���$4�6�.���<�TQ��&38(v�C���kOְ���ڸ�JË��ΕWx4��W��T��O�@OP��w(����`�&�7�<J�ߘM))��0"|D�]�@�GR��,��y�o�����ua��kֈ1���^B�ޖ}j�:�k�+�H�!r��$&�k����@q�}�!�A!OS$ы���.���f��u�U�g�>�Gd�����`�����i�1�L躱(�\r�_��~�d��[��Z6�
���0 �ѵ�Ƒ�].��kv#H�_���@r�����=�G��@C�� i���W��l4�y�.#D�y��`�����|��ߌ�ks����PL8G����3E��s/��L_A�ZKq[L̹�Oh7�	�Y�{�uq�S�D�BDȳ�<�>M]�����+�FϢ�W�ւ�L����B��d~�2A��K�m�/� /�ru�ϱ��$ ���^��2�e@����h]�ǭ'��h���"�>r�|�>�m(GQ��P
y;�G@�FuQ������D"H�i�|��2�4�����ȟ+���S��G�{�i���&6l>|����jy���z����S���W�,{?=�8I ����k?�9����s�D0��@*�8�/Р�ɋW~�_z�R��)B��e�n��>&��{�i�����(m���wf����*���s�"�k
mj9�;Q9m?� ���c���Mv������ۈD��M� �E&/ �5�/��x�)t2j0 �����.�H���^C�� g_X�^�֑ ��*M60|�������_fX�:�]�#_�a����˰dIg�����_��T�]$�1��`��B���Y�׀ iM~+`fC�����9��:��G�;/�K}�I�3���١ �[�6$��$f�Ph4FfT�+�U_H��j&�#I�A�s��٣�����A��P,����4to/c��؝o��鴯��~˼��2�� ��F��2�������@ �|�ןˈV���م +����'5H'�u���bP&�]$���s�}��8���ܾb��"4�v��\y.G�����p�D��Qɥ|��O
$L�s�b�
�A"!f�o�9�����Oq�u,��~����e`r���ie�5���<N�9Ir�y|�Ӏ�|����팁��E�g��Hޕ��w���� ]4�Fh,J��v��h��̉]���5B
���TBvF)re���0�?KE��;9���$��8�B? ���<��oL_x�,Dd�Lv�[���ݥ���&���d|��o��g ��;l򅷔r�H�4Yv���"?�H��:1g,�tZ	d����ch���6���N�8�%�t��|c���inkn�?��a-^O���"Q�R����/���x
����c�.V��O݇�5�" ��?�7�5>����Z����̪K���� i�J	�l5`�7��O�<#�X��AJXC��f���u8��|	��'���?2�D/7M�[S%�;�e,�K�#�� ķ(�X6������$6t
�ܯKK ���X��o9ƥH��Q$�I�6Ӻ
A�A��3��pYV $�D@g�\?��G@�)1b[�	V'2��8B�&WB
ᙼ�UK07�p6��hR��6��P�����)��*%�˨�h�̪K!�<2�$)���+M,�Xe/�����P�3,�ӑ�e��B��C�OK �V��ǯ�R�f��4�?����@	�X�6�n�!�X�I�����7 �*yn��gWA�r��gX�*ƪU�^��_��C��T}��D��"rgp�[<� �Pf���%+ͮ�73(�3�H�|�,�k�ײ��5�x0g��I$Qܚs~�m�O��-�Q ��~�������f�7�./�0.�s	]�Z�s��nf@����g(��"[G���k��4Ds�ʙ��(�CY��z�G��n�X�Rk����@�*f5�W5����@�@��G�֗w\{ߏ��񻞏��6�e��G�m- 㷾�6�z=i~�ԅ�{�P�,���$��L�X�fZ-�X L{%1���u�i@��:'��PY�rk0Iv�	"���Yv;�z�l233sNI%&V�\��/|����?ԏ+*��rtm�ݺ�J����[�@8K2@���DX��|����E�����)�ݞ��S�@���ݼ�"���
��������: ��^�_���NSb�r�s�'SO}���f�B_O�^�ѫ��lj�����7�m/�<_	�D3�~0�`��4	+E��L>v)���S!��o�$�%L�DPڬњH3A)����
BH�q�4�����O-������Fb�@�����5�Ⱥ�[�cr��01A�*��Xߋ��;��OD�!��Q�飻�*3�8��p���o��������~͞�c�d5fP�+�J��UJPȳ�v�^�éշ��zR,X�G-��M�+VT���T�y"ӯ'�#H*	4��a����6���&V�܃��L����}��q���ݬ�J3Xl-��J�"o�ß\r6�?�z�][��(����4&�C��Tڊ�5"�ž,@Zh����sߦ+m��~іI�����iw����|9Δc7��
X$�y��7}?�t���@Hp��d�[�.fE1C1�)X��#͵�gՖc���[������	�ܴUa�K�TT�������Z��$)#��-���{�Yf)��d&���w�Rh�p��14M���B0	b��� �J{��y7�_��-]�z=F�� 0Sn�q�Ls?{R�������um��h�bI�թ3n��U1ݦ�_�b��~��8a��~���px�]�d�yZeo�`��Hlp�Se`]n�u������I-a�'Aq��TlL������] C	0$Ce@���)���ɔ�o})�zR�]�Ћ�9!�7�X��2������yo���ד���mR1	�l�	Nl�#�K��<���s��l&`ad:&M EI[Qs�Bެ�D�#����@ �o����_�w������	��n���/׿����k�h���N�ܹ�z=Q�{k����gߥJ[lg�Z�r|���3�K��r��-��[��4���G@=���MW�Q�"f}!�R�	��.kf� e[sFAK�l�T@���G~2u���M}��u��'�c[%�ZVtlޜ�^��xU�^�������b�D�D`���eQ���\x#ܮQ�1\Ԅs-MAaw<kb 2�8Ko�f�R���.��&����k �A�έ��l��sN�|�����O� N��u�M{E�x��xI�� "4�O�<� ��xL�U���e�}L_p��(m.3��3��R`�&�����А��r��>�:�k��qs���p�ۈ�v@<�Ҕ�I=��p8|Yh(+E�� �G����S�o_��+�X�8�cw�>x��������)������8N`��<gtZ�qG ZیU��[���[TX��43(� �Շ�l�Yh|�7X���-���Nm\=̏m��6r�`es������ƭ�SF��7���IP�nе�e�����TB\�e�lªUQ�Ę[��s����k�^C�G��Z���a��K���2Y�5	ԣ���}-X��Y��DT�=�7 �\�+i��"�v�L �4eΪH��L=�M+&��;���[��[W����Oa�r�%+*����B?��|9<�C,��C�q�&hg,
���[�����4�4�J�����k��^�ūb,^c�ܸ��m���~a����?��S��u=��Vّ�" tt�~�X�p������j��MBJ��v��J�	�\Υ��c+�~����)�ē&K�6`��˗�*��<]K?�F���Q� У����7�����O�P 274�s&�;W�W��_�\^: s� �ϣ���O9�Mgn����WNM��cl�#G��`F�O}�e4���9*��"]�ݾ�n/�0;�8�A�fgS�=7) "F:�J7�_�6>�}�XQA�m�xbr/$��_52����?�SN��n� � � 2�p�֢o��vn;���9b(h�qE �o����j��L����(��	��z���׈��{"!���R��>�
�1�2�� 6��z���<��M��įS/D[B$���H@��~TXp��a��L�ӔH�"�n�:��Wu��c�ד�MkZ��lɼdE%k������W��;/�UfHb���&]�/B�m43��$EqB�@����-y���7���-�^H���@UN�U�v4o�<��6M��X&��ƛZ#��g��-���rC�A`�$#��-�i��b�\GA��\��U٧��5�u���{���`ȁ �^Б�#@���x�PJ/g���Y6AI&S+�Lsӹ�xS���&��98ˠ���O��|�io{֭ΰ�����@���٪P�'����U_��hg�2n^EL[���\�D,#	��)���
f�qS�,Jb�+1�ڂ���Mx�K�+VTP���u_��|C���}=�����'���?��U¤2b���s�;�ߥ��)w��(D��n�Ǥ�HA�8����ٻf�k�er�q�V�&��ܜCAdk��܎���� �O~�$�O�Lp��R\�< ��������>��H("3"���H�O������G�"]`T� 0W؊K������)�Bf,�A�h���=3��`����+4~����å�|�������d��c��om���z��_�[�,�(@��S/N؇�d[��w<�7�ZOp��g����#�\ڔ���4G�|Nwd��&O����8���2����bժ7��e�g�W�~�d�V9��^�r~�[`�d���b�>a�%OD�6���n]<�4�٢�x�"�,I�|�k�p�;�p�I&���VͶA0c�%�fdz����MP�2�$��s-B�}[��M�D�42 �1�ӣ&��;��\�/aQ � Ioe:c�H%�b}���m�&�o�П��g8�?�G�2���2T*޹�<o����s��z��r@a��T���:N�����(D2�u����"�	.�b��ٚ��{9���8N��Sg�^�������1���}��)v�F��U ��e�7�	�]�Y�*ƌ�f���/{!ѷ:������������� H�>6��Y��K�k��%0�Dx�!��PQ[R�H��>�z=Bg��ƍ�{� ?��'Ѕ{b�e�֒����j�T3�T@��`V)[mm�eh&`V��P��?�9s�������I��>���q ��N'4�Ծ[�::a�V�~����M���`��v\�I��t��͟����Jh�RB�`� DA�I����D�ւX'��}�ޝ�ݰ&Q[{���U���ދE7����Gcj�ḫe<0t�����T�^���
�S�s�m��������^E�aW6�vJa$�0������S����U{%M��[� j5�	Y�2J����1�arE�վo)E�XHp���{� �1�-��w~����,�$ؼi��`Jn�*�MF&���n�
Z3���*�c�Ȏ��O.�N��b1��q��ޭ�Fn�j4<�r��v>&�샸`��h衛n�H�Xk}-(�"b@QPآp���8߽-kd	���6l�s�o:[����}}4f$��a�jw��f���[���9������_���@���]m�-,d13�ͺ@���ލhL��]���O.���M5�]��Z~�[�0��ُ��^ 0mv�Z��
)N֜ed<�T��W������ւ�ޢ��"BSVmҒ���>�j���*i��(Ur�B{�ĭ�6A@�)o� ��S�N30l��ue� 6C�}�O� �"�������.[���==ir��7(�"�t���%����������3�Dܟk`>k�#O;kF3�+�5��u�*����:O@�Y��ٯ'�U2@ŉ�x��貁�/X���d`^��R�u��)�74�0�Oh�d�[�@���=S�X!X��	 ���i���熚��0����2!&��_��y7�����Cz����g5����u6I�����yк���YfC~�v�(�+��y�A���Ĥ�J�4�/d}q�ٷ`mc���C[J���{�	�Z�y��A�����M� ���?�.� +�)� cPx��7|�G�4��A̪��5����~���>������5ev�JZ].H��9�3�%[�ە����];E�T�c���A2� ��?"�R�GR?5����ɑjけc��B�_1�W�Qf&Pv�pA���w����[�	E��@�	J�=�}�&̟ۿ���E�g{�� �������I�i�kK���4:�,�]rr�%���`i�{�ݱvyv�b@�`��Y� �s�D�B��B�.Q/� 6ܢ���@05CpP��U$A�����9O�s�}���n@��}FA}� �U<���w����;g�yn��K zt� � �rw[��e�R�h\��Ih2�n 2
�6�P��܂���H� �V�s1:⡼7$_�̬��綟���[omb��9kor��^0?�ZxWr��v�*�/3�o�#��Y͵8�����j(|�;HD1��q�|w֞���� 1�0+����R�Vd�f��In�"Cԭjw~7�p�� ����⯶o�������X���lh��$�����ɡ
h`�;/\�h�R��깜b��;ITb�r��`c "�y�^�7�1�q�	ILR0	AĮ|9��d�7��v�O�s�Ʈ�&g$��,�ID	��)%����M?@�� }�u3�,M��p�CVe@e����Hc��j-�����c�XD
BFF���mlHA��D,)(�g��ֳN_��f�p|n7\wd]�"R�� !5��?_�z��6�ZK�W�� ���n�`~�)�a3Hu@;�0�<̾�Y���+\CC�x��$+1HHjW�'��:a�$xv���Id�Z�kbBY%� ���eO����,!����p㲾-[4�-���3��� ;9T�B'�����	=!}@=�?}�tJ�k��'Ŭ�Ă��v�H�E�Ԅ�6cܱ��u|�*4.B
B������"Y�F��п�������iOh�|�F�8\�>�{��p̆��a)�:�ǒ�l���cf�^�ϒ/�zD��v5�+�l�2�e��"ي�ƀ����p�I��.LP+AQ� -�x����G���x@v�
����΀ލ+ow簋�-��n�X��c`&h��RZ.�f
����Wq�K9l��,&�c����Kb����?p��Q��U�k�[
�N�Y����f����O��_D�nu>��狘j�w����3�OAսb٪����YN�j�A3A��|=#}��n�>��=�h0���֠҄89�=V�j/��Z��-���m�����HE�{l�I��~�2|�LL% ־Ԃqo�D2"�!�o���~뎇��8�-��^�V�jf����?H�ޔ�U��xt��$M�5x�s�)H}���	c�Ԓal�2�D6rb$��G 2y�H�H�Y��"����7��uǍ�a�GT�R�z��m�=��QC�>�Vͼ��ԁb���X�x�۶w�R"�(���$ Y�� R̤�RjWǉ��H��5I N@r+��4b1����V�;n����l��!8���I9�h���!�"�I'�5C����~> ��R���ևM�ۛ���	���{�b?��x�4�i4�Ɠ	@���>�=9�b�o�z]L����琯 �_�s�h:C�t��~����	�W����z3�Z���S8����L z��\z$jP�J��^3��N��r� q���mq�U `|�<�<�@���`& =���A��6t
�^`��Y��h���k�H:Gm1E`v$q�����I�|��P,4shJO�Q��@�:�5S��	Jɮ ������`{������YC�ʁ��Nj�Y�=&����M�A��y$H���~�`E��z��I���}�λ���*������}����O�kpTm���Xr8V�"�x<���;*��r��ͱ�+�v!���=�����(;��h�V����xw����w8�3�w�7@:Zn�i��C��!9� �'9�{�P�5sm��)�YK������p2�{v9\9�x��`�O�Jjwͽ��{so���ϔP�߭mݯ6�p�7��V�    IEND�B`�
```

## app\channel-portal\_components\ContentSection.tsx

```
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
```

## app\channel-portal\_components\SettingsSection.tsx

```
// app/channel-portal/_components/SettingsSection.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { postJson, uploadToStorage } from '@/lib/api-client';
import { STORAGE_BUCKETS } from '@/lib/constants';
import type { Channel } from '@/lib/types';

const MAX_IMAGE_SIZE_MB = 5;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  if (parts.length < 2) return 'png';
  return parts[parts.length - 1].toLowerCase();
}

interface Props {
  channelId: string;
  password: string;
  channelInfo: Channel;
  onPasswordChanged: (newPw: string) => void;
  onChannelInfoChanged: (patch: Partial<Channel>) => void;
}

// ==================== Icons ====================
function IconImage() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ==================== Channel Info Form ====================
function ChannelInfoForm({
  channelId, password, channelInfo, onChannelInfoChanged,
}: {
  channelId: string;
  password: string;
  channelInfo: Channel;
  onChannelInfoChanged: (patch: Partial<Channel>) => void;
}) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState(channelInfo.description ?? '');
  const [imageUrl, setImageUrl] = useState(channelInfo.image_url ?? '');
  const [imageError, setImageError] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialDescription = channelInfo.description ?? '';
  const initialImageUrl = channelInfo.image_url ?? '';
  const dirty = description !== initialDescription || imageUrl !== initialImageUrl;

  useEffect(() => {
    setDescription(channelInfo.description ?? '');
    setImageUrl(channelInfo.image_url ?? '');
    setImageError(false);
  }, [channelInfo.id, channelInfo.description, channelInfo.image_url]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.show('نوع الصورة غير مدعوم (PNG/JPG/WebP/GIF).', 'error');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.show(`حجم الصورة كبير جداً (بحد أقصى ${MAX_IMAGE_SIZE_MB} ميجا).`, 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const ext = getFileExtension(file.name);
      const filePath = `${channelId}-${Date.now()}.${ext}`;
      const publicUrl = await uploadToStorage(STORAGE_BUCKETS.channelImages, filePath, file, { upsert: true });
      setImageUrl(publicUrl);
      setImageError(false);
      toast.show('تم رفع الصورة — لا تنسَ الحفظ', 'success');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل رفع الصورة', 'error');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    try {
      await postJson('/api/channel/content', {
        action: 'update_channel',
        channel_id: channelId,
        password,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
      });
      onChannelInfoChanged({
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
      });
      toast.show('تم حفظ بيانات القناة', 'success');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  }

  function openFilePicker() { fileInputRef.current?.click(); }

  return (
    <section>
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-teal/20 bg-teal/[0.04] p-4 text-sm dark:border-teal/30 dark:bg-teal/10">
        <span className="text-teal"><IconInfo /></span>
        <p className="font-medium text-ink/70">
          الاسم والمرحلة ورابط تلغرام يديرها المشرف. يمكنك تعديل الصورة والوصف فقط.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-5 rounded-3xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm dark:bg-paper/80"
      >
        {/* الصورة */}
        <div>
          <label className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink/70">
            <IconImage />
            صورة القناة
          </label>

          {imageUrl && !imageError ? (
            <div className="mb-3 flex items-center gap-4">
              <img
                src={imageUrl}
                alt="صورة القناة"
                onError={() => setImageError(true)}
                className="h-20 w-20 rounded-2xl border border-line object-cover shadow-[0_2px_8px_rgba(26,33,31,0.06)]"
              />
              <Button type="button" variant="secondary" size="sm" onClick={openFilePicker} disabled={uploadingImage}>
                تغيير
              </Button>
            </div>
          ) : imageError ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              تعذّر تحميل الصورة الحالية.
              <button type="button" onClick={openFilePicker} className="mr-2 font-bold underline">
                رفع صورة جديدة
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploadingImage}
              className="group mb-3 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-paper/50 py-6 transition-all duration-200 hover:border-teal/40 hover:bg-teal/[0.03] disabled:opacity-60 dark:bg-white/[0.03] dark:hover:bg-teal/10"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/8 text-teal transition-all group-hover:bg-teal/15">
                <IconImage />
              </span>
              <span className="text-sm font-bold text-ink/70">رفع صورة للقناة</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            onChange={handleImageUpload}
            disabled={uploadingImage}
            className="hidden"
          />

          {uploadingImage && (
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-teal/5 px-3 py-2 text-sm font-bold text-teal dark:bg-teal/15">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              جاري الرفع...
            </div>
          )}

          <p className="text-xs text-ink/40">
            PNG / JPG / WebP / GIF — بحد أقصى {MAX_IMAGE_SIZE_MB} ميجا
          </p>
        </div>

        {/* الوصف */}
        <div>
          <label htmlFor="channel-description" className="mb-2 block text-sm font-bold text-ink/70">
            وصف القناة
          </label>
          <Textarea
            id="channel-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف مختصر للقناة..."
            rows={3}
            maxLength={2000}
          />
        </div>

        {/* زر الحفظ */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving} disabled={!dirty || uploadingImage}>
            حفظ
          </Button>
          {dirty && !saving && (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber" />
              توجد تغييرات غير محفوظة
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

// ==================== Change Password Form ====================
function ChangePasswordForm({
  channelId, password, onPasswordChanged,
}: {
  channelId: string;
  password: string;
  onPasswordChanged: (newPw: string) => void;
}) {
  const toast = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const canSubmit = newPassword.length >= 4 && newPassword === confirmNewPassword && !changing;
  const mismatch = confirmNewPassword !== '' && newPassword !== confirmNewPassword;

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setChanging(true);
    try {
      await postJson('/api/channel/content', {
        action: 'change_password',
        channel_id: channelId,
        password,
        new_password: newPassword,
      });
      onPasswordChanged(newPassword);
      setNewPassword('');
      setConfirmNewPassword('');
      toast.show('تم تغيير كلمة المرور', 'success');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل التغيير', 'error');
    } finally {
      setChanging(false);
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber/8 p-4 text-sm dark:bg-amber/10">
        <span className="text-amber"><IconLock /></span>
        <p className="font-medium text-ink/70">
          بعد التغيير، لن تعمل كلمة المرور القديمة. تأكد من حفظ الجديدة في مكان آمن.
        </p>
      </div>

      <form
        onSubmit={handleChange}
        className="space-y-4 rounded-3xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm dark:bg-paper/80"
      >
        <div>
          <label htmlFor="new-password" className="mb-2 block text-sm font-bold text-ink/70">
            كلمة المرور الجديدة
          </label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="4 أحرف على الأقل"
            autoComplete="new-password"
            minLength={4}
            maxLength={200}
            required
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-2 block text-sm font-bold text-ink/70">
            تأكيد كلمة المرور
          </label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="أعد كتابتها"
            autoComplete="new-password"
            required
            aria-invalid={mismatch || undefined}
          />
          {mismatch && (
            <p className="mt-1.5 text-xs font-bold text-red-600 dark:text-red-400" role="alert">
              كلمتا المرور غير متطابقتين.
            </p>
          )}
        </div>

        <Button type="submit" loading={changing} disabled={!canSubmit} icon={<IconLock />}>
          تغيير كلمة المرور
        </Button>
      </form>
    </section>
  );
}

// ==================== Main Section ====================
export function SettingsSection({
  channelId, password, channelInfo, onPasswordChanged, onChannelInfoChanged,
}: Props) {
  return (
    <div className="space-y-8">
      <ChannelInfoForm
        channelId={channelId}
        password={password}
        channelInfo={channelInfo}
        onChannelInfoChanged={onChannelInfoChanged}
      />
      <ChangePasswordForm
        channelId={channelId}
        password={password}
        onPasswordChanged={onPasswordChanged}
      />
    </div>
  );
}
```

## app\channel-portal\_components\useChannelAuth.ts

```
// app/channel-portal/_components/useChannelAuth.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { postJson, ApiError } from '@/lib/api-client';
import { supabase } from '@/lib/supabaseClient';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Channel, ChannelListItem } from '@/lib/types';

export interface ChannelSessionResponse {
  channel: Channel;
}

interface UseChannelAuthResult {
  channelsList: ChannelListItem[];
  selectedChannelId: string;
  password: string;
  authenticated: boolean;
  loading: boolean;
  error: string;
  channelInfo: Channel | null;
  setSelectedChannelId: (id: string) => void;
  setPassword: (pw: string) => void;
  login: (channelId: string, pw: string) => Promise<boolean>;
  logout: () => void;
  updatePassword: (newPw: string) => void;
  updateChannelInfo: (patch: Partial<Channel>) => void;
}

export function useChannelAuth(): UseChannelAuthResult {
  const [channelsList, setChannelsList] = useState<ChannelListItem[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [channelInfo, setChannelInfo] = useState<Channel | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadChannels() {
      const { data, error: fetchError } = await supabase
        .from('channels')
        .select('id, name')
        .order('name');
      if (cancelled) return;
      if (!fetchError && data) setChannelsList(data as ChannelListItem[]);
    }
    loadChannels();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (channelId: string, pw: string): Promise<boolean> => {
    if (!channelId || !pw) {
      setError('اختر القناة وأدخل كلمة المرور');
      return false;
    }
    setLoading(true);
    setError('');
    try {
      const data = await postJson<ChannelSessionResponse>('/api/channel/content', {
        action: 'login',
        channel_id: channelId,
        password: pw,
      });
      sessionStorage.setItem(STORAGE_KEYS.channelId, channelId);
      sessionStorage.setItem(STORAGE_KEYS.channelPassword, pw);
      setSelectedChannelId(channelId);
      setPassword(pw);
      setChannelInfo(data.channel);
      setAuthenticated(true);
      return true;
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 401
          ? 'كلمة المرور غير صحيحة'
          : 'صار خطأ، حاول مرة ثانية.';
      setError(message);
      sessionStorage.removeItem(STORAGE_KEYS.channelId);
      sessionStorage.removeItem(STORAGE_KEYS.channelPassword);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedId = sessionStorage.getItem(STORAGE_KEYS.channelId);
    const savedPw = sessionStorage.getItem(STORAGE_KEYS.channelPassword);
    if (savedId && savedPw) {
      setSelectedChannelId(savedId);
      setPassword(savedPw);
      login(savedId, savedPw);
    }
  }, [login]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.channelId);
    sessionStorage.removeItem(STORAGE_KEYS.channelPassword);
    setAuthenticated(false);
    setPassword('');
    setSelectedChannelId('');
    setChannelInfo(null);
    setError('');
  }, []);

  const updatePassword = useCallback((newPw: string) => {
    sessionStorage.setItem(STORAGE_KEYS.channelPassword, newPw);
    setPassword(newPw);
  }, []);

  const updateChannelInfo = useCallback((patch: Partial<Channel>) => {
    setChannelInfo((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return {
    channelsList,
    selectedChannelId,
    password,
    authenticated,
    loading,
    error,
    channelInfo,
    setSelectedChannelId,
    setPassword,
    login,
    logout,
    updatePassword,
    updateChannelInfo,
  };
}
```

## app\channel-portal\page.tsx

```
// app/channel-portal/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { useChannelAuth } from './_components/useChannelAuth';
import { ContentSection } from './_components/ContentSection';
import { SettingsSection } from './_components/SettingsSection';

type Tab = 'content' | 'settings';

// ==================== Icons ====================
function IconContent() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10M4 18h10" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

const TABS: ReadonlyArray<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'content', label: 'المحتوى', icon: <IconContent /> },
  { id: 'settings', label: 'الإعدادات', icon: <IconSettings /> },
];

// ==================== Login Screen ====================
function LoginScreen({
  channelsList,
  loading,
  error,
  onLogin,
}: {
  channelsList: { id: string; name: string }[];
  loading: boolean;
  error: string;
  onLogin: (channelId: string, pw: string) => void;
}) {
  const [channelId, setChannelId] = useState('');
  const [pw, setPw] = useState('');

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-70px)] max-w-sm flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-3xl border border-line bg-white/80 p-8 shadow-[0_8px_30px_rgba(14,74,74,0.08)] backdrop-blur-sm animate-slide-up dark:bg-paper/80 dark:shadow-[0_8px_30px_rgba(0,0,0,0.40)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-teal">
          <IconLock />
        </div>
        <h1 className="mt-5 text-center text-2xl font-black text-ink">دخول صاحب القناة</h1>
        <p className="mt-2 text-center text-sm text-ink/55">
          اختر قناتك وأدخل كلمة المرور التي أعطاك إياها المشرف
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin(channelId, pw);
          }}
          className="mt-6 space-y-4"
        >
          <Select
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            required
            className="w-full"
            aria-label="القناة"
          >
            <option value="">اختر قناتك</option>
            {channelsList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>

          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="كلمة مرور القناة"
            autoComplete="current-password"
            required
            className="text-center"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-bold text-red-600 dark:bg-red-950/40 dark:text-red-300" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full">
            {loading ? 'جاري التحقق...' : 'دخول'}
          </Button>
        </form>
      </div>
    </main>
  );
}

// ==================== Page ====================
export default function ChannelPortalPage() {
  const {
    channelsList,
    password,
    authenticated,
    loading,
    error,
    channelInfo,
    login,
    logout,
    updatePassword,
    updateChannelInfo,
  } = useChannelAuth();

  const [tab, setTab] = useState<Tab>('content');

  if (!authenticated) {
    return (
      <LoginScreen
        channelsList={channelsList}
        loading={loading}
        error={error}
        onLogin={login}
      />
    );
  }

  if (!channelInfo) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 animate-slide-up">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
            {channelInfo.stage}
          </span>
          <h1 className="mt-3 truncate text-2xl font-black text-ink sm:text-3xl">
            قناة: {channelInfo.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-bold text-ink/60 dark:bg-white/10 dark:text-ink/70">
              <IconEye />
              {channelInfo.views ?? 0} زيارة
            </span>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={logout} icon={<IconLogout />}>
          تسجيل الخروج
        </Button>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="أقسام بوابة القناة"
        className="mt-6 flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-white/60 p-1.5 backdrop-blur-sm [-ms-overflow-style:none] [scrollbar-width:none] sm:overflow-visible dark:bg-white/[0.04] [&::-webkit-scrollbar]:hidden animate-slide-up"
        style={{ animationDelay: '80ms' }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                active
                  ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] dark:bg-teal dark:shadow-[0_2px_8px_rgba(0,0,0,0.30)]'
                  : 'text-ink/60 hover:bg-ink/5 hover:text-ink dark:text-ink/60 dark:hover:bg-white/5 dark:hover:text-ink'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        className="mt-6 animate-slide-up"
        style={{ animationDelay: '120ms' }}
        aria-label={TABS.find((t) => t.id === tab)?.label}
      >
        {tab === 'content' && (
          <ContentSection channelId={channelInfo.id} password={password} />
        )}
        {tab === 'settings' && (
          <SettingsSection
            channelId={channelInfo.id}
            password={password}
            channelInfo={channelInfo}
            onPasswordChanged={updatePassword}
            onChannelInfoChanged={updateChannelInfo}
          />
        )}
      </div>
    </main>
  );
}
```

## app\channels\[id]\page.tsx

```
// app/channels/[id]/page.tsx
'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/Field';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS } from '@/lib/constants';
import type { Channel, ChannelContent, ContentType, FileEntry } from '@/lib/types';

type ChannelInfo = Pick<Channel, 'id' | 'name' | 'description' | 'telegram_link' | 'image_url' | 'stage'>;

interface ContentGroup {
  type: ContentType;
  label: string;
  folders: Array<{ folder: string; items: ChannelContent[] }>;
  noFolderItems: ChannelContent[];
  total: number;
}

// ==================== Icons ====================
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconFolder() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
function IconPin({ className = '' }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 flex-shrink-0 ${className}`} fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 4.5v6.75L6 15v1.5h12V15l-3-3.75V4.5M12 16.5V21" />
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
function IconTelegram() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

// ==================== Due Date ====================
interface DueInfo { text: string; className: string }
function getDueInfo(dueDateStr: string): DueInfo {
  const due = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (Number.isNaN(diffDays)) return { text: `تسليم: ${dueDateStr}`, className: 'bg-amber/20 text-amber-800 dark:bg-amber/25 dark:text-amber-300' };
  if (diffDays < 0) return { text: 'انتهى الموعد', className: 'bg-ink/10 text-ink/50' };
  if (diffDays === 0) return { text: 'التسليم اليوم!', className: 'bg-red-100 text-red-700 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900/50' };
  if (diffDays <= 3) return { text: `تسليم: ${dueDateStr} (بعد ${diffDays} يوم)`, className: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' };
  return { text: `تسليم: ${dueDateStr}`, className: 'bg-amber/20 text-amber-800 dark:bg-amber/25 dark:text-amber-300' };
}

// ==================== File Links ====================
function FileLinks({ files }: { files: FileEntry[] }) {
  if (!files || files.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {files.map((f, i) => (
        <a
          key={i}
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal/20 bg-teal/5 px-3 py-1.5 text-xs font-bold text-teal transition-all duration-200 hover:border-teal/40 hover:bg-teal/10 active:scale-95 dark:border-teal/30 dark:bg-teal/10 dark:hover:bg-teal/15"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {f.label || (files.length > 1 ? `ملف ${i + 1}` : 'فتح الملف')}
        </a>
      ))}
    </div>
  );
}

// ==================== Content Item ====================
function ContentItem({ item }: { item: ChannelContent }) {
  const dueInfo = item.due_date ? getDueInfo(item.due_date) : null;
  return (
    <div className="group rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-300 hover:border-teal/20 hover:shadow-[0_4px_16px_rgba(14,74,74,0.06)] dark:bg-paper/80 dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.30)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold text-ink">{item.title}</span>
        {dueInfo && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${dueInfo.className}`}>
            {dueInfo.text}
          </span>
        )}
      </div>
      {item.description && <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{item.description}</p>}
      <FileLinks files={item.file_urls} />
    </div>
  );
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 skeleton-shimmer rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-48 skeleton-shimmer rounded" />
          <div className="h-3 w-24 skeleton-shimmer rounded" />
        </div>
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-line bg-white/80 p-4 dark:bg-paper/80">
            <div className="h-4 w-2/3 skeleton-shimmer rounded" />
            <div className="mt-2 h-3 w-full skeleton-shimmer rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-3xl border border-line bg-white/80 p-10 text-center text-sm font-medium text-ink/60 backdrop-blur-sm animate-slide-up dark:bg-paper/80">
      {children}
    </div>
  );
}

// ==================== Page ====================
export default function ChannelPage() {
  const params = useParams();
  const channelId = (params?.id as string) ?? '';

  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [items, setItems] = useState<ChannelContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const deferredSearch = useDeferredValue(searchTerm);
  const term = deferredSearch.trim().toLowerCase();

  useEffect(() => {
    if (!channelId) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');

      const [channelRes, itemsRes] = await Promise.all([
        supabase
          .from('channels')
          .select('id, name, description, telegram_link, image_url, stage')
          .eq('id', channelId)
          .maybeSingle(),
        supabase
          .from('channel_content')
          .select('*')
          .eq('channel_id', channelId)
          .order('created_at', { ascending: false }),
      ]);

      if (cancelled) return;

      if (channelRes.error || !channelRes.data) {
        setError('لم نجد هذه القناة.');
        setLoading(false);
        return;
      }

      setChannel(channelRes.data as ChannelInfo);
      setItems((itemsRes.data ?? []) as ChannelContent[]);
      setLoading(false);

      const viewKey = `viewed_channel_${channelId}`;
      if (!sessionStorage.getItem(viewKey)) {
        sessionStorage.setItem(viewKey, '1');
        fetch('/api/channel/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel_id: channelId }),
        }).catch(() => {});
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [channelId]);

  const filteredItems = useMemo(() => {
    if (!term) return items;
    return items.filter((i) => i.title.toLowerCase().includes(term));
  }, [items, term]);

  const pinnedItems = useMemo(() => filteredItems.filter((i) => i.pinned), [filteredItems]);

  const groups: ContentGroup[] = useMemo(() => {
    const unpinned = filteredItems.filter((i) => !i.pinned);
    return CONTENT_TYPES.map((type) => {
      const typeItems = unpinned.filter((i) => i.content_type === type);
      const folderNames = Array.from(new Set(typeItems.filter((i) => i.folder).map((i) => i.folder as string)));
      return {
        type,
        label: CONTENT_TYPE_LABELS[type],
        folders: folderNames.map((folder) => ({
          folder,
          items: typeItems.filter((i) => i.folder === folder),
        })),
        noFolderItems: typeItems.filter((i) => !i.folder),
        total: typeItems.length,
      };
    });
  }, [filteredItems]);

  if (!channelId || (!loading && error)) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link href="/channels" className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal">
          <span className="transition-transform duration-200 group-hover:translate-x-1"><IconArrowLeft /></span>
          رجوع إلى القنوات
        </Link>
        <h1 className="mt-6 text-2xl font-extrabold text-ink">{error || 'لم نجد هذه القناة.'}</h1>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton />
      </main>
    );
  }

  if (!channel) return null;

  const hasItems = items.length > 0;
  const hasResults = filteredItems.length > 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/channels" className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal">
        <span className="transition-transform duration-200 group-hover:translate-x-1"><IconArrowLeft /></span>
        رجوع إلى القنوات
      </Link>

      {/* Header */}
      <div className="mt-6 flex items-center gap-4 animate-slide-up">
        {channel.image_url ? (
          <img
            src={channel.image_url}
            alt={channel.name}
            className="h-20 w-20 flex-shrink-0 rounded-2xl border border-line/60 object-cover shadow-[0_4px_14px_rgba(26,33,31,0.10)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.40)]"
          />
        ) : (
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal to-teal-light text-2xl font-black text-white shadow-[0_4px_14px_rgba(14,74,74,0.24)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.40)]">
            {channel.name.trim().slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black text-ink sm:text-3xl">{channel.name}</h1>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-2.5 py-0.5 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
            {channel.stage}
          </span>
        </div>
      </div>

      {channel.description && (
        <p className="mt-4 leading-relaxed text-ink/70 animate-slide-up" style={{ animationDelay: '80ms' }}>
          {channel.description}
        </p>
      )}

      <a
        href={channel.telegram_link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-bold text-white shadow-[0_2px_10px_rgba(14,74,74,0.28)] transition-all duration-200 hover:bg-teal-light hover:shadow-[0_4px_16px_rgba(14,74,74,0.34)] active:scale-95 animate-slide-up dark:shadow-[0_2px_10px_rgba(0,0,0,0.30)]"
        style={{ animationDelay: '120ms' }}
      >
        <IconTelegram />
        فتح القناة على تلغرام
      </a>

      {/* Search */}
      {hasItems && (
        <div className="relative mt-6 animate-slide-up" style={{ animationDelay: '160ms' }}>
          <IconSearch />
          <Input
            type="text"
            placeholder="ابحث بعنوان المحتوى..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-3 pr-11 shadow-[0_2px_8px_rgba(26,33,31,0.04)]"
            aria-label="بحث في محتوى القناة"
          />
        </div>
      )}

      {/* Pinned */}
      {pinnedItems.length > 0 && (
        <section className="mt-8 animate-slide-up">
          <h2 className="mb-3 flex items-center gap-2 border-b-2 border-teal/20 pb-2 text-lg font-extrabold text-teal">
            <IconPin className="text-teal" />
            مثبّت
          </h2>
          <div className="space-y-2">
            {pinnedItems.map((item) => <ContentItem key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {/* Groups */}
      {groups.map((group) =>
        group.total > 0 && (
          <section key={group.type} className="mt-8 animate-slide-up">
            <h2 className="mb-3 border-b border-line pb-2 text-lg font-extrabold text-ink">{group.label}</h2>

            {group.noFolderItems.length > 0 && (
              <div className="space-y-2">
                {group.noFolderItems.map((item) => <ContentItem key={item.id} item={item} />)}
              </div>
            )}

            {group.folders.map((f) => (
              <div key={f.folder} className="mt-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink/70">
                  <IconFolder />
                  {f.folder}
                </h3>
                <div className="space-y-2">
                  {f.items.map((item) => <ContentItem key={item.id} item={item} />)}
                </div>
              </div>
            ))}
          </section>
        )
      )}

      {!hasItems && <EmptyState>لا يوجد محتوى مضاف لهذه القناة حالياً.</EmptyState>}
      {hasItems && !hasResults && <EmptyState>لا توجد نتائج مطابقة لبحثك &laquo;{searchTerm}&raquo;.</EmptyState>}
    </main>
  );
}
```

## app\channels\page.tsx

```
// app/channels/page.tsx
'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import { Input } from '@/components/ui/Field';
import type { Channel } from '@/lib/types';

type ChannelListItem = Pick<Channel, 'id' | 'name' | 'description' | 'image_url'>;

// ==================== Icons ====================
function IconSearch() {
  return (
    <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

// ==================== Avatar ====================
function ChannelAvatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="h-12 w-12 flex-shrink-0 rounded-xl border border-line/60 object-cover shadow-[0_2px_6px_rgba(26,33,31,0.06)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.30)]"
        loading="lazy"
      />
    );
  }
  const initials = name.trim().slice(0, 2);
  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-teal-light text-base font-black text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.30)]">
      {initials}
    </div>
  );
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-line bg-white/80 p-5 backdrop-blur-sm dark:bg-paper/80"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl skeleton-shimmer" />
            <div className="h-4 w-24 skeleton-shimmer rounded" />
          </div>
          <div className="mt-3 h-3 w-3/4 skeleton-shimmer rounded" />
          <div className="mt-4 h-3 w-20 skeleton-shimmer rounded" />
        </div>
      ))}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/" className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal">
      <span className="transition-transform duration-200 group-hover:translate-x-1"><IconArrowLeft /></span>
      رجوع إلى لوحة الأقسام
    </Link>
  );
}

// ==================== Page ====================
export default function ChannelsPage() {
  const { stage, ready } = useStudentStage();
  const [channels, setChannels] = useState<ChannelListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const deferredSearch = useDeferredValue(searchTerm);
  const term = deferredSearch.trim().toLowerCase();

  useEffect(() => {
    if (!stage) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('channels')
        .select('id, name, description, image_url')
        .eq('stage', stage)
        .order('name');

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setChannels([]);
      } else {
        setChannels((data ?? []) as ChannelListItem[]);
      }
      setLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, [stage]);

  const visibleChannels = useMemo(() => {
    if (!term) return channels;
    return channels.filter((c) => c.name.toLowerCase().includes(term));
  }, [channels, term]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <BackLink />

      <div className="mt-6 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">قنوات الدراسة</h1>
        {!loading && channels.length > 0 && (
          <p className="mt-2 text-sm text-ink/50">
            <span className="font-bold text-teal">{channels.length}</span> قناة متاحة لمرحلتك
          </p>
        )}
      </div>

      {channels.length > 0 && (
        <div className="relative mt-6 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <IconSearch />
          <Input
            type="text"
            placeholder="ابحث باسم القناة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-3 pr-11 shadow-[0_2px_8px_rgba(26,33,31,0.04)]"
            aria-label="بحث في القنوات"
          />
        </div>
      )}

      {loading && <Skeleton />}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
          <p className="mt-1 text-red-600/80 dark:text-red-300/80">{error}</p>
        </div>
      )}

      {!loading && !error && channels.length === 0 && (
        <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up dark:bg-paper/80">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/8 text-teal">
            <IconChat />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد قنوات مضافة لمرحلتك حالياً.</p>
          <p className="mt-1 text-sm text-ink/50">يرجى العودة لاحقاً</p>
        </div>
      )}

      {!loading && !error && channels.length > 0 && visibleChannels.length === 0 && (
        <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up dark:bg-paper/80">
          <IconSearch />
          <p className="mt-4 font-bold text-ink/70">لا توجد نتائج مطابقة</p>
          <p className="mt-1 text-sm text-ink/50">&laquo;{searchTerm}&raquo;</p>
        </div>
      )}

      {!loading && !error && visibleChannels.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visibleChannels.map((c, idx) => (
            <Link
              key={c.id}
              href={`/channels/${c.id}`}
              style={{ animationDelay: `${idx * 50}ms` }}
              className="group relative overflow-hidden rounded-2xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal/30 hover:shadow-[0_12px_30px_rgba(14,74,74,0.10)] active:scale-[0.99] animate-slide-up dark:bg-paper/80 dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.40)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-teal/0 via-teal/0 to-teal/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <ChannelAvatar name={c.name} imageUrl={c.image_url} />
                  <span className="min-w-0 flex-1 truncate font-bold text-ink">{c.name}</span>
                </div>

                {c.description && (
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink/55">{c.description}</p>
                )}

                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-teal transition-all duration-300 group-hover:gap-2.5">
                  <span>فتح صفحة القناة</span>
                  <span className="transition-transform duration-300 group-hover:-translate-x-1"><IconArrowLeft /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
```

## app\dictionary\page.tsx

```
// app/dictionary/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { postJson } from '@/lib/api-client';

// ==================== Types ====================
interface DictionaryResult {
  id?: string;
  term: string;
  arabic_translation: string;
  meaning: string;
  root_breakdown: string | null;
  clinical_note: string | null;
  similar_terms: string[];
  hit_count: number;
}

interface PopularTerm {
  term: string;
  arabic_translation: string;
  hit_count: number;
}

const RECENT_KEY = 'dictionary_recent_terms';
const MAX_RECENT = 8;

// ==================== Icons ====================
function IconSearch() {
  return (
    <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconStethoscope() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6v0a6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3M8 15v1a6 6 0 006 6v0a6 6 0 006-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
function IconTrending() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
function IconCheck() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

// ==================== Recent Storage ====================
function loadRecent(): string[] {
  try {
    const saved = localStorage.getItem(RECENT_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed.filter((t): t is string => typeof t === 'string').slice(0, MAX_RECENT);
    }
  } catch {}
  return [];
}

function saveRecent(term: string) {
  try {
    const current = loadRecent().filter((t) => t.toLowerCase() !== term.toLowerCase());
    const next = [term, ...current].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

// ==================== Result Card ====================
function ResultCard({ result }: { result: DictionaryResult }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      const text = [
        `📖 ${result.term}`,
        `🇮🇶 ${result.arabic_translation}`,
        `📝 ${result.meaning}`,
        result.root_breakdown ? `🧬 ${result.root_breakdown}` : '',
        result.clinical_note ? `🩺 ${result.clinical_note}` : '',
        result.similar_terms.length > 0
          ? `🔗 مشابهة: ${result.similar_terms.join(' · ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.show('تم نسخ المصطلح', 'success');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.show('فشل النسخ', 'error');
    }
  }

  return (
    <div className="rounded-3xl border border-line bg-white/80 shadow-[0_2px_12px_rgba(26,33,31,0.06)] backdrop-blur-sm dark:bg-paper/80 dark:shadow-[0_2px_12px_rgba(0,0,0,0.30)] animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/60 px-6 py-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal dark:bg-teal/20">
              <IconStethoscope />
            </span>
            <h2 className="text-2xl font-black text-ink">{result.term}</h2>
          </div>
          <p className="mt-2 text-lg font-bold text-teal">{result.arabic_translation}</p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="نسخ المصطلح"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-xs font-bold text-ink/60 transition-all hover:border-teal/30 hover:text-teal active:scale-95 dark:bg-white/[0.06]"
        >
          {copied ? <IconCheck /> : <IconCopy />}
          {copied ? 'تم' : 'نسخ'}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-5 p-6">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/50">
            <IconBook />
            المعنى
          </div>
          <p className="text-sm leading-relaxed text-ink/80">{result.meaning}</p>
        </div>

        {result.root_breakdown && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/50">
              <IconSparkles />
              تفكيك الكلمة
            </div>
            <p className="text-sm leading-relaxed text-ink/80">{result.root_breakdown}</p>
          </div>
        )}

        {result.clinical_note && (
          <div className="rounded-2xl border border-amber/30 bg-amber/8 p-4 dark:bg-amber/15">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              <IconStethoscope />
              ملاحظة سريرية
            </div>
            <p className="text-sm leading-relaxed text-ink/80">{result.clinical_note}</p>
          </div>
        )}

        {result.similar_terms.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/50">
              <IconSparkles />
              مصطلحات مشابهة
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.similar_terms.map((t, i) => (
                <span
                  key={i}
                  className="rounded-full bg-ink/5 px-3 py-1 text-xs font-bold text-ink/70 dark:bg-white/10"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-line/40 pt-3 text-[11px] text-ink/40">
          <IconTrending />
          <span>بُحث عنه {result.hit_count} {result.hit_count === 1 ? 'مرة' : 'مرات'}</span>
        </div>
      </div>
    </div>
  );
}

// ==================== Page ====================
export default function DictionaryPage() {
  const toast = useToast();
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [popular, setPopular] = useState<PopularTerm[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecent(loadRecent());
    setMounted(true);

    async function loadPopular() {
      try {
        const data = await postJson<{ terms: PopularTerm[] }>('/api/dictionary', {
          action: 'popular',
        });
        setPopular(data.terms ?? []);
      } catch {
        /* تجاهل */
      }
    }
    loadPopular();
  }, []);

  const handleLookup = useCallback(
    async (searchTerm: string) => {
      const trimmed = searchTerm.trim();
      if (!trimmed || trimmed.length < 2) {
        toast.show('أدخل مصطلحاً طبياً (حرفان على الأقل)', 'error');
        return;
      }

      setLoading(true);
      setResult(null);

      try {
        const data = await postJson<{ result: DictionaryResult; cached: boolean }>(
          '/api/dictionary',
          { action: 'lookup', term: trimmed }
        );
        setResult(data.result);

        saveRecent(trimmed);
        setRecent(loadRecent());
      } catch (err) {
        toast.show(err instanceof Error ? err.message : 'فشل البحث', 'error');
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleLookup(term);
  }

  function quickSearch(t: string) {
    setTerm(t);
    handleLookup(t);
    inputRef.current?.blur();
  }

  if (!mounted) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="h-32 skeleton-shimmer rounded-3xl" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
      <Link
        href="/"
        className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal"
      >
        <span className="transition-transform duration-200 group-hover:translate-x-1">
          <IconArrowLeft />
        </span>
        رجوع إلى لوحة الأقسام
      </Link>

      <div className="mt-6 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          أداة طبية
        </span>
        <h1 className="mt-3 flex items-center gap-2 text-3xl font-black leading-tight text-ink sm:text-4xl">
          <IconStethoscope />
          قاموس المصطلحات الطبية
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          اكتب أي مصطلح طبي بالعربية أو الإنجليزية، وسنشرحه لك بمستوى طالب الطب:
          المعنى، تفكيك الكلمة، ملاحظة سريرية، ومصطلحات مشابهة.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 animate-slide-up" style={{ animationDelay: '80ms' }}>
        <div className="relative">
          <IconSearch />
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="مثال: Dyspnea, Myocardial, ضيق النفس..."
            maxLength={100}
            autoComplete="off"
            className="w-full rounded-2xl border-2 border-line bg-white py-4 pr-12 pl-32 text-base text-ink placeholder:text-ink/35 transition-all duration-200 focus:border-teal focus:bg-white focus:outline-none focus:shadow-[0_0_0_4px_rgba(14,74,74,0.10)] dark:bg-white/[0.06] dark:focus:bg-white/[0.08] dark:focus:shadow-[0_0_0_4px_rgba(77,184,184,0.15)]"
            dir="auto"
          />
          <button
            type="submit"
            disabled={loading || term.trim().length < 2}
            className="absolute left-2 top-1/2 flex h-12 -translate-y-1/2 items-center gap-1.5 rounded-xl bg-teal px-5 text-sm font-bold text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] transition-all duration-200 hover:bg-teal-light active:scale-95 disabled:opacity-40 disabled:active:scale-100"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                جاري البحث
              </>
            ) : (
              <>
                <IconSearch />
                ابحث
              </>
            )}
          </button>
        </div>
      </form>

      {loading && (
        <div className="mt-6 space-y-3 rounded-3xl border border-line bg-white/80 p-6 dark:bg-paper/80">
          <div className="h-8 w-40 skeleton-shimmer rounded" />
          <div className="h-6 w-32 skeleton-shimmer rounded" />
          <div className="mt-4 h-4 w-full skeleton-shimmer rounded" />
          <div className="h-4 w-3/4 skeleton-shimmer rounded" />
        </div>
      )}

      {result && !loading && (
        <div className="mt-6">
          <ResultCard result={result} />
        </div>
      )}

      {recent.length > 0 && !result && !loading && (
        <div className="mt-6 animate-slide-up" style={{ animationDelay: '120ms' }}>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/50">
            <IconClock />
            آخر ما بحثت عنه
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => quickSearch(t)}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-bold text-ink/70 transition-all hover:border-teal/40 hover:bg-teal/5 hover:text-teal active:scale-95 dark:bg-white/[0.06]"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {popular.length > 0 && !result && !loading && (
        <div className="mt-8 animate-slide-up" style={{ animationDelay: '160ms' }}>
          <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink">
            <IconTrending />
            الأكثر بحثاً على المنصة
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {popular.map((t) => (
              <button
                key={t.term}
                type="button"
                onClick={() => quickSearch(t.term)}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-white/80 px-4 py-3 text-right transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/30 hover:shadow-[0_4px_16px_rgba(14,74,74,0.08)] active:scale-[0.98] dark:bg-paper/80"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink transition-colors group-hover:text-teal">
                    {t.term}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink/50">{t.arabic_translation}</p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink/50 dark:bg-white/10">
                  {t.hit_count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex items-start gap-2 rounded-2xl border border-amber/30 bg-amber/8 p-4 text-xs text-ink/70 dark:bg-amber/15">
        <span className="text-amber">
          <IconWarning />
        </span>
        <p className="leading-relaxed">
          <strong>ملاحظة:</strong> هذا القاموس مساعد دراسي وليس مرجعاً طبياً. 
          الملاحظات السريرية اختيارية، ولا يُنصح بالاعتماد عليه وحده في قرارات سريرية حقيقية.
        </p>
      </div>
    </main>
  );
}
```

## app\globals.css

```
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap');
@import "tailwindcss";

/* ==================== Dark Mode Variant ==================== */
@custom-variant dark (&:where(.dark, .dark *));

/* ==================== Light Theme (Root) ==================== */
:root {
  /* ألوان الخلفية */
  --paper: #F7F6F2;
  --paper-deep: #EFEDE7;

  /* ألوان النص */
  --ink: #1A211F;
  --ink-soft: #2C3532;

  /* الألوان الأساسية */
  --teal: #0E4A4A;
  --teal-light: #1A6E6E;
  --teal-glow: #2A8888;
  --amber: #E0A63A;
  --amber-soft: #F0C769;

  /* الحدود */
  --line: #E4E0D6;
  --line-soft: #EFECE4;

  /* الظلال الديناميكية (متغيرات) */
  --shadow-xs: 0 1px 2px rgba(26, 33, 31, 0.04);
  --shadow-sm: 0 1px 3px rgba(26, 33, 31, 0.05), 0 1px 2px rgba(26, 33, 31, 0.03);
  --shadow-md: 0 4px 16px rgba(26, 33, 31, 0.06);
  --shadow-lg: 0 12px 30px rgba(14, 74, 74, 0.10);
  --shadow-xl: 0 24px 60px rgba(26, 33, 31, 0.30);

  /* لون الرابط الخارجي */
  --link-color: #0E4A4A;
}

/* ==================== Dark Theme ==================== */
.dark {
  /* ألوان الخلفية — أغمق قليلاً وأدفأ */
  --paper: #131918;
  --paper-deep: #0B0F0E;

  /* ألوان النص — أفتح قليلاً لراحة أكبر */
  --ink: #ECEFEE;
  --ink-soft: #B5BEBC;

  /* الألوان الأساسية — أفتح في الوضع الليلي */
  --teal: #4DB8B8;
  --teal-light: #62CBCB;
  --teal-glow: #7DDBDB;
  --amber: #F2C770;
  --amber-soft: #FFD88A;

  /* الحدود — أوضح قليلاً */
  --line: #2C3635;
  --line-soft: #222B2A;

  /* الظلال — أضعف بكثير (الظلال السوداء على أسود غير مرئية) */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.30);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.40);
  --shadow-lg: 0 12px 30px rgba(0, 0, 0, 0.45);
  --shadow-xl: 0 24px 60px rgba(0, 0, 0, 0.60);

  --link-color: #4DB8B8;
}

/* ==================== Tailwind Theme ==================== */
@theme inline {
  --color-paper: var(--paper);
  --color-paper-deep: var(--paper-deep);
  --color-ink: var(--ink);
  --color-ink-soft: var(--ink-soft);
  --color-teal: var(--teal);
  --color-teal-light: var(--teal-light);
  --color-teal-glow: var(--teal-glow);
  --color-amber: var(--amber);
  --color-amber-soft: var(--amber-soft);
  --color-line: var(--line);
  --color-line-soft: var(--line-soft);

  --font-display: "Cairo", system-ui, sans-serif;
  --font-body: "Tajawal", system-ui, sans-serif;

  --animate-fade-in: fadeIn 0.3s ease-out;
  --animate-slide-up: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  --animate-scale-in: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  --animate-shimmer: shimmer 1.6s ease-in-out infinite;
}

/* ==================== Keyframes ==================== */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ==================== Base ==================== */
html {
  scroll-behavior: smooth;
  color-scheme: light;
}

html.dark {
  color-scheme: dark;
}

body {
  background-color: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background-color 0.3s ease, color 0.3s ease;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -0.015em;
}

/* التمرير السلس عند تبديل الثيم */
*,
*::before,
*::after {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

button, a, input, select, textarea {
  transition-property: background-color, border-color, color, opacity, transform, box-shadow;
}

:focus-visible {
  outline: 2px solid var(--teal);
  outline-offset: 2px;
  border-radius: 6px;
}

/* ==================== Utilities ==================== */
@utility skeleton-shimmer {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--ink) 6%, transparent) 0%,
    color-mix(in srgb, var(--ink) 12%, transparent) 50%,
    color-mix(in srgb, var(--ink) 6%, transparent) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

/* ==================== Reduced Motion ==================== */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
/* ==================== Native Form Elements Theming ==================== */
/* إصلاح خلفية القوائم المنسدلة في الوضع الليلي */
select,
option,
textarea,
input {
  color-scheme: light;
}

html.dark select,
html.dark option,
html.dark textarea,
html.dark input {
  color-scheme: dark;
}

/* إصلاح صريح لخيارات القائمة المنسدلة */
select option {
  background-color: #F7F6F2;
  color: #1A211F;
}

html.dark select option {
  background-color: #131918;
  color: #ECEFEE;
}

html.dark select optgroup {
  background-color: #131918;
  color: #ECEFEE;
}
```

## app\gpa\page.tsx

```
// app/gpa/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Field';
import type { Subject } from '@/lib/types';

// ==================== Constants ====================
interface ComponentDef {
  key: string;
  label: string;
  defaultMax: number;
}

const COMPONENTS: readonly ComponentDef[] = [
  { key: 'first', label: 'الفصل الأول', defaultMax: 10 },
  { key: 'mid', label: 'المد', defaultMax: 20 },
  { key: 'second', label: 'الفصل الثاني', defaultMax: 10 },
  { key: 'finalTheory', label: 'الفاينل (نظري)', defaultMax: 40 },
  { key: 'finalPractical', label: 'الفاينل (عملي)', defaultMax: 20 },
] as const;

// أهداف النجاح / التقدير
interface TargetDef {
  value: number;
  label: string;
  short: string;
}

const TARGETS: readonly TargetDef[] = [
  { value: 50, label: 'النجاح', short: 'نجاح' },
  { value: 60, label: 'جيد', short: 'جيد' },
  { value: 70, label: 'جيد جداً', short: 'جيد جداً' },
  { value: 80, label: 'امتياز', short: 'امتياز' },
] as const;

const TARGET_KEY_PREFIX = 'gpa_target_';

// ==================== Types ====================
interface ComponentData {
  max: string;
  score: string;
}
type SubjectScores = Record<string, ComponentData>;
type AllScores = Record<string, SubjectScores>;

interface SubjectWithPercentage extends Subject {
  percentage: number | null;
  targetAnalysis: TargetAnalysis;
}

interface TargetAnalysis {
  currentScore: number;
  totalMax: number;
  remainingMax: number;
  targetScore: number;
  needFromRemaining: number;
  achieved: boolean;
  impossible: boolean;
  noData: boolean;
  allEntered: boolean;
}

// ==================== Helpers ====================
function defaultSubjectScores(): SubjectScores {
  const obj: SubjectScores = {};
  for (const c of COMPONENTS) obj[c.key] = { max: String(c.defaultMax), score: '' };
  return obj;
}

function safeParseScores(raw: string | null): AllScores {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as AllScores;
  } catch {}
  return {};
}

function calculatePercentage(subjectScores: SubjectScores | undefined): number | null {
  if (!subjectScores) return null;
  let totalMax = 0;
  let totalScore = 0;
  let anyEntered = false;

  for (const c of COMPONENTS) {
    const comp = subjectScores[c.key];
    if (!comp || comp.score === '') continue;
    const scoreNum = Number(comp.score);
    const maxNum = Number(comp.max);
    if (Number.isNaN(scoreNum) || Number.isNaN(maxNum) || maxNum <= 0) continue;
    if (scoreNum < 0 || scoreNum > maxNum) continue;
    anyEntered = true;
    totalMax += maxNum;
    totalScore += scoreNum;
  }
  if (!anyEntered || totalMax === 0) return null;
  return (totalScore / totalMax) * 100;
}

// ✅ تحليل الوضع بالنسبة للهدف
function analyzeForTarget(
  subjectScores: SubjectScores | undefined,
  targetPercent: number
): TargetAnalysis {
  const base: TargetAnalysis = {
    currentScore: 0,
    totalMax: 0,
    remainingMax: 0,
    targetScore: 0,
    needFromRemaining: 0,
    achieved: false,
    impossible: false,
    noData: true,
    allEntered: false,
  };

  if (!subjectScores) return base;

  let currentScore = 0;
  let totalMax = 0;
  let remainingMax = 0;
  let enteredCount = 0;

  for (const c of COMPONENTS) {
    const comp = subjectScores[c.key];
    if (!comp) continue;
    const maxNum = Number(comp.max);
    if (Number.isNaN(maxNum) || maxNum <= 0) continue;

    totalMax += maxNum;

    if (comp.score === '') {
      remainingMax += maxNum;
    } else {
      const scoreNum = Number(comp.score);
      if (Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxNum) {
        remainingMax += maxNum;
        continue;
      }
      currentScore += scoreNum;
      enteredCount++;
    }
  }

  if (totalMax === 0) return base;

  const targetScore = (targetPercent / 100) * totalMax;
  const needFromRemaining = targetScore - currentScore;
  const achieved = needFromRemaining <= 0;
  const impossible = !achieved && needFromRemaining > remainingMax;
  const noData = enteredCount === 0;
  const allEntered = remainingMax === 0;

  return {
    currentScore,
    totalMax,
    remainingMax,
    targetScore,
    needFromRemaining,
    achieved,
    impossible,
    noData,
    allEntered,
  };
}

// ==================== Icons ====================
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg className={`h-4 w-4 flex-shrink-0 text-ink/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
function IconTrendingUp() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="mt-6 space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between rounded-2xl border border-line bg-white/80 p-4 backdrop-blur-sm dark:bg-paper/80">
          <div className="h-4 w-40 skeleton-shimmer rounded" />
          <div className="h-6 w-16 skeleton-shimmer rounded-full" />
        </div>
      ))}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/" className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal">
      <span className="transition-transform duration-200 group-hover:translate-x-1"><IconArrowLeft /></span>
      رجوع إلى لوحة الأقسام
    </Link>
  );
}

// ==================== Score Color ====================
function getScoreColor(pct: number): string {
  if (pct >= 85) return 'bg-teal/10 text-teal dark:bg-teal/20 dark:text-teal';
  if (pct >= 70) return 'bg-teal/8 text-teal-light dark:bg-teal/15 dark:text-teal';
  if (pct >= 50) return 'bg-amber/15 text-amber-800 dark:bg-amber/25 dark:text-amber-300';
  return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300';
}

// ==================== Target Selector ====================
function TargetSelector({
  target,
  onChange,
}: {
  target: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white/80 p-4 dark:bg-paper/80">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/10 text-teal dark:bg-teal/20">
          <IconTarget />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">هدفي في كل مادة</p>
          <p className="text-[11px] text-ink/50">اختر هدفك، وسنخبرك بكم تحتاج في المتبقي</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {TARGETS.map((t) => {
          const active = target === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange(t.value)}
              className={`rounded-xl border px-2 py-2.5 text-center transition-all duration-200 active:scale-95 ${
                active
                  ? 'border-teal bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)]'
                  : 'border-line bg-white text-ink/70 hover:border-teal/40 dark:bg-white/[0.04]'
              }`}
            >
              <p className={`font-mono text-lg font-black leading-none ${active ? '' : 'text-ink'}`}>
                {t.value}
                <span className="text-xs">%</span>
              </p>
              <p className={`mt-0.5 text-[10px] font-bold ${active ? 'text-white/90' : 'text-ink/50'}`}>
                {t.short}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== Target Analysis Card ====================
function TargetAnalysisCard({
  analysis,
  target,
  subjectName,
}: {
  analysis: TargetAnalysis;
  target: number;
  subjectName: string;
}) {
  // لا درجات مُدخلة
  if (analysis.noData) {
    return (
      <div className="rounded-2xl border border-line bg-paper/60 p-4 text-center dark:bg-white/[0.03]">
        <p className="text-sm text-ink/50">أدخل أي درجة لتظهر لك التوقعات</p>
      </div>
    );
  }

  // حقق الهدف
  if (analysis.achieved) {
    return (
      <div className="rounded-2xl border border-teal/30 bg-teal/[0.04] p-4 dark:border-teal/40 dark:bg-teal/10">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-teal text-white">
            <IconCheck />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-teal">🎉 ضمنت {target}% في {subjectName}</p>
            <p className="mt-0.5 text-xs text-ink/60">
              حتى لو جبت صفر في المتبقي، لسا محقق هدفك.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // مستحيل
  if (analysis.impossible) {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/40">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-500 text-white">
            <IconWarning />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-red-700 dark:text-red-300">
              صعب تحقيق {target}% في {subjectName}
            </p>
            <p className="mt-0.5 text-xs text-ink/60">
              تحتاج {analysis.needFromRemaining.toFixed(1)} درجة، والحد الأقصى المتبقي {analysis.remainingMax} فقط.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // تحتاج نقاط
  return (
    <div className="rounded-2xl border border-amber/30 bg-amber/8 p-4 dark:border-amber/40 dark:bg-amber/15">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber text-ink">
          <IconTrendingUp />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-ink">
            تحتاج <span className="text-lg text-amber-800 dark:text-amber-300">{analysis.needFromRemaining.toFixed(1)}</span> درجة
          </p>
          <p className="mt-0.5 text-xs text-ink/60">
            من أصل <strong>{analysis.remainingMax}</strong> متبقية لتحقق هدف {target}% في {subjectName}
          </p>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-ink/50">
              <span>حالياً: {analysis.currentScore.toFixed(1)}</span>
              <span>الهدف: {analysis.targetScore.toFixed(1)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-l from-amber to-amber-soft transition-all duration-500"
                style={{
                  width: `${Math.min(100, (analysis.currentScore / analysis.targetScore) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Status Chip (للـheader) ====================
function StatusChip({ analysis, target }: { analysis: TargetAnalysis; target: number }) {
  if (analysis.noData) return null;

  if (analysis.achieved) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-black text-teal dark:bg-teal/25">
        <IconCheck />
        ضمنت {target}%
      </span>
    );
  }

  if (analysis.impossible) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-700 dark:bg-red-950/50 dark:text-red-300">
        <IconWarning />
        {target}% صعب
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-black text-amber-800 dark:bg-amber/30 dark:text-amber-300">
      <IconTrendingUp />
      تحتاج {analysis.needFromRemaining.toFixed(1)} لـ{target}%
    </span>
  );
}

// ==================== Page ====================
export default function GpaPage() {
  const { stage, ready } = useStudentStage();
  const confirm = useConfirm();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [scores, setScores] = useState<AllScores>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState<number>(50);

  const storageKey = stage ? `gpa_scores_${stage}` : '';
  const targetKey = stage ? `${TARGET_KEY_PREFIX}${stage}` : '';

  // ===== تحميل =====
  useEffect(() => {
    if (!stage) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');

      // تحميل الهدف
      const savedTarget = Number(localStorage.getItem(`${TARGET_KEY_PREFIX}${stage}`));
      if (!Number.isNaN(savedTarget) && TARGETS.some((t) => t.value === savedTarget)) {
        setTarget(savedTarget);
      }

      const { data, error: fetchError } = await supabase
        .from('subjects')
        .select('id, name, stage, units')
        .eq('stage', stage)
        .order('name');

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const subjectList = (data ?? []) as Subject[];
      setSubjects(subjectList);
      const saved = safeParseScores(localStorage.getItem(`gpa_scores_${stage}`));
      const merged: AllScores = {};
      for (const s of subjectList) {
        merged[s.id] = { ...defaultSubjectScores(), ...(saved[s.id] ?? {}) };
      }
      setScores(merged);
      setLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, [stage]);

  const persistScores = useCallback((next: AllScores) => {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  }, [storageKey]);

  const persistTarget = useCallback((value: number) => {
    if (!targetKey) return;
    try { localStorage.setItem(targetKey, String(value)); } catch {}
  }, [targetKey]);

  const handleTargetChange = useCallback((value: number) => {
    setTarget(value);
    persistTarget(value);
  }, [persistTarget]);

  const updateComponent = useCallback(
    (subjectId: string, componentKey: string, field: 'max' | 'score', value: string) => {
      setScores((prev) => {
        const next: AllScores = {
          ...prev,
          [subjectId]: {
            ...prev[subjectId],
            [componentKey]: {
              ...prev[subjectId]?.[componentKey],
              [field]: value,
            } as ComponentData,
          },
        };
        persistScores(next);
        return next;
      });
    },
    [persistScores]
  );

  const toggleExpand = useCallback((subjectId: string) => {
    setExpanded((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  }, []);

  const resetScores = useCallback(async () => {
    const ok = await confirm(
      'حذف كل الدرجات المدخلة لهذه المرحلة. هل أنت متأكد؟',
      { variant: 'danger', confirmLabel: 'حذف' }
    );
    if (!ok) return;
    const cleared: AllScores = {};
    for (const s of subjects) cleared[s.id] = defaultSubjectScores();
    setScores(cleared);
    persistScores(cleared);
  }, [confirm, subjects, persistScores]);

  // ===== الحسابات =====
  const subjectsWithPercentage: SubjectWithPercentage[] = useMemo(
    () =>
      subjects.map((s) => ({
        ...s,
        percentage: calculatePercentage(scores[s.id]),
        targetAnalysis: analyzeForTarget(scores[s.id], target),
      })),
    [subjects, scores, target]
  );

  const entered = useMemo(
    () => subjectsWithPercentage.filter((s) => s.percentage !== null),
    [subjectsWithPercentage]
  );

  const stats = useMemo(() => {
    let totalUnits = 0;
    let weightedSum = 0;
    for (const s of entered) {
      const units = Number(s.units ?? 0);
      if (!Number.isFinite(units) || units <= 0) continue;
      totalUnits += units;
      weightedSum += units * (s.percentage as number);
    }
    const average = totalUnits > 0 ? weightedSum / totalUnits : null;
    const allFilled = subjects.length > 0 && entered.length === subjects.length;
    const progress = subjects.length > 0 ? (entered.length / subjects.length) * 100 : 0;
    return { average, allFilled, progress, enteredCount: entered.length };
  }, [entered, subjects.length]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
      <BackLink />

      <div className="mt-6 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">المعدل</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          افتح كل مادة وأدخل درجاتك. سنحسب معدلك، وسنخبرك بكم تحتاج في المتبقي لتحقيق هدفك.
        </p>
      </div>

      {loading && <Skeleton />}

      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
          <p className="mt-1 text-red-600/80 dark:text-red-300/80">{error}</p>
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="mt-6 rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up dark:bg-paper/80">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-teal/8 text-teal dark:bg-teal/15">
            <IconChart />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد مواد مضافة لمرحلتك حالياً.</p>
        </div>
      )}

      {!loading && !error && subjects.length > 0 && (
        <>
          {/* ===== الهدف ===== */}
          <div className="mt-6 animate-slide-up" style={{ animationDelay: '80ms' }}>
            <TargetSelector target={target} onChange={handleTargetChange} />
          </div>

          {/* شريط التقدم */}
          {stats.enteredCount > 0 && !stats.allFilled && (
            <div className="mt-6 animate-slide-up">
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-ink/60">
                <span>التقدم</span>
                <span>{stats.enteredCount} من {subjects.length} مادة</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-teal to-teal-light transition-all duration-500"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* قائمة المواد */}
          <div className="mt-6 space-y-2">
            {subjectsWithPercentage.map((s, idx) => {
              const isOpen = !!expanded[s.id];
              const subjectScores = scores[s.id];
              const scoreColor = s.percentage !== null ? getScoreColor(s.percentage) : '';

              return (
                <div
                  key={s.id}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  className="overflow-hidden rounded-2xl border border-line bg-white/80 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-200 animate-slide-up dark:bg-paper/80"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(s.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-3 p-4 text-right transition-colors hover:bg-ink/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink">{s.name}</span>
                        {s.units != null && (
                          <span className="text-xs text-ink/40">({s.units} وحدة)</span>
                        )}
                      </div>
                      {/* Status Chip */}
                      <div className="mt-1">
                        <StatusChip analysis={s.targetAnalysis} target={target} />
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {s.percentage !== null ? (
                        <span className={`rounded-full px-3 py-1 text-sm font-bold ${scoreColor}`}>
                          {s.percentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-sm text-ink/40">—</span>
                      )}
                      <IconChevron open={isOpen} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="space-y-4 border-t border-line/60 bg-paper/40 p-4 dark:bg-white/[0.03]">
                      {/* Target Analysis Card */}
                      <TargetAnalysisCard
                        analysis={s.targetAnalysis}
                        target={target}
                        subjectName={s.name}
                      />

                      {/* Components */}
                      <div className="space-y-3">
                        {COMPONENTS.map((c) => {
                          const comp = subjectScores?.[c.key] ?? { max: '', score: '' };
                          return (
                            <div key={c.key} className="flex flex-wrap items-center justify-between gap-3">
                              <label htmlFor={`${s.id}-${c.key}-score`} className="w-28 text-sm font-medium text-ink/70">
                                {c.label}
                              </label>
                              <div className="flex items-center gap-2">
                                <Input
                                  id={`${s.id}-${c.key}-score`}
                                  type="number"
                                  inputMode="decimal"
                                  min={0}
                                  value={comp.score}
                                  onChange={(e) => updateComponent(s.id, c.key, 'score', e.target.value)}
                                  placeholder="درجتك"
                                  className="w-20 text-center"
                                />
                                <span className="text-sm text-ink/40">من</span>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  min={0}
                                  value={comp.max}
                                  onChange={(e) => updateComponent(s.id, c.key, 'max', e.target.value)}
                                  aria-label={`الدرجة العظمى لـ${c.label}`}
                                  className="w-16 text-center"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* المعدل */}
          <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-gradient-to-bl from-teal/5 via-teal/3 to-amber/5 p-6 text-center shadow-[0_4px_16px_rgba(14,74,74,0.06)] animate-slide-up dark:from-teal/10 dark:via-teal/5 dark:to-amber/10 dark:shadow-[0_4px_16px_rgba(0,0,0,0.30)]">
            {stats.average !== null ? (
              <>
                <p className="text-sm font-bold text-ink/60">
                  {stats.allFilled ? 'معدلك النهائي' : 'معدلك الحالي (جزئي)'}
                </p>
                <p className="mt-2 bg-gradient-to-l from-teal to-teal-light bg-clip-text text-5xl font-black text-transparent">
                  {stats.average.toFixed(2)}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-xs font-bold text-ink/60 dark:bg-white/10">
                  <IconTarget />
                  هدفك: {target}% في كل مادة
                </div>
              </>
            ) : (
              <p className="text-sm text-ink/50">أدخل درجاتك ليظهر معدلك.</p>
            )}
          </div>

          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" onClick={resetScores} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">
              مسح كل الدرجات
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
```

## app\group-swap\page.tsx

```
// app/group-swap/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { postJson } from '@/lib/api-client';
import { useStudentStage } from '@/hooks/useStudentStage';

// ==================== Constants ====================
const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
type Group = (typeof GROUPS)[number];

const OWNERS_KEY = 'my_group_swap_owners';
const USERNAME_KEY = 'my_group_swap_username';

// ==================== Types ====================
interface SwapRequest {
  id: string;
  student_name: string;
  telegram_username: string;
  current_group: Group;
  target_group: Group;
  notes: string | null;
  status: string;
  created_at: string;
}

type OwnerMap = Record<string, string>;

interface FormState {
  student_name: string;
  telegram_username: string;
  current_group: Group | '';
  target_group: Group | '';
  notes: string;
}

function emptyForm(): FormState {
  return {
    student_name: '',
    telegram_username: '',
    current_group: '',
    target_group: '',
    notes: '',
  };
}

// ==================== Icons ====================
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconSwap() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
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
function IconTelegram() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
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
function IconSparkles() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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
function IconWarning() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ==================== Helpers ====================
function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'الآن';
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  if (hours < 24) return `قبل ${hours} ساعة`;
  if (days === 1) return 'أمس';
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
  return `قبل ${Math.floor(days / 30)} شهر`;
}

function normalizeUsername(u: string): string {
  return u.trim().replace(/^@/, '').toLowerCase();
}

function loadOwners(): OwnerMap {
  try {
    const saved = localStorage.getItem(OWNERS_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as OwnerMap;
    }
  } catch {}
  return {};
}

function saveOwners(owners: OwnerMap) {
  try {
    localStorage.setItem(OWNERS_KEY, JSON.stringify(owners));
  } catch {}
}

function loadUsername(): string {
  try {
    return localStorage.getItem(USERNAME_KEY) ?? '';
  } catch {}
  return '';
}

function saveUsername(username: string) {
  try {
    localStorage.setItem(USERNAME_KEY, username);
  } catch {}
}

function clearUsername() {
  try {
    localStorage.removeItem(USERNAME_KEY);
  } catch {}
}

// ==================== Group Badge ====================
function GroupBadge({ group, variant }: { group: Group; variant: 'current' | 'target' }) {
  const base = 'inline-flex h-9 w-9 items-center justify-center rounded-lg font-mono text-base font-black';
  if (variant === 'current') {
    return <span className={`${base} bg-ink/8 text-ink/70 dark:bg-white/10 dark:text-ink/80`}>{group}</span>;
  }
  return <span className={`${base} bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)]`}>{group}</span>;
}

// ==================== Copy Username Button ====================
function CopyUsernameButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`@${username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.show('فشل النسخ — يرجى النسخ يدوياً', 'error');
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="نسخ اليوزر"
      className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-1 text-[11px] font-bold text-ink/60 transition-all hover:border-teal/30 hover:text-teal active:scale-95 dark:bg-white/[0.06] dark:hover:bg-teal/10"
    >
      {copied ? <IconCheck /> : <IconCopy />}
      {copied ? 'تم' : 'نسخ'}
    </button>
  );
}

// ==================== Request Card ====================
function RequestCard({
  request,
  isOwn,
  matchCount,
  onDelete,
  showActions = true,
}: {
  request: SwapRequest;
  isOwn: boolean;
  matchCount: number;
  onDelete: () => void;
  showActions?: boolean;
}) {
  const telegramUrl = `https://t.me/${request.telegram_username}`;
  const initial = request.student_name.trim().charAt(0);

  return (
    <div
      className={`rounded-2xl border bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-200 dark:bg-paper/80 ${
        isOwn
          ? 'border-teal/40 shadow-[0_4px_16px_rgba(14,74,74,0.10)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.30)]'
          : 'border-line hover:border-teal/20'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {/* Avatar */}
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-teal-light text-base font-black text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.30)]">
            {initial}
          </span>

          <div className="min-w-0 flex-1">
            {/* الاسم + Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-ink">{request.student_name}</span>
              {isOwn && (
                <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-black text-teal dark:bg-teal/25">
                  طلبك
                </span>
              )}
              {matchCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-black text-amber-800 dark:bg-amber/30 dark:text-amber-300">
                  <IconSparkles />
                  {matchCount} {matchCount === 1 ? 'تطابق مثالي' : 'تطابقات مثالية'}
                </span>
              )}
            </div>

            {/* اليوزر */}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-teal hover:underline"
              >
                <IconTelegram />@{request.telegram_username}
              </a>
              <CopyUsernameButton username={request.telegram_username} />
            </div>

            {/* ===== الانتقال بين الكروبات ===== */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-ink/50">من</span>
                <GroupBadge group={request.current_group} variant="current" />
              </div>

              <svg
                className="h-4 w-4 flex-shrink-0 text-ink/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 5l-7 7m0 0l7 7m-7-7h18"
                />
              </svg>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-ink/50">إلى</span>
                <GroupBadge group={request.target_group} variant="target" />
              </div>
            </div>

            {/* ملاحظات */}
            {request.notes && (
              <p className="mt-2 rounded-lg bg-paper/60 px-2.5 py-1.5 text-xs leading-relaxed text-ink/60 dark:bg-white/[0.04]">
                {request.notes}
              </p>
            )}

            {/* الوقت */}
            <div className="mt-2 flex items-center gap-1 text-[11px] text-ink/40">
              <IconClock />
              {formatRelativeTime(request.created_at)}
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        {showActions && (
          <div className="flex flex-shrink-0 gap-1.5">
            {!isOwn && (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-teal/30 bg-teal/5 px-3 text-xs font-bold text-teal transition-all hover:border-teal/50 hover:bg-teal/10 active:scale-95 dark:border-teal/40 dark:bg-teal/10 dark:hover:bg-teal/15"
              >
                <IconTelegram />
                <span className="hidden sm:inline">تواصل</span>
              </a>
            )}
            {isOwn && (
              <button
                type="button"
                onClick={onDelete}
                aria-label="حذف الطلب"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-600 transition-all hover:bg-red-50 active:scale-95 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <IconTrash />
                حذف طلبي
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Stats Card ====================
function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: 'teal' | 'amber';
}) {
  const styles =
    accent === 'teal'
      ? 'bg-teal/8 text-teal dark:bg-teal/15 dark:text-teal'
      : 'bg-amber/15 text-amber-800 dark:bg-amber/25 dark:text-amber-300';
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/70 px-4 py-3 dark:bg-paper/70">
      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-mono text-lg font-black ${styles}`}>
        {value}
      </span>
      <p className="text-xs font-bold text-ink/60">{label}</p>
    </div>
  );
}

// ==================== Page ====================
export default function GroupSwapPage() {
  const { stage, ready } = useStudentStage();
  const toast = useToast();
  const confirm = useConfirm();

  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState<OwnerMap>({});
  const [savedUsername, setSavedUsername] = useState('');

  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurrent, setFilterCurrent] = useState<Group | 'all'>('all');
  const [filterTarget, setFilterTarget] = useState<Group | 'all'>('all');

  // ===== تحميل localStorage =====
  useEffect(() => {
    setOwners(loadOwners());
    setSavedUsername(loadUsername());
  }, []);

  // ===== تحميل الطلبات =====
  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await postJson<{ requests: SwapRequest[] }>('/api/group-swap', {
        action: 'list',
      });
      setRequests(data.requests ?? []);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل تحميل الطلبات', 'error');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (stage === 'المرحلة الثانية') {
      loadRequests();
    }
  }, [stage, loadRequests]);

  // ===== طلبي =====
  const myRequest = useMemo(() => {
    const byOwner = requests.find((r) => owners[r.id] !== undefined);
    if (byOwner) return byOwner;

    if (savedUsername) {
      const normalized = normalizeUsername(savedUsername);
      const byUsername = requests.find(
        (r) => normalizeUsername(r.telegram_username) === normalized
      );
      if (byUsername) return byUsername;
    }

    return null;
  }, [requests, owners, savedUsername]);

  // ===== التطابقات المثالية =====
  const perfectMatches = useMemo(() => {
    if (!myRequest) return [];
    return requests.filter(
      (r) =>
        r.id !== myRequest.id &&
        r.current_group === myRequest.target_group &&
        r.target_group === myRequest.current_group
    );
  }, [requests, myRequest]);

  // ===== عدد التطابقات =====
  const matchCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of requests) {
      const count = requests.filter(
        (o) =>
          o.id !== r.id &&
          o.current_group === r.target_group &&
          o.target_group === r.current_group
      ).length;
      map.set(r.id, count);
    }
    return map;
  }, [requests]);

  // ===== إحصائيات =====
  const stats = useMemo(() => {
    return {
      total: requests.length,
      perfectPairs: Math.floor(
        requests.filter((r) => (matchCounts.get(r.id) ?? 0) > 0).length / 2
      ),
    };
  }, [requests, matchCounts]);

  // ===== الفلترة =====
  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return requests
      .filter((r) => filterCurrent === 'all' || r.current_group === filterCurrent)
      .filter((r) => filterTarget === 'all' || r.target_group === filterTarget)
      .filter(
        (r) =>
          !term ||
          r.student_name.toLowerCase().includes(term) ||
          r.telegram_username.toLowerCase().includes(term)
      );
  }, [requests, searchTerm, filterCurrent, filterTarget]);

  // ===== إضافة طلب =====
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();

    if (myRequest) {
      toast.show('لديك طلب مفتوح بالفعل. احذفه أولاً.', 'error');
      return;
    }
    if (!form.student_name.trim()) return toast.show('أدخل اسمك', 'error');
    if (!form.telegram_username.trim()) return toast.show('أدخل يوزر التليكرام', 'error');
    if (!form.current_group) return toast.show('اختر كروبك الحالي', 'error');
    if (!form.target_group) return toast.show('اختر الكروب المطلوب', 'error');
    if (form.current_group === form.target_group) {
      return toast.show('الكروب الحالي والمطلوب متطابقان', 'error');
    }

    const normalizedUsername = normalizeUsername(form.telegram_username);

    const existingByUsername = requests.find(
      (r) => normalizeUsername(r.telegram_username) === normalizedUsername
    );
    if (existingByUsername) {
      toast.show('لديك طلب مفتوح بهذا اليوزر. احذفه أولاً.', 'error');
      saveUsername(normalizedUsername);
      setSavedUsername(normalizedUsername);
      return;
    }

    setSubmitting(true);
    try {
      const data = await postJson<{ id: string; owner_secret: string }>('/api/group-swap', {
        action: 'add',
        student_name: form.student_name.trim(),
        telegram_username: normalizedUsername,
        current_group: form.current_group,
        target_group: form.target_group,
        notes: form.notes.trim() || null,
      });

      const nextOwners = { ...owners, [data.id]: data.owner_secret };
      setOwners(nextOwners);
      saveOwners(nextOwners);
      saveUsername(normalizedUsername);
      setSavedUsername(normalizedUsername);

      setForm(emptyForm());
      toast.show('تم نشر طلبك', 'success');
      loadRequests();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الإضافة', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ===== حذف طلب =====
  async function handleDelete(request: SwapRequest) {
    const owner_secret = owners[request.id] ?? '';

    if (!owner_secret) {
      const ok = await confirm(
        `سيتم حذف الطلب الخاص بـ @${request.telegram_username}. هل أنت متأكد أنه طلبك؟`,
        { variant: 'danger', confirmLabel: 'نعم، احذف' }
      );
      if (!ok) return;

      try {
        await postJson('/api/group-swap', {
          action: 'delete',
          id: request.id,
          owner_secret: '',
          telegram_username: request.telegram_username,
        });
      } catch (err) {
        toast.show(
          err instanceof Error ? err.message : 'لا يمكنك حذف هذا الطلب',
          'error'
        );
        return;
      }
    } else {
      const ok = await confirm('سيتم حذف طلبك نهائياً. هل أنت متأكد؟', {
        variant: 'danger',
        confirmLabel: 'حذف',
      });
      if (!ok) return;

      try {
        await postJson('/api/group-swap', {
          action: 'delete',
          id: request.id,
          owner_secret,
        });
      } catch (err) {
        toast.show(err instanceof Error ? err.message : 'فشل الحذف', 'error');
        return;
      }
    }

    const nextOwners = { ...owners };
    delete nextOwners[request.id];
    setOwners(nextOwners);
    saveOwners(nextOwners);
    clearUsername();
    setSavedUsername('');

    toast.show('تم حذف طلبك', 'success');
    loadRequests();
  }

  // ==================== Render Guards ====================
  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 skeleton-shimmer rounded-2xl" />
          ))}
        </div>
      </main>
    );
  }

  if (stage !== 'المرحلة الثانية') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal"
        >
          <span className="transition-transform duration-200 group-hover:translate-x-1">
            <IconArrowLeft />
          </span>
          رجوع إلى لوحة الأقسام
        </Link>

        <div className="mt-8 rounded-3xl border border-amber/30 bg-amber/8 p-8 text-center dark:bg-amber/15">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber/20 text-amber-700 dark:text-amber-300">
            <IconWarning />
          </div>
          <h1 className="mt-4 text-xl font-black text-ink">قسم مؤقت — المرحلة الثانية</h1>
          <p className="mt-2 text-sm text-ink/60">
            هذا القسم مخصص لطلاب المرحلة الثانية فقط لتبديل كروبات العملي.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
      <Link
        href="/"
        className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal"
      >
        <span className="transition-transform duration-200 group-hover:translate-x-1">
          <IconArrowLeft />
        </span>
        رجوع إلى لوحة الأقسام
      </Link>

      {/* ==================== Header ==================== */}
      <div className="mt-6 animate-slide-up">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
            المرحلة الثانية
          </span>
          <span className="rounded-full bg-amber/20 px-3 py-1 text-[10px] font-black text-amber-800 dark:bg-amber/30 dark:text-amber-300">
            مؤقت
          </span>
        </div>
        <h1 className="mt-3 flex items-center gap-2 text-3xl font-black leading-tight text-ink sm:text-4xl">
          <IconSwap />
          تبديل كروبات العملي
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          ابحث عن بديل قبل الانتقال! انشر طلبك مع اسمك ويوزر تليكرام وكروبك الحالي، وسنخبرك تلقائياً إذا وجدنا تطابقاً مثاليًا.
        </p>
      </div>

      {/* ==================== Stats ==================== */}
      {!loading && requests.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-2 animate-slide-up" style={{ animationDelay: '80ms' }}>
          <StatCard label="طلب مفتوح" value={stats.total} accent="teal" />
          <StatCard label="تطابق مثالي متوفر" value={stats.perfectPairs} accent="amber" />
        </div>
      )}

      {/* ==================== My Request ==================== */}
      {myRequest && (
        <div className="mt-6 rounded-3xl border-2 border-teal/40 bg-gradient-to-bl from-teal/8 via-teal/4 to-transparent p-5 animate-slide-up dark:border-teal/50 dark:from-teal/15">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal text-white shadow-[0_4px_14px_rgba(14,74,74,0.30)]">
              <IconInfo />
            </span>
            <div>
              <h2 className="text-base font-black text-ink">طلبك الحالي</h2>
              <p className="text-xs text-ink/60">
                يمكنك نشر طلب واحد فقط. لحذفه، اضغط زر «حذف طلبي».
              </p>
            </div>
          </div>
          <RequestCard
            request={myRequest}
            isOwn={true}
            matchCount={matchCounts.get(myRequest.id) ?? 0}
            onDelete={() => handleDelete(myRequest)}
          />
        </div>
      )}

      {/* ==================== Perfect Matches ==================== */}
      {myRequest && perfectMatches.length > 0 && (
        <div className="mt-6 rounded-3xl border-2 border-amber/50 bg-gradient-to-bl from-amber/10 via-amber/5 to-transparent p-5 animate-slide-up dark:border-amber/40 dark:from-amber/20">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber text-ink shadow-[0_4px_14px_rgba(224,166,58,0.30)]">
              <IconSparkles />
            </span>
            <div>
              <h2 className="text-base font-black text-ink">
                🎉 {perfectMatches.length === 1 ? 'تطابق مثالي!' : `${perfectMatches.length} تطابقات مثالية!`}
              </h2>
              <p className="text-xs text-ink/60">هؤلاء الأشخاص في الكروب الذي تريده، ويريدون كروبك الحالي</p>
            </div>
          </div>
          <div className="space-y-2">
            {perfectMatches.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                isOwn={false}
                matchCount={matchCounts.get(r.id) ?? 0}
                onDelete={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* ==================== Form ==================== */}
      {!myRequest && (
        <form
          onSubmit={handleAdd}
          className="mt-6 space-y-4 rounded-3xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm animate-slide-up dark:bg-paper/80"
          style={{ animationDelay: '120ms' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-ink">انشر طلبك</h2>
            <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-black text-teal dark:bg-teal/20">
              طلب واحد فقط
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="gs-name" className="mb-2 block text-sm font-bold text-ink/70">
                اسمك الكامل
              </label>
              <Input
                id="gs-name"
                type="text"
                value={form.student_name}
                onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                placeholder="مثلاً: علي مازن"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label htmlFor="gs-telegram" className="mb-2 block text-sm font-bold text-ink/70">
                يوزر تيليكرام
              </label>
              <Input
                id="gs-telegram"
                type="text"
                value={form.telegram_username}
                onChange={(e) => setForm({ ...form, telegram_username: e.target.value })}
                placeholder="مثلاً: ali_2004"
                maxLength={100}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="gs-current" className="mb-2 block text-sm font-bold text-ink/70">
                كروبك الحالي
              </label>
              <Select
                id="gs-current"
                value={form.current_group}
                onChange={(e) => setForm({ ...form, current_group: e.target.value as Group })}
                required
                className="w-full"
              >
                <option value="">اختر الكروب</option>
                {GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="gs-target" className="mb-2 block text-sm font-bold text-ink/70">
                الكروب الذي تريده
              </label>
              <Select
                id="gs-target"
                value={form.target_group}
                onChange={(e) => setForm({ ...form, target_group: e.target.value as Group })}
                required
                className="w-full"
              >
                <option value="">اختر الكروب</option>
                {GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label htmlFor="gs-notes" className="mb-2 block text-sm font-bold text-ink/70">
              ملاحظات (اختياري)
            </label>
            <Textarea
              id="gs-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="أي تفاصيل إضافية تريد ذكرها..."
              rows={2}
              maxLength={300}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            loading={submitting}
            className="w-full"
            icon={<IconSwap />}
          >
            نشر الطلب
          </Button>

          <div className="flex items-start gap-2 rounded-xl border border-amber/30 bg-amber/8 p-3 text-xs text-ink/70 dark:bg-amber/15">
            <span className="text-amber">
              <IconWarning />
            </span>
            <p>
              يمكنك نشر <strong>طلب واحد فقط</strong>. إذا نشرت بالخطأ، يجب حذفه أولاً قبل نشر طلب جديد.
            </p>
          </div>
        </form>
      )}

      {/* ==================== Filters ==================== */}
      {requests.length > 0 && (
        <div className="mt-6 space-y-3 animate-slide-up" style={{ animationDelay: '160ms' }}>
          <div className="relative">
            <IconSearch />
            <Input
              type="text"
              placeholder="ابحث بالاسم أو اليوزر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-11"
              aria-label="بحث"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={filterCurrent}
              onChange={(e) => setFilterCurrent(e.target.value as Group | 'all')}
              className="w-40"
              aria-label="فلترة حسب الكروب الحالي"
            >
              <option value="all">كل الكروبات الحالية</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>الكروب {g}</option>
              ))}
            </Select>

            <Select
              value={filterTarget}
              onChange={(e) => setFilterTarget(e.target.value as Group | 'all')}
              className="w-40"
              aria-label="فلترة حسب الكروب المطلوب"
            >
              <option value="all">كل الكروبات المطلوبة</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>يريد الكروب {g}</option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {/* ==================== List ==================== */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 skeleton-shimmer rounded-2xl" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm dark:bg-paper/80">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/8 text-teal dark:bg-teal/15">
              <IconSwap />
            </div>
            <p className="mt-4 font-bold text-ink/70">لا توجد طلبات تبديل حالياً.</p>
            <p className="mt-1 text-sm text-ink/50">كن أول من ينشر طلباً!</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm dark:bg-paper/80">
            <IconSearch />
            <p className="mt-4 font-bold text-ink/70">لا توجد نتائج مطابقة</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRequests.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                isOwn={
                  owners[r.id] !== undefined ||
                  (!!savedUsername &&
                    r.telegram_username.toLowerCase() === normalizeUsername(savedUsername))
                }
                matchCount={matchCounts.get(r.id) ?? 0}
                onDelete={() => handleDelete(r)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ==================== Note ==================== */}
      <p className="mt-8 text-center text-[11px] text-ink/40">
        ⚠️ هذا القسم مؤقت لطلاب المرحلة الثانية. تأكد من التنسيق مع الطرف الآخر قبل التبديل الرسمي مع الإدارة.
      </p>
    </main>
  );
}
```

## app\icon.png

```
�PNG

   IHDR         �x��  ~caBX  ~jumb   jumdc2pa  �  � 8�qc2pa   Xjumb   Gjumdc2ma  �  � 8�qurn:c2pa:d0fe5ef7-df5c-4265-b868-b6377b347e6b   �jumb   )jumdc2as  �  � 8�qc2pa.assertions    �jumb   Djumdcbor  �  � 8�qc2pa.ingredient.v3    c2shA�\q�9�nA�6�a]   lcbor�idc:formatiimage/pngjinstanceIDx,xmp:iid:64ff6a17-261e-4c28-9f89-630bbf37d15clrelationshiphparentOf  �jumb   Ajumdcbor  �  � 8�qc2pa.actions.v2    c2sh�x	C����7� ����  �cbor�gactions��factionkc2pa.openedjparameters�kingredients��curlx-self#jumbf=c2pa.assertions/c2pa.ingredient.v3dhashX 湝�fD3�+�6f&��qF~(�F�C�;��)��factionxcom.anthropic.claude.providedjparameters�xcom.anthropic.origin-confidencegunknownkdescriptionxfClaude provided this file at the request of a user and may have created or modified the file contents.msoftwareAgent�dnamefClauderallActionsIncluded�   �jumb   @jumdcbor  �  � 8�qc2pa.hash.data    c2sh�@͢�ٶsM�D��   �cbor�calgfsha256cpadM             dhashX D]�Gj���b�N��h���J~qT{D�i��&dnamenjumbf manifestjexclusions��estart!flength�  >jumb   'jumdc2cl  �  � 8�qc2pa.claim.v2   cbor�calgfsha256isignaturexMself#jumbf=/c2pa/urn:c2pa:d0fe5ef7-df5c-4265-b868-b6377b347e6b/c2pa.signaturejinstanceIDx,xmp:iid:4b851767-784b-4f93-a3e4-8f958d832b2crcreated_assertions��curlx-self#jumbf=c2pa.assertions/c2pa.ingredient.v3dhashX 湝�fD3�+�6f&��qF~(�F�C�;��)��curlx*self#jumbf=c2pa.assertions/c2pa.actions.v2dhashX �C����e��&i튼���in_;��Ep!�N�curlx)self#jumbf=c2pa.assertions/c2pa.hash.datadhashX �U[LH˷�A[�+�+ޒ�ǽ�Ü����3�æ�tclaim_generator_info�dnameoAnthropic Filesgversione1.0.0kspecVersione2.4.0  8jumb   (jumdc2cs  �  � 8�qc2pa.signature   cbor҄Y�&!Y
0�0���@�
��9о���B=gU 0
*�H�=0I10U
Anthropic, PBC1.0,U%Anthropic Content Credentials Root CA0260807184356Z280806194356Z0D10U
Anthropic, PBC1)0'U Anthropic Claude Content Signing0Y0*�H�=*�H�=B �z
k�P�4�B�9[D���ײ�J�з�+3wdw���<Et(�.:}}?�4U��}�J�7���X0V0U��0U%0
+��^0U�0 0U#0��Q��Nd[#���Ϛ>���\�0
*�H�=g 0d01s�z��U��F�=���lNf���O@e�?<E���$���@��U�0p_\��a�bJ�/���P�(��2_��=�Z��,Ï:2��x�S�TQ�G	�cpadY�                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              �X@}����2L,�jCN
�I	�%�F
�C�z�o��V���
�pƜq[���'�U���t$�?�m����.�   IDATx���{�]�U���}�}�-[�e˖-+vr��	�iII�!/�CR @�SR�|)M�Y��R(��
��������V�-m�#4B�'������{�ٳ~̬�5���/]IW�|�s�޳�g}֚53@AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA�e��(((((((((((((((((((((((��(�Wh�gAAAAAAAAAAAAAA�sE�/(((((�BP�~AAAAA��B






























































6�~W̥�@AA��@�� [ PPPPPP�	PrAAAAAAAAAAAAAAAAAAAAA�e�>72΂���N�U �M��@AAAAAA��(�zAA�EG� \(����������������E�/(((((�°�R�B





�c��E�\P�U ��\pPPPPPPp����K�q>��,�E��z�D�|�JE��������\8���@|���2��]PPPP�F���" C.�����͗�c5h�u2.����K�q������Ǘ��J�׋��������b���������i��#���#��~�7�<��w�����"�
<�`A��w|R��B廒g���Qya�ri/������BA�
(����`5�����>ו�Z���g�b%�����k��JXm����<ʋPPp��|�����7j��<tYNVK

�x@A����D��G{��r.gI�X


�K����+��`�X�	��*(�h(����[�]�¿��`
((�|QrAA��Q� 

�,\L��f5�_�S�b((x�bܚ��k�����z�Z�^�A6/C/((p8mu-K�$PP�b((ج؈���K�_/��Zַ�Pϟ}��IA�y��Z�Ͽ�ev˭i�S_+X�PP�b((�Xȅ?u�[�Y���sVz�JG���@�h����ǯ�\�1�"_�\�(�����|�F��k��.��:.(@! ��T@9�v����2�҆�� \<�$��8����R��K�lJPP�9p��QJ�}���|!Q�
6%�V��ic'�q��q�@�u}�hX��|���+��*.D�`S�R3も�	{�y�Kxw��H��⼰�8�i�k]f��X._�� ��6�Yi���Nh��� ]o]������n��e
��`�XI����j���3ӑ�{֐�{V��y[ֲA�f�E�\6(����е�︹다����ED����9��|[��p���4. 4�^��i��زe�����[O|����e�i"q;b0+�����9A\P��@A�����Y�~]�)�\�>J�1 G�<�̠zv;*	�<�@�VS�j��7����	Fo���Ƙ�ŇO '  �h��'M�,�p�6�Ǯ^�1�<>͏�:5��I�eG4�Y�Y��`:��I���S�D! �G>��4�����������t�����0��Z�_��w�hpVg���G���z�g���	�3����о}7�㽧y�3���[;�{Z𜝥Ys'��@�оmN��rs��~�s�����B
ˋ!�(��(������v	<�E� ffk��6����ok��{G �ȑ#��>�۲�eb��z7�����-5�v4f;�f�zh�&c�ܰ!";b��YP�te�SM5xbiD�v��3{Ν<s��{�0׸<0a��v����X`�bu$�B	ʋ�2���M�B 

V�喚���۟	��Vaaa�G�^>t&x��m���n�'��o[=�,�g�5 ���� o���`����[b�Â�l�����Dx�=	�Ib�>I������ON.�|�c��W/�q�Kv��ŉ�P���F�K�Y@��G! ��J�"�>w��W�.�WM<��'N ���N^��W����Ģ�B��$��6d�&f&@��ncP[fXf��"��D bS��@� ��L���2p��~�G���D��ɩӏE2p� ���6��l�ڸ� !�+4�R�BP�)��M�B 

R�f=�r��[������� ��y�׏F�1̗��+Le����'ФU�pԀ�l��QY�%Cpj?�A 7y�~v�3��M�ACDDd`�2�-2�1C� ��G����j>����o	 p��N���Ml��~����V�B 
65
((X���/��� �p�s^����L�z/Fo���������� ,3Yr:;` �	{g��w ����v�Ad&b�L��!��`�� ��@O3��4���>U��3�>5�335p;0?7B� ���|�#�Ǹ�	(�T(��`<�m+{	�� g�!��3�暙�����ۖ��W1U�gK/6�n*�6��Ep� �C�;�����Rqt)b�@`fTD�{�� ���?k�� &Be���;� �=SӇ���}�׿�:v�L��e����F��j�r�@s��B 
6
((��z��7� ���`f���� ��/x�X\��L��@4;j�"�N���/y#8-��@���[Rl@^�'B��q��g�B��`��#v�4��x�1*��~�G���d�k��?>?w��N�$?ޠ�9��j[I`��2T@��B! ��$�Ƭ48��q����r�ҹm��z�m��0�� ��03��8�� d����{R @
�ty@$T�O�C0@Q|��#� ���8��Ȅ3,��3��1�>U��%������_Vw6��A�դ��� :lA���&�

6.��=�g>^a~����-���m}s|#Y �
���V W�'�[R �.u�"E i�?
\Lf\���]�̆�-( #&XULTр��3KͿ����=>?w�����'8.��^���(���

.*
(x�c���E\�ׅY�$��h߾����<�꡵�V��Bl'�� 45�ș��D�DL�`�(���S��'ٻ�&~}dv��"�<�	��qB, �� ���0�Z&0�� ���q����=�>��p�p�8ït�X�Cq,��(�� �%�������`����\3}`���L����>ca�3?�8/�,6%�Cq�0v"�)�EL� `H4zV�|Q�j�زx��@����<���-[�i@�'�#��h��Ƕ�����C\��L���`n�q��Nw�����M��5��[p9��Z��� g��![o�٧�F��1ۯ"�I/����*Xb�s�cY�'3�ګ?Z ����^��M���=���e���3<0&�䚳;X*��+�#ˏ��G�য়���=�V���� �?༏�P(���ƥ� ,;#YPp	qH�|����m��,0g�~�U�S�o�}Y~�^�# �DƯ·|���b���/E���c�(��ܯ����LW?��ϔzN��w�$ŗC(��D�mMH=����-��S����� �k�>�v6!	�l�)(Hp!��e;�\n� ��8�� �F���b�t߫�2o�_Jd��yX�����+]>�n��d(��;U�3����'[&��@tt��@�Y �u ��@GB��4$�5���Y4������#��0ff{��JƉG���M
.����{�J�������2\.����S=8�h���/@�~���k+2{�`���i�nG8�z0�Gs�Ҵu���Y�9�"W���{1`�XlD��V"�d/���gqL���A1,-�A�I� ����v�?iF���7����;��|���SB˺"�$ց2�lj\(�Fn(V����nd��G�7��M5��Ń�x볟��F���V�ɀ�6#b�+�\FD�ׯ{��z��\<���ν���>5�������:+i�+p�)2��k_	\���F��pC��mc����ҟ<�S��Y��5y��c��b��ؖ� �-.8)(�[�����i�s	.(�rp��
�F��>�x�G�];O=��*��7��0`-l3$b�ʸm{��T�8�����E~��[F!>��I8�Z�'�o�Y��e�K�xdo�#O[.�<�3]��*��5ê2W�?,n{��G����~i��^�Oc;��B~9rPPp��RLti��piQ�h�؀wC�=�C8�G=<p�@�}�k����'�y3m��ȸ�{��^����~!nV��J%m0�y#~w�C���L�L���~����F��̤5\���/7��Ƃ�1��k�_�wM�>�������?;�/� ssveAQ, el+ش�,���"�hc�����
�c���><��7#7�`�#�֎�L�D>��ᙺcGS-'K)j�a?+Z��8^L_Yu������ZJ<�
�-���o@��}���F�k�){���b�+�p�Wq|����3`�������s5>���A��8����U��hl��pyȅ�|���ܷ�놯����oz3�*��������$�9+-������?��?)���M���9�=H��G5?��g���[�O� ��	e �	����A��p�1S�^����d3/2�N[ӷ,�vx�x�#8�a��nc���Ч�K�Ntb#	���qvm5�\Xt�V�նՅ�f�k�J��_���	`n0��c�Mox�hb�A&�M �Ecl ����\��J��ʊ���,[A�'����Y���d�#���{>�8�?�Qp3�$��X�5��$��e7K(������0��6��[n~�w_u�%�8~|fz�A�a.)r+h~�������v����%�J�]u>����mV��skx7��!����!����7�j����v�����}���mykk�6���ڜ���Kz�߸�N�8n1}X��k}>�d�FXb�a�Y��<�
S (��CP�<qp�a� =�vt��	�Zk�-M��6�~������[&���t��o_���f�<h�x�`�pk��d�E�o����Tz.��*ލ|���5,Ux胋x��ԎS�MCoe����;d�Ȉ�n@l���� HW�		���0G� ��g�3 A��@�����=(��{
$�0v�`Iˁ.SK����n��HLT�?�{�Ta �0�dL��Z���W?7��ӿ��c�3�[1�v��5�$`S �.���
քKA ��.��X�f����m���3��??��$������,-��!~=��ZXk�iDd+�m��Ô<R����p���9 �\�q�����obM[�1b�O����<��� �Fn��"o !�:b�n����U���Z�#��,��4��w'x�O��o���WM`���e�E����rV����Jx/6e����JZ�j�{�0k4�8��������"��v����3z������!���� ��' !.��Z��'��cu�����M2� ��.`�P�S�һr�0������m��J4�&*<�	�I�l(���8/��� k��Sj,b��7������[����>��gq��i,����y�m,G�u�+�,�@��t�K���J����Z���ݣ��8r�������^���o#����0[c�MRw$���ݹ���q���^E���!�:ZQ["!�w)�Nz%w�"�=�M#Ҵ�#5�z�� ��`�� p�"bn��2�TT��I����ʾ��O�֟���I4K���h!R�M�.���EԵB

V����.֪�?�q>����{8���[`��u����;˯2d&��b�5b��[s�O?��^��<��M^����Psj�'e�ڝ �秶��g�}���'�y�&*�ީ�m����Y��b��
xO�'���5`����d�l����24�Sk�ݧ?����gvffq��wL'ȗ�j��

VD! �eb�������߷��E��OK�߳��̠Ll1C����kv��h�Z�Sth9�)M^m���3ǈ��0U�5o�%>������l��C�1D熠�K��	¾1h�� �c��_@���7�'����˄��Xn�����O�֧��)<z���[���k'��ȅ8:������������`�P@�s	�6�޿;�9J�1��þGzx��� `�-��*���,�W�k�%p�~#�0��e5��SX 
I@��6�UV���D��Ҥ� H�aVA �8�Å�ʒ��#��_�&(���J����D����)p�ߞ&\
���nٱG	��v �TL�=���G ������%������;Dh��w��q�X
V�B 
�� �X?|�:g����/x��s�웪^�f�j�6Me������]�;BE���BRjz�j�	� .�X� x�YՖL'�;�Q�$����hP��-�е� ��L>��
�ɮ*\���+6�@���R& İ��c��򃦱����>���8�}wN������=�E ��Y-�Ǒ�"�V�B 
.w\�>���K��b ������fDo��^	2[����/b�
a/�l�8x����YD���Ӗ�6P�s��d�%Bډv��tx
�L�Q�O����#"K�Z ?����٢~�"�9jǿ�����>���}�K[��RÆ�z�|�G�����o��V��$f�1�!�&�&%�(8oPp�c��01���'��G��|��
���Tw�17{�~��L� D�⼧��Q�� 9��3��|R��'י3I慹�>�t��v�Ó"!"W�)=$��w�>Q�-Q��*v@��qJ0;�/�G 2Ґ�d��b���6�����/?���>}�m_��ɛp�{��)�Kft�C6.��+ � \���>�8r��_�����Y ����/ac�Zs}��x��6T�"6�[߿l�����l��;�iэĜ�z�g �BYE -��I�z��!��	<����FtjlOt<.YP���(!��e-N�L��q%ԁϗ��  ��D5���~�G��>��_��⻧�=t�}tߢ;S@�N��+��MldW 
(�P8�Ar�x���^ أg��q��}pq���ݽI{��򷑡�T�T͈������A^�_M1Ez��R�t������J���+>��[S�3ZTv:����/���;q�ѭe')$$��jI�E� ���]�(]R�< �!� �*�Mq\l�07D`L�#b����ĩ����c�-f�ڂ��\���~(��|}��w���� \(\��g�k �����q����|��^Ҍ��U�u��y� 4q� n䗱{�cqc6e�;��r��t�9^	t �+?��-sv���������s�����v���\�%�DB �:�"9y
a� ���H-aWA�,�~�*�~
�ޟ #.n�C�+��,�� j��,������q�>Kx�K�V�xl�`^ͻPH@��(ใ���>n�s�>,˶r�_�=Za���- G�n�y���cX�%dM�%k"���6A�զk�͚p�ߕ'���	��^��N���<M�] �΂� $BQ�# �낤�^;��TA+F;"��	n{b�2�+I�u܆�M �ä!�d�P���5��������o�o��yxn �Y�����w5��s��{����G���-J.K<�_����k�Qrbv����}���s�׽��7�����`��M{7�����o2/�#M�Dsb���>=J$����@��H5��t��G��M�X!R�:�2)tb���x�����t��dZA���%�p?�"�H"e2Q�˽b�]�X�xX��5�Q�Lw���e�z��fb0�"1o����L��m�|�7]s�_O����cf��ߵq�X��[m���JϮ$��p���xa�����ۢKuͯ�]�?3w�0-�^��g���y���� �B�K�%Tbp�M�X���X�v�8�LO�	����W�������z��<!6� ��v��]AHH�G��r���	�2���*��� y��*H�&lm�g�M|a|ʭ��J�8�ʊ*�0�@��b5�n"E ���hȢ�1Ƙ�g�'��"���Oz��l����Z±̬r~�!�eg1��ǐ�u���(X3ƽ��X���i&���fg��F�|��Ae^�0�N�_�`Kl@��P�e�H�VZEP��Lj�V�)�n���:r��J,N���d:"͑~���'Ѯ��ZO	Yery�v��"�t��O��e>��?j}M���D�' �9�;m0qy�kt|j	��@` ��Ck�KT�{a���۷���w�P�?���-��wMa�Q�^��@[���t��]/�f��������{��
'N���- ������h��D�`�c�f	`��� v���l9�?B�	+JoVL"r�ka��� D�"��q%n�N��Gg7Ry��D	G��x� Ի�9����Ch  �*]�7� $���:W�s>�Cd,�Բ|p8��JA} �3�;�J��;� ��UU�΅������>9�9���18Mx�!���e��e)�@\N� �rz�u������k$G	��1;g�'������:��;�v���[�_H0��\�~�k�ϟ�9�h.wKʺ��]����l�{�x���  ��r��N a�f=:�<���Ps�u�o�<�<��&dT/���m��GU�@��� 	K�ö�d��@�c�B�l��ٹx����\�&-�i��7G���s=�� �L�����w����G��B 6'V�"fjc~��K���1��0l  �n��͘�73�o"�u�fƀ�� 2 b�D J�E��d��A��[+��������^�%�.! �����I��p��N�#lg���x��cYX- �CI6B/��~�I�*���	�*N� ��Z�&I�skG��� 3 ��X���O[��}�7NG�Q/����Z�J���ZHu! W 
؜�z�J�e.�2���\��b�3f+�|���'�W����F��+���0a�$,��!��^�C�k��0�J���{b%G��[BƉ a  q����������s\\~�%�	<�Σ �h�+�Mʯ��sH�w�K�Y�b����]��y��#&�"&��S�ZՍO8K����-�4�s<�mI.,�'5�ed�en��T��e~�o�6�>���	`����Vї�5��+� \>�" �ut|��B��6���p���=��_�`����B��-0�F݈��x��˱�Cs�(GAs�>,��B�����=������fBq�F=q5@&DC�:}B��UE������r��5�I!�n�HB��A����J\�� U�]�8L����~�[�ե�o�/�^/�J����5���� ��=A���{�����{�P����;n�M5�4^<���:b�C���}���
\����������=^���8r����Ѿ}wN/MN����w �*��,07 ��˃�J8�Oe�B�D����^���?�g���Wϳ�˦��F�s�dG������,e��Vk���0A
K���t.�! ��<M�kwVo��p�d�^�=@�˰o��< 8�xeA��y��8��-��V���v�TE�7���S���`q�x`wuU�@ט�\؂+� lti�����z��̀з������C����! 욙����n����F@�h � WN��Y��O�ĺ��v�'�-&zo�aB LP���-��i�rp��`:]��Ʌ'�> �.�-͢y���x:.��2�V5�$Rr�ګ���/�/���T����]#m��g�ڒba��E�?�"��!sajG�EڃS{��W_3L����#����?:��}f0��g>�p�H�3g'N\�)�q K6��Qp�P��A[�kc�gXM���VlP�ʅ~��/Gf����_1;�̣�2��W^�����1��{	���]pEN�2�.��S��`�����믋��{J�k���1�N��&���0�H���~Y�'���._���r@�+D�ʍO/����LvG�Rh[4D���Qt&�����K��u���m�D�DCX�M]�֎g���o��}��%�
��k���]����q(� @! �ki�\�/��W�6
з�Aq��v&�;*A`���G[��	����$�en�@T3q&���3A�8a��� D��x@�X�	�4���DPksuײ D���L	�֦?�dJ��5Y�ɯ��Z/���w�єo�$D�+ �A"/�ԧ�U�"���1#�D�2#�C��<A*�;
d� ��Q��bf��;=�S'bQH��RðC2�$���?����Ǐ�03���I��an����r�ڱѤ�+����%�W�����>O��j@��{�8~��y�^\�̰���� ؞c�@ �({��K�T*� m�uW)܎��#��%,W�i��U��b%a�����*C�1gY��G�2���T�ߝ��u��,lj�I
�����HYZ)!}�+1�ؐ?���y���q��W$喼�|��`���َ�di@���l�{��Gv�u�����������߭2Ú��X}C\�(���F��>���D�N�33�_��==����_�ﭫ�-C��3�	� ?(ǒ���Z<�o�2؂8�3����^��ve�g���*_3	)b���.����dzߥ�h���ez�O�T�C��!7&�S+GG�i�$;R�B�<)��C(1�e=�CJB�(�����z���[�BL�p0˨T#�L�B\���37��ҀP?��Q��w���`_�CSpOծ�5[ tQ��/X� ��Ruŷ�4���[��c�u�-��8�g�0�
ܷ4??7�y��������?eL����瘹!�������= �cF)�o��_�`%���P>� ��v�5H����C��[��{!�h[O�wŭ����ǯ4��yBmk���wEy$�pV/��X��밚$��o���9U��H�/^�鄘}�#~9�0�$����<3�����&n�6k�w��{ǡ�}ݞ��i<p�f�_W9+׺�fg��
Jg����+}m�m��qqh��JDc�0��YO�=���G ?>���٩�O.�-���T�*B5a�Y �U����`���h��g@�7�5�L������H���(�*D(=D�����;DU�2�{G�@X�ēG�n�<6�<�����*T�ЪMw���d�́"�H��n0�e�A�zLW/�]câ	�U�ԐH�\�g,Ǜ@���Std6���I��#�1�p�޿���}�;�֘���c�}�e� @! ��ӕ�]���p��וFW^ƅ� }%��G��� '	�{ssͮ�w�ӻ�a�Ĩ��C���/e�w�K�\�(�����Z�fJ5�v�uk����rWV��퐛���/��HEz=�*�c�@z];��x4Y�����R5�j$|�v�A���k�"��CJ@�А�E����<�;��������_��W��������	#"3	�#K��?un��/��`v���'-�����K�X�K V�lr�1�T`9�# ���|t=p���? ��2nm��z�-W�a�' ���nx��nLf7u��`^����z�?"�6�SҘ�'��jn����ז���|vF�^4�ʑj�n�Z�q^{��À�� @�w-�%*�!n���%nՍ�I��@I�$�@�\<�	�� H�dnu�T�P+>Y��_��	�I�д0��oT!r0|C Z�\yHl*TU�Z�s�3��|��~�1>���a���[f���d~��ׂB �#(`�q��#4�q�~g.�/�ֿf�28x�bn���ůܲxz뛘����"f��l�	2N�('8�#3)��ĕy�(��%��R�{�{Awl���^�Z �i����:@����L�h�Z�F����H ��!!/8�"!
�q��$4�5�	�r�$�/[\��	����ci_�\���O�T��6]��X��2Ŵ�d�c�C\�����Mqc��1��SU}��8|w��,07�P�E �ˊ��8>��� �"��E�h�^���w������^�xf��X�3�z�mlB�M�[r�*a�#��0s_ep����,Zg���5�̣���g�h��|<�q�����z�(�iQj�F�]��ZߏdI�2�}�YKx�dR>�F$�C;�q�P��q���l5�V�9��ڎ26Bɟ�����d� Z��*O��c��
�I��%0[������̎��[p�+�q��!fPa�؂gհ���}ǻƆqJ�Z�-��(������Jq-�"_$% �%��w��Ư�Eu�k�V��27 ���q~h��d�$Q��\ߠI�U!���P�[�ESN��b�Us�:t��<X�����z��a����-�P��V���.�Iψ4*V��K���r��&M>�ǩ���%��E÷�*���R���xC`M:vVR$O�h]����'6q���X�.;l1���l��)~�y�=���Obv���ǚe3�v�� �x��w}��+�&F! �E �s�b� ��� ����>���;x@� ������l^;�Ƣ�Q�(�e{��h�.�qG��2R ��	��� 	8��7�Jw�aT�DF�,r�;�r��V���d��p�e��eR脈1u���*��Y� ��9�y�*��A��,�,�\��L�Z�wv�}1�˭���n �{�"�62f0��}#���⃿����
�0w6�1p9a�Q�~N ��O
6)����F1��@���Y8��f��׾���g ��Dfg�r��}�5�q�֦wrz��z���(�%�3c���N��_�:U�pl.��iM�$��N��v/�E����:�A?�*�2ȭ��  ����sq?�,�r�Oxa�mZ���%����H�8���ii�n�<M������y�m��������*�I�������07�«z��m�u������'� p�R�X�6S��]D�`�b�+�#�Ǚ�6f?hp��8fw���\��ZطVU}���:U&�Э�tR�<*�+HOw�� �%s��K�\�䉖��i�Zs&pS��e�CbΎ$&j�m�>
ZшW�Z^��o莢�L����A���vLIu%I���
�.&=$h�@��I)R@�J�T$^i�������x.�&��Ʉ���hFb����a�b��_����}�w @�p�h��k�)B�2�&8�ǵIp��.gs��Co;��Jk�[��@d������0BG��}�]7 ����" D0�Cڬ��'i�<��%��4�\��s� H�\��IÉ|X� y�x������X/y��W&���R�K�\�R�1�"(eݿ�^=��7�Aצ�1��Pu�[D��dd�{�ҭ�$�� ��!͟��+���B"*C,&!.U&V�� 22�D�,�>s������:1�0[�����%lzl"�P����;���ggCA�Qk��(����/�o��3��v4p҈{��Ѐ�]���۶�w|�[ �7���;��;���a��4��y�k�=Z"R���
��<' z�`TO�LR?�ydr���;5[�L�ڊyGk��]��QFHT��v��R�n�tN>��_2G̬��M7�?ژ�ٞ�5��ʠ�mq`��*G5%�311�w�"B%I�?`�Uuߢ9Y�Bz)�o��Y���1|!�JcS!�6�p(8����m�6>R������W-Mo#S�-L�lLvHl*Fc���y�It5� j���"�:9��H BS�G���v�~� :J�1�h¹��7��uB�J!�%nn!I��I ����!�vW�|T�9��Y�^漧�D�]ѹP� ż%�U�!?�QS[�� t�K�m�1=�6�H� V퀚���!�,���X9���˖@#M0�+�G��;�g~����8p�� pOs�^������	ps��O��ڗ�pI��|N+���ĉ�U/|���m���C�b�^Ɩf����5ڔ� F	5��&���!�"�hg��P0��S�h��!�~�S^�9q �KΈQ�5�!� �Yv9I.�,�lW�h������.�3�!~e�Zm�MH�Z�,����P��$^�p��4W�:ؓ!���m��w�,��Ъ��ջG��i+��F�EɈ2e�%�r?%{�
�&��	}�[Dğ:D��0�`��#&�E��_.ڭ?��_�r�������E��	��բ�̓\���3��4�#G*���s&I�v<�k��YZ�i2շ��6�%�L�Iz3���1%�g)f�&�nPe��S���8�*9�iw3�p�[zOA�~j��A8�z�S������S���rNi	#҂D���q�XΟ�%N�ʕ�nL�i����:rs��UJ��_Z��
�4�dՆ
�7���k�����EI�����)T�5�Vٚ�y��;��ނa�}�n{���y�_OsC��z8|w�L��������4���bu�c��w�����?;k�'��x`��w�{��'�
�K��g�h �Dd*ev�&�t�((���l<�)G!�C7�*�t�_Z]j���G%O�q�zH�Aks#l���k�H�H��̖zH��#Φ$�q�u8:*��$���H���Apt�e�E�+&2	��5/��"#h�����
�NO�T�!�䃳�ҷD�'+tX�N�3{��� �b�g��E4�4~�E���o�X��&&"a������Ԝd�?W�&~��O���p���X��й�
�	����w��x�2l�E@! �6!�C}�V8���6͞��~��i��	o2����.���VN|��� ���BϨ����W5Ni9@A]�pWϲט���� �ڞdES�|י���o	Ћ�����PL��Q'�nH��rƛ:���9��U���o`^Y��m�K�j_3��$}E"R֧����,?�7 �%�B�B�O!)-ɵ/�:v�U�9��+��w�X~ ~q��h��E��2U0d�߫j��~���8�7��	�c���R`-B��M�B .?�# k	�A�s���!���}��as�����@/o�V�Ai�Xk��Վ��$F���� �ֹ6���� ��=���8X��َd����C��ҭ�B[RO�IX����i��XC��h��$�X �F�1��'$! ��D��H�D�ؕQ9����L�lR�"�E�;�a�v�5y9�(��X�d�Eɋ�z��N ��v�r��U�0�0,�r��Z��Y�B^�> f���`M��=#C��R5���3��q�H����΍plC�j� E�oBp�a\�%��*�o@>�����MA��y��^B5��Ao��6�d���n��h+60�	�`q�]R"�l�KQ�����,�g�!��l]m�V'�c "_�hC��Y\��>s�E����Z�	��T��9D����&Ոq�O�1�(�]y�u����,:���Q�y5�����}�1��u<�ż���ĳ#c����iQ[��H];�P������P�jC-:$��`k �@�@D�����~��g�C�^��/o6p߀�@׸����A!k@! �t�ƽd����o078�����#����z!��X2�`8H�`g?hgj�hDA�*�|*��y�,�h�����H����_ �" m+��G%���iƓ�)	Ht�$/��Yߏ]"P�FCE��D||�D�kٕ@V��TI-�C۲��<l��D�L�7�i�U���������Ϡ��/EJ |����2�$�f*JO[�a�(���=��o?M�phD�
���NLd�uL�*�L͖��N��?���y��c����ebC�C�;�w�?�pyc܋��o4��0�
{NZ?>�~��"6�e���-�.˼d\��$���v��E���n��g�H���.��/���(S�S�3�H]~���2[��<��y>��%f��i=;^�?�|�x�Y;�����<)"�e.G-��'r��M񻆶��]�T�c*nJ	@<P(�	�S@Q�O�T����%Ҙl�X���H���G���i%�J�X�3�JMY��G����}��k  f�W3�Dga�0�,<�q-��8r�Ǐ��ՄRY���N�
���E�e��	B�Rv����w���5���{��[_�*��y2��Ykw�6�0��P� ���8O�8�%m��j�����ҳ�����ՔF TS���q/$D(R^��T���߁/)�z�qϧlX$JI����],�B����Ng��j��b����HJn��q�.qI�-)@l�)k������:尕�t%����=��n$��k�g��r%^2iZ�5pR!�lT�,��:�6s{03�]�Gl�fv4IT�������C�y��n7��E ��ll�W��Ơ1=��R������
��^"����>���}K�ffo�����,��T���2�%"�ɠ��� �̤i��wb�r�Q:Ъb��d'�`7夤B(�s!)a5v�Q
I���:0bī��T����~,��R*oD�f�<�P[ҙ`�v�FA?��	� �]��e�x`�d[�4}�/iR��H=��q�G�=�]����KG9:ˠ���!d�bE������@�d?�ShB�:4�8ȟĨ ���7��^\��������׽Ǐ5��af��{7JHwP����+
�1
6km��G	���{x�r����ާ�
˃�Y�W�6�f	 `��A��Q�13�ʢ�9�3�{2�I��	q>X{����y�:Vٟ�C�6��Y�a���<�<�ی�T�2�/,኱��"��ie[K^Ig��>����Oc4�4�G}��+��%�����tD��,]��D��n"��:Oq٤*�*t�t��3���B^))�z6]/خ2�-�/9\���CoE��	���e)�;҉ �� F`�?1�Oo�z�ۏ���9�U���?]0��*�n�6h��ւB ։ˉ \��_��a�C�pǍ�~����4�M���6�#`���~�cH���PBpW���9m�5[P#^����O�l=�#��8*�L��M ��ok�2v��7=p&����LB��=�4V���Z�!M&��yB�)J�Q�T��B�DH�,��z� ǅ����%{�&{�ye8�"�x]2˪��W(d��QS;@�u�$��Ac/J��R�4\^BŴt�Ǌ�w��c�r<� ��4UزŐ�`�d����p��}�?=��8C�GG-&�<6Z�\`�9������?��۞G*���"��w�c_a��͖_IdvX��eԐ3T�܉�`��i++���8��! U�jY\��/�O֚��5Pz����Z:l$J4���b�<%ȑO�G	�νH;?��	��/�Qm�h�j7;m�VBZv@�G��1�! J�U�_�Pm��6�ъ�U� x�@��Z�<�$}�i���ZpI��b��2��Ǹ�@$1O�N�I��y�$Ump����j�_|a����&� �@Vx K0�&��,��kF��g>��F��3#�1a���/�����+E6l(.'p������'�5���1N�����o�}3@�6��0�Ae`*7$�8� Y�%Y�5�h�WSZZ%�%aH���K�ĵ���>%�;*V��۴fY�r���F�M+�4�@��gI�LJ�H���Ÿz ɗb�.NfEh ��e7�I�扂Z9���&G��%�,O �6
_�� �&e��kݹ_|\�G-���.�	�i�e�j�DUu\��� H\R��a!�GŒ���^��@C0[�	��v�����W}�?�ĉ�s�p��QgRa|��rp,$eC��u*e�턙yp�}K�\s���Y�n~��z'Sukc�1/1q�0U�UӀ�w\p� ��C;c4Z�!Zih�>�
�
.���/��xRg�~�=��JGɯ��<j'5_��^2�'ڢ���(^�1 �*u5t9"�i��o�%�TM���3�5Е4~}L�Z<���st�$F+��l�*GJ*�8m!!����E�N<�����/e�
�����f-�(�j������_:�p3]IBED}0���U�p�{��gn�gS�^�'�:���0k�\\����(7�m��__��q�e5��c��}K ��y��?;j^g��7�0ܐ� �S��é�[��v����n�2�h�ֹ��בk}WW�8�Ey�5�Ld��ݚ���l��&̤�y`-��iD�k	:�P:��Z�/E�6A�h�ʱP��� �3���H��L��;�1bR����vkPqE2�-y^�QϬ��T���Xv]�y7��;j��֮�:jYH�bJk1���6a��$DЇWDOq;��X��Ѱ��M2j䤼�^�� �Ő����)�]��_k�Sg�F��07� �{8|8q�PUȲ�+�ܸ�GE�]j���<zع����˅�D`��n�8q�Ү��;;���ܼ��z_Ơ���XK�I����"kUZV������_z@Fx��$^g�8\J����L� �|�(2/�8-�j����YY�%�B���o(��Z(��$")�69�ݸj�1��ɾ�����B���ȟL3���9�-�(�#�*u�?�_]y���RU�rֻ
��DKԆ_4&�|"'>*�R�ȇR�ʀ02].!UR^!w�ِ�7�Lc^c�m����۾�W���o?��+���2S�el.XV��7.u'�����Mc�X- 0{;�O��|~�5;������3�_MD7�l�&������,��=��h{�_Ui�1�HI�)-MbN��;A;O��RO� |����D<�dA�U/1cUF���V6$
��4�,���#UbQu���Y�c E²E!��~�HPJ�
(�϶�vR��"	�	@��襋�Eg��x���M�-����`!'YN��<��[he))��d��@��#O7�W��F�����J�<&{�M"{L�*CXH� 0���fn����*����'��av���I��g	l��Wp�p��K�T2u��}��6� G`�8��b�.��χ�&�}oe��A��c2���+�x,c���kε	��v��[J�)Ԉ���y��>[��og1�G��U	�0]��W>�QY�:C�{���)��PB҂�% aj#' R�T�i����cb��(Ѽ��	�	�����,t )O�k���f>��6#Ҽ/.�T�V��eGně
�&  i�)2A����˔ƣ�p�H�n=ƪ j�(������ �*��k$ �Y3GI��a�!3�D4����<�����`v/cnζ*�lp98jl��y�i�+	�y
���p�Q�����}_3��O�V��~��-̢�����0�VY���"%a� �$����2��`F�]��L��#N��?�`QQ�>�WB����lR��)��BجpNU�eyS�0�����ݎ�B{��O[�i�p���U�ثuWW2���:Jf�N��.�.��]�����{�EI�H�W��>�VB�/儯[�U�$^Rŋ�Z�?tiU�T\��*�!ނ��r!�p|ZCY��D�6�L2�"�h0/��햏�	���UO��� Pׂ�ժ7"�.-?�����:�d��׏��7�� ���w޸H��Vt���k�s��3�����vA#-<�(�d�c j�H��V�aٕ^�/p��?�jqTz���F$�s�[��~F;(��IOR�\��G4�`}US b���Ȱ����C��'�U
!�����E��$D&�@��4x�*דe�Y��R�cpY�헠�K�̆�2�M��<���X�}<y���Đ���n�p�_O�AZ5�!}�C��T:��	�1P�q�������'I�w�$�Y�K◩��oU�����H�`�j�i���Ug�)FoMY+`��`G`,���k?���᳟���?P�e����Y:�&&NJ�c�qd�0�
���8pdr�ͯ{�M���{�ρ����'D���3l9=R{N���� �^��0���� l�3��%����_S�Y�N=�+W"���
��n�6�22���F�n�U�ܬ	3�amb!�,bQ�AZ��eL��e�K+�>d\���_���|���V�I��"-3�v�ҦH�R�$������1r/]�V���:d 9*6z�v���i�z}"F��.�_��Q�)�J�P���Q�S��a��}Nx1�����Rr,��G�c&���PE�iی�X�/|�} �#wtUO�e��a�f�Fu�|q��	g���|͡3��Cf\�0�ms��I,��a�*��^�g=
�N>bz�<i����Oˀ�Z�����s� ���$�S�AC�� v���0`fbU����8� ��)�{���a9Y��e0��tWO+ɠ���#/ˢ[G��&�g���([LR�j! ���5��&��V%��5�x��I^�1�iTI)�i�cd�l�{�&�~��Y���"e����@̆�1̠��O������=:Ru8\(�� �ƽc����,pG�ûΜ N�w��x╦��n�2 �4�,�5��[Q�E�*�CQS�K�b.н�ޛ	�_�xg�%�^;��O�@9/{�PJH@�e��<��^��G? |�i�0l0XX����v����<}�S�Q-019�l�%�z��A1.�q�fUl푗�����b�$M7G>7�D ���A�M�ݕ�*�`ay�5�>��-*���_�jQ�.��TM�y�.��$��X��z��wH)�U	y]ū�ȱ�T�BZ,Y��%�8�C�÷���ق@���.���D3<~	���x�N��Z�`�%@! �G瘂�	��<����{*@���	�kf�F;8�&X�mD�[�-rccx�����W2n�9��*��2�(�)����D� �X�˕�Sm�RY�1DF2�)�S!�΋���&D�:pc�4X��-�b�݊��ׂ�O���9y�>�(?�'���Oazr0k�tt!�c�j���T�
­g��]��	��
���d�ک��5!���=�!�A��x�T�U���7]*��%��oί�:d�^=!���X�[^'��
8��/-U4��Z�D+Ǻh�(bÌAU�m5�e�o��C�Y�:Xv���y
������=���0�Gə�w�۩���ޖ3�|im�6"�ã����������F���H�=�O5e��q�cӶ�9��Q�Ÿ,D(K�� �����<�LT-�:	qs�T�D'@��H4#2c	�K�~�!\��_
s۵� ;�X��Ao�y��?����q�'?���i��Mģ���^��| �/��F'<iA��DS�����Z$K���&���M�Q̹�}���>�)�K����$D�'e��j)�x�O�#�sHA�2JV}@/U{/�2K�e�P��[�6��Q�/�r�N1���oW��?�D���5�AY�n�Q� Ι�.�����wR���Z(}����Le��_��<�����͸62p�Q, k팉LZ�s�y�����k��z���g�_����0󒵣!��L�N  �Ҡ�^-�ɡ.�d���N`�K�`%��!���`q`"$�j��V5����A���0������9�n����B�]8��i���8hU���>�}�͸a�$��_���Aor� �E��y�uC��T�L$�0(ӡArh�V�1�2M���S���:S�ww$jmِ���m�u��/��?I]tZ��'�M��]/�뢊�&�U�U� X����9��ѴN\7T�:��*�"ٲ��^ �i�N�M�I==�en6��u�l����E���E�V�������
`#�\���.t��q�. f�28qb���f�-�����!����X��2`	fڍC��"Y�&�5Ѳ�'7Q�B���kr�N�k��]=l�Z?�)!�5"J��Vө.f&r�),M�3
D�4¨W��;�x�N<���cLO�11=���	LLM�h��ԓ�п��y��✱`k�
@N�����gr7�8`���I�I��v�fM���$�ekTY�jZ�5� @��^m�&l��-=��DO� L���Fy�z�br�� �'e�W�&���&]�<�����	��S_M�T=I���}�I��q�L�oͮ� �.�ȸ�- �	�\t�O��%�~�Y����r˳O���L���iy�h1z�@[��r�pk�M2L��&�q>^�	Q�.�x��<��n�&ʝ�:�:!I'4
�ܫA>���4I�6�{LĲU�+,--a�Ka��<��3�D�9��	t�Bo��f4gOc������K�YLl��!��˜����	ҥ}���E�)�J�(�n\��)��R=�S�8!j���O�V��K��Ƽ)IՍ�T�0�H]pl~}X�0OB��Գ��lzy��B T-GJ��G��IBRV'�aa�_ȰO��u��3�%NiĜ���t���OCU��,��6�N� 1p��r�Fx�gT��b�r� \J����ra.p��# vǍ�?8:��������a3<m���j�o��� ��n���Yϔ���OY?����35+<����s��Zk��3��l��2����V�Ƃ���àO0�F0pˤ�l�Qǋ��!������E7a�}p��A�.@�O�l���M�Y�%Dz4o��Z���r��������㠭I��;��쎘�O���P���/t�9YJ4�T+7�F����';���+���u:�N�_�4j-	L��:��F<���7,G0�k:�d|!
.".wp)���^���0,@v߾���|�ߥ�y���~"����i�"�Ћq�a�n;>g�1���D�Qܜ�!$uFrq�5��C���ò�w�3���J�� ���P� ��Br8����"΂�a^���F\m����_�K��������Y���4dY��@C������ͨ��Ԣ-bfbf��lY4~�,�u�.�G�ɚr�J����vq�y��Ǳ��)�c�����x�vN�r�G��㡤�9��S
q�6�����j.���;���U(��b_�*�c�U����T_���S��� ����x�m�oQ��"�!ZOt���EhK^e�z{㳘��09r)��+W���B��|Y�<�� ��k@G���|���3_G��F�w}3�fj�!��[����*�.o��1�N4�N��=K-tnh�v��	s��@�q,Jb��L���.=��5�RW'$���7��&���zFÆ+c��pG��ٴ"�p�{x��Sg`�	o�U���$�����Κ>d�# ]՗�M�.:�vy$:�zD����6_����J�=|[詨X��&K���.A A���5������wQ���+T8��U�DY)؜*�t̮m��㠼o�k�QJf������� ��਍�ֱ��,������p)Хr^@��}G�20�l��;�w��7�p�.�������Y"�$�i&��u��6������e
NxP.�pC -�e0��#>��\�8N+�U��8j�I���i[*��XUNH�#[�zm�[_x���9Z�?H:�Iѭ���ڎz�V�a���e���F��\J���>㔈~�u)E�骆 �|Bd�-;����O1�:N�k�a�
����~�m�	ڪh��{2O�ݘ=B_g�5������	Z6��+!�(��N肌��w_�W�Hxj'�I�8�!��J��k:����X�i�dL�T�#��� L�R�.�/�/��(���"0T�����p'ǆ8�j�M�{I54�������4:������u��"�����AC��8�랕TU٫�k1�Qn+��g����-Va��H���,��μm�a(�;"��Om�i$~Y"�B.+�F��۰�%7��`~�;��&D�_o�&���ܻK�ٴ�I})@ a��u�i(a��"��5���P��l<U���^��:j�]�RR9�g����˝��@�=�1�D���G�n��,���~�������X���������� "Hw�3�+Z~�n���ت�8�D��0@~߀$5���SC���T��>>59��3�N 8���/��0�^�(���������8�h�ك86�}�U�w�}#*|�R��`��i����`�m@$�,S\�V�[�P'#�#7��ףd���~���6	IzA䯶z��s�]�E{��g��*W��*1��A�4�����ܰ�� 2���?�o�dmӀ�5&���!���i�C2�.��@g/\K��?��ZY��$���")��-a/�0�|�2�d��I��'�F��ue������!�Ժ���O���
���Zǰ�#��H����Sdqb"6d�j���_s�����[/��.���r� \J6x�����2��{�8�~��9dy��Dx;��k��Y2Ue�� f�J{O婞���a�7({�t�>��#�K�M8N�r��$�l��&Ae Ѹ��C>ބ���c��
*��Fa��hcIMU����_x5��(����Zk�6����=��>��@UŴ��ע,�iIcD���ø1j��/!�S!�$��B��3�Qn��%F�u��!�I���▸i�<�V�b�XnN?l�.��b \}X���d$B?W�*M��4.��ϒJ/��;!�/�S����Ȼ��,�԰�����G���8~�������A���f���M�7�#3���o���7�I<�~6���l����	��A&�
j����g>�� ]��r� 2�ͼ�h�p����2�-��D�W��f���Ĝ���m��a���Yж-���&��P���
 m�:���@ӌP��	�2�6JD�V�[�%z}1
�>(���C�讟.Yb[�e x��؃P��n��u ���[W�J`guL�wGWZ���u�S�s���j	�",��D�ê��vi�[���D\�c�7L�1�H���Y����%��P�Z
..7p��A�����
� �����n���^��P��r��9k��̤,��7�a�g�,�����z"����9���-A�
���ta�<��G?@�3�+-qX������4l?�q�j��r�$�B
��#MǞ�0-0����w�i"@V ���o�"$����l�#s�6T���Z� T�s53�i[�<��g A��1�KI�7-�>�3�"��c?�ĵQ%^�4F����NhFp��ws@X��@�&Yuu��<2��q�T�3ƥ��tr�Ủ"��(�M����CM)��z�,RH�?�oq#Y�+e�,>��^�)!�@��`����}x|߾m}�9������Vp�q�M<G�����N1w;���/X�Nd^��l�9����S�����0`)��W�Q��R:��K�g�e@س;#���j���B�x���Dh�=����d�w&�+&�h��{"�E��D��%�F��/�	��	��bp|sf�Ȱ8KS4R"`8aj�4�����ӏ���/j �Ene��ʗ(dc�g�["�@�k�S�����Hɘ�Ug�4]�|��G
A��Ԧc�5c�!$@]�_��)�+��G
�LȮĩ��ue"o2��e�ѿ;#������*]���)b@�B��j����}��(�g� �da��?���_��]_:?zS����;�ڡ�Sp�P, k�3�G+`�����g�v|��ɚ_1�x��Xd'�' &㉸�y��Mlȓ��\��O[������}�L���L�.)!��I��//���}�E1J�A<+o^��z&���d@h#���g�cԳ �y"�?�4�\$"4#L�0q�5�T�_Sf S�N�;��X�:u��DD��b�
ׂ%�R�S���=ģ�mG�*ױg�(	#�OC�b߄ˏ��5D����p+ːX�:<u�Ũ���$���dɁ���U��x5�
~��v��$c�wJ�m����Gԯ?����G03_�N��T�?J�#�r�m��[ p	p��#p���}0O�ny���G������z�kF��D葡	����� �8"�L�ֈ�)�!��8t�A<͜�� 0�0A��R6�^����L	�܄�~!v���@�!5ZhU��ꑲ�m�[�Z�N��rL$S��c��;�߿ؿ��!����M�4�tB�	����;p5hr�o'$�yg�xiK*�wLe��^�B����Y/���'���Tݰ����}����>
�Zن�V�lDtF�L�4��$�U�_�����P��6QI�,$%5ӥ�i�N�a_�w��!�St�/�?�ܨҋy 1���<�%�W�-����Y��<�P��u�N� f�����������_��`�߻���aK!��( �X�r~V<k�G+�����&v�K� S}��]2d� ��Ė��ԟd.�4�K����J/q�$n�çZ�a)/2�=�@I�[qeq��8�F�M��j�/+Kk�4�2F�b�������,�0�Kt�j����R�G#��kw�l����䲒zdC�jE!�սX^��x����u�����:��S��V������qHK��^m�31��=��=�S=��@�b֤e��+N�˒��{��iw��6�+��~] lU���E��jf�9����'��ߞ��Wػ7Fך���y���3-N��Q@�q�o:��T��# �z��o�:q�?�T�Kl�Ď�sn��0zFQ΢�ً{��ʙм�����BF�|mpL'G�B0B�b��hsj�%��e�@e�m�=�F)t��QBg!d� Zp�H�U��v0ON`��7`X��|A�j�� OȔ3�O��zWmC�k;�F���c�cR����r�����c�s��-��N4v�����c��Tʚ�;��le��h��q\�B��Hj%8�eq'��Գ_���C�ϕ%H(4���H��:�"�<�w�C����g�ƕ�HWp�dĶI"�}=���"��Ȼƾ�� � �	@ŀaj� �� ���<����?q�h�Z�?7��N��)�.��,X'
���L���p��,����}wN����ג����Qk�ޑ�g���j��& ��.e BA;,�&�I"q�V)9s\�qP>���t�r�L��㭑!dj��4_!?^ s���`�ʰ�ԤdN��z��@�,�0q�nL�|FKCT�m���P�`�I����1h��6����Ѱ?:8�U���Q�H�p'����_M81�V>�D�M�$ɜ��{���<��$��ⴉ�7^�?�Us�Նs�T;���B}80�%��KU�QL(�1��<V��Ŵ�V�$~���Y�i�x9�٥�V�2,�{u�~��w�� <>o�w/������}��։�D .5�Ӣ���]����������}�u�T����/aH@C��0FU^d�lxyEQ�G��� ' ���.�4���w�[�ր�WX�y�"�(�g0rf�a�8��lԓ�
%�2Vc	媒�K�t�a���rۍ��[�,AF�(�����c�D�0�&n����Y`��Ԣ�Ȍ��	��:�-���;6G��*Ʉ�(a�������=�L	/��gV ��M��A��?�/��M�nP�l&I{�?�b�u C�?n;�5\Z?�B�X���ـ��]��,W.��&�6��Lo��S����;z�3�����b��Q 8�8�a�ɑ�\�z�*�Y�v��4-d�u��畆�����GP����r���l�&�K�Cnu�9ۘT�Nǂ�]�Dys���	�G��2�u��Hş�������U�F�B�Uy����t�0�I��V�x������z�%����a��7bh2��l��Ζ*O�ό;+��xb�n<]���+��{�Y"�aP�uB���'S)�~D�t��u=8��_Y"g��{�k�>��O��1�������e$�iqe�e�wϩ�d�ԉXy	\|<����P��Q[�\T	�HޛP�1�P�����H�l���j�3����80L�Q�V���V�66)0a��5*��O~��~�z�>� w 'g(! ���x�(��3�kp�Y�Fl��j@�
m�p���{�[n����>��2��L�n���O�L�&�� :%��4q2  ���9�� ̽ɲ�wEOi 4�SA�?��и
�U���xZ��e�c����2��P"��E3d�ى�-�`�8BE��}��l��D{W�"  Sah-꫷�}w�@��^��%6D��DH����u������������9�g	P�"��Ĕ�]�v���q��&��5	��~h�or�]?M*T�v��m��Ks���.�� <h]Rm��M�*�E�PZ�15�n�%i��Ϧ~���g>����Ы��߻��w�[ڿ�G��'V�f! ]t�I�q�&.�>��|��5���ed&~�m�����*�����E��'�j�e���D�ňdH̒����x|�hnq0��ޓ��V āG�k�is�)s���u�љ��3���{~�R.�]���5T�f ��y�t@CL��i��=���>o�H(�R>æ�َTۧ�mӰ�(٫!���!	's��	J�.YK=�L�e!j��
��D�gJ��D�w�T�N
�X�ՏB�����l�?I|B�:��!��Hc���qq|���I���DTҽ���X�K�$�+]'r��4�`1��T���X��!6�z��hLUC|��8zj��>���>Xh���̘M��h�;����
X/�D �&�cq��W�|B0O��GNpl�k�z�[���L�UU��l�`;�q�`&=Aɨ��e��.!����Xe��}:��j �|l�]��MK�PxW���ja���\M![�m_�6�V��Й��JUB�I�䚆	f���/�� ��C�0�G^������l���޳�-7Lh�m
�P%ݺ��\{�訊$'m��H�j��o��P���"�
��~lhNV=�����Mr-��,�(D;"P�P,w҉�z��	��*�<�g;�)V��{����N�������E1���ȓ��0��fD����LU��������{f,f�r��c��͉�ś $�Z�\i��B�����y����������-K?=��� dkGL�e�`��">:���O�JW�LÆ4���qN1S]B:m������S�I'���N�a��"�W�huh�^�՝����]����h0@�B���}Y�s<��2��T�:1>i۫1�wAkcYN�U&
��ԟ�_�%A�2v�x=��Tx�t����؅23sL�=��(�q(�?��Y��P�?R9�` i,���*��j�K�S�����hb��#�=U��v�mwSd]I|����e�~�p���]& �`c�P40��]S�_��'��{�`����N�ϡ�?����f& z����n��'����a~np��toס�;��%2���h��Kf���Ö/M4c`�(:Krp��Arb
��Na�9W̯���A00�G1��}�/���&��#�ZFH4OA�����2���qd�SX��Z��W�T4S7���;l@D��?�saE�":{k  &��TnC 	h9VB*���P9I}��2@=��N�DzR�n	����*�/���ks�|q�$���J����k.�V'�>z�'���*��.b?�"-��{ �ue��V)�}0�N���"�r)Z���k̿�[���Uʅ�4QBV$�V��S��P1,5S3���޿����?�����Y|��
w>Ҵ2�c	�x(�<��	@���4��h����~�:p�dS2�/F;_��O��~���a�<����45��ז޸/�-5م�&|�Oz�
�5���7D�gAl�8[�[<[	a=,Q w�5���tO�fD"�z:���	�s��n,�bl{�,j�L����g��<�
C0��v=/|�uF� ���4��v3�Ր��S&]�4��S�*YU��J���Ļ�▒����X�䳕��91���PY㴫v׹ϯ�F|Z:�5֮X����!c�i���'ҿ!�L~�&�0�-�z0x��R��ko����{��8�	<eǚ���J��k�[����Y�v�2ˮN�_�T�{��q�mf��nx�hi��zU�2�1�DĆ��������=y�	ΫZ�`uC99.��Q����1�Ɩ�N���Y�s����Mn�1UT���I���Y��݋5�*D��Lˤx?I"ׂMjMs�:%#�{�c���8=�y�6�rW�hZu̪���#���[a�oG��i�Z�e�T��n�9R�T����dl��W�c���4�"P���ŊE���!�*�3��$��#x�n�i�r�C���g�XwE�}f����,O�I©b��K��JW�����%i�B�_�.��IҦX�jL�lAU�+z����h�}��}��w��1��~~�i�M.�*�K(C.\n��b%m�?g�'	�NטG���-Mݶtͮ���p�]����Zn�y �5�:��W�e�1����Ŵ//o6�S��ꐾ9I�P#2����S�~t��ѭR0I���sء��g��a�3�p��-���16�E��N+
���@OM��/�i,̶I�v�mĵ���lS�Ѝ����)�y`VB��˩�<2$���eq��J���ʑ �)��r��-Ǟe�lx���5���6�J�%ґ�.t<��
�5����`���ҽ%Hj&����IW�vENHǤ����
����m�گ��Ǐ��,��e/��Q(�r�������-?�
W
X�H���.�o�3��[������5���g��� ���Yd�=�~YN�N�s����H���S�Q���
�0�zǗ]/P�ǝ�8�I2>�`��O2�b��gԇ�斉Y� �%Gb��BPj���8�@�ܲhW��IH��M�W����0 �|���`*��H[q��=��f�2n�~��k��e�,@�Ǻ,i�����y�h�ф��X?T�H�T-+aܪNU���3������_��eB���ѡ������8��z9_L7\�I��h�(�F�˷�T���C��AI $L��&eH������N}�_�E:��eT��i%�WsMU��?��;o~�C�[�xˑ	�=7��W���׊�-�k�ȩ����ˣ_��u�3�e��h��쵽%����Ms�`�8B������@0�V'!�H۳�Q. ��. 룕�7�q�g �Ѓ��#�RZ�D�P� >�u%J2yT�@iKa)8{Fe1�!^�st�w���d@��ip�zR|/Ǉ��݅����Lc%"��;���Li���i��O�L7m�yp���пn'����dɊe��$�98gi�.�%C����	���ԡT��j�$o���邸T�
a
I�U�+E�	c�r>+�C�6@� H\�6�%�2J� �D�+|M�s���PB�H='�4�2d��F�Y]��
��&�`Ӑ����_�S������տq���Ks��'�b�|{�?�^�	��&�� ͐x�� l��[K>VVZ��<Gf`0l  ;oz��se�	��J&L0�";/�	���������d+��U��@:8z��V2-���t�I�l�&���g�v��UUeW0�ɝ����E!��t�Ѻ`c���BV��k��b8`��k���;h`��j7���7�T3A��[Ȫv�d�i�����o'�d߭4��V�bAy>Vi����腍��D�Qם�Bu��O��ş���|l�ߕ�C;��B'�����"Y"]�5�UG�)��$!T�*�0堪��%�Gu;&"��,�.���3Q����t��'���;���z�jL��w�W���͋UT��	�rj�,k5�2y��c�A�����m�3��c�k^�[�.|�e����i�q������9�2��os~���$�.�k��f�� �YNi��p]���R"Qt�0bm�5���@�c�[C
�nh��o�����oA�uu�1�=��f���]�a�/4�x�Y��t�B4�3L�za,�X��6��v�ڶ��)���;#ا��Y0�KHGR��@���'��[F-�WUIU����&��-3z�6R��va���� ���^��J ܧ\P/�^L���$s��?\>�%��GU�?�=�,gA��A�N���]��~H����jc�#U�~�'>x?pw[�*`f 8y�����������b���U k��Mc��7G��y����`�-o�}pn� �0f�mF�@0 L0Q<B���h��~���Z	�0��f�
�~@���R��ev�CdI��6i�[r�U+���x��tL�>Tu�)F�lF�lM�Bx ���9���л�Z4��Õ�ͻL�o0J�#��B���ں����i����c ����)$=��]�	�JyJ8��)|�ձZ�����[�ӷ�?n};6��s��N9c���>�lrc����d7v�����L"�QLؒ\����$�qH�p',�Qe���w���?�ܟ~��p�U�g������O�p���y]6���`X� w|�k��`5��Iȸ�c����0Cغ�����ګv����_Y�nf�v��ζ9jj�{>g�֬aB�*RW��G3?�:#αs��.�\t�	�v�҃��#���2.��
�I4y�M�aVD��eR��f��;�yv�ͪ>|�\�"�J&��WW�� �&o��w���1&
%�j2�xs#%Ce꺂��ͷq�G8@�l��+XG x�F����HÀ�A����ja��I�d�/A(e�;��g�ȏ�׎'���{b�r�{�K�K�q#�v���-���%:�E�<��α`��=��i�>"S\�wO}�����,����՗>�!�I?�P�v����J�u�b����rd�ڠ_�^�}��>���3���r�K��p��ˌ�kY�yV l�|lz��> �	�`-�a�q�2o�>C817�q`��w}��p�6�]��g����hd��|ٿ��)I��&��	�t�Y�F��*�i��cu%
�F�hM����9I�,�1w��?dD$� #u�&�Ȝ��u��,��sd�kN��z'0ru`kjL?o?��^���o��b5>����� ={f�$�n�����G�1���dL�
g*f"�CV��Dy-�k�%_q�����T5B�?w��*�y"ɴ���_SB�.3C�^ �rya�%���R��Kj;�ee��)-��mqUyhev�K�
q�$��x:d�6cf&PUWԧO���G����x�+�`�MC��u������Y 6b,�и�xQ��e��W!灕:�:;�1vZ�<{'N��oز�������[٘=>���qo)w|KXzGX��2a�^$ӉRȨU�75��ʍ�����IB�+�ig��ֵr��w=xE�ˣ�m;i�h�f,�η���ӱMG�a�j�4&�Gc�m���ŸU�01��
�G�ĩ��g�@k-��>}���uoٵn)��l�8"�+˾£R��$���s$��c|˅�:�-�l$=7����SB�嗹l�eV�#���s٤O���%��t�"��h���«!Kb�=�)H���OIY�w�ҷ�����"i�=�rq6(������������m;��_V�0?O��5��]���z��z�K�c�Y��^�5#Ζ֎�����5�\���y����~����^Πs4E� ���vn����lwd<_�e��O����Q��<�`�T��$Խ:��.-[^��$]R�i�F6��O;@�%!�ä}���F���W�w`F����$D����Y2�L����Y������@X؆}�^0f�mF�]��s+l#{��b k\�oږ�2Zu��/�(�,�J��W��;+����*#@Gl��lã1dCz� ]���IN�@:@���yl�giW�(�;�ҡ-2���[ׅP~
Y�!Pez}c&��ڶw�w=������o؂�����8��z�ו�k���cn�y�^�逵
�B<�3p!vͯ��p���	s� �ꆯ�n�7w2�7 �2�<��O�α;f��@HAH)��Q��Üj(���K��.��% g�D���}0%�c�9Gq�,aLNH@�f:��m8�1�cc�I&?	��@Ʈ"@�$ZY�i�}��i0"��C7�vn�=����:�)�f����@����0O�-A�Y�=��4P��vd�ߵ�=�a?�,*E��%�w�BbzemK��j��b/J�[�#��gHT��pL�9et�t��9��?yQ��^6s��/}R��7��/�%���fLy�9�e�=>��iT��Jc�K=x�U�������a�a���ʌ0Y����;�����Oa�nŮ�E�~���}�¯k��������� ���Sdn�-��8'��;�W���-k�Xl�� ����)�Y�\�5�|��U՛��ZS�;l3\ ��O�۰����Gش?9����m�.@{�1�k(+,u��u�Jk2(u!xf��'�A~��Kg�L�ߵn"e�fABa���	��NӪ�49TL�.�Z����`�,�vNazf?�00��2��kۂQ�FO<��?���E4Ϝ�ٶ< ���`��2�.����݁E<�^~P̹�Վ��d&i$J��5+�ޡ�|��b��"�_B���1Oҡ$�vG��g4���!��<%J�w;�qYP1t���;y�dD(h;��|�\��z2. fT5��loK���Ѝ��3�r�	��{�඗/����3��X�^���޽ss�]�w�8����>��������ر����
331�ѣ�c�8����� X~�j�+Ȱ�) ͤ�����b &��]׽�S��̽�� To!��֎�Q�Iq'b"r�y��#�(vO��I����"�#j��-*\�B��)1UB^�x�w7o���٫��3�JK�Þ�AG�ʣB�e�7�{�3Ė�r7��d.���?s.��8IOikA�Ϩ��ty18�#L޸��{0,�8�i1���<ҙ���8�W��}�,h�Xx�)T=����C�_>���;�z{����J  �]�I��o�*,K��H�l*(�_��2��sH��#���&*���1��(T/��w��q�I����[��
d��s$1Y�c~!iJ�R�o@|��1��x��>hCls�\9��9��� �l,��ѣ'͖ޏ��W��G�ؓx��n{�b��_N��&@�af�S����`nn���߽�������������b�����G���O�ظ�+ų���"���ʯ�U
���}R_W8������܉! ��5_bG��`6o �}��[���Bn{d��S��d���> �
�y�qy=������kPklJ�d��'�{d|U�[�2�s~_e'F�&Y�Q�Y=�Tx����.(ɳZ�i�C�,���m���z�жI�g��P��-�dY ƭ����b�/?�zd�#��g���N)��$��t��W��}``���QM���D2��#��&0GU�n�&�I�����������kZ�v��n�li:i����"f� Z�H	E�m.$�2ʒy���D��'r��2���|U$�?�
L"ɯD�Jd|F�O77Ɔ��T5��O��N������!�����S���Ҫ���Z����g�v|�?�u�k�9���m�^���wg�m�#�?#�o�~�ɻD�*�N��}���j��8O8r�p��8R�8�_ǶzU�7�5d��}�z��D�;���d�PXe�ɮ��A;��?�$���������!�v{������_0s\�A*h�A�ߘ���]5o�E&+�ߓ�r
Ϝ��P>!c3��l�Nb��7bhG�!$46�LZ7z�����Xz�Q��4եGO���C(_XsN �!�l��kv��:�O�D&>��ಧ�"�^����VOM.x9tI����O���i� {�5bp���-TFt��EJ��$�j�i��C6e>ギ������<� ��UC�"S�W��zۖ�y������p`���_��b��9�q> 9v�2���`��`�;޹gi�5G''�a�f��D�l����C ���}��WO������X=�v�S�5ƽZ��Y�#�����-/��k��r�?̽��K�-�0�0�j''����a5������ä^?��u�S�)��x��t��'1#9g]}��L�J��>��Q%5���DL2bz��L��{P��,�LqPG~c��Q�MJMq�!��3Pq�+aZ$y�)H���m��g�`�P�T7��pq���(��cm��k���>��c�`z=p�0��W*]'�c����؆�ߵ�]�a-���u]�еn� -Ȓ���7��V��?k�H���+J�2n�,ew<r�U����ދm7������2���_|'��d�r�P�;ZCg%-���	�&�Sa��B��!�Mm�dvĵ��%�wUo���~�N�$��!��
d{�4�'��ɏ��;��84Uᛏp�㴬I?����3�����k��x����;z���kh8=��4�u�TF��z\�� ����0?O�n(��]��4�`�u'@�z+�<�(u��'���<Ǐ�������~q�4�aC��D��p�}2\�P �8�\\�`�̘II��t�b���\>T\2(��~w�rY�tdLHqd�7FN��.ҁ��waT" v{�G�B�R��&+i�I6���b�D"�l���M����LX ��f��0ԃ!���O��^ �*��N-�9��������������j��z�N4]�z�RV����m���FU`i�ekCZU���*KPP�1�T�YLY�#����r��HP%�uz!���Y�Z���b���r���OS"`,[ۀL�-ٞ����O������afv+n���K��0�����;�GcF����<v�np��-��#/:�e׿NO~7v����|�l�w��]>�աk�[)�Z��"�X�[/�ZCCh�3�.�?�7�y�֧�F����|+��LzO�T~y#⛲����a(�R�VL��!��45`�pL���L_"Ȏ~n���;�,�ω�i1Jr��p�G[���}ry�t� ̥�|9}b���m��N��pܬ7�}�'�g)�Ω17�LisUf�����$�x�Z��O�_�x�~_��WO���_|}�P]��]���3�z�H�T}��h�8�R��
#C��� ��VJ.��	���i"ptl�~�;��GR����Ndo$�k��gں�����O>��ԋ���Ǳ�Ó��֩��F1_��j���&T��W�{��Y��_��g��C��z��/Q��<O|:� 6}6t�'��}������OaߝӸ8�'g��?N����&���y�a�c�F���_1ص彣ɩ7�����`���, `X^�٘�Z�N�9�M�7�+��.��˝�b���~|�s͎۾�&�/|?Q�S�b�ͳ��}��%�,�lQ�+��7�Х�t0�A�Rh� =�[[O㐁F�3N40J�!�&�y�o�ia50)[y26�zX��"'T���y��e���Վ�:�aou�*4���]����b�XCrS�#�)g`�a�'1x�)�{N�V50a�ؓ��P���X@ˢ�A�l1y��@]��ƕ#��}!���}�H	��uI�NXK��Ӿ���]�4���V�>O����C�p�k��}��ʒtR���l�7�	E�2�E��'3H�)����W`�+�"�v�� ?)��E�TUO�T���_p�;O��O��[&q���D��0_I���M�a0wl �S�����v���7[���G��h��:T�,�&W��\�jV����QWVcX��j��Х���'��,@���a���@�{@T[�gИi���)�~=�(,��Y�I;���1ء]ږ\S>h*j@\���ئ%�ޒ�E�
��I�$?��,.���R�OR��w0�r������+���ʜ�',���s��i,�>�&4��n�6�*��xL��!��'B5lp��Au��ڸUD0����,@���%@���A��æA�Ж�6�BR�v7QV!FI��R����O���j"ХŉÀ��m��lIXOɈRc�t���<�]�U9�J�{1!�<(h�i��@!N�n�宮v����XU�$�Y��D ��cT�d�����'������o�����!=���s�N�z5}w�? ������<za��`��G�'������|��_���`��_E�a�s��S!j|�f��J͇��rv0�qX�`��ƅ?�� �����[^�%<�[��N��YbK������^I*/<�k�ԇl�a�ɾ���?���T�{��YOk�a|���|��E�"D85�Z�AS����V%�6���V�	I���~6�����ء$�0��/�}Rq���e�c����]�f4OMb�E7`X���)8�u����z�==�3�|���]������S�g@�q*�=�ff6�F�vM��5n��/F`]�TL�"0�H�)n7��bfp��)��ޢL؊S���	���az*�"�AE�ˤ9�����A�m$� ��E(������F��8%�6pL-vTSXI�B҇t��/�+N��P�H��4_���S�����x��#��#�T㥟�ė����]����!�`�W2�}���oy瞧wm�����{m�;yax����Q�N�-���͎�/�l�L�r��e�]t�"C���$ v�����ʚ_b���΀��8�SK;��V6�w�!��B�a��^�n'�8��wt�Z�J2����u�0�շs���}_bn��SLr��j���Uj�t� �Bh �#�hi��};y��h���N�(��6�D�`���Xz��''ݦ?���a��Y4�A��˨�$ᥑ�^�&�h45���]����r����m�k%����_O������\*��"�VO�{�V��<] z�!=ZZI����iZ2�j���sY�Ԉ ?g�~3q͆�k<cv���3�����c��af�����V�.?�;��33���3w��0��Q½o������S����h�:�i�m3@E��e6�`�	!�k	 W��ɏS2�  �JXc�t ��^p�X�> kx+��e�� �G����������Gg4��>���2����+��_�w4h`���[���"G��|�Y��%�Ԛh'�S�ZF���r-D�Y
!�B!�"+��������x#)*�u-����Q;B�t����I�h�f"�M��d�=u�b���`�l�E�z�uhvL�?����IR��T�Tx�/>������o��� �3�`�|u�N��D"�9@��m� �k��M��j�t{�1s@�Tp�䝔�8P��&yt�g�c�ASV��U�WY�S�+�h�
f}����s����"��IY<uΥ+%�;�Qu� ȓ	�����*��(kX�0�C��Y'.�%SW��zG�����/��U8|����Mk^}��c���a���	��c�{�����ŝ��;ڱ�͍�Ũ� Ӌ�яQ��W�`�ņ��Ls���.��������)W.�i��4Z?����kn64zZn΁i*
$��ɘ�)<io���M�+Ӳ�X�I���6:3�BD`WU2��PJ��ߟ����dߤxx�8���s���3ȭoN�[v���&¨U��	�y8&*L�z=l��N@D��'RL�	����ٿ�z��<�%haAu^\���O�
�)�d��8�����ľݰ5~�"�������0���n�v�!��J��@�Uַ�����gd��e�Y�>M�}ր�����=��4�dS���viH�SxR�1���.*��+���j��<��>�c8���Sk;�W��}�vN>��yƽo���G^�ۦ�mvny�.�a����ƺ�
e�qp̰9�;v}k�Z�_1��������'���GLRS� U�-7� ���D�T6P�$��d��	�x(|�L��^�|��q��R�o�
���S��d��8'��mAF�u�I>��XB��d��hV-- ��OF�U�B��߄�']?�(y��G���$72.%�b`�������؋�hf,��*�x0�>�}�I�y��IX/��J��@���sO��9
�d lV,��`���p�z��Ԥ;@{�QK��/�<l���-k��)�Ŵ��m����LQ}����H۬%�^���ZaC�Z����EO�/�մɰ��
"�N ����Hv=�q��a�o̩鴱T��V�0����O~����+f���<����@�����\���vm}���:�,,��tZ,FҰ�np������80�[U���u��1^���� ���K��v4 ��`uj���q>A"e"���J���^��x���n��v��{���(�wqZ"������l����VZ�)#ւϛ��������X���G+fc���}{�/��Y��E]&1���BP�JL�a4W&��4���;���{@��b�4�сX��Wq�+Ԧ�ٿ:	:7���`�V-	2��>{f�=gS�q���V��#�vm��
;jBD�_>#YEe��%�����^m�[Z�ۗ�w�6���|�nrM����׈9��Ը?4��8�7n�G	�(��RO��UM:�o�����r���jꏄ%ԅ"�Q�Z1 +�����k������_�߳7�9/�c������G	�`17k���_�l�x�3/�K�0MD�i��l\Պ���(m����S���wR���zW\"�N�N�䫯oL�]DuD�4w�T�x{��'�{W��i�N ��t�㺠O�Y>cJ���5~K�!�T3j���P�	e/�D�RVˠL*��J4,�*W�s�(�"]aZ�%8�������\��V4C�+l=t ܫ`�����u�	C�&jТŹO>���AT�)	QW�O=��["=	�ͱ�,�0;j��6���W�{�Ĕ�tnq�����F5iR�IE�p��6!�	3K���g"H}�����-ǧ,�>s '��4/�]]�i��cEwa�#��)ҤȰ��ծ!'���W U�=�?�W�|���g���-�z ����
��Z�?N��:½?;�ћ��?��x��`�7�`���~�D�;�N,/>t��}�� �M-n����B�8'��O���k�ŞX+0�#'{ �;�����ΕڕA�leB7���fS�)�h������a�^O"��E�t�R�#���Li��kj�Ved��N>�~ "1H@tmKT�$��]'�~�\��l"ޢ�B��U�	�u�l1X��cN�t�{�#��N�>�>�����`�j�V�o�K�ƺ#S+Q���� ԯ1x��ϞD�W{�K�dy(3L�N��豧�g��t[Kc�k�0��a�ڽh`�� H%��$֓�r���+Z��֣��t�Uz-k{����#�kS�7�dIN�-�'Ā�����I�9-��`�b����6]�B�*%��!���0y[*6 ��{���_��}ϟ���I<uz��]��a�1� ��p����6��߳�o��cl��Xn���C�w0C~{I��4��%8ݫU�`���X�v�p��yv�y��|���w��kn6�׃L Q�Z|��g���9ՆRp�&&�q��A[��a釸$2Qe�+�����ej�'�E�L��x��$3{9�W��+I������h��m�w�{�P�N�&ge�o}�\��;)!�f/��T�n�@�tc�[��n؊�` r�X�}o�h�d`zU���YاP��mz�X0=ZZ���'aF6�=3`�.���L�S��w����U��	ڋє̧�ĥ�oD�CJ��O]���zM����u�㔩�'�[�ia�	�Փ���	}Vhq\��^����'�^1��t���X!�ԙBPJ�ǘ4b�4���̐'����N���{��p��$����W{R�j��u�}�2�?�������{��_��mx'@C�ܶ�nS�8�J��	j3+��Y.
.*ꕃ�"���Z��_N���E���朙5����ųN��,�(�I�����rE����,��(�!AX�T�ߧ�i~�a��8R���������[∂b�x Lq,��n�>��0-�bR(�IƼ��i����@��v��_q*%Ͻ�T�7��nE�M���{N�2-U�-����O����`���-���վ1���|�S�� ��%A%�d,~�Ilz!�8"@�h��|Z�n�6@�`z
|����K5��+ɋ��eC���Ҁ�"��,�6~fb��C� ��qKx�֏�
�<����[�a��	5qy�}$%�e�$�4�#D��8���V�������5y.{����MG�D ����5���޻��O����'�p�- F��`�{t5�ht��8��� �}�h�{�+F[&�+�p0�a���ɸ$V���.�W�1ȆN��H`�og`~�E(�x�H���y�<�*|�#K[��js��*bTh���.E2TsBPQSw�'GM]<��0:a/c����;Q�V����-�]����<"�S]Sp���qn=�����g���Ύv̒���������?���(���o��<眻�&�H#B ��ƃ^5~�cy��8����&�%� ���؎��� �zM<yNb;qb%`��l�kBhc�4���Y�=�<O��GwuW��;w6��i��=�Yz���Vuu�e������]�T�PDp�+"������2�Q9���=�cئ���	���y�e5��%.�"�`�!$���Q�+�ُ�0U���� Db�(��'V`���O:��M�ָ�[n0�e=�6�;��h8��J���D���$h�� K(�����_�^&�H��E?NƇop
 䯗��G��G+K��r�S�]��W��)��cP�-��}��.������t��2j�7	�O@]��5:��[c��/�a��y�3� =��� �o�'�%�G�[ '�����;��߼s8��7�T3S���̎�#�)4�CL�Z3+=�������y������	 t��?��x�����( �p��7U�L��n!�L����ZS������2�!O�0s�=N�P !���OoL�$Jj"ș��M)Kx�R"lI�y�>U�05/X�!�bn���K�T=�3lc[�)7Q�X�g�j�XM��P�	y�1��������k�d�(fz�y�娞�	�aC��by�/��cw= ~tE1����[�LQat�0��0S��i�^x��$d�4���.��{�A�z��"&o#NtZ�-rӸ2��#���)���=�9�*��e��0Vt�"�V�I��3��>�:������m\p-�N�$�~�j��U���lQR�&�� &#M��Ugk�)09R�#Z�4 �fjTJNSt��da����tu����z��Лcl�ў�5� o_<�,^B�|��-�y���~ſO����l�M3BQ8"�}��"cEJF~��H��ń:�iZ��/+�|:��\ �t̬)���- ��3���0�D���uqD`ʵ���k�@�r;]�#��';�53��dNpv_�vw��z�׃��cs�93��NxW�ѩ��:�Z��1�����Oz��SO܌�EP�M1dY�����F�; �(}���0�$̺�.lop�4@QT0��0���W-3,,z�l�X. ��(�	5�� �h\.4GV0����Y�ƙ�e�V��Ɠ)��c�,��d�7�s4:��w?Ll���?q3V
��n ���$Б.��,��������P<a6|��1��ˀMs.b!;������%�.���k�|!2L k]eTT�@�t)kg�G)$<��Qƅ��4`��n�z�2���-�{A9=��6QWsT�sUm5��,���j�%K��Sz�@^���~��DTYS<P��_����%v>����[��D~��h������������o������i`P*����9R��1��W2�x��൦]�hH���t�ӹ  �(�;�N���l_���k��^��
���$�9��-��o�3�`R�uU�LaZf{������h��*���IG`T^�:�\��.uf�Ԓ`��6_>ƴy=6<�۱�YW��0;�`�3��n	1��I1Y��Ca��n���^\B��ml�z� Р0`������J�z�ɢW�P�a�y3��6	!�/��X�7���C�{�e`�ޚ!��UID�5�`p�f<Z�K��mK��rɐ�Hh��Ɖ���woÅ?��h.ـ@��
0l��2��f�B������W�T����kƖ��7�	�@�� �1��τ��s�z!��7c�E�~y�B	;H�fN>�: u���s �����OX���� ��
S�0_LO_����a�W
��a�ſz�Z?�yҞ��m�x�h��o�<���m��?��M	�Xg��? ʂ�AT�����)�D��v�0P����H��&;q
����?�A:W�3K{�9���㎛�K��ҍ��K�D4 5C� ��k!N��V�L���pp��vEKp�9���̼>�ͶD������b$R"k�m�	O�Y�����N'�3kt�Ʉ�WU�Z�-P���2�M���۱�_|Ɨ�a�2�6lW��6n�ZY8�@��~RuuO�p4笉n�;h���2���)�&��q�qyϽ�-��|�>އ�d������#'P��c��#AY[�陜�c�%�k��ҷ���T�����Ѐ�߲4;{xT�REkmrYߡ��\�0N������M��.��cc�ź2n9�t�.�&�\	��� uյ�� �=�c���]  ,j�/ߩ��ZݐI� ��N5(��	45��-L��G)�=Y^h���M0e����#b��L� 5�x  T�L�+�J17u�����c��6�[�łT������E�?oeݡ7>exA�mv��!k&��n��W�&�-=��O�5 ���Cd��$��� :/��qz���H��7 �1�l���9�"t�;��ٲz��0�,��0�0�6�'<N�) (�V�U�F�%�epU��G1�0U�.�$[U���!eV���W''nKK=�f� W>�Gp���s:��Y6h�쐁 6�� nG#o�uż���w���aw�U�X���m kA܀����n߽���5�/{\���<#��^�Y[�����O�7j@�`��Bj�(�ca�����tѡ��:F�d�4�r����hlB�ƊG�il0^^���_��?��8V��5
�����dX�5���G,:~8��U_E�qe�-�@7�q����>��,
?V��(m�N��z@Q�]B'�e�v�(a�OE�l"�sSl2m�+;�K�a�\=;0_�����������sg��[lY`�
������C�K�x���W�ûW���-+�?�L���)K�r�w�����43������u��[����L6�KN]�ϧ��� 8�6��\ �I=D�q3���� ��=�V�ժ�Ld�R�m�+�&^�ͅ'9<%�&��)��9G!��n,��	��Stm�k���"Do}9b�Hz@ش[/Q`8:�d������_�����p���(FIea���H�� �m��'��}��_�'�
��k� /��ڰ�_���@�T�	��&j�0�8����Q���!���
�i��)a9:��J	;s���r�f��r�:���_�Y����5��.�����9���=kP�P�H{���~�[�	�L	}5�H�_���݇���	�3�<5fb��u��Etl70�qfy�5,+2wr
NZ!�]�{'��1�6� ��Ș>*��lX��n��O �J��o�e�{q�'���� :5�����0��V�W�޳ͦ�?����4M=����D`#��G ����h)å!��n�
�S�+��Zӹ  �����@�0�� ��+f��)��S�\��x�N~ab�SD�ʠ�Yx�F��h�*\=\"���J����&��.N@%^P��e�@���k-Ќ)l哥0��1��p��\���O��'P�-J&Y�a���d�p�E�������sM12!����'B�� �"�pM��֘}���!" 3F_y |�0�~�L�`�C}HS8�Ol�C��QPi�ٟծ�,lmaK���]���|P�q�2.�0{�%��rF+5J��#4�j��;;�:��ʺA�R�]�ے@Ĵ�o\���zއ*?�n��F�e�o�D�jh�<��2d*K���n�����!�S������tA�~E� �u`@x�2�7n��Xbb*��~��hn��K}�p��WA��jt��$��7� ����?<���w�H��>Д��mFN�7�*x\��
x҄�+ ��a�rY�-s��'����%�P˵��|:��8X8��j��uՃ�����X����FX���d$�B��� �FG���z&�P�Lg��o����b����������۟�CǏ�j����g��_��p.��]�7T3H����K�-I���Ηt��o@ZV�瑼V�3�$+5N���0�1�Q������φح��~�QTE�0g>�dW����Q]��*�E q)�Yu<�N%ka`��=�A	�]l�� �U�O�ոKr߽P��=:�{�������iΒ�m���=@�_�`���E�/�����56 7���V�ƮϏ��Ш�Dٸ��F����P/Xj�sU�<=����t���o�W�*�e'��$-�T����%ܸ����z�����n���{MY|S�<rѩ���o��q�dT���4��lCފ�i1L�;`�:t�Y zgB���� ϧs���K ��j92�G����[B�w���0���D�&�;s4ŭI��uѸY� ����V��@����"l2�N��� �fv�����ϋ�J����e}4b��W���ix�^�[bٰ�׀y���U}��I�����{���|D�e3@�"$ �G����!��)@O�����`4 ����P�'�,a��G\ ���$I��q,��. ���8��@�0L�6T`�<D�iSW]���~T(NM��i�A�dNhMQ�E��0�6٦)�?����$"��v'�tG���n� ��^ט�F�<���,��`2�"��H��d~x�J$OX�Il2[<!�Wm5w�
��(+3(߱n�ů:�7��k+'ԕ���������~�����C�
ܸs���y�/�q�vvp�%����DS��� 
�f�P#�c���u �O&͔�|70�n����@@���=��@@g/�� X*��hD��+A�.i�F�3��SPr)�j����˥�e���3:$e")����ű�:*�^H� &q@��0����^���%��Gѧ��U'r(�_ni�'�/줉�H��n����n�1���r���ԇEAX�o�K��O�i�$� �H lL��`"����G`�T���zK�4ə	��flQm\�a
|�8P����^�c�������2؋סid+#����k>�ܙ�/ÎR:��:BQ3ndFf�F�^� /13��ȑa�80�0��1�>�_�蝠��Ql�Emǝc#O����B�"w=��[:K9��� Õ)1]��.Z������G0���+�&��?����YX��<��7=o�����߮+��غ�a��J�m��2�[,�_�|�^)�?g��k�̟����#�WO�%�Og�K 'K� ��p@!,X��ȃ2擬զ^G�s���s>2]N�HR&�sK��S��0�䑌�y�s1%���)W1e����='-�F�]q��^�4KoJ���{�[.%jǿ̊ޜT=Y�'O�䔀���^w�߽'Z	z�Z	ްm��sA(k��_�̸��s�z8�*o�	w(���#�G��~�:�}(��}b��Q��1ؼu3���3d,��Q�OQ��>��T�3=ǿ9�)7���� ��4�$�8���/҆9��c�q�/��M��V���v���4�×p�������p��	�R����5MB���Q�>!-�a��=S���zW���C��#���>6�Oc9�5mY`���S���?��������-^��'�[7�>���N�m����l���h�D�P��ݠ(��%'�'8.iL+-?ٖ�����O�0=���W5�ΚG�x�-�"q��\��S�(�+�(���fJI���4��$^�"е�@@�Z��0�r��F���c�re'��R����<S�t��u[ ��O�M��Q�Υ��E��	�ݡ�YQ
�n�j2y:��E�6)����9v wj�;Ѕ ����'���LA(����}��*�D�����>����=1�x�1��~��I�_�3���?0��oDc��pځ�}�+5�O��UO����	�U�ط+��I�!���t��i�t�Z��}�ߗy�������v��eԣ!���0�� ��c(�L%���_��
"NK:��`$}"��ǭ�w���`�a�>�� f�/<�)o8����0���������4��ѹ;ӯ7���<��w�(_���h6�ޏ��d����TH��� ߠH+�3\��Y�+qH�@�Z��������:W �'|?�t��j��Sbc�q^�E�n��kB-�$��k���C��	Eh����ɪ�O¬�G$=�I����B�
4��� ��/Ƹa�q�>�F-Y7�1�v1F������u���1`�q��1�j��z輴����F�Ћ�p���e�������0^<����BF��$CmU��M,-E��}��*+�(�F��U}��׼�75ʋ6�)n�(�CA�;_��0�-��4`�zر�a����ױ=Ӷ�Rb�4���tF��OC��ٲ����B��O�c��;,H &�,�0}�:��+���^<��������:w&�����^�@$��4��E�HS�}���M�������j�	l�����������������a����=�^���afp��y��Ώ%��r���ۄF2����E�J�3$��1G����Dz�"��] ����l�s��%WI����G�}Y�����d�c�pd�2��&�quR�N�2i^S�[4ܰ=L� �]�Vᵘ�О�,_���/�1�;Ǽ�ϵ_�w0�T�K�Ba�^ék�6��`�x#
�hJBj�+��њ��@(���E�eg<�c�*^�H��ɿ��,B?�P�X��Uo�#����Lm�F��	�峨�`؆�N�k�7i�<�qAjԻ�zs�Ĩ~V�#�,ZxӠѻp0Ӄ=2�)�)I��7Ơ���L=�ɰ�X 6�hS� 4|X6�� j&N�q���G	h5� n��Z��Gc{H�� �����i��`v�/~����.܏��i4���� s���D�J�"���b��ڹ���%���rwLE9��cY��?��~��W�*��i;��/K �@��#%n�ay�n�2�r���*�W�V��cg����`C���?�%SM?
4�!�+I�n����q�mr:�%�6K<�N+=N�q����@Ё�v�p�r}'qq�,�`�"�O�G�� �s��wU���!��g�X�\���,a_mD�f`/�I+���q�N�dȽU�k��g���T=�GcT��)�q��"#e�`�ѷ`ra�T=Ci�Is�'ր G;r�Ebo*�rچ[�&W �D@0��p�q�������a<�gC}����T�lA�?��}�D��G`L���Vj�^	�6����˺��Q�F0�Q��B�t�23W������	L�(�،q]���LfbP� �M��K���&m`�)�
�F�x� �؝��4N��G�>��	�>XpQϠ��F1�Gs�0����4p�ALMO�r�-��3R�3|#���Rq�dS���&� ��,,j�� ��O]�s�I��Y`�<a�i	������	�n�n����mm�z��?���� *حg�鄹��(T����K(t>���?%����Zw�PO�@ö$��ϧ�{z, �&D���(�{�� :f��s�*�wx����Ȅ<:՚e�p��.
�$~�fԊ�D-c_�G��8��5y�1��)� (�÷%��Yɇ4}��P�k�"��aB�������(���P����5/r��ɭC*���'Џ �%���pN��V���*��̠� ��`�:��E���%���T�0
20�|b'��8�??����E���m,�`&��6�%Xq�"`��#�K�(/���Y�t:I@#�7��(gz(6N����(��tQ�*ak�����+a��]Ai����8�K0Y\A#C0�a
�;Z������~����J?�,� @�o�� Eg4�5�8��z2����������g������8>�`n�q�"oQ�čiY�n�s�8Jt��j;�8�& '�-ՀK�VMO��;>��~m��[�m�e'�������2�����}��=���[�������7��;-7�z�p��J�)�G�]-��-<�X�S|������U��}&0��3Χ�y:  ����SH:����kz��/�+�l��p�: ������a�koX��׹����$��Xv��'�k��.��E4��a�{�Y���?�뢁@�N�O�C#�{eo��#Gp��ϸM3r�0��J�w� :Rw�N�'6ac�X0T�EA��5Q8���:�6Z'����&p`��R��[��JS�5<�wݏ���=|S��t䅮0U����Q � a|�N��Dsd�z��OZU�0t��)8�a]7��+�n��,���5})�	�f4Bu��]��m �izY�P#CU0֢�� �a�
��q`��R?��a�퀖��hpnɄq!��-��~�g�o�,�����9���%4���GP/.�aP�P̭G�#p�d;�D���^5ʳy�����laR bn�A\�=T��L�W|�C�ŕ������ػ����ֶ�o-��{6^����+_�}vj�m�W=��f�	P�����BZ�N��R�g̓�9�h�ɃYE�����ީ�A�O�y:W���D8I�5ϸ�^�� 毸�%2�9zN�M��۪^��q������<R�p�ۿC��6ӦyE�j��vm
���N�B�� [PU�7������;�E���V�$ш�@�R��W�VHd�z��뤒�c�]��O?8�A�,F<��L�s��8�gL���|l}*P�]�Y['�#�<<L�	���-LQ�^�1|�zx 9�0[�e�c��q�, ۀ���a`،1{�Q<a�a��km� L��}4_~K��oQ[�>���؅/����#>�������r��+��V�`�3|�`&w�S=�=1�=1���~��z 57P�L�a�{��*�z��Q���'��dBC\��pY��3c��v�S7W^��65���ڻv�֬��S!O�M�
<w`q�u��k��=v0����g���(��O�dDP��e�p7,���bT2����Z��d����K��?���<�) ��TsŵM�V���w.0��rb���V��'�9�	���V�O�_�7r"�#�rV 7,Iki�I[�.�����L�h�BY��ɃU1�4O���uaO@��XMl���Dc�=�|���*A���� �ŖB��/L�C��Ȓ��Gŋ ��/��+T��X���{C���B��}㮻����S� �T�
TU�r0*X+&mW)>B�\jDI��8��`��#��;�.���Dk���So���Þ�E��Qa�<Ub��.Ǹp����(�gh3,�=UU���c��`Lk,����, d0��ʭ�ɑ���Ms�Ã��C�e�o�Ծ2�)��U��)�S~)��:�l[k�!"|}���z�c�[b1����PrY4(�Tg_��G��� �wd��"��w�%�m�z��!v��׼�;]�nS�ϴ�ѐA�#�l��)01�.�� ȅ�&|R zd�ڥ <��-W�
*9�� �pz�O_�t6- �)�אdb��ŏ|������[��1���y��i҈��Yq	hȲ
�X{����ϕ#hO�	����j�:M���&ʞ|=ߣ��U9��]�+�A���ǽ�bsɰ�:�l� E(�Y$�ʋU�2�E<d�[���V -|�ع��p���qx$X�j�jy�e�Q��\���%�;��6QfD�gi��A�X�/�C�a��ʰ&ka�`4���"�z1��jXc#����&r���@5(�Y����`z��)����|j�hܾ�.�x��Wh-�qc(�#s���9����g�#b�^��7���o�3\�=�+�D��T���7���������ջ؁��3�yZ�/.��p�M���3�~��?�L�^ʥ�&� *��*�[q(�ީRJE$�>&i�!����&� N�Nv,��t�ҙ�s�a���A��5����X�7������8����p�K����(�$�@rV��l�M�:u����]ڌ�'(�L�m=�c�Df�CV/J0��:�L[4��O���뭕�����2K{�-�l�頠�� a���0�J��&'���)�w�W�*7�JiRzAn]^l���Cstta��4�D�4 j2h���i�.؈��o[���v毀�����ՠ�.�.�U�}���)�{7�E��P�Em8DDL��4Y!��"�/��;*�A@Kg(�GW�0���	14�:�zc=>fN �6��q�JڢQ�q��.�������9/�0NB����H���v�`y�vm9�u�K�o���`e�C�s��OWAO
�s�ʮ�V�c��B�	)���|CN:Ks�K �AV�Uө<���� `���c�Ł-��»��*�ΰ�Q T�B��r��f�;�\�GS�'�8��X�<�+.#�� �=5�H��Dci��
��pE�P/¤	�Z��/��6>����1+���냨P���y8��h��D丹ѵ���g�(��a���՞辟�,(�����pJ�T���lq� ��=n�����qԇ������ڰ|A���6 M�ѿ�BX���Mc÷]�qS�������9ڸ@G���(,�|�WA�W�^p8�O�1��!��;#
�HG$}'��}���t��g	�r\r��w't���u^� ��D}.͊To��2{���}�z� �u�	��Bډd��С[�v�`epÛ.^r���~q������8�����]�-X��8�	�ҕ��I�1/l(��jLh��-l��Qg;,�����ڴV �E̜��۴g���64۷o�ox��L����5���|���8f�1��Mqo�N�sp���	�(����J�-|�q/�Z�Z�ޠ|H!���)!��J�Qr�Z�|����KA#�܇���l�|&(�>�������C�8�c�Ď�jY�f�x���Ǟcf�;���6ҕ�DHm�C�P����`�Yǎa��A9��ʖ�V˝�@A�)��O�T� P�)0�`�����d=��F��#
���'�;lџ�y�8Nܵ���Z��x0Ȗ�XQ㩬c�E�@y%rv�i��\�e�7�8�ܫ�A_}S�%��f@��ܕ3غUS��>t��Ͼ����_�:��vz_��S�N%m��ش���|���ݣ�W���a�V����GdLEAlT�q ㈤2dC0��?z���O�NP";�W2�ZsyѲ�4y9@O˓�b�O�t��s&u�a~������Y�j�ߎ���)�Y\�����o�O�	6�\�'�"�h�hW��jGɮL�$��%��,�=p��5�|�l������7+b*�Y�������}3�3O���|��P����y���5��H�ct�B^$���a{a����@�{6�T�0,� �p��k��� ��p��<�fu��\|�������}\l��+1�P[o0�J�`/�C�}�����y�0���J
����I���v�ǹ����� �+_Ame
�+�&>�噔�&ntԓ ���ECT�Q�C4U���?q��.ތ<�S8�u�ռ�N�{	{�V��Cc\wݸ�o��z���W�+�4C�Sazqhy��3t���[KP�}(���S�KajI!�}���Ȉ � �F���r+@�3ϧ3Hk ]�[��Z���`a�O^����x�LO�nGQT��&�G����=�I�84��H r��Y(UW�����Ty?���"�Cr%�(IDI�� ��b(��2��f�������JV���@;z��l|_�#�w���5�v�������HAY�=|�
��s�(c����J�q+������� k�.)� �`��Q^�ņu��yʏWVл����vK����0���Ke�/78����F��86�0
u��2fI�[9��O<�ObIK��clg}�.{�ź��DU��U���9��`M��a�Riz\����k�O߸�{����*\��m��c|WK.6~�ݻW�?k��~�[����3���>��JH�pvpǱ�E����VN�B���xϝd~��H�'۽FHNr�����p�n>ˎ���IҙX �B\ݙ����&���v�w9�'>q��������J�AeY��Qk���>
sbm)���Nmѩ&
!m�j��^�o6%;����ɬ��[˭I���%Nw��؝��Ge�U����nh矋�Tp$�t�"��tbxRq��fR;�A2�n�q�?cÇ�����(�Grk�Ơ�X7���.tN� ƣ6|�h6L������%�a���oR��a��#X�g�~/�!���XS�d"-*��
@ _����dG)nA%��8S�6L�o=���*W����&Hl��4w�3��=���}��/T�z��5��l �p:� �k��Cv�^�x�+��Ƿ�l45x{c�\�OP�� SA:�%�]^�Ё;��40 ��vʴj������m�i� ��k;��Z��I������	*��Jg �әN��w���]ꓧ-[���̏�n�vz����j}�Wa� `��S#B_4d����'�ڻja4�I^x�&Q��u1�e�3M�0(Ϥ���~��'�A{z�R�\���$�e#n[�Q�OO����׷�"�q(_��%O�`����i��k���z6з]b�tm
�Fg�H3
X��RJ� ~��H*���J���hs���b4 ٶ�i)GSQJL]z,1��!h�f�q9��u�[ $e.�>�S;�9te��6�c<�-�B۔�]B_%�98Rr��U��[[���%�����'53�5�e���j�xh��_c! ��(KT�������O����q�]p��Hv�c�?Oغ���wgnxӖc�\tc�/�1v��2��(7x�z,��#�:e�pk!��)lyM�%�;��D�JL���Ŀ�3����@@��]���Egy	��?I:S�sC�]X_����p������~l��m�����ul�l��@d����P��b�5T����ʂ�L��f�G����<��[[� k����G�'�'����yF�xNk���������GD�桎�x1��o�x�ky{��,����.}R`V������)R� BG�I��_E�x���F@M����>v}Q�;��CQ4��W�m���b�8+ ��� �'^ T=��1��'���g�[E�)�/Y��Ee�>��_�
J2��OV$���q���G�ɱ����ʟϊ�U�% u��2��\��kȍp�B��8`n��P�%*s[o]�K������<g
O}*��'��_��?� ���^��'������/ij��r*z~���C�"K:Z4��o�.�F ��w�|�
�@P�q�8NԐ%�q�X�Q������8�VIg�	��I�@y��-�+��������<g������/��������1�P����>�i�v�8 �	�38*G�;{5U��&)8�a&kSf�y�t-��	l��ѿ�o���b~1����mm�R�V�T|�R'���$�U�by��#�F�!RKh�[ �B�0�G4�9|��o)۸"Fc�<��Vd�DK��go
����/M����ۿ	�\vlA���j�M��"`Q%N|y���*+���۔�z �Wb?4�қ�b��i'��k�0kjg���Ə�����������Ć����|dfz�W��G��t
��x�{k��KA�oY���kI�X�; ��=�{��Z�̼����7u�f�X�Q��(h3�%F'�-S�`�Θ�by(� &��6�S@�!P�u��[Pv��PH���z�ҩ����� ��mnY`�p�+���s��>��O�}���?c�'L�!*��T��D�LT/  �<��p�q���p[ɘٯ�F�Y%Y�� 9P�K4x��M��D��9<M�Nإ��-��[�ͫ�\4��H1x���^A�*#M�A�g�i�Y�t�PV�����h+�����R�*8�ysx0}D�H��C�k�Pؕ����@�H0i�ec�<����3cM3����`�Qm� ��Bu�,��z�6�h���������tb��!�q�8`�(c<�z ; ��UP@��>�Qk�qy��S�KR��/ɘ�B�w"u'R���`��a,LA��ͭ�hߧ��Y\s}�~��[�	���)��w:��s��b��z�o�����M����`v�� �|@0�V���E5�Ae>$C��MC�0~�+3�w��
z�j��cq9�+��U��1�0��1��ͿkY@k�'��	g!�* xl���h҉[[Ϝ����v�����*g�4E7X࿁�a��f�ǖ�9��5����~T�N�nc��[�9%/��&�h_-�M���S���i��zV� jF%W��
��@t�J!���+S:[���I�Si/���"Y�a����L�<�u�A�e�c�T;}��E����hN,E��o�*h����a�fQlڀ�\�r�ئ��39�v4R'l-�Z4u��"؇��_Bed�:��&Ɨ��5�c��䞔���RD<�zv@�LZ)x�2�`�`���,�l��_~�܉��c�{k��M5�SIIl�}q�������Uo�Ε��{�^���2����7� ϗ�ZԐ9�,�O6���%�Ļ�~���c�����-t.sS��� ���6���@�=�t �!=>#�%.�$ p�-�7[<���C�|���g��O/���~y���.�F���Z"L��B�����b�^hm�v�E�r�||�����y�W�0�#�"�ze�K1m@L����ac�1���q�h��J�E}�g�!L364D1n���r�\K���d�(�!���%�B�6����z����!f""�1��@c�o-ʲ�x�Q��q$�}�v�ID��w�@�	[1�MO��U�`L�I�NF7��5z����|��!Ek%f��2�Z'���I�~
c7�O���R�M_[���B���h+�! Y5��Gr����Kl�`*�?��l�E���|?����M�;�t�������W�7.ܵ�q�u������٩?����^��p�'^'� I�#����w�}��+ vY��h�+33h� ��_ϯ�A��������AM�. �K����������J�O'����&�-�{/��w�0����=�������f���6�Yc�����B+~Z3�(78��I��.'@}�@)��!�����z���v�4����PS���*��u	d�Һh��I�ꗢ����<�43�efz[-eD|��|4r�6�0e�[��8� ���#.K`y����0Az�b��~�<Ɔ�x���)X��(Ȁ��m;3���O�kPi`�q��_D1�n"�G�*<�w��'��N况���N�פo���2��J^% #OD
��	!y��Xb�lؠ�=�g�����[�ʷ���M��o~��g�iGǵ�KK��]^���g�w��ob�'�(z &MǴ��mB�D?P�q۩�qj���AY��7�'϶�K��YEЈaMw#&i���΍��K�O'@��M@[xa?,���5�S������3�k����1_�!��tY�	!�Uָ� �!S��岠,^���b��`�Z%�X�2ND���V^��u�H���@����kf�R��A�Ӳ\3��e'�(p����$�����@�ur�K��rF�I{�'�J�ׅ��/�Q�2d��1�f���?��p˨A�lC�п�B؋֡7(�ό���|n;��5ʩ+�<��WQ�q�f�Y��@_���J��=:Wc�O"�r	M�q��V�ٳꎢ'�t\%�>�����>��q͡
?}h�����}0��"aic�=�G3�~���S�7q��pcW��`�O���,%+7�Ռ#[{,�E:��E)�z|E�i��l��Y�:昿F�p>"�pN/��N�4�� ��ٲ ���X�p*(}�c�P\^_v5z p������
U��0\��d�d�8�'O�!�#���LV���P@ORa��e��j/� ��7	��Eth�`�L��Җ����W3���ь��>	�aN��\�?{*.��M��յ\��k�NG�s���ڵ����q�2a��~PӀ
U�P'i�\��cj�L�k�)��;� �����:r��;�ȟq�ū�p��`��4
�T�H��{kٟd�L ��l���c�9�G��aC fj�LE�*��7����ջ�X�|sZ&�������Y`��V�|���S�7�2�yT/4HZ���*�k)�dy�@4�[�+���#t�%���L~�~F��^$ 4{��9��q:[> 禃'!µL���n+��pP�{�a���{���}��m�V�ӿĦ��E`a�r�@+���d
�R�7(r��U�j"1q�G&r���ov3���I�"��Ҭ:����'�.A�Y�R``�m?��&zD~x'6�4��	��T]J����9�BSU�_-�`�I ��U�O��a�~؍��Fݹ&X۠����be�+����S�Z�����պ�տw�O���	9q���=E/�$���	 ��5��������-6ز�e��@'�%kU6�T���z�욱Sӿa��_؆�E䎞
u�1To(�N���h'q�&�AG:2Ӕ^����c&B��Ց��L���}]�����zܥ.��-��+,�mk�w>������g?��ڴ�ź��,����%K��Q���D#D�/Da�zcv�t��HI�u��*��h�]/���5{�+jQ�'FB���Y��B!,j%�.!	CY7ɫ�I��䪡����� ӿյ���	a}�[��j짔}�>���I�I�輵�<��GeQ�^:���	��B�)�+�9���e���}ٚ9�s^1�a�P�Q�����G� �B�#�N0#^�!h�a�(��;��#$�'V�ΝF��D�p�_��/�Zn@eAE���{��\'\������gn?T�{.����fiӺ�^�s�<��
Ƅ�Aj�^�~bJ	�`��ύ�ɋ��>�.���;	��D�r�d=zq��u��8��f�������{۶��8�G�OkL��8 �ُ%ր������y�;��e;n��V|�ڼ����_������0�]�$r.Y��@�Y[`�z=,��2�<w=����ˡ��l��h�F��V5�F��^����ZK��%y�!��yA�תk�G'Q2$@U��Tu^��1X�
�>d
��+�)+�D@���v�R�;Y�c	�츰���f����AqbSU`����2DN+y���-�t�J�8��f,]0�%���wm�S��%�T�������{{ؖQ�- k�*�@`a���H���^���ԫ~����K���+2T����c�lY_��%��[��Kj����@�s�""�c�����YaL��G���Q��=ǿ��,��g �t�B���!����K��c�� .�p����?��.������Y��T�QЄD-ma��ƭ6b�e��!�l a�����eʮ�
)���ZT�
)�1T^JP?[�z�^����)󯢵��������Pq+���ZЪ#��xgQ�Es�^��Z8���+AB���#��9O}ruac`,����1�e&�W#�pr��l�����$5e����#}�!TE��1F�F%6��T0�b5��E�����ʔ;��C|Tb�
Oǿ��Zˑ��GG��.f3�D�(>^n��D�}�vv��S�`�N��7x��V.��f���sջu�L�2�z�f�`e��� [&��i�
B)O����@��2ڶ�7���#�0ŷH,�b�k'�q�CCb6`�1�~{���'V��[� h����׳�����@@~�ne���{��m;��.<�౟|�Sf���c.r��F�a&�(V]�":RJ1T�����T�T	X��!����9��x�\���KJ(ks�4�������d�bK���s�oH�C�U:�rC�ĄH
Ɛ_J��f��#ΞQ�$mL=�|16d�#�u$H���S`�k���T )@Da�M�B������ �1X��=�G���+X �
[�� �2�B�~�Y$�j�􎠃c�ߋ��a�h)��6�j�@���0e�\Ca�z��}�a\�C=̜�O�[�g���1P��޽�#�D|��K��\�� W�6\�1�`C��'��!x��
h�)��B�� *�HI���T;�b�
�%}����r�U�]�Z&������d�y��KZ (z���!���ޝ�+\�lC��y�➍f��>�����O����37ZS�� �c0�q�F!�=�#+�ZNt
$�jØ�UF�e�٨��~Z坽�^�����)5�F98��r9�a*��QT�#���!��5���uc�K�p���8�y�R)�;+l���^���0>�(��eUf3PQο�JHj�(ȟ���e�T����EcAe��h�~�R$F<YR������m�F��]ϴ2DX6k��/@Ѓ!S�]eI30��Z��<�ޮ ��^�z�K���b��EPf�O2κG2�1�ɕ����Qr|@�X��2��Me����LXA�������hXk:��]�Z, ]�Q���r�������%�瞍W�*���g<4����6m���Tu�%3`��cf�LH�IfMQk$���?��U@>ѱ�����N:ZsR�C�[����Z�s��ʽ�����A�!�|��'���`�'�Z�ک5�D�:�ƥHEz�xi<{���p]�۪h�\oz1�;�1��48Uj5�E�C��1��EU�2��AҗP}�	_Λ���&T��_=���GP��9\D��q�A;�Ie�8�xELՁ�ʌ��'I��h%��%�б�5��Uv0�2"��`�}�X��~l���?;�{�Nk��ז�߾��oK�}v<�q���f 
Ψ�	u�~�&�Z�?��0/��4��t^I�kʬ�@ܶ�8!�9#������v�����v��5�}=~���i�> ����? @;����0i���+�,�,0�p��������wզٟ�oX�&.{�2L���b�<�$ԬN�&(5}�3�]֌Ҭ5#�&(��hMޜPTG����ܩ;H�=���(���r�xז1R��'(���Z�޼�R<��Y�k�	7��%'��%x����LY�u����/�f��*��P� ������!LY9ẽ��R��FB$˚'�0��U䂇eX�4��Bߏ&ˀaC+e��􁏼���yn��3������/�g���ꂺ��1[�h����*O	^NZH�](����^����/$��0�O��d_���;hNo��ɗNX�O��3�8����������%��I*B�K�ϯ������y�K��b�oo����?_��S���i33u�-�> #0��DQ���_���&��n��LR�?u���W����C��\�D�@1���EM!���׃���4��T8E�u"��ߔ&-m�T�L�X@;Ơ�*��#8T��r�(_8
k��r(/�ٺ-E���G�4g��[����b��p�B�+�C�8��P��
!Rb��t=�����ØT퐶ȀS}��C$���S,�TAϛ t�a``�R=�� ���}���92?�D�� 88{��rA���qP��lu��O����&��i c6qE���qs��!�0�ָ�8.g%}(N����6>ϰ�X�a
ӨV�9Y �� �n�t g߹����I�;���6 
��O-ᾖӻ�;��O���KK��+n���V���8��[����{^o�܋PUZ�3���`P�B�3�j'e!�k�e��'��p�Hr70D������e��A�8�B;Rn���9���E�$�ȓ&Z?���K&��t�u��v3���Y�����N��0�)"�`����G@�T�q�Zٔ�(Wt��v�-	U���+���%����L!-OumX�"Ex%@/�/u
}Щ�+Г�*
w_�V� ����DL\ �����> ���7X���N�&� }m�s�����U�wsUn%�ѡ-���5��X��Ɛ
r�E_	��e;eJF>�]?$���K�=��D�� 0��j���#�K�=��E�} �>i-N�:���N��s�w�r{tw���k.���^~)�����±K"��s��9գ>5`ر������<x�����~���~�Z�0STd�`�q�Q��ug��x�*��)np��Ġ����Z*d�a�͝� �C�
�������Z���`%���Z�"��A˶�-g�R_��z��<���͋|Ry*9�>�7�����4����\��[��`���E�I��} f�8���Q�T�M5V��%� O��^P�@i�h�?`	�����O�� D�O���FfVG�����W����W�S׾]y�Њ����#��-_��a\�V�e���X��� K�4��AIM僜=�gyE�\V����E�?�4kcY�� �F }���A�y�p��ٌ���U�m�.3�ƍ�m��6�7O���3��������������ߡ>g+%~[�Z�Ν�����ӷn��M�����w5LGɔ�0d�Ҙ��s��@�G���R�7�=5q��Sb5A�v4K!�������qMP[ ؿ�����0(�Ay��G)L%%A;FGq�1S���q@W{�A�)SǮ����5O�̍T9�@&S�~�)j��G�|^�Ō�(�^����(��Pl@���7���[�S�:����,PH�$`R@+Yyq(����b�G�S�k쾓K����á�Cp�>�(�j�t�a0
pæ��������1������N`�^�O~��j��V3�{��pH���Q�$3�X
��üE
����N��g�\E�y,N�a,�55��������:�s��$I����1M�b�9մ�A�#�0a���R4�qE��7]8��ݯ=�]���4��z5�wk��{�e��(��5ר;i�«w���������e�x��G��K��45�Da0 p�ꡰ�DͲ
��8��R@ঢ)�Pwb"/ �ycM]�x��r_�u]u���>�g� �H-Z�
А���yq�
Ӕ;�,y'BRh��"+{$��#�V���
���֊���@Y�.�0~x	����=�%� ?�df�D$|3�����X:����F�,I�N�C�I��ngw��R�^_E�P�*�_[R�cC"�m����q��w}�v�m�X�p��s�%�}�ۯ�^��7�k��B�J)��   IDAT��(H�6)��O�J�}t��q��_5<�q�N�,+U)�ݤ�q����I]���N����xJg�0���dK��E����1ճ��/�iꕿ�S���Q�k.����m��y����Եu�;���Uۯ����s~�Н��^RV�/7D{�b�Ԁi�~JF�85E���t��VY�����XV�dL�65�����c��A0?!,�캸�y�+[X^�9�D�=)w&J�89F9�XY�J)��i*�c i��9�_��)��Zc�+VA,C�� ["f<�h�~�V9lR�E	X�]�+ �=k����5��^T@Y�]DA�� �t��_�c.I�|��t��&��Q}��Q ��E��2z:���Q��/ VJ�-[ֶ��ִ���{w����>�n��S��@ԁ7�� 7��]|d�Ҋ2��5qЕ���{� �/��H,��������v��S=�Z��w>=�ҹ k�t��}��y~i���L�l��з7^��5o|���n�~��p�-w����=k�����٭�����; l�����X<|�{����?������P�|��D4�TwAB�"w (tA�'@�F�?<��@q�V�ܥ֔;���Y�e�s���yk��%cPD�L&�/��,F�,���ǵd���z���Fʜ��!_��O��J��wRJ�$�2Y��� C0d1����F����l)G�����i�5��
+�����Q8�J���A-�9P,��w�n}����4��I��Rz��O{0d-S3 .:�;���Z��潕��E���.�R�O��� ����<Vr�$�� 1��%�ʻ�k���`'�Xt�Jy�d���=i�!+
a�N%����s d�����]�>��,��S�eY�'ճ���쮛n���.z��7�����.�ʱ>���[���*�����[��b�}{�g�N��g?���:z��_��/�5sDds��e�U��7Ȇ�I֡m%�����v'K
&��(c�Z��]X�ߪ�|ok(BR�Vi�  <ړ����y=%�os��[ꪝ����i�����[�(��4�E�E��#M��pI���=�S��/=}4C�X�����}�+�#ˠ����:����Lv�������{��J��@?�G�d���Q�B /Ė�MhՌ;��T- ��� �o1�t�`8]^ʃ�F0[�0��y��&��9�H�~"�~J#/R�����	�;�2ݫ�Y_YK2��K��3ӹ  ���"5N�4 À%` M�l	���/<��7�~������~�>�ɴ~~0���4���y�����$�%~��V��2����n����?w���T���
�lKX��1�f����[0���5	�������~T��@	�D�N�yDA�5K�\T��;R���5�1������uM�� a��r��%b?g��a
��c(�O��'{�U6�I*�(t�)Q U�J�=�(K���>x�{��v�	����	�i��E�~�8���%�gS!��=�-M�����鯶��[B�v^+��D�(�U?G�� ��ӵp.İ��o�y��N#	�,^� �4�)�6��J���0u�ЗS���d^��2�GJ�l~C��_�� �#Y�p7ӎ��KqP.��"��O��t�} ��H0>�1 k�(�4#�ý�Ɨ\����{��g?U��W/]���ֽ{�غ�[@`a��ԧi��.f�q�v`��jϟ�Kw��m�E�_33�ԯ� �9X.�|�4 �Z��}����:QQ����@��J�"�d�JLf׵�%��Оh��9Z˪��mt^��MJ޴�G���X�JW��_�`+m}[UJVk{'�7�mSh�����a�T@(!�
m��W����3`٢�*��⃰���
rd�ݷ%x){)�E[5IF�z/�^m��^�����A�� �Q{n$�֧1p������0Ka�u�vœ_q�s�c��z���0�&�Ҥ
u�k]��ۿ07��G/�O��t6�*8�S���8�f��m�����[��ӯ}�۟yS��߸��+_yt���X���޽U��|ǎ�3I�,b������<��?�~�{��M�|��b�0���`�,���k]�XP)�a���=���&�G�"6	��ഌ\��$۽�V�T��~B�[Q��Z�X	�^{ի�Z躭J����h-�Tl���q���MҼ �5�L�H��}^���*P���W?��m`�@�1�_{�?D� 2��I��Iи�,��U�Y��g���x�
X���� 	����H5qy��n��g�$Y��K��Qd�,�^�c��Q�ty2CaV$�[0�d��[48�4����%�][��{o�E��8��1F��P�[���}�
2��d�h����7���6�y
h�$?d���=�����k�	0���)O���{��� O/��<��ҩ�n)��$A��4/9k���ܬ*b��JC�[?�l��z�_��y��ox�a��F��/qyܺZ�����t�Vƞw����?zݾ��m�X�����^I��(�,jDf�01A, R';r�?0B�"�v�P��6���9����������J़���ש�+�A$o�C[3�bZ\4����,Uޜ}��e�7])FR�l "��Ç��?�/T�0�_���3ek��}���>T�M'Pl0���u �Gh�S�n��PU�BX�n"�c#����
���q�8r�(x��R�"p�b ,lcl��WY�:2&�Ҥ]��,�5�w5@Đ@��/���KY!-`�Q�A��=��44�)t~�h���Χ�4�n �Հ�ɮ�9-�i[!��HK ?�5vւ�yf=��ʷn{����p�����c�:��^�n����9pR���x�^����+��k��������Y�/������ E͖f`�2@#K��'�9	DA" �Fڣ��}�Gd��]���-��8L�����-N�M=��6���o�j�<�B�5%���IY�.�nU�m�GN�?B�3��+~���*jG�zUTԽ�3���?>>L�#Dx�) ��in�T*V>�U��Q��sV�a���RڷU�kR}D��s��Z�9�I~.��2f�5��;O��K�4͛��¹6�w[l�Ai�(G��E���H��z���.��D.�<�?��ȁ���EP'�9�n�Hg"�X���P�q����?�8D@Y�w�v�B[��)��u�������{w>��IQF�s���٘u��9���i�oz�����L�~�1|׿l6c�4��%��\�I��1p������V�][Oxvl�eW������K���'.�r뫫���T�Gٟ�EED�̰6NO ���3���J����Sۊo#d*l�xxƣ5? a8��_������K�m���Q�Ga�D��I5�m��L�#	.�i6Zk˩��rba�*�EUa|�Qأˠ��t��~l [��g@K'p�����E�g��$��41�|7���5�#Y"PE
)A�����%���XF�.�=��K@m�%�N⫴o�&l2D(�"E&�O���0� E�TNgaP�_���E�|J��i������,�E"�rq
T�ęX9wK @ڤ��ә� ������+K Cp��*��?4d˵���tܟzq�eû��n���~��Ł�/:v�_:|�����|�o�v	�u��U~K�]����=Z^y���{��-����A��_.f���Z��i��Lf(�#LQU "1����$�.1���Tc�.�K^səs��r�o���Ɇ��H1�P�A��ud��A[#���v�$���/���
�#G�<����'ڢj7�0��ɪ0ߵ��W����h)o�'�P6f�L�a�5��"XJE~����	C9����2�YuCo��C�Z�� ;Y�b2���c��{��6���־�@b�� X�M Y��n�T��f������`�"��%������I�}��~ډ��Ɲ�K�C�/�<��\�ǖPbz�;ͨ~��3�;��|�/|��
G�<�[na��p2�@����1v�%,d1&��[w��wme`ks�C0��������|d��Ol޹����O�ß�q�j2�[Y��E��'~/�D������L�	T��m�}�N�U�K8�N-�� p߻4C��UB�u��1��Ėh!MFL�q�@���~E��!���l����tk�`��jo�D���f�EY��x���Ɠ16 �1R-�E�ʀ-E�x�s��_��0��k��ɸ�����q=I�'�LM��H���}Usace\�˼f�F��(���  C��Ɯd����
�n�)}���!��9ޓ/��=u䈌��Z��
Jv�3�����B�U�:	_���*��������?;r�ϧ6�5\f�0�Ȩ��dcD.����ÕqS��mI/�ׯc�[7����x�ql}z�х��, ց��Բ���VK�v\��g���k��^`��ށ=�z��O|O��_^L�>�e��3p�~��T�H)�c3��|Z�.�)�.݅�ƒ�<�[]/^�Z��[���^/��w�:w�o�b�_�r�Î&��d�e��!g�}�`T;�Oq��.��¢(p�(�@U���v���wK5��vL c��dIîvM�4�֮W�S�����u���8�]���%	��솑^����kL�&�a���$�iԕ��K^��a��y���� ST-o�w��pVt�se]��>��@��]��z��|) �:dW��㫞[C�#���!�둭���(��[���{M�U�{%v����w� �~��qE���Z"X���
�Wi�;N�m�;��n�{y����]�����m_���_C�ޯ��G��*�b �F�L12�Z�eY�'�M���d�=�j�OqS �2to�VŸE,���K�R��gA�ē���2�MP������4{�t����9	B,�|�!�g�Y���%��&$�ڕ_s��%P��p�aؕ:Y�5��@^f�~Uax�>�C�P�JXX����flX��� 0��d�]�W��*%;,R->y����Rm��v�7	�O��h��6p �Ȓ��p��i��?�Iv#�X�S�I�@�n�>Z[A ��i������u_�"g��<c�z���f��`��y��͐d�]�)��̜OI:�m��� =��o�6M"�o�l#{H,N�!6��Յ.�Ԡ��e��ů����������/���8�����?��̫��,�it��D�� �,l[h� ���V�}x�CG>��w�Ͻ�T��rU��E�S j0V��������7PvJ�v���)_@��ow
�DA��N<A�ƪ�������*�H	ͪ����|�<��xZ��	y"͊ XkQ�=�<r��2@�����σ6(��p�3_E�0`(x͋�̑@�EW����-4�]�L��]c�d�DBR%��h�+�W]� � {n� .qQ y<$�M8.9�]�a"7���v����M����*��.ʿ"���E'?�#~��ބ�u��Ç��R��X�s���=������YJw����.��&E��0�w�� Hݩm��\3�WՏ���݋O����W���-��+~�8�m�8��> ��O�C Og+�P��`��ϵ�p���÷���_��+~��8w=��&��d �"�L5l�O�f�h�i)H�\P�Z-e����O�E� �K���<R�۲V��<�����IR��*��a��"�iw�ږ���.��#XnP�=4���GP57`0��K�ɀ-```���0~�0Fw�C�/a�%6|�!��^��)�˛kO�o��tE"�&��hq�af���^�"2�- ;�7њ� �Σ��te��7 �9�NEE��Z�����@++����b���!9�T��}Ʋ�@�o8���t� <��Ғ��z�ݳ2�0�YM��#Q:I��C��mЌk6���\[��yw��o~��+~�Yx�-����q\rI	|������J8�.`����#|�4��1{c�F��;{�����{k��'����rQ��� S90 b�!�Y�.q*tM���vN��#
$��y�F����������w���&�Dݤ ,�F��(M�Ӕ˚���<96� m֞�b��5$i�p4�N�P��|�˨``c��� Y�8t}���ǘ�.p���;ꕰD��!��ʩ�M���R�>�+x��% ���X!� F4��e�@D��b�Էc[LȠi̹�O�s^�����I[\u��v��6�����պ���@/�ȣ������>0�!��s`��	ϝ�tv��o�t�Q��!�C��>���G7#fK�|���r�cH��@p���֍�UOC���fㆷ�~�i���o?�]w�6�m]��m7�h�xI��+�@;pj[�0��,��[=Zb~g��y㱣������쒗p��uni�A(��4dfw0	@�N��|!���8�u���N�����l��)S]��}���%����s5%c!Z��N�B �����U$B ,����kZ42¾��ZA�U��
��\�Z�2�E5����2�̽4�n���G#`<&�-h��5���\0�{G��.��-�F���´��L�/�&�C�d��8Y�l�8���L4a�Ȃ���N��B#!<S��g�>���b�6l-8 �9!M��{�Ѥcu�Z?��`� Z�ɘH\u3Q�%t����6�^E� ��<���6b�A�4bd�!�ڰ^ac���['Q�|z<��3�4�?X�s�/C� NbD��+ d\6X��#kA�W~�~�.\���W��_^��������*�x����e�+� ����e�17Wcj#_���>�����߾e��/���p��-������fЊo<Ʋ�~�0�bw
v�#����MW��~�������ws�O���:FA�+٢��MV�8��*9��(!IZ����h%"�	��]���/�%�C���=�ڇ�f��8 � �!�^W�w�zGG��_܁f�!��^Җ���|9�Tg��	�5��K�V��w��D���+���U��F�x�Ҹr��,�t���ӂ'��	�����rD�oȜ��v��]��@��珯�͘F<�P҄��i���=�>��Lg��[�����[�&ւ�'a��؏�0_	 C�
2 ���h��6��O�s�o_�������]��-�8���f36p�P��ŵ�}�i�=OW,���,�q���o�c����'?�07�m3]���I��"6+��!��L��Ƚ���*-�3��4�RTa:e|Q���!��^Pϴ�XX*���N4[�����kIAD����k7R'���f���b�}_?2®NH�v@8+ ������o���%���>p� f}E�}K���>��O}�^�Wv���-�����SJ}4p��h��G��9�Ɛ��!5�*v�RA�U0E���&<�M���t,�k�F:�B��$���c�D�_�����8���
ϜU;���QYf�y���uŹ�x>�A:�@@g/��5y`l����h��$�O�Sdx)�����W{ j��Æ�@�z2Q�l6n/_s�M����m���8���S؇��-��dI`~�:���[X>���G���e�2x��^p�������㗃��ZjjC��)1,��R�@(2��d7wU5r�^�)o�!��!`��7��Z�Q���@���۹��S�<(%�(s�&e�J,1�V����ffXCLMax��X|�-�z�e��/�]?3�a�;�����1]V��>�?ׁ�_=�g�v�&��.Y�u|Iq'���,
��I���]��
���� M��T��B�ni'@	ֵ������<P��cl��	-X͘�0�o�f��)%DN��r�7�I�3�U�[i({�3�;q���ؒsL9���L �k�����d�S&�IC~ + �x�d �M��/�,�420���maJ����7�(�����7{p�ul��{�;�>���{��'g�v X�?�75�pH����>a�����{��gt�ĵvX?��O��LC�-	T�Ɋ�tN"��?�C�S�B`�o�q�}r��?� i���hP_�����H��^|5��v�3�e������侨Jp>|M���x�_/
���c�c_ĉO�T��<B�@�������"
�㘧(L���+L��S,m��3��,Q3�"�Q#ѧ����H��Q��TO�\%�� ː�d��ƔT2�K��]}"k�������	4Y=M"f���O>���"�V���n<}���K���w�e��C����l�A��*��Dq�4�\A7̉ �%�)@37#.�'sQ�N�q��7^���s}����ػ���%�mۺ��6^�C��->���~6f�2�75�W\A����#�y�W=�u��_E���\�ǘʹ�EI#g�f��*H�{ �O	����\���'4x��O���(�@��n����	+?%
�M��4�M����4�RYNP�z���M�w�i� ��G@� >0Yp	��)L7�N �# �Gof
\7	<�DX'>��i3�� �����X�P���BGM�.H�j'y�����qa-p3.By �v��&F]���8�ZS���DS��NNQ_�}���e- u�I~���L��9�>7��jV��qե8��m2�� _2O��";��F<�N3�) HX�)�]��ww��3��E�WQ�Z��IU(�  8�J%��=�c��s�,s�T���O�����~��ڛ��p�C�+�����7�q��v6��ĸ������O��ꋶ����w�,��=0z`n�\�
Z/�\H�{Ƽ��Èt0�L��J�L�R�-]B�C_̎���OF�ZK�O]�4��{�0F@!rg�'bڿ�le�����S�W�&N�S�h-�S��[g��h
����Z��>�$�tC����v��~�U̹P5�ٳ��4���pbՀ������`Gm���'U��̟?�@��ԩ�w�t�N,{��ޖ���Z�j��kK�i�i^�P�L����ݻyb���q�#�L���U���(8���N��V2H6��y2oD+��8\�c����2�\�3��xO��7�^r�z�t�2�mq��%'[ �1����,4X�����)�|�����}�׎~�o��<��/�Ē9I��Y6��	��Qǅ����$�D^��{��}��>��9	m+�OR.I8�j:^Q����kIDah�.����V�;����K�����bq��Q@�f�Z�k�hi"����n� �lkX��[;�G+
[��?� �m����:�e��M`�6I���%��Q*/OG}�Q�c쾸�R/��h=�#���[�n�����M��L`G2FgPR�Ndj�H,��`,S.���}{Rb,#����(�F��9�K��#��,�W��֎� ����:�. ���쯤3yں� `��n�C S@��| �s"�cE&�)'�CPw�
Mh�|�Ɇ
��㶩+[�;h��@�a��̾��߼�曁�`�m{P��A��@��y�<qP����Z��s� ��Q������|�_X�^�d���dzĦ�\�%/ܜXvDd�&��\g�>�w�*�D[r�3�0F���ki�$����x�DU��I�ߴM�ߜ�����n���:�딽"S}/��L<d=!�O��5�t�c;Q��w����R� �SA�c��a^��O��Ꮯǩ���\��φ�]M=��8 c�fA��4���0�?�i�"`��tV~�DzxD�a�PBV�+���L5����Bt�[������Ϯ�8�N)u��tH׌<��- e}b�a���"�A�"
V��5�U�\s��?;P�&L�]&C%�{`j������v��++��=?�M��W��x�G8�H����L#`M `���50``�m����LM���ji��裟��wٍs���ŇA8DD��k~��0��^��H���)m�ަH��s�>��D��P�h?$Za����Q����l9{RsuWa�U�+dZ�,o��Xqw$� 
~��gr�a�^���CPx9��=$(��sj/G@ҊTP���31���(J2A��.���]�{W/�:��n^[Z#(����))p����	cZ�}	� 䫚b��H�����a�*����0g�q�w�م�k {ΠOΧs������ûL�������,Z���@t`S���_Ğ��aE�d.&O�ⴆU`k��#�\۲����z��ٹ��oxݷc��k���ʊ��%3��L�1���_Kڲ�ں�1�P��uq�n�Bu�^B3��q�������6N��z1 ���ͭ��v�8�!�9!�D���l9:�����e�1��U�XT_�u|�dx������V�3����2�|~�ҫ�_ �̩Ɲ�+��������v��	�So�'�$dS���䄶�D�M?�28T��x��L9��=�lկ��T?�.eDP�f�-�V��yꒉ���!߾����ȏt>�����r���rC2��|�ANb5Ӆ��H��)_��x���"Y'���]�H���땾�� '9�]w1������Lal�WP�'��8N�0���f	-,�x���H.XT�����bP��?[o^��髞��W�4^��!�w,-�o�P��8���U^5-,0v��ؾ�`~g����ģ���?��h�����ۭ)	�2l �N-OVՅ{$���%q��I��'��L�+�:�k���|��.�[W'�a�e��%ߨM����Ϥ�M DX.`�����g�E� 8)�Z�������&7��뢟Oۦj���vs�Z�&0 >��   f�m"Ӿ�#�_�Z��ط����=����@T�;}:��h�ߎ��~Y��qD����.l;ɉ��-~;�\:W �c�w�I������wl]�����(B��X���kA���>�;�
D��k��)e���t�u������x\�<}<3��/����+��شi�뮭���E �&����Y;��t���%�m;\yq�k�-���{��o��M��sU����E	2�ZG��۰�.��$ w`���x���>e��y���2w��i!���T�l�,i�B�':2q/�[��%v(HnJ����9u˵�XvP!���\���M�.�Ge:���H�$��(�9_!�-�-��5V��d)b���*��x��"��{s�9J3�$
��)�<
τ-u@$�ċ����}�
|�K-�N�GBW�`������`��@��T>�97<C�rg���q�ε`�A��� F��m��97� *�?;e�.%��Լ�2����J&�d���D��=@ ����+��qi^��M���M�7��Y�D���n<=�����ǝ�e<�!�,p��������>��~���> S.��A	f�������	��L�^LØ@��3�/
�M��N_�Nͨ�2u�C��P��^��(�����$^Ȉ�k�I�3丫��&�>��S��l���wGV�m {�#p̘�c����n�,`Y>�e"YNr�T8� ��	~yw��4M/[C�$\�3"�U�,�R!�)�]O����r�8�X6�\���eP�'�M�'P��) �1^�I�c���N����a�X @p�F���
�~)	ϼ�_��8��*a{�1>�+����|7~C��fMGӒm3��l����к�Ջ�۰uc{G���E�k�]GKځS�ig�_^��+��_�����y���//f��^u�%S�=�����(xQ�"��h�A���$a��8ۊ Ij�#ly��pԽ���*�aG����.a��d���G�6�~�t
ʑ��KHJ$�5_�6�5�'Z`ʆ�X?���>� ���2��$2,j���
7,�,i�{U�W8AL(<Ol:��`�>7��Ô3�R\�
�@�H��oZ�D	�Y^Ӆ��-T(�0�h��.W�fvј��>u�ijUF�e���.�s��<XCz�� �ϻ(^�}�ş�y��x�>2�'��Q����Zbn�E��8|$rV�b�\M{�S �z�b��ڠ�������=�޼�O�b㋁��/�E�ӟ]`�-i?,^Bغ�W�������\��M���]�����|�/pѺ�/��_c��L�1D%�� 7��BK�+� ґ��k�k�;�8雘�92�`���4Kϊ �)�SK�l.�kݐRxF3�;A9ey�,��� AW6��v�#Wk�"�eс��HO��"7�߇�����,߰���&J�n�(Ĳ������{r��e
��Lg����%`�+�ZMݱپ�
��$ ���=8�z�����S��3���F^�dj��	YQrL'd8S
o��H�I��n��%�d�d�p��<8Iz, ��;a�`a��w/�c��G>�����L͏ \�Q�jnh��QlK
Mp�1�����R� �JX[�چ��m��UN]������c�?W���a�6�l��-�x	�>��PIk�X��Ÿ�P���ѿ{���}叼��s�����aS<K}"XX�`b�(h,v�~�-�4�<"y�vD	I�R)�v�i�	��ad7��M�Ӫ��i+p�#��m��(���Z�"�����W�I�;�c~�ni�R��ǳ�>&�B��hAlO,���&WЖ�\�?��8Y��C����1%�1�h>��`�B�k�g��N�dB� 0�%U
�q|7�i�Z�/��$�'��9 eb���
�Vg�� � �y}���� `rD@XÁŮ]f����@�oGQ���YǨ(aViV<�z�w�T���zɓ������Q
1�z��v�Z�#����G.���/��L�ꯎ�m�-{��~���}�nV;�$�yZXp��=T����w�<�yt�37�l�����e.�����
��~���3N_�L ��[.L�e�&+�kv���Yl��Q�ۚ�C(~X;��i'�]���451��"�Oc"Ph�V��m'��<�%��A�#3hu$4U���	�Vy��*�8���ky��٫<W��\����f� ��������O���\6�џ,�D���ܦ���i6�0�1�j����Gv���uR����:_�S}�����$����öi�T��|�4v`��J|L�5��Q� v<� |��ܦ������ ��kp�H���_��cF���Qg�)�'�i�in>r��=�x0��V㈹ ���-�򓨨^0�`�T����mn޽�}O���s
l���u�O�4�3`��� 1�',-Y<e~�k�/�����-o8z�s���f��_�U���0}԰4f0�;�UQͅ��L-RI�>���Q�Ar��g+-5.p�8�@DGZm �\	E%ײ�ZL���2R_��%F҂&�y��dޘ���"S}�q(R��鹘T'Am-� @��L� 1�i
c&[X-��Z��s\�.@�/t�5q���s))<�1�J�V=Thj��
V���*� w�8��m��4���4��� i5�n] 3G�w��"`
�&����k�09�'a^��5|l��%����l��zPP�����#"KƠ �@ӌlm6��uU����'�c�ů�&�~ѱ��f	1�{ap�%�4ٺ/�~���a�c���'<��5�T�q�9|�{����o����Ea�+�c�f6����wg��3
��"�M�2��K���(���j ^�u�*����Fz��*񩗋�Z�p�����(ӦC#&� �9_R�&�!g�$�o\�8�Uٜ�pK(���j��\'��\��X��(�/"J�{�'�!�T�4QN� d��QaA%��N�<��h![ÜY�ƭm���7���@D/;V�t�h�k"�!�$%�ѰU12E��τ��̸|�!Ż�X�2�IW��N��In�x��V�Gߨ�� �|D[]Xhp����_��{LS�72�h���p��n�fRD�I�-��O��U���<�����R� SȲ��r��,_4�����3�w�����ܾ>v�pM[� h(!�P�ٿK��)ה��m��	�\�pϺ���w�j�ET�w�(���f�쏦!b�,1��`���u�1��w�S�I���/xu)z���FQ�5��!��z�y\� !4xI%���e^��I@���I��;Y*��j� 0#N���ԛVD��.��jRt�d_ow��i����� Ch`�7��u�!�0h
^)f�=�'  Gl���}���)@F�Tc8
�.��?Ծ.�R��e����o�.+��(`��#V�R��%���\����<"�3JL��g���<��� t%	
 �1 �����cܙ5�w+
(&�aWH�R��e:RԬM��-s�qq A�*L	C%؎2la��V�7T��������sx�a<��ƿ�}�7<���3��a��Ƹ���N����[����m��m��˨�>E��h��bH�<��gX-LFɛ7D9�ɛL9ɳ�a����x��:�'כR�\8�ͬxA�߈2&����]��?�8����	�L?��;�f-` �Mj+��դ�:�p_@^G����{�f8��h���&�Mآ̈���z�Z7���������������@� ��Ō�I�!&��dN�3$�ؽ��$sF�OlSt��N.� ZN@�0��۠|��s�0��e��#�K Х��YZXh�kW��_�P,����� ��L̊K�i!򗠹�Gz����P�$����;H�@MdB��l@����-[5��j�9޺��w�����^u�X���A�
�x	�Xg�rMi�<;�wX|�F��?x�o��W����l�y�N}��L�F�Ř��CY���^3a�T&��V�q�Ez���	����VȿL�q���f㽥腢|���Q�I;��A���0x����Ƣ���/8Db�2im_��\9O9?��h�En$&��$ �yzO��ˈ�#޹��@���l�M9E��Ӄ�����K���_�g��gm/q�*jZIgz��j�J�8�Z���d�\��q'��«DU�}?�U�B4�/����P�xFJ�rhc� �k@�C�6	�Z����N tq���t<w���@������]���[ Y1��&�(Ӹ���Y�'�y3�̍x:��E�(Փ���{#-� "CC˶`�gr��P>q���~��?�W|r����/�o݊*�x�)��O�k+��~�[w���r�Y����_�鷪u�ߴS�]MQL10�r�l�J�(�[,�Ѫ�S��!'�g�Iֿ��!Ů-�<��~�ը�c K'IkE�k�:b����z٭�ȡB��c�i�����0���Q�ל΋�K��+ �WR1�{�Ԗ�_�����/XX�+�{�lf��[��k��'���	_�D0z	�R���N�r��t&�c��4��
6��Y�>��QcU���8���)�f1�ƧN։�ϝz�wm\X���=?O�u��o��y�o|�<>|�a����i��g/��0ݢP��52�6��	�Ċ�X���	���Y�@s@$�g�-�y8�B`	J�%�<��i�;�{[���=~���z�ptq�������s�k�e�)����٭��,-���o�w?0x�O�~�q�/���Omi���	E*����1��>� Ih�JGFb-�j�T`�ٮ��B���L�	#�e�hj��hU��ZΗ��c�7� ȸ
�Uh%����Ǔ,�XJ42�۵�4y���d��/`�GYH N}��AZZb.������W�W�Q�<#��5���
�,��Y���Sn�����6�z���w�������Ww��:9.{�c~�N�M����Ԍ�5�3H[<h2����V'	Q�v���N~��H�X�|M(~�)��z��#X9Eql�)�
�$��d<i��6!r��(ɲе���nu>��[ N�N��?�4�P  Y�Ɩ-��E�Ν���G��8>�SS�*��h�!68o�m.s�(�sJ���T/S�P��E���b�AR��Μ�M�3[^�]��x�ٲ���k�򋳟������Mw�ں��>�|'�i ��35��g#c������;�j|���u���//�ף�n�D,O�1#����r�����#zۇ���aaZ!'�Hi6A�i6�Ձ��'������V��S�)�9��S��Rm�;�
��j�q��|L��m�j�1��;�}��V�в�:N��K�N�J�`"�Tf�X�QU3��u5=��#��o�y`~~W��}W-6��G�ԻZ �;���~� ��lIBT��t���Ը��3uʌ��BzBj�D �ϡk`�K
�2�?L� F7���!F6�b�K �-��� ũ֔8��S&&w���u?=]س�X�t�����3�^����ܾ??��U���S�"ڊ,�1�S٣$R-rϲ�@�]J�!=�gD �x� ^��| <cP�a[�X�z�7T��rՓ���W����/؍xn��5�u������m���'�3 wmel���w�+f�+������޶x��?����E<(o�^�O�b��0Z�l@�7=�8H+��	�Ѓ"�l$g2z���}�5se�-����r�a=^�Γ�V�l<���O�����[�ΊK��f-�w��x�G�-1B�X��PG��L�@@��sY� w�VX}&�hLLfHT�d���0sS�{�̼�O�#;���e��`a���kܥ�����1ۧ�$P�c&�Q�͈�2�e�J�{�C	'w���z����a��'�/ �o�@�ԏ̄BU�$����O2�d	`����8�N��| ւ�r���~>^O�ɫ��֭�~��K_:u���K��#�.���)�0e��G���*,�V����!ߠ����"E��;AP�\�\jr1B#pao:v�<���k�vhM��)駇��|�_|��\�ܥ���c=�č7N�}�{<�VAܹYt��'�� 72�b`]s�� ?����ߵ��>��{/x����f^f�{��M1��ff����R�6�c��E�gs�Y�QTd��i(�Oz/�2��ٶ��q@�4+��ߵ�#�c״��k�y
cT�L����@�~:n�@t���cig�Jj�*� �cb���y�y�VQ�N��Li��t��
�G���q��rv�����ދk���\=]�w��ƍ����,X�  { 'p"e�~�򋦫X�(�	X_)d��i��L��KFg'$�HidɸN�r�8��e��4-ٖڅn�C�pV��p�t*ϞO'I]K kI]����)�
�Ig����֭��'���tp�����b�����3����D�s�TLK��YR���@�V��T��W��;T���v�&<�M=��R�"&X�m�=c\����t�[���?H�x�ql�6āߛ�����5x����M4���t;m����mb���~;�ˮ�zp߇_0<��M������7�W�Ŧ7��� �-�#��n9nz��<�s�.����,1��w|/fE�7QoN�Ⱦi�]#��x�+7��h����Px'���k�pI<�)'GG�ݠՖ����+E?F��b�{� ۢ��*�T�fc��>���w�G�}���?��%�U�f�N�_�H8���_��ز�1���h����]Hz�3�Ma4�,��Q`.���WI��s��Vh$ ,G�o��r��+.���mڟ�����o�$ ��{�N������	�<=����-v~{����~�?<�����kƘ��Ȣ���f�����ZQ���M��D%'n��B=��F9A�,~âQM�m,f&&0'�� � kG�q3l�7����~�mՍo�a�-w���/:�M�/���-PXˏ^-���Y6.r�\���w��\���_�|��wox���)gg_d��?�,JFo��%rH��J[�j����ʳ䅌Di�j�i�i���[�g ܑ� �M��K����B���Wux9u8NT.�X�JW�j��.�R>�������F�A�}���=3A��~�]���2�qb��ъ�����2���)_�e������p�j�������w�w5����/���][�[; ��O�`�gC��h�yw�1��jh��:���$�$�#ѲuT��,��k0Ή���R%�ذ�Kꌋ�J�&Heܕ]x��  ]�Դ��I�:����َ�����%-���5�_�`׮ޱ7��?wx5��ͬ�|�T���j;��+�VV̛J��!��a�&*ehVpP�QtD$�f�g�lMs��:A�(8�qS۪�MuQ���K.~s��-ϡ�x���\���l����Ͷqph:@@L�wM�n5��5��?x}���^9��?��x�%//g�7pa>Ӕ�)�Ee�V`iĉ�7Fݪ�r L�Z�i�6-0����Х�t+ϟ�H�)�WԾ��uv��B����-`&y��#U�[-X�dQ���t9��:5�>J]�|�(�����bD�MSA���]�\�S�w}�G��w�>2��Qc��U^���� �-0��iy��5�Fn|1G��(맮��a�w����-9��1NޏE�~���xQ=��J�AنN�Bm��τ*���՗�.2NU��σ�,�m �%F'}�N��+��Ln��]Xh  ׾�:�^�p�ŏ�\Z�:��~��!���AY��4C&���B�[C�������q��v ���ok8���%�i�1�f�z!/�w�Y�T���^���ƛ^1��7>oy�q<����Oa~o�=;]\���ᓥ�k�?W,Y��K�<oq`hq��}l��:�7o|�����w�6��W���*٢?��2ֲ��F���!��*�X\$D��`@ >Xxs4�˹����jW�|´�=����(5'q�C$���^�,��z*��]w��)�./��iҾD��Ȥ���B!�3�@`Tlx
��Y���4 ���Oe5�����W��O�鑿ߗ��qcq�5��6�[l���6n�7 �Q���(	g9͎�l=`�T��%y�TG�w8t �~V�Y;S$"9�I�'���3�CW�D��U��4�8����v����p�@��N�U(`��NG,,�(a��֧1�{��?�V����8���h�k��_�RٛFm-l=
u��v��313���Ųw���U�6�sfܓۭNE�����1" �x��b� ��1�p3f���j;O~c�y�;z�����s���/:�u�
��M�"��_؁�@ O��z���Z<aS�+��\߿���C���O�ֿ���z)��om�`F1�!��ΓX����\��Й�=Y�R$�YE~�m-���PqB������K8ڙԡ�`�O��P�;ML�L6�s)�W���d�!�
��6�k�H7���`	�|dʰ�a+�"B+�x�h�:"�\pq1
SL�W.ѠxW��K�>�'��W7���]��\�Hw/ojB���mw��g���[�� AQ��P9���Oп<#&� �B����~D+�'�Y_̿lS�0p� & ��Xiܭ�'	|�t��GT?�"߸�<�Ԉ/��.���7�~���P����v��x��Vp�O˥�//j�&Y�I�zTU�Ʈ��%�[�X�*2�&+!�Z�6�Ia z:�I-� ـN�D.�{��`4���9�~�)����EO����^�]|��V�,���f���4����}��*i����w��^�#�Z��*��w����/������{	��߁�/�Xc �F�]�=�%�C�A?T�PБ���
��ʈDڶ54]FT�wUңC�I��õ���ݐ�J��(�qr'���G���Wx}(�U���T�BRX�u:�2�X���d���(�(�ۊ���캙�x���܉��.q�5}ܳ�X�V�; �Vo|!�3��� f�	a9-<��H� N:9:��A�e �u3��z��͓�Eye�F���'���93�Gz�;)Gb�;E�����=���`a���>����/���>����7k��@L���Cئ��ۙᎱ4�_��L��D�)�T}�-@y�E�gB)H:1q��F��d���A�� 4�쨮٘�mo�����Z�歿2{�w��ʣX7KL_��xM� yڑ���P�W,Yl[h��l�`���bu��?���i��V�)_��W.��)�	<h�l�.G[��ʣ4��Q><��ʑЩ�P�S�E�?�LR�a-Z��eM,qC#��b�����$cq�Ii�	�82eM:�C�&� �tKby~-��?� AguY��@آ�h����<�����w��$˖+���$�a14�m��ZZZ��BXHH�	!������씥��(�ڴ؄BRp�=�g�J�D�e-ｙ����νsgޓ,�rZ�D~��r��]���s�9������oU�7N����.Zs�ώ�Үf}}�;�p�	�]J�M�wUX+������7�)��S�W�Vɻ�d!�kJ"$�w�?�a/v�;�1�tm��J���n�6���3^2<�q���Vt���	��%�q"[z�޷@4[?�4��C�J�]�~ ̈́?��5��@�{���;<�o*U�<�����er��I��cT(��H��43b����'�1g�k6Ar�33]sB�=��6��lI.?q��,Y$�2��+�a��J	��@V��*^|�)�z���o7�y���rc��_0��ҋt~�3��F�r�制�M�{Nᱡu�ݿ�����������o��BTR�Ʀ��i�]���3���17k\��V�dy��1��%�l�279٭��l:[8{!5��SN1W^c8�{�I�{���C��!0b�� ����,�:�|d�G��� ^wN�e��[���i_�ⷫ��2�Y*sF���XKm��HD����E�@�y��o�hIfJ��H����Z{n�iih��Y��a�ƫ��Ҝ%f����� ЄM;��O�O{�7P�T"t�d<~J��1�@�����v���:��Wa��ET�o&/hs���
3�ݑ�MG|�S#�Y0��Ѵ�Lx��#&��:��y�a�?l]�j����$��q��ɃT�����|���^}.�h7:;c��E�,"��gO�z�y}����V���±��r_�������_I���J��Ǟ�Q+��`� ^K'n6_ �7"r)'Z7R
�n��(��	���|r��2�v옺X<��8�ՠ�����mB�(b�D�tE�kE1kǦ鬯�ۜ�wI��U�z���OT%FD쵲U���X8�?_���|�N���}����K��i|� �Mس�ߐsԬ직��Blǟu"����5��,�ɍ�E��l�;u'5V܄,ga�i}N�g�LN�`�z{���q.r���QH��ޜ��&��ܧg �\3��4�%poh�C}* n8���W/�TW~���u~�n�zHHQ�EĪ�@�<jM^&1�YG�\���8�IC��G���L .�L���a�.c{��ȃ"s��/Q���M\U��Wc͚��Ƣ��l����e�ؘ�a�q��C	G�^�mpz���;���o� � �l!��J6����|֝�Y��Xu��4%�������vI �B�{�>�8�J*d���N��q�N2睅��
(;�9�ܑF�p��T�k��4���ƌK��R�O�����ݿ��O+��� �~5�e��d=�SW�1���0�d�aI���|���i�� 7{_��Q�y�_GS¥��ꍉZ��ʎ�|'1�R �4�N$���U˜H���Ao͎$�׳K�e��P�� �B%��2�.a�{�!��@	U�eD�~<�9�+��ߛ���[���SS� �o	�q*[!���
��YxK�xP��e�����Ml�w���X��J0�3s�I����#�j�8.��׵\z�{����/������� 0g �/�֌�@W�\tJ���"�� �`�]_z XT�mm&_��C��U0�:*�ֻ\7vʜ�^�ajl4.�53\����Α�p/ʉl���hC�5��������x��.�l�9G�e7���XmW�9̿��uV��r����޺֣��|a;V����rYi���cc����?c���A�8��p:-sa�W&-8	6!��+�p���La�.7�E�d���2ד����w�(�6M*E )���M�h��b�=�>?#��x�O�����"���5o�f��!3�����Dtz���/y
�Pa�w�moQ^��K�"F�j`$�i'&�ՔL"��hF��Z$��N�&�'1Y+`���#󩷪5����^�H<��@>�R�P��$��+ �Q�?(\r�W��8� �uW�bx8FOO��d��d[��Y�0�Ä��@��������S��0�ou�j�����gPTbyE��j`x xF��F��d��nd:Μ��>`�9�o��ո4�\�+�1��� ������z�(��ع:��fGj;�%�cir/q�M��1�:���X�ҰL�J �eP`�ʢ�����͝?���� P.Xƭ���2�|�����>@k��أ����,�E ����^��%%��|�����!`���>e+���vkVK7� i?Q��l�h>m�\�ae�����>� 3\��8R�df`` �W�9MYV��� $�|*�Ҿ�\��.���B�S�#�,c|�E��e�K\���񩵢V�)�Q�T� �y�%,'m��� �]����Ǩ�Hc&�,M�j֡�2f�@�⺪Ɗ���q��5���W��N��Gal���a��,=�bx7]骰���
q\!Ɖk�x�����Z��,����p���g��>C����Z��;��}u����pr��\;gP�Z��H���{�Yῇ��k8嫦ƙ���Y�^�U�-�pb\��ɤ���Tiy��eJ� F�P���
�䉂����n�_y�Οlx�� � K�*��)�2� 	Ͷ��|6���`��o[�.X���D�ͬ�뉮��6D��F���� ��2a�9�M�B��v���b����j+Q�˨�}�Ќ�T�!��߿W4_���`��ط��T[;�_ax�0<L�Pض-·n���b��;������O_@��˩�M���"uR��W�ө�)7&r�A�Y-[��nn�Z��d' ��hd��R��TU)�EB�ƥ�U���Q���^�U��X�zm��׶P��^;	Ε�5`��8�:�^$9�����3���[��9�d�Q�oQ�GXx�
Ĩ3#L�?iaaEu�w �0H�ii�@p�|���5�0Y�Ƀ�i���?�L�x/7���ּ;\>�q���?g�7+�r�) ������,�n*�7��p�/}���FC��/��QBbtu=s�r_ g����p Еf@��r��tQ2|-@u)�U���f-:���L��T�9��f 筒& )�~dnM�Ur���-��|&Y�ڼ��6nԃi��P߼O@�N�[�a<�aӶ7��c��`j�C���FLO}PT�/�Q�~	DL�[���/��絣w��'g�Y�� �DBj:N��Rv��yb�8����CA$��n�A `�1+�b�9�>|��������v`����}�Q.�p�z�ɗ����E���@o������N?qm�_�2��[��;��Ke[ˇ"AߋI�f�� �*Xe���f�����3ɨ�nPcoN.q젔�>{�����i(�W���jF���M��p]�����}�b���Z"�0�A���� DL)Y#��~�}�>Q�:���v��3[�b�����n�pBg8Ci�So�����ȇ��c{���� �>���ix#�]=�р��B�����?����kctǦI]��	��3H�c�9  �Q��oT��)M?C�|0ۯ�����E�Q �uH�	;�] �l1�����'Y��F���}}�ۏf�]_ܸ�����i09�a9U����
Bx�fE*��e�8e'�� L�g'M���)ߝ��~՟.c��i�|D��&�g ��x�I��װ_�Fv.n��/y�cpp�r����u�qc!�8[;*�+��h{�<�ľ���W����Qu���b�J��=LR@�"!�C�"�,����,�F�1�ܭ�`<���lp�22|�a��L.�Kؿ���L�7�<���4v�}
���ąe,F͈ri�M<CrN�֖"x�)�P��l֌��׮�z���8������N����ۋF��R�%��RB���7{K˖1 ,�N�J')r�wU�5tv��bj
�d{#8��1�]�D!u����^���VĄ/6���Y:�����aF�����٤<����� �^pO;�F�T\��U��^zZ��:6�CG�ػ� �2~	 "�mUx�:�!�����5z����t����H����JEH�U�B������;�ȝ��r*����I��uus�o�h�-V3H.%���#)�P��0��0�tf����<��-�|�׭��IGԁe��Г�0���ؽ���~]iخ7��G�c���ூڝ�����X/�K�b�E�yE�N5p�@��ر�"�e�	�\ ^Aɮ��W��������\o`��g9ia^�ܚ'eSX��&�b�F�["4^ yV�aP#��"���	O����kph׹c?���e/����)� ����@����Q�v
72{Z�Fݾ�I��gAnT��m6_���osL$#�!A��N�A$.�txK���Yy6��UL �ج[����*���{����0�Dk�Hy��B(�[;���8�kᅅ������g��Ȉ\�$d 0a��k7�6�}6ׯX�O��;׉���Ra��� ��Hq�2���-Z�D+�dv�$����Ȥ�hvrڽ��o�}N��&�a�϶���^g��$�Pj�c�Ŭ�(��Z��
�]/~�� �gN����þv�C?��`��Q�l6�!Y���j�c�|5����>��[�}��[���[䀒t�"! d	�bf���xe�PR2(��
���xl�OM���Ͱ�Kn�B-�6n�Im��e��C)w�-����D.�ٴ��t�yJ���/�y���g,FA�Hz%�I*��E��,z��W����ۺW�n�ғ�-�cj�fԋم�!�|
���A}W��}D���> �������M�9^�0���LH��M�\鞖p�g�,�s4����K�+�\�-�g��8JA�ba���f���Ĕl��@�L� <����=� <�/��I�����GJ/>�p�94��xD�Q���#@��㱡:��p���U�����\����j�N�ۅ ��>�����4N3�����8Mqd-y� ?�@NyY�xc^� 0⤘1�J��@����4+>���N.�x�G�-�_�k�P��`��>z��=��fi/#t�W�	���'���[ꇟ�r+O/���O>��W_�5.>��9��"�C�� c%��a�H�,���Oۤz�Ą�5�hvL�X¶��K������v�L���v�h �ҡwd�!%uu�&�P3kCf�$ac�"���$��B܋�w�\�������<vݝu����'b��ߛ�1W���Y��D�&�U��}=C���?����d����p>+T� j����;{\H����;�`�Yf8�{3��V���7��-?U��>}J��BD�F�X�0M�;�,���K��`(��43���q�!�F�?z�p7 0)� b�)b*���+jw}�A,>��������^�G�\ЧA@y�1�:�����w}��i}��v����\��MA�� �����$��HH��f�fA��Dɇ5/��+�^���R��\�P���r��ZwM����E� ���G�PV�,��W�\uk��j���.l<I�'x(>��ѡ0��fZ�T`8�r�G��h+;�	� me~�5��Pˋ����k�[��=��f�x5+��Br��rM(�h�d8`�f�7T�*I��J��?��9͈�?�oYiC���4��`EkƇ�����g %c� 	��n�S��?Y�X�k��6�J��� `ߏ[��/��+?$R8je��-x��m�q��m#Ro���,#tog�1�a|9a`�Tݺ���?���?��h=��6�w�Qj^���Z��8��?��6'��ޗr���k���Xr\�=EMج)��芚T.O�K���y�6Y�[6��� �����/�?�� `a���@�t���UL`�(����<��5��M�������㚎-^02{
�00t#�Ǹ� �_���2�>��?D4��\��Ȟ�BR�Ą���=������������qPKAB�)k��1�)��8�)�0�9��HV H��k�ix"@Px}�y/�����_�����P�?���i�*��d�@S?�>�;��kV�06���R�±%���v}�q _�|�{~ON�������+��4�2I���g6��(c�e���$�����FN��i�	(H�Mkg�O�t"�s�d�����3);�ȹ6�(R���!��g)>��7&���������Z�.#¦�:�O[����m5�]*�v�#�؂����.oU��V�VV��~�M�շE�K��D-� 0>J�@��D�/)���K؝��Ո���uo��Q`e1` ���M�31S��BrdP��"}?W�ϳD�{%�~/���Z���9IQ��b�D�ow캩��w��Q���M5�GA�c�����\���o ���[�H=�ڵ%��V/�|͖����D�|���O��H��R
I�4fe����c�7�Fb݀i;#�Iȑ�I$na�ȟ")u�+@
	�"bES��#��hQ���{�y���E��5�H�qG#��1b`��I�Ĕ�vB ����W��������`���{1h7��I��� ��X�	���Y��Q�R<���ښT�,����v�ݔ� ��'IΓ�[#3��J�SW{���B�:�	��"���ː���"�=����7n�������+��%л��f�M��3r�tf��^�W����O�o�UW�K^��7����pm$�9u�@�--�/���π�7&�غ;*�Ȕ�`�Y�w��b ��ɜc0���UL!N��q�>��1���ޚ:�f��y��%��s���̀x�����ׄ$II:N�gA�XMPȯ��_5~ﶳ����7հ��C�YM��2['C�X��9��`@�\{m�_��XB�����xq�>*�/�� �nx���a9�!gH7r@z�:�[g?���N�F�O����4�<�n��q�Ing=�	+�@P�U9��8�'�T���A��m��կ_z��m8�* ��#FF#�fa���AА�׮.Ʀ/��CV�^|p��x���S�d�(�W)����O$}0b�IK$A�d�#�vo���ך��5��l�#�0�Y�d�����gf��線e��/S�	����5�2��=&�!�� ?,Y|ޮ�|���U�ǞS������оM�νN�1�I ۼ�ZQ><xF���;eˇ��S,.]]�����?Q���$�ȅH������Is=[��<u���6f�$��DJbEd�q�^��h����@�X���.}['U$ ��U�^�����;2����vNPz��B��.�  fQvx.��٢gc;�&��hXA,A.�P��S����}l���Wv��=������{btA`k�h
潽�40@8��:�@#�~}i�N�/:�6o�/�Z���GP��ê��N`Vt;��k�66��!����'s0�\<�)�!r�2)�����p�8��M2ђ���M�������\un����B�I�����=<�H;�m�P{��Ǿ�P�Ɇ�&�=�Jn-��b�����3<*;,o�)�ʩx5@����*��9�o@FIsX� �0�0ͪ��Ɩ�A��5C�#3)ˈb/&��P�~�%oPsХO�u�8je�u�:�;�K]]����Y�{�BU`d�;
�Ȇ3�y{�H[��xѢ�C���b��y���,2X��_˃�p�
�����R��<e#荙�|O2�12f��"�(�)}Rru��ߔw�p��';& ��V�9ӘeJ{޳���#=[ `nBx���� � �A*`V!���=�x�A'�������7�+ `gE4M!���	���U���ض)�ƍA��g=���ۮ��p��_CʀA>����`�Υ'�Ov2Y\� ���xÀ��#�}��lߘ��:��bbVıaLZ+g$�3�N4`J4� DE��ufL+�?.n)\���W����������=i?��+x�@��Ը��R!k�?�5���׮kř_�{��X��A��b��Wh"X^�e����|�&��u>�����M�B9��l��R�]��s�e�)�f�3�
%�� Ү�, +0�����D�E�or�8�O/~����d'���]�޹�g����Q۷�×Gb><xF���/?���zKq0�?�U<�q<%*�	�bnus�<�\O��t �iS�t&�X)�觉R`n�lW��q����B��n!Jn�1s�E��Ld kb�w���I���&8`,x�� ��L��2V CG�}a��Ӛ��l���� V%PXCV�����7�|�#zW��M�1*Cl������������:nc\;T|��z8x��i��9���&���K���
��Z���4��1fD�mEg��/ �F#Ìy0�-*k�0��I�	R!�Hz"%�V�����oQ���{���?g�Q�W��#�16�1� V�J�Ѓ�������]>[[���ӏ����X/ڼp �3�bP b�����3�f�.���
P�¶Hh6�rjz�|������.�6��,�ᠴ�Q�"���s F� o
=�'��ۆ�$�����[�����Y&Z6B�v�#��N~lݺ�-���.����"�3a����E������8J �BͿ~f���f4	 ʶm�"N����^f�7wLe�q@�A�=3#��
�>��pM�4C��ovSǤ�s��Z����`\�~�so	�p䋴�c	Œ�� DzMfb�hz
�:LMW/������;j�y���:ں���9�7�Wd"�c�+\����v})���M�O��pX�Z��}���+�	P:;1��	גU	�q���ok�N���V�*�S�~s�Bb�$�y����H4uH�X�ȡR�5^��N.[|U�k�G�y\�_,[&��y�7F�I �(6��:�iq��[�h������ŋ>,��R%�3C# E)�m��ƲD6i�M�=��fe��ԯ;Fo��'Oپ���%����˥�R̘3�i�MFk�	��� /��#ſ�������_��_�{+Wq䡄�-����s� ]Ocda{�|p͚ڃ��a�9W��e]�ڊ7D��Iq������ȃ VI�-�����l���=�5�� ���CN^�kj�
��7]�|cg�&V���g�	NȠa ��f9�?�[?WѠ��C�* i�2�W�6�Y�3�Z���3 ��s����zy��u�gJ<�	�����8f�7`����O>9x�)�_��Ɩ!�;n����
�+��sC<6c��Ү�>�[~�W���Q��A��E�Wdf���1��x�iv��Y���d����d��Bʩ�}\z�a�vo�oIc�m�d� � q<Ş_���o�%��^��,}�S���7հzu��S����2X�{>W��u�y{��]��11��Tk�|��U$�&"���J���mVb���H����3��:�ӍY߹Aj ٻ�QV�d���8͉u�H� ���W�n)�h���_��c��c����RX����Q&+��)�k��R]��`u�Yg���[��~H���}(XƵ� �z(�ky��qB�,���e�h�@ /�g[H�{>' � ;��7�z6�.�[��r]�isN<��G"�Sa�"]��Ĕ�[}��%g��9	Ub��!�s�������@��Tߝt �:��3��J3�
 f����a�txv�Į�;���ǿ}]+6l0���� �BC����/q�P�ߨj[������/�(�K�f�I�}Ŭ_�a���|�:���IyRM��5���7��Y+@V�͌w�CS�d%�=��M�b Q���MǾ<^��������z10�cÙ!�!t�.�E0i�}Y�1��/z<���a��,Wa��_��<�E�s�7{�C����Ϙ%-@���F�~f�[r�M
�N��!��4�{�4��U�u&��D�,�2��CXo��P� R�
�]rQ�b���>��OㄾV�� B,-�L:f�v{E��ێa�u�g���9b|�.��-�&�SU��L@����v�7�+�bNޅ�9Tmx��m�k�����_L_N��;ŒlUxkŁ�4�I �^�����Sw���V��O�M��!) ��!�1��г ���� �E 2�4o�ד���&K�b	��)�*�*ⓢ�SW=��wWu���c�����#�n����tw¹�k֮�>��1�S���ۦ�ODY������7S̏�� $+ "d��0��7���]1dԡ���������8OÝf�p���"*q�Ч|����+���#�aC����u|X��y���atM���vƊ�-��{���|�&j-�O�'�"�%�X�d�u�dR3A`/n�i���ٸ��-�?�!��� to���y�E�+P �B�� ��3z��~l�����-Xr��Eh�y�k���	o�@%�ર��ڗ���WG�`]��CUmzJ)Y�+,�n�k�0��J��}�l��,(��;W4e/������sỻE�'7�׮�>C�J3���������q2�e��Mѧ��~��I �b�Y���u�zd,�Ԉ��=[X�X2jS�;�z|����O�����u���Eز!�֭Y3t,���T�RT��D	kח�+/�E<��K���9T�%bx� z?+\����ڥ���M �G�a�8�5��sŉET���U=r�
Ҍ2"�0B�I�$��Ts-�FP�����rKp�5oƛ�\UGw Q���� ���J|7N���]ǉ}� ��w�6�u��UA|��7
�$� F�i_�v�i�m�TAM/����d)�����Qm���С���`��e$��O�����a�:���~�����V�8��Y1b�3�q�����4��t_�A�>&��v��Dg�Ě55��T��uo	=��b)�:��*
 H0gd�U��,����D==<�< ���6�Ư���p^�7Vk2��V�`�\j���uw�G�ל9s<ݖ:+���%��>���IR H#x�����|��E. xΚ?b��T�I��`��lN�0`HI(.0QNS̯�k����>޿��ӎÖ-6�X}������h��He'���#���h�����.W�O^�����D�D���3TAŤ�Mn�T�[Jm"p�9���Y�5�L�$�ޒ �$v��Ñ�/��9$$@ ��(�d)Cn+�),���'v\T��c0xF�B�@[�G�� 3�NW��Mk�O��׍J��4���_?���uq[am��&&D��#�Qd�+�0L�3��j�-�'�����A��U�j��,�۶��P��BDҫ�����%�Ƕ|��Op
}}%,-lC�- �!�7��ﶥ!��Of3������D�l��6	�*�YS+^z�u^T��7E��+�(�"V�� D�[R�ر�_����Ɵ����c��P���9�Pc��=b��������|,9FFhߟ�:7�03`f��shS�@����~V�O��o��r!Ͳ����w�9)��'=�} \���g7Ϥ�~�$n%�G @����J!��Jǿ�M��][Ć3�o@__c{��!���0���{@g��[[�^��G��?�O��(�.	/���22�3/j��4`'��C��a���Yi�����9BIv2]�]/��"�!H�T�@�:�AЭ|�Ca��&��/:GG�<s
�@b��s ��?`&v����ĵ�{������_�Jai��X��}�$� $ j`���$�F�\�t��LB��c�خ����p�(����uj�"fFFR(�����O�u���o�����w��� ���GhV��lm�@}��z�v��8�$���Q�O����$nm�N�%1�0� $�HSI밇�C��RF������h��Y��۟iR(T�`=���[��c��s�������{���(�曜A��F�s\([�=� �<��s	��wr^�a�L�L�V�U*��f�)��eF9���8.*DsT�z�Z9^3���_���}��]�/3;{�H���!���v��X�����A�s~ �ܽ�j�u"�ǩT�AB1sh~��S ��ݞN@cȷL��5\��I7'!@�Us7;�h�����h��DV�e����U@ Q<���%*y�ڽ��\�ɗ��g���:�byx��ss]�6ր#����?�5���|�-���
�Ѷ�|� �i"*1H�D��@BR�ib������:�ֈό��Ra�~�esL13�Y	��1�P��男|��ۮ}
�;���B,���9Y��Z���6c�9Ӗ�##���p��8�Z<�cGy/�=�%���K��i� !��3�T�vdZ��d��!G�x��9��>�L"���O�Y2��f�RA�+S���[���|�`^4?&��\�PSd
�my�2C�R��0�̡���K�{)��u�������87*u$#�����D�oy�~7LwY�gf%��I���/��w_�V>���v�y0¦M�)�kr�@��z�}5X��T�����ۮ��{��?RzT����*%{�R��)B������K������}F�Lz��!8=�DJ�IJ���Y� "�AP�y�����U���}���m��08��Q��?P^�lh��{��u�Ol����?��;�{�Eq����ůȓ	Y	"��C��\d"&��Fm=OV��)��f�_��"((���_T>����K�^x̅#?���6��t��님���ԛ�Y��������=.p��*zH^v��K�ܤ����8�'�,	��>�רℳ�����D�Xx,�{��O����0��
��? �P"Z]���Χ���̞�;��=h�"g!w�f�0`��=M�e�p�Ą��B�<��y�����h4��%�2&���Ik4��MZ'��d�Ϭ���I��B��*��9߈Z}����/��w�?�Q�̓n����1��9���@@eH/܉:��[p�	a��k��8��}4^E��1*�,�bA'�Q]
6g����¤�ӊK%��L$M�j�&�'�����M�LZ���a��1f�aX�-�ҁA>�r�T%�)J�k��A^��?�M7�q�u��ge��!��Zsy�=�(*~�����"yx�����^�Њ��q�����S�w�oH̲�D>J)DPA!f&�!�H$�A�����`�Y�� cP`1�J�`��<���b�M��G����������~���>�;��z���f��'�E*�]r���ֻz�>�yC�x�ǎ��,���wxoV���(�H"��$�D���I&ѧd2�H�*1��K��L�$�A�}fOd.K�a�VK&�9=d�L. �Yj�Z2�1�؃l�(?�3@�I�)�O5 �L���5�5��q��( )���˳��
�o��H<?+  �QLB(��M��d�w�|M-fl�3����X�Pu�h��B�?����>��%�<[6�رC����s�sJ3�?�JO#c�����[.�?�����x�L��~�b5A� ` ������lj���7�Nr�D030@��!�ցl� �}4�MT��o��I�rjFm�,! �!RU%EQ����Km������x�ǎ�u�Mc�c�6�Aô���\B�%��Jˣ�v����߼iFo��Χ?{��|p�{U|�=�X	�4���|�"��TgFȠ��Ͳ�^��`(ݵO�v%{H2��C�$�D��Q``)E ��,y���:޳�Ϗ�z�nz�����{�qR;�
��1�υz�ج�FWk��#�����` ��C]�mP-�K9��z4 "HQ��P2#�lD��FFp�s�Q�s�
��h�.�e��ɝ"յs��f�!�@?��7L!0�B\�/ՙq��8�,��}�5���s3� ��0o�_��Y7E<SԸg����wZ�}Z�HB�AV��N�l�M�or�����7�1H)R�����V�my�6,]��?�|Fx][G���|��y�10�Y׮o�c`���+`�.���w\q�<��W�5�[��̪��fbA��z}�f�aT�ȏ����Տ�L�f}��X� �i2�@�*exw>C^R��5t~Z�2 	*f�G!���՗^|��O׿��������X@�X���t�Ø�+=�2-tN�{�Lހ.F�a^wC+ά�߁�����n�}5y�D�U���W,�B��R��S#�J(�B0)	��5�J�;� ��dV>A�����)��B�[�R��AK�l_��v}&�\�����WpJ+�e`Soұs��y�Վa��=��N	� ��S������%o�\ͅ�a��㈀B�~�N}eF��ޥ�"X��5�qˬsP)�v�M�/H�5%	"���D�����KFw�?#y�Z4�ܟF�!+���q�b�2��	�);lu���U�h�o��쑲����	�9%s��X�  ̩��5J��� <렒�o�-#Z1�L(�z�B�&."f�8�K���31Y{���R�I��~������XtJ��}
�V���;��N9 Pf��ѵ�q�����/�|�XT����������H�>� +f�����x��o�4N���t�'	���p��>#�^�,c��[����B5��֢1��L�P*�1
�=���W���3��~��}�,�Q�Q��L]������Q��j�@����`�$p?��De|��GEO�ex�2��ő:HEQmĢ��o�qm"ٗ�M
"bĉ����&�W��£�����p7u,�<��Gp��4@��+=����)�=�q�@W�wڧ��9�p�pX҆3�֋�<�V(�S�����z�
"A��'�@ I'�Vٵl=mI�2B�Lrߠ���`E��� `o��[J�R���a*�����4c�O�I�s��L� r�2hH?��8?�\r�v������)��n�����J,#I��ռ6dګn�_#��'=[ �Q2�B>��N���[�Is٨(�z$����R�I�XK�R�u��5���I�/y��=��7�Ӗ3_QC�� ����"���䷤��ˬS�`=��a 1�/U@��W�νt�����
�M��
�"���D��)bD ���͎
4yc�-DhV}&�,�L,\u#-'Ukƨ�I�F��X�X���v[fF��t̾�<�%�K���k7�h��n�����/�@�I�C/*}��-�E�PW�Q�R�u�hYbh�T����>�W�ֱ��P�RG�P���������(� Q� p�Q�13�����8���$�����m$Z(,�G}|tg垯��E� ����1֥�{W���řz7����r�{�ۖ{(l�Fu��Y��濪�ȗr=R �H�oF�`�d6[�
 g��(�V4o�� 9�<���B�H4
�v�ebYMr&��Ɯ��mns/q��{����wn���,�$3琽��@jzɕ��  �4��b���_ z� ��Y�� nT�	�l�<��vo H�JǬ�=�|i���X(	���:��P򏔪��w�5�^�������QY������+G{%��OC�By�3	�*;��}gv��}{T��п�̏W��:�|�Oy��Y�U(U#�O���r�v����6��`  "f�B�]}Ѫ[j{q���?�Up�	���m�����}��p��%Fa���/��z���sn(,�Q�9���hf�.�� � � �����z���V1��±
���$v�����t+MM��~TS��
C���#dI&!U\�j�*N�4QBi��mSU�x����U ��xݹp��q*1v� ��]c���w9���f��7!t����~�D����)�9c�m�5�갮w�Gkؓ�T� &b�3�Ӹ#��>L�� �@��6'�� 7\�V�l����f�# �^nL�:3=��i�q^7c`�5�Ȃ���[���2E�} ����dj����9[4�\��B�῀�l��ibB�5)���ӰeW�rs��	�R`-#��+�M�H)V�U�� (�7>qr��w^_z��shpG�^�*���9�\}f�"�2�+^��=���"n}��z������bQ�Yʣ��%U`""_��3�)�>��Zc�,�P���`�Rp~w�<vOjËk:L�1%�;�"�m&p@�1��O�0*.G�O*}��K���o�����`xL�u�W�o�f��, @�����c�����C��NzP8����@صl���8��<�cƑ
c�*�S�5�@���|�;���nX`���Km��T���N�Jq����0�aTX��.�$��`ddT�Ԧb��!���)'�=b"/�ֶ �Ƃ�	@�.��7\�W�]tL���j�y����r�=���Gʣ{�a�N�fwf&u���9���gf/����l�Y�  l9Z[�Er��� ns�om)FX8r-;1��X�+��A���k���I )L#2�W��Ts���+��ܮM��"�ľv�n��Ҽ�D� Ա|���_*��և.���+~��Z��m��I�QP��R5b�!���T��ZW��,.p�3�O�Y��J}����&�hy���DR~�圩�2�a��$p�H�Y @K˛k�襏/���������3���/0�"
�ĸe4N�Q�@}X��!1���Yc�:�P��t�R���o�	~{Z��S���NƑ�L�M(=�8r��}P�>��1c���;��o���ٰ�ҕ:P_�|\���������~��rA����W�}5���Vg�k ���������#L�|ϩ��R&t X��}���̚4��چ�B08��muތ8�������������E��;Y��!�r�Q�_�:�Z翆ɜ�~v5��sps_��F]� �5�=���Z쁦��n"�db�N���)/�$�2>����*��O[���0	���qH*<5^�v��lǊ�����]|���#�3~��Ƣ������p�Ƕ�ԻBz���~���K���O�x�B�@"��A1Xա٬�9��ym�&��M�槳������u:��B�h�19��*��flO1 $���9F=��#�ֶ�T�+^~��m��A�p�:G˛ ܙ,,���0��o��ۺG�)�V�QV�(��YS�~k��O���E
�_�t2�Ba)���2��)L��}G�p��Č�)I�;�nѻ�}I���,������a��Ө ŏ|��Z{׵�R�K�A��A@�	&��JsCh��.dV +S�Agh�P!��W$����g��#���F�`)�M�GfȺ����dz�����O@Vf���ɥ�،�)t�JRV9���s}��� =��ٴ �Y��A���'')ƘY2!�O
��)PY���2���\��9�z�{��Oj�D�+b��N=�諗���ϯ��;�B�uN�Gg��s`�BYSnN8�p7:c�,#�pC箙�	����S���l;-�_�/��(��3{$i�ŸS��#�ZT7B�)�,͡T�O[�h nKszm�x�Q�ɹ738��!��U-ɇ���z�NZ�]|������8�{�����7s��|�6�gw�}GY��?n�0���Ց�Ȏ�Z+��^�N�Gp��z����'j~0����	�x#"�ZWoy�����w�B��B�Jڔf��]��V�WN��'GS�2��`!���M@C^��5�HA�VЩ�J�촙խ�Y0�6m���(�Xvyd�������솘���$}�C�`H�Wj�' ���!Ӽ���� �ى��ܳ�ț������Ύ�����8kf@Y��N�T���u���1A��� V�$BĴ�c>�ǧO������^��G��v`��ϣ��l��<0�!�<ݗ�O =�>0�.e�xC��E5qÙ��i�W�;���$Ό^���0�C1��#;�ɺhen��i�5� ��#�Ҡ٘$k�4W���lOXm�`��5��L&0Z�_AD1Ǌ�H	�@K�;���9�J����~�vl�(1<�w�Ph�k�B��F�u3�Ĵ�,��2��}���h���u�5���S��l�1�S������?�t����m�u� �d@�t��fǓ�cr8L�+=���r����j1"���ll�����9�5;6�$P
���8���4BG8ՅqfL�y��P�s�94C�^����ٚт�Yg��i)w�ٟ�tF�7���q�Io�M�O�'z�e��9=���hE�}^<Mď0��֝g���P�6�m�<�Nю��q��u��8���S겉�;n=�w�	xS�ǆ��һT�-�@�}� |z'c��������������������a:�E�V���Y)"�ݰ��h��N�0��6^��7)������i?�d�3� x$���QT�0dU,�/ꯕ��G���W�.08XG�N�s� �K������B�)w�-y��m�P�
l��8zK[钫Σ��[U���X�-Pj�X�$3"�8�����	�0��x�p�;�[�Ip\T��Ĵ�4�o� s@�F�X��l�8���M�N��1���̬iX�w� �b���HiˉM���f���43ܙ��W��@4 Xhf5ώd`H���l	ӽ�*B�.2���Yhlq���v�:��]��̰�á�'^B����Fa�O�o����m{�;.l=��K���:��ڨ�M��i�a5DC�K}�ov_}�������6�mb�$�/Ĉ�дq�|���w�:^�39�e4�̞NY�� �V�I�Γ�'����qcaDH��zTcV�(���ֿ���;�xѧ�ĪUu�xJ, ��xv��&�s���g�2Bj������(p,�5kj��W�`�uٕђ�J��(U��@����)��<=o���TCM��8+h�=fAִ���f^-T�f(��7���?���u�+��D�(6�E2�X*�h�q�t�$�i�������X���/�#�&d\Z�Ԏ@Ωt�g0|�IMX���)�5�I���sxÆ~�	[�/�ꯉ�N0��4쬵�q��%V�7���k���5�eJ��jj=��Hy���.��y4�.��'�9���w6ă7�Q��ѳ��� �
�,\f�e��'���1z ��_D7��~W=]?OT�A��/�����!V
ʸV�fx3;I[�6K��j�0��z&1������Ln��B &�؃�k̨��@��^.j�d[�u�9��wx<�
,�0�/> ��	�\�q�����Dm�u��e�hv��W���*�ּ�����^�����Bὑ
�9�U����!+��wǡ&�]r���e:[�f�2�<��0C�l��d@��
���Q,�ь�H-[��_� lyy�I�J�g�� �T"�y�i�B���?�A�O��V=1�	;@�9z�s�4�"����cek:%L	)�1<�A�F�w}��:b��hS�>�H0�k�VQ�^r�-K^|�;��,��CӨ�Px��V�l>I�5b`x�н�1<���Ga���97�����nյ��H�F(0�I����͎�G�3�����%s���صԸ���
m<xF�7�0��V�D`�� ȃR�a}Z�jS��z��]��	��W���a�*:_���0�}af���*�B8��&.�� ̅��Y�c�����VS�n�4���b�׿�����OU*���$l-;����E��d,q��t^�,��d:��"k�
~��]��0�� �P�o��LH�TӳM�T��s�.&��հ�`��2,�ʔ�ZH舄t:7���K��}��i+ڀS����u	`�q��� ̓��(���1����-�;=�w*R��Y�k�s�Tf<C���.Qj�٣����z��</��"Aį���O��㯔�x�v�������#}V��T6nTXx3��2���!F;%V��r,~?��u�[.���(�A�?Aq9�8�BG.y,����n�D���|aK��GI�_㒧{,YNL�V�[��JYӌi� xDLPq`O1�",�GR�B�_��÷������~�#��>�$]r(/�]g�f�`'�^ g;mB���+��~�>Fe��W{( ��}�����<-��J�Q*�`0A��m�d(�	Ys��>t�c���I�(�)�AV} ���
)͔�o��cFl!*e�AqZCi��+��3I��2C) h`g�{aq�>� ���Q�pv'����u�jx��� }�>sk���Q	�3����{`R�U����V;���f�����p4L���o��3� ��P\P3��Ǉ�0Z����^���[Oz*Cul�1�W���(����(8y�߽�ѝh<�tG�~A���N�����+�9艱����d��Y�X�_�$��J)�D�d'tF��\���z�Ȯ�r�o��^����B�,"�Ո`(�*�ɷ���ȑ�.�_{4��`���� x��F����h&k@_���*vS���x�e����r#���)�nZS[��b��N���u ��J�Q�7�a�A3PM�勻��� U\�iF������6k�#9�,4F��w'���*;g�̗�����/�V�������͠�����&��̷�/4c�p���a��A�1: ����) 0��#=xO��+=ODw	��H�I����x�!F��Yr�1��c.
6,�]�?���B������R��T��ni�9�O�:�c
w��㶑}H�9��L���j���l*=5�v�X��֑�M��'?�-�~���^%��Q!� �B Pšn���*e6��%r�ٶS�9%VI#�f�]�,K�qv�DZ����{�B���M>�`�)(!z��.I|�.��=m߰��U�pn�򰟘��c1ɢ����:0�=y��lgD�X��Dy��08X��0/��I�]�>�N�*2cBx���	Ӿ"��4��'�Xcd;��4d�&�3��(wl�
WعOǟ7�Aof�o�'j
��SdQ�&L�������L2�bn-g H��HwA�듦�rH����.�rq��^��&ez3��ˤó��0��Z.���l�_N�  �c������D�A�$�ğ*U3���q�%��3#?�L9n�|0��KgR�Ym6 ��%E����h�`�WT�oz��?�u��3oT��M5l��%6mڻ~N��l��c�tGh{���� _�/N^u��ߎ|L��}����g�h�|� ��B0Y��H�&�>�7Τ�8�˱����s�
n)9=ŭ�.D@w ��H@P��XM�E�Em��.��{_y
F��18X�
 �oἘ���ٳ�J%u{�ǥ<(p�� 1�I<����h񺫟��E��>���t8�� ��	�ڞɄ��ɬ��ӥ�qb:S2o����vt��Yu�A�"�c5�6��v�˖9�Me`�LY�M��Gf*�z�7l�'!8����~a!���,?�^?Β�b43*qh������ )Н��xx"Ɗ>�_�՝ !��0��A6Q��8HCM	ک��	`eY�mʲ!5�$φ@�OS��(R�UwM����w~�s�9������ض�CG���f4S���i�@}�Ԟ�e�����?;�Z���o�ݵ��x�_��	)�,�*L�*	������Ɖ�U��P&kE1a�e�Ω~D&� B���:�	�hn�'*K��l��LBx�( �!�O�q�*�V-*��-^��҇�Ǚg� b�1�ik��ɔ����-��v�O ��A&��z�7��Ht͸iM��=��ŋ������nT����B�R�
)�U!@"`���a$��3��oO�|�S�c`���M=�n��3��8S����rN�����s��ql�'5J��]��p�X��t�����q��a�Ih�T�̍�m��m�	�=kQ�ၔ����o0����ܦ������^��  ~a�h��������һ���\�!��c!�]�0�=kA0�oo6�����c@Q"0U2�
 P�iR�B�N��������7��|<��*~�-1\������_32�ex�p�)�&j.`�OJ�����+��Ȼv�u� ����@B�D]�%� e�v� W� `3�٫ݶt4|{����0�4�h����g��,@$�����UkU���RU*\�,�d��O�1v�B�iMݯ"���7��� �ғ8�&'��tfZ晉�}���~�h��
^����K�Ö^��|*

oRE�NO��!�@�w
�ݑ��@S��D�돜�j w�[,� ��١�\� Oݵ*�/,��y0�WXt��<G	1>.�S.5�����i1)8Q�LK&(e�'ۂ	�H� �U.?�F-˔G H1���(���/�L������h1V���Z�R��଍��Ci�<�q'��cf�;3��%��0b�}b��L�o5���TP���괈�%T��J�j�>���^����9VQ�������k@OO�����o�����>|g᷻E=�XԢ;� A%0
Q�NzU��x͜܊�fYА��\fp 9�e���d��<��B< ����)fZ��wZ��{'���8�C1��:������;t�+�����
9�A˭�0*Ǝ�p�ul�Z.���D��'���Ta\� B�
,AP�ǆ�Ƣj�YIR�_�S3��f�t�0TՄ�g@�&�t7��;|��o~�@e�\�@ͼ[f@�WG�Ϟ7̩�)�������&�n.:�{����f����
�z��ٲ �q��S�0@@��s�x➯N2��8!I>���Դ�r�f����g���7��Ø�9�e~@�a"���sXCV���'�yO��w��@�b<��~<F�k���@3��M����ox��B S���q�߷OY*��9_&k��jx�����~�PF�,���f���޴�]	�=�mg�YS�抢4K?�e~�s2��82��@����!<��q�4 .��.\��֭�Ʊ�@�2dƋ|!@�|�hv���|� �a�C�<���.K��kO��J�U��'!+���$�B!���-U�ԟq���s�n���jGp��$sSca���%��n
@d� �`5.�$�͟K�st�L���sL �Ğ��f��
���^���i���8�&���~��r�ac��2�k��Q�d���(����� ��=O�!>��'Ɗ����c�n����[{g����K��S�	Yd�V#�[%�}��ry0���� ���zb@Jƪ>IQ�������O;s�?Ё�P���HA�ղ��M�:��������*�^�G�}����V��X�����w=��e�!��R2I/`��R��dya�!������&����I��a*B�ƌP��0H���8�ɌY�&-r5#�IN�r��v��TF�ٗ����Z�q�x���m���P�YSP�����> �!�}ސ+���ǥ��� �O% ��e �OD���_s�/:�|���)U(��a}
aP��%��v�'�Η����˶���؁��Y��Dc�UH�S�MG���뫄̥�m��Κ?�f�ׄ�#+U3O0@�T/Yw���� 5�^aR����f	�y�Ӥi[9���%l���"�\g 	e�n3,�qÆ�˛��,�z��3i�L�=_�j�*3�ژ�ONL�諉 �`
�,�K���;1b֝&	��W� �Yz2�S-G6.:��2� fbOna�J�'E�^�Uu�zz��S�w2�e��o����;����)�ܜ��n�˄�e�mϛ���w_���v��}YMW�"�P�A2�k�@H��3�q�d�}��ܴE��FM�hf���Xb�h�qq��4
4A�ZF5��S\(υ�Gk�K�)\|�-��n]�6E%�8
Η��z�"�f��N��v��G%�-ct�bp����O���W)��W$�pz
������Oq�~����2���� ܙ���-�h����F\eLI�̀� �B
�q�h
̄�	Foo�1�w��I��b3��iPj�roJM��� c$AN���Iz ��
uw���]@7�A��� [����X@���#����{+�./m�b`Xb����E �!!x`����{v�6����}���/��Xw��߈���Urs�]�K���G+@pQ��I�q�xO��ԍ���۳���y�`�-"��x��Β@3@�R3��2��9Ku�	twG�T�tG	����c�l�/����^N�h<_@zA���Z�f�"��jK�E�ej�0B����kev.t�bb;��9	ؽ��I�NY�@$
`�yzj��,r��xQ˵O�K�|ꄥ=}E�tS7�[G�v©cc����3w��Ϳ��3^�����N��q�8y$ƺu�8������e�_�rnTh�!��3b"��d��/ ��X��Ď'ڞ��p�t�g��u������OѮ����K���K��H��sL��$�WL�M���	�6Ic``���BR�:�*N�R	�+ ��k�2m�9Qk�	�t���`;�k�� ���X��*��s� ���	S�<���@��a!7ۥ��P���oZ�����R�V���\�Z���/~P��Gۏ������{3��
A,I�q�O&�αC'S9���l��p"9L������<���	d�Y��M��(��a�È	�
D�q^�"_���._~�+C�5�X�GK 1��f�е�I�������팑e���vg�4���Å�[4���]X��V:��a���~�7�:��CVL���e� ���3�d8bCO�*��e�|pZ��Ȯ����R��NE�?	6�ABB��8�3���KE�^�b�.Y�~�%W~oj`��m����b��a��e��0*;g;	g����cg��لw,����z��10b� ��7�O��/E�O���Z����jm��Z�����sڱ���T��'�5�<6!| ��^C
i'���C"1��dd�G�J��NN�Q�(@��M���*��D�D�)�l�g# C{���j$�OJ$�7�W<鑧_-܄l^��4O�VF�'�39��-��p~8uvP5�e�U��:�l���? ��lMkH�1�fU�g�0�_��^ʕ��B W¹���Y��!ym����~h����BH5͐I$p&���ݨ{���6uf����)�rQN��';�`&5��l)��[2��D��O BA��K�z��s]'��;���x�����3���s|X3ם�6��c��1���i���7s<����­������_S _tA��JZ��z��f��.�$����
&��(����h8��7a��I�lJND���H���F��Hňk�� A�*�xy(ũ�I�>�)�?�@�K_?h�F�n���/ct��
u�/�l�l��e0���W��r�!#�g���1-�BH�z����+��y/�-�kPj_��h��a�5ԫ�$� �J,2zYg8Rj5�s�a���$��t����ۜ�6q������e��֯�QI��'E�vI���o���̟�?��[�1��h!)�hQ"!Ҥ7N�X��=c���\f�j��A)Q:'�7 ���,�i6�%QS�T,�(�t&�_4���h:��|� �~?����Ln����0ր~b<A�8����Ρ��Ǽ�B�0�M���qD��	�EÄ�A��7�N��K����� Q����a��|�d7!S=���	�*���Q�NB�P)����W����[&����
�z���z�b�6A�k��MȂ w9����e�����p��A���Kv}i��~�?��S?�E��H�P�q1��ļ+�6���\5��o��P��Q�����yi�\L1��� �0ϴC���Ky!���$� �ms��f_ ��TW�����-���Wn.���ę�vahUhې�00@z#�n�i���٩��	tw3��ܯ��mgt�0�����h��DS/�^Z�
��+��?��UCub�Hx����" p�X���Βz�g�WVѴ*?5�1��4��bf��L����LR6���>���>/ėZ���:zՇú��⶟�t�8Y���h���V���k A��+_W3\�s��3mm���i�rږz,&<!��朋�)�ݬI�=�w
L��*֌�`;)=�G8���k�����fS���y����G�N�9����	��04����,	=�I����8�B� )a�m�JҙR�^p�&}�2�$7��1+�`{*̑���$GɁ�C@�b��&E�E"�o���B����
��������$�󎃽3\7��,(YF�~c��BO	�Ra�X��&N|�[Q��I��"*!�G�]J Ă��׶��Fr퓩�۬  k��� b$8�<3�+m��Uv�+�Ҳ��GC!d���B�Gq��$���_�z�W@� &�v�ױ��{�2W�����/�\�D��ȧ��Ba%�_q�|��Q�Ǔ1�`��𵊪��-' H��\����&i�[s$fzg|#7�3W'}��5#���-v3+79�)� R ���(���,�������/����ζ/
�l�  �۵#�!�63�� �'�=qlL��3��O\ȴl�GX�z�fx����h�P�I)b�-\�۰(`��Bd��S0��(Il�Y��gі���1Ӹ�ڷ������_J�`b&7��,	Y�D���#�����36n�������� �-�%��@y���d��8����ᗎ��l=�o+3�KD�D)�
PZ饁$��	ձ��L�D�O����&��>������F���\Y@v-5q0H�һ����W�)�^���`������S���}}p*a�2�ѷϜ��mJ>{s�, t��Q�9	���/��z�xժ�xg}t�.:^��X���>�8$�c>4Ӡ��L[Y&�u��XM��-�ʨU.��MUU��S��G�A>��yzz�A>����࿘���~#�7L~�H�dr;�_�;��'�h7M�t=�=UĈ��S�Su�@�!��_m�}q{�����(����q轈��e(K��"�Ru:db	�"<��AJM"ݥ6E��?�ڞ�?;�ڽ��w��	G��� 2s���pN�8ݟ"�ۚ( -D�E=����֯^w֣Ա�����qF��.��y�G�ɉI��E0��Q��_��8d�l�#��,6c&�r��p�uQ�Hǧ���,���È H�f��7i�%�:-�ق�oӜy/���@�{� dg:G�è�(����CC���������/��bV*&�I	b�G;)��o�a�\����ŋ3s59O�|iZ�~s�,/�$�.�`届wpU:W��%�=��޲�{��nx(��Î����'XW���nJ>{g�π�&_��!�z���/*���|x�ʾ�]'���R|'yjx%DQ�"f!5�b B+Ԧ��D	LLS�m_%� M��!�uٗ;$�r�6�U4�O
 
�*�tm7�j1�_�$^��v�8�r�
�NAW�<)�4	AS �I��X|RB�b����Q��IɥL�=b!H0��P�X����H�8���e��x� Ts�ipn	�9��Ҍ�O[3��{������*[�Z�Ȏ�=�#�]"���k�/wW~��]7�Oݺ������S(Tӈ����G�4#��υ� d^�N>�G�<�\_��<W51��:��]���n^+�V�><�^�Jj�55v��M:�S�Axfr��}�� 3���I������k<���]�n���rߺ]հB�y/d�A�Hs��fAD�]wfμ�T6�rjF���Tn4+ p���8�k쿺pJlyLH�
�*�Q�X����{�8��wy����`+Wz��!�v�f���2�q��vT1|��9��;;�E<�m���p��%���U���c�TVD ��n�ȴz�J�	���#W�[�K��"1o&�&�X�?�g��e�a�φa��f��2�IH�J�
�c�<��j��<y$Q|�� 	Y�j�d��� � q�DGj�TL�
����Ch 	������8�N�rd��in����\��Si70R�?y��ꗜ-��x��0�5_�wN~m��?���_i�8�S�Ƕl�~�c�Q��m>��	�J�������||�2���
Z /pN�1.S'��� a�����'N4s�;�%��ݹ3'��p�>����ݓ�ԚC���r��42F ��ak��L�B
�F��٣�}E u`(�x��7D*:OŴ��H��b����Oi���㎓^V��+�)��2��7h��~I!xꨖ�v{�Ē��)�D+K�S���>/e�;c��G  +�=L��k�$�:�z�m���ӌ�7�@����I��`�'ެ�[�T^��}Y@X�)��Ж�J��V�r��49k�ք��|�qS�O���آ�ejv44\��|e��@`���5r��11!R�0��Y{���\��
B竂 �c"ID�Z2p02�&2"��&������fp�զ����_��g�lF&z�Ș�^
q� <�>Q?�Q�� �n�l���F����}8t"U���&���샎�m���0�� ���Ce��d��z���`��M4	B����5wm�"&0+�����Ϊ��jT�Ѽ�DkXt��k#<�*<d�����k������~sN> ����� ��,̛��:Tű�pp_0v���u���iZ�*�0V��S�jb��@�Y�G�L�dQ��)����pE�`ŋ���q}J(�n�+�'-=�����Go���*��~	l��4�3�M��zјR�dĶ==!�]Ђe�U}ݺo����<�\*�� �#؋��-��C@�=G���mdt8�J��nc5��9C)�!R6t���p�������ԭލ�&@%7 �$ ���2�zNT:��Bv]�M��2�î"7��#u~ԗ4AC��|���9Y��~�-�ǩ�b"��fۖ��i�>�P�ԯD����0�������"گ%��S��0��н]�2��3 �X��BF�73-�&���k���d��fº?�Adp|V��L�]9MfDn8�!��4�B�of\�æ�&Y�ij~u�Lsk`o�r�4?Z�4��9�)����$�8��c��*�y��Z�>@D'�"T%Yϴg OX�L�e�}s,5'���SM�-�0�V�d�5�9��E�f`ַ�J  4&�,�)���ӧ�E-�]7~?V����
�/���������(�,p��i"bq�'��:�Gy�D%��c+)4
 	�q�})�����#Ё\�d[��!�I�'�D����4]� v��X� ̜7�e�iAZ�'o�n"p3c0��ܻh�����$i�k�g��gZ�F4a�}���S�Y)���9A*)\ ,�G̻��}������~��%n/�b$�vG�7�{Z�8�6��[��`�X .��[���z�j5�
�P>N�Z�'s��ތ '7���r������7���g�Ƶ&d�����4���y|~�sNG%��&�$U?M}�D�F����q�?<�	-���sH��@[��r��*�p��}s����
�q?�Bz`��FlEk6<-��ٕ˙�񸣅5�	dN��Ԝr�8����'X��0�P�6)Tt����ƻ�ol�"X������P�M1v�i�)�����CC������q�5-�qc_�7�ʣ��T�Q�Sx~җ�H)fp�V�i�}ȧ��`�A
�s�-_)+��-C�ݘ� �9�Kgww��?gK
���1v�g��������-����i3�5@�^c�,h0]��GN���.%P����'��Q����]gE���g�܆���~s�w襫��<��uK�Y�?��/�LY�'�V��d��3�ڵ�;�BmB���J��rNض���d����&�W���YJ0 �a��@I���R˖� ����N 8��ܥ��5�#�!oo���w����#$p�`�'����(R���IC��f��+�=�a���Y�5r�Xg�����c��
��$L��/Mj�b"0<f.�8BMŵ��h2��{h�E��q��#L����΃��5L�;�n�7�z\}�����γ�/�'HHO�
H��AZCT�����97���'�U^� r��a�l�]�0L@�v�e���L�9�ְ̟9�.�6��'38m���2���+B��H�[S�\ 2mg^1Y�vlLd�*�2M�I��q�u6?�fOz�bZ��������O���i��ڂ�U�:*C��� �g�5��l�4��ϓ�9�~v��E.�6�A10}j,���,�K�Q�/d���;�P���/�X=�\+��#��br��؎��W�!t.�٢���Ǥh/h�j<�A����Lr�k[�0]���?}�U�>P�e ;A"`"B��8 �̜͖ր��Ncǻ�\�N�D��s�='�@��e�LZ�P/S��@ׁ}f�xR�Qg<^=�vM_۱�?�
��P��3Cl���N��B�2�|a���3F�D\SW.
o��ÿ����/��
)"yRD"��.�*�$�'����e�_�r�G�$YM��q�bB�d��ܿ�j�hM��6\�����&�\�sv�4��ڟa���r��KP�-1�V��J�����sz�eر����"*����I��mתS�SOxA=�1xd�O��>��X�z:j�r6J��N�y��6�C�L PN�[����&���TcJ�����T����>(Q�͸�cެS	� 	"��V�	�K�@�Im� �d���4H��AN9�%���  �\.z ̃�W���{@`x≓��rwKW�M<���/9[H�XA�Mz��P��L���ڕ��xה��_I�Ș��0�����Y�6���"���U�C��a����ڍ���:��ˀ���% (���*F��l��UE��4��o}�[���A>���QǗ	��I���ik�/v���h`�|W����Tg%�,X�t&�0�I3}?�o�h*��^�n_��ґ�1�P�`sU~�)e;�cZ��*�445W�tȺ�fʳ���,S�Ă� +��L� ��/�{�C�O]V����s�M��6l�k����fK�cs�� ` 9@�!��Ȏ�D�;��ɜw�Oڡ� %ND>|O��I�H��h.wi����F�h#��	� p��ӂ�� �<�z�ɛ�0=S�7��ɳ�I*�ͽ
;{�������}4��>/|��0V_#AO2_�BU��w�@��k4�DH$aa���5ǝZ[��j�lL��o'�K���m���`�ղ?3�A0���$MGK�Z�X�7/z��'�o�����6A,8�P�k���Ʒ�8����{�'�=Ǜ�_&�6���v$[�p���&M��UZ�d�.���V3v������M�<K)��5Zˏ��]��]���2)˩�~rb���d��)��d���X����K�J��d��d�.���ƺ�����I��?�����O� ��4���jb���}�9���i��_��q�h�{cp��}�  ��$� �'P݌�f)���q���a�纇�c.�8���.��u1e&!� z�@� �WĴ�@5!������i�ҝ��.Oq�X�q����N� ���l�o�k�4z� @���+��4X^�!a��V'�������D�"t�N�A,�u/���D1<?A�v����9C��9���ٟy<�2nJM���%Q� ��cb5EQ�j��7ڇ���%�<CÌ̓1n�@����T&<�!�k�[[±Ǣ6��K�O�G��	B�OD�u8��R"m�<�w��Ű�l�5�9�RA���2m�j��@d��c���`���>��9'�b�'�t>�|9���Y�h��D!��!�����^��G@l (	���������p�ſ���%
q��ԑo��lW럯��YH� ��+�b�N#����cy��v�9~� a�"A>��W�x@NL�OU'ό�p-��0��'A����s�0��'θK�\�3[�Xh)�V t�������L��σg�U�����)F_E����݉�Rg���U���Y,�� t�$k����$u�l$�)Y�w3�i��DSu2&E8�;<&�n����$�aW��:ŜV0��6�pB*Z���Q,߰hŶ[�G�o�948�-+���f�	pP��[jf�;���a���Kh;���b���.Uj�@ �R�$���,X���b��$�8�Xb#p��@�۲I?���,J4�L(�m�� ��:���؝���0+]�A��n$c��ܪ�r��=&I���v�	�R�h���o+(b]Hg@�������Ă<��)D�����}����6Ő(����P� e6�2�"��?���L����hZ7���~�g�6�f�b�����4��h�Hy�a&�`@y����nr��}����w��# ��	K%+C�~vi���0P]2���ɇ�{n��G�g�[� 5�g�@3|�P"Ȇ��b�V�Q+�����|J��`�1����*Ѻ��TB�c;��DYImU��t�J���G�)g�P.@g�?�d*�1�#,J��Ą�U���vM���:^�ޞ��+%6jcގd��Z6!�#���ĸ{<��@�����Ï�MJ��d�$�y R V�P1A��PK�,�V0��4GҠy�{.��as@P��4�c��	����� E����\}���ـ�=H��a�5h#d\u=�jՠq��2���%��6Qf���҂[�$�$cCV $������}��x�����/10�c9"t̲iO3j���5}�o����8���(�nP`H�4��n�
J'Z�P���������/;�9]�!&!)"���/>g���"n����/q�խxä_v��^� �� ��,��_���M]ȱ8�͘v�U�dS!/������PK�������%�f���h��o dhA��M1�TC�?�������5`�3��ceG�ô���U��L��k̄�!�Ț�\�m�;�!��aF�V�
�) ,F�#��)�v�jk���o��[���x��14c�a�3^\0W@�UalBcFA[�0ax����J< ��o����J|��5�k�"V[I��'4H2ș�LM��)�9'�"�͠DB0���]0�d�db6e��$��v�iW����}�t4������ܐ��5���L�-�΂ɼ/�b�`��$�����H������1:u�����O��O���[0���Al5��e�ڿ�fk��e���|L��#�pz�pe�K��N1�ʆ�4�1����T�3S�(`g���}$<At���h+Eww���GUE��ڡ"��>�}ǵQ�`��x /q�P�D� �>��-Ww��Fɕl�KCw�	�@���eF3r��uh�L::*�s�fZ�z�UaG�P�x};�����1MRx`���CL	|N��r�9���L|J�7��ծZM3rG9�Ǭv
�%����xF�g� A� B)��iU�??�
o�������w�����qb� 0rC7af P��MZN8!�X%����=o"�v�5ގ��br��RqM��NάC69u�L#d��/D�d$@H�^�o���RN꿭�hF�v�����ph〗&r��+�\�/��YƜgʔ3"��	����֩�}G'N�D�$���G��1�A0+ff��'V�h�~}ˎ�FW^�#��#�� [�� ��)�?��5����~�����Q2�yk)k�1�J��t b��a0��u�/�I�R�����b�FGQ�DPl�θ������o�q�w��ɳI���Q"!�4����\�رD��4k�g�<�a	`~��\u@��+=��&\lў֚�y��O� c�@�
b��`�o�����y�# <@�D��c�]y��_�9�0��=a=��Ed��M�=�\l�� ��
��:��Q��
�S�w��N7^��%(�#l�0�*6m��g_| 6!��`ن$*to���k��a�vӥ�Z���n��8��{��LBJ0�@;�E���m�[���8�Ц�k���DM��q��E�F��G�DJ����Vr$n�@�Rm���u���~3�!V�*�Y�"������t�䍗>���":GD�oh6;��!tܾ_����a�4M�<N��5��L�Ĺ���0�bIJUc�wa���cڧ�'?tw3��C���1֯/a �GKKW@�$��$I*)5JC��Q��4�����Dl�@ z��͘x�4��o�9�`�~г ����r�E�'��0���	!V���:��]��D�'�6&1A�|3����/d�a�˘��HG�G:R��y�1�NC�aNx�!#��5[cH�����_@�H@8 ��(<�wO��>:v����l�N���K�h�{����o�I�RaT��?��,�ڵ��Cڞ�Ʒ]�]Sg���7���|0$�����t�����B�8��o���@F36͙6�틆ԭd� 8SFz�[��k�a��5. 4u0��,���G�����u��Ԋę�%����:�lqZO(b�I_0&QW�DO���?�a�sC##1 �2��|��f��w��.p_7��{���0�z��b�����oIP�̐�>G�G����2�#��fIh���`��X��	0���{��==��[�?��;}l�N��knqt� mқ�$�l"IN��aI���֖	b�h�&}���W��F�׹��g+����0x���k���&���=�eL�ww�c7�%���?J�\+��B�mL�g"A��$�gGY���4A�;T�4�k�A�k��;il�{�~�T��A�uC��L��!�r+@�cP5A�WS�Ӣ��v|��}�'>���:��)l�v��+h�� m2��?Q��P�q��wx��?�vM^"��)=E$=(�zkRTL��X�~kq�2�
W'1O�f@�Lo`�d�%�,�pA6�R�j��rϜ���6� 0�iM4�t�~O��K�k� ���/$IH��"�ꗫ*��_{���݄{Fctw/�C��츅01B��ӏ>�ҳ�gJf/�N���7C�9�Owr�m���1ga��#�pOF��h3�)����.x_�b��aӂ{����#,[���臗�?�k��넔����!(m*ngPg����E���%F���g ��P��`27��� ohFeƃ��q�:ꨕŃ<���N |?+�6�"�(�	P�f���L���d�F��'�ƹ�c�I8#���
��k��y�\�`bV�CQbs0 C� ��*V �R��E�������\q�	�
[n�0t��@`/&yW�gܙ0��@��� ���bl��M�?:���{_iyj�]41}��b�#"	� t�D�VΕ��o˦#�Hд�,�3�+�)/��)N {��M���?�N� �Q�s�7x1I�}��
E�	+���%	1��<OBa�����l���S��/�
�B/.H�+FǕc����aǩ#��_��S�<���18��a�r�����29!	�I;�ٍ���(�ǜ��-l�,���I!D"S9��<)��^����ڪ�+�Ü������1z�֟���Ѩ��5"��%D��A�M��K(��X%��+��d˂';@�B�4 h��3p�=��Kj���&���S?|vX��Jikm|�m�JS8���p?�D�����QϦ�u�x-s���ph���d>sv+8��Lw�ғxvk~H�k�9]��(��m�:!A,�9��J���e�鉯/9��r�;�Bl����^��B;ʴ�{�ޡ�my��N���-����S�ص�]���RVYʀ�p�����ʌ�x��V�V �Υ ���f��q��k�&��9��ټ�n_g Z�gF[p�T�Ft�[��n�vқ�f3LF���y��2e�ܶ 6�"3�Y�G�:�KLGg�Lk��/�+ tv�@oljn�w=���FF##@+�gF�h����_r���'§�� �H��BFXҖ3݆fn����v�l��dz̶o(�̊��n_�A�B�Up��
��k���b	fܾU���P�_v�?˰v���1|D��C�̤A�"����ְА��n����s�g2�����t_nZ��f*���@��@�%�Ep���[V +V��O�ӎɒwK���	)?K�QV@����5�Ӛ�w�^���37�zs"��k�q��������74�^��@3T$T|t4]:Y�q����}��K]�É)qG�f���5s��0ۿ���JO�- ��t�����M=Q?]L����H
ɒ<f�AۄAF��`�����{��8V�`/X�T�:��S����~�v��a�O�C��8���}Gn8� ��R1$8~�k���T�J}�����������#TvrF�wi.�y��ן����� +��j@�[o����H�)�y�ȶ����S;JA�+���J�3�m�f��0�0@}����8�0�q�=����)#����$�)F}��
�GU��Y�z�$��2���p�C���^)$=I�t��D���J4#AD�l���-��C$�t�����z��vf�=g�̡\gM��TH�n-����8|h�ݢ��"E� mN�� ����Md��&��q�C����C�!#�fzA��V�If���M����J\/�0�����/��7�/��s�>��Q*������ʞ���F�aƎa©
��0z�D�� �����o~�9��v:j���v	/��Niil�t�je�M�k}I�A�1 �0krR=;��yF;����`��TӲ��VK�C?MU�������%H����(a嗱
1�D��$h��*��m<���=��~�շz@��X��Q���������ق� ��V�Ҩ��v��/׎?���C�|���z����O"�^�G{�ޮNB_�!}ye����@���ϔ���s�����gX�S�U;ȁ�`�>Y���I��v����o�10@ػy4<��]�����b���x�� Tg�?!!A1{PJ*����Q������J+ ]�����-����=��ڠ���}e�)9P3��`�;��!�b���W_~z����j����1��A�)���Ht�tW��~{QF�H>��S��Eh�1�l����43��X�	�D���:����p���v~�黦�:�m��ÈP���ڨ�g��dm$���]=�ǻ#t�i��rY�W�����0U[C$~FR
�`V`�S��Y!]�t�����T�V�B{���J�q��-loJ���D�2���Xh��g~#� Ҁ�q8I�R)�a�R�|OHz���#������W_4�ի} Ђ���P� z��&̜ ƺ	
����`���~�G����� 9����ܪF�#[��+C�2	H��< ���"`��1��3�llBd8<�`���&8Ab	<�ؙ1�e�E�X#[#���U��w�[�������uw-��nU�s�w�=�'���υc��#����eQJ�E�*�o�5���Q�?+
�(�6J-]���Z�>��!�G�(�_G__	';�){{����r��!�3�,:'��?��o�ri��M�y%��BrHjʭJ�%4��= �D`v��O�ʟ'�"p�e+���00*��l-���������Âĕ��sCG�j p�ر A�pz��`gO�l�f��hdI��CJ;H\�$�$�ץ]%��R���L���{���_4�T��wC��[<LW��F��jHr�h�ģ�o �Th�'�~D������[E��D����6� ftl��R�|���z�x�F��#�]���|���m���{^�P#�������<_�Y[0��j9ڈ1��`@��A��E;��%�<�E��1
>���1z����I�Z�~߅ty|�~NFG	����]]�����bw���_��<2v˧A�3 �Ȥk�5�=�h77H��(��
��m�Շ���L��5q+q�bW1�7����B��]�\�.
���se,vI� [|lߞ)���h���>D�F��m,YQ�!���dF��<�v 3p��[h2��0�(e]��/S�=������& �=��k�G�~�[^(��,o��3A2�0��IN�s�'Û����6�QLN�j��-����z#h ����p�		���� 8��g��42������0n����Q�!LӜi�4�M�zQw����6�wf��ꮎ����d�J��!�2>�<��2����v0;쇣x���b���(��Y�X!�I���p8!��"F�N�T'd�y�m��S�mf��^	A��P!�	R� �L��\*^~��C!λ�CC�ۃ�~�-s��Yb��0����i�ƾ�ܹ��_t�[���5����� bd�3HZd*b��8���!LZe � $�2N�3�c�=;-R|�G%������ǀ!F3��`  ��6�����\���+��e�m`K0 #���$�UP⦋����ֈl�,U�ARJ�J�!0�~&�
��� � �|[�zG��/f���H�AmL, 8��- �I�%'�n��!=��%���O�@J}e���Bu�����?��gb�Y�������g�������������%$��чi��Am��ɖ2r .��c��w���F11�Wb��%!iJ���C�6����{U�{�B���b^G>�#)E��b�z6T�i��ў&tZ�� �L��P3�����}W܉;2@�ú����,�i��,5E�6�����I��3��3?up��<U|$�ٓ!����.ӵ.<d���:�0e����/��k�|�&��*����'9 $� e 9$i�� �|��;vx�;@ag���-e���~-S.�r��I�Y�@�e�  X�b�3�c bFK�7K� ��LN|.TS�w�g��&>�Si¹|vr߷G&�M;
�"��HH��0t�:�`@�F}ǖ `,K�,a�iFY�Y�һd�1�Y�1���`�7(��q�L\n��!s0擹^�oZ��7�n��Ik1�_�B<r��`��"а�0!tL�y? �L�	p�um(�Pw�m��_̔.�����H���P��o"v;Ťq�}��߯rF���' ��Z��Mr���fq�m3���WuKMmUu���O����%٣�9�T�~�!_dE)�ϛ,������K�}�}��6��E���oU��
�?kߝ�iH������C�c�y��fr߁
G��N��(�X0�%{3d�:J�Xh��u�q���-��G5+�_4faGa�7| ��z��nZ⏥�t@e�7L<�;|�>���}�\�7�؄� �r�~X�}�.f�$�ϓ��v���%H.Ax>��@8=}? �����f���&`��ZX�78�
�v�1�q�ym�����]m��
OЧtPx^�����U r��r��� ��~D��[lS�Gf �O�&0�����W�;����%�6/~�����z�;~�����"J�	��Ug=�&�zF�U�8$pS�}��F���.n�ʥO��%?��0�X"�!6�I��dU�����1�L"*�ꢚz�v����Nf��fǈ��K�<�/13��!(�e��ƨX�g&|�+?v��&���!\~M��������<oc�o�3��}L�������?����<<z-&��!(��fY"�d�\���  ���iW��%�S�P�Z	'���&Z�dz�M`���99@���ƌ��L�w�3�-�Ї$ff�l�e�ݾ^F_/��#���$����[Ʈ-����'��]3�X�'K�%����@��G&��c������ �R .�e-E�	X�
�"c.����28ȸ�{%��a�ym���~!ŧ��A�� "!���!A��f��x��@�c�a�<���Y�A����I6׷�.�3v_�h��B�F Xj���]Đm@(9,�擩X�^~���<��+ֽ�����":U�}]��㜢�J@,�+�cnj�~��W߽�������$�B����%���B�:�����k�[BW�U��u;5�]AO�Tl�3�%���cG'�[:�l�1!�+�(r�d־�L&��ES���>6}U���{��.�˯��� n!נ�������uu	�>֭������e�{�}6���g�O�4�	Y�ߊ_	)MF��X��9:a�9�QV":��h�H�a�����56+�Mq�o�����o�U>����Β7z?n�9���ډ~��wry=��z�e!���t������ᕋ�xax������N�b�?	�ϸ�"
/�����:�I$�~M�b* i�\���}�XJ� ���e�2��|��>L\q�-_�w	�/1�q� $K�MG�+�.�l����dp�����uw #k�ơۧhm�&7qTv*� C�INS���3�����C�~ݳ��|`w���� �}]B�`ւbh��6�8EPma�+���p�W^�����¾wݖ92�nQƧ�1�Y� e�4肿ɹ_l�����O����t��u��lQr�DF)`�$� ���&H��cF�_�3�������#�^X��g�X��2������L� �n���n��/�l��h��.z[q�������8#�p
�`Θ*��n���	x��rh�]�W��malؠ���Kr�5�?�ޞj�������&�l��P�ʟ���J��
��/�	���_K	�X ��Z	������P}ߏ2�S�(]����WG��|�ڛ�����i�d>��X.@B\-�`.�%��&�?W���~����}��C��:�|/eA�����Pw���u�H<;��"� G���������� �іlO�A �C3�	��Z
�<OL��ڳ_{����0�_Bg7㑟{�eҸ�x~�ô"0���5�O�Iw���7�s�⦛ڋ׼���7S�J�J��	���
vP5&�)C�D�H���n�1�#34sC�G�]����{�m��>��Gm�>JA�LR�m�f62䉌(�����o���o����K�$���C�C�N��&N�	B���}]�F ��W:��u����pb��TϢ�<łC���P��;?�w�;�|ٛ�X��I��T�u�@ z.�QQ���I�	�b�;ʣ���B�r�g��~c��������tA_���g��Ck˸�.�B�������^���]~�����l�"�S���n_�0'�uȈՇ�T jY��`67e<({7��z�����k&��|lb߿|�˸�ND����u:؇�TqCP�f�Q���
-�L�x�0�1�_2
\2V��#��c�jc�F� IgX��E��$Iy6��wܱ����pk�6`�mEt�J<�cZ��	��VB�g!�����NL�?z�M4=��bj��"���3�� �L��=E})Ov�p%`��h�����q{Q)j�KDD��$>bbF�ˀx��7�t����\�����n?>���(���i��ti�����.���ۮ/�G}A�������bpa1�Q@Σ���	�%�*l�8��7,�Y��@uԫS0�J��j!��ø��_N�A�bN,M�@P6�0��rf�(�XZ��A��������mS�J@���p��!����B��P���, ���*�͒�oil��E0�V&� 4�&-�^�"���;wL��m�|^��������}'7p�|��E# �K-�T�11�0L�T:����2��Ȃ�ɍ�or��v����v&�A�m^�����u���8�eW>	߿���}!n��kW�������>G8��8�zюwf�O^��������h��S"��!�)`�Љ}�uJ���r�V��N�����.����a��Ze�hJ�>~(�C������Q>�'�
>~ŏ�cGW~j-�� 8���N&� t?e��P5Ʀ�\�MC9����eWnZ����D�7p _ɡ�0� �*� d�/�(�TD}�'���[�c� ��E�u=�W:�Xe<��T +���d<��!��Z\}�Q�����Q*Ы����w�Q < Ţ���\��aeu+�I��F�"��;T~��_���}7߃��>fz� �V��<_���1O8ӊS7MHřP�r�g��[��^�lk�v��	��J��H��`J�Q
��b�3��L�����l��c�F5����􀢹4�Y�C��6�6	[�q`�͟\7����z�?�c�y3�(�}�{m�D$0B�� KH�4�P��B0<�̓t��N�WQ��W����
����a�U�@2_d	t�+����'������4>����N�f�����'%�MZgy����o������`���zN>�[���?�C�|�gf>Da��L�A�[C��.���I�T�\������}m؃�"x�T�i�qC8J�����[������=���җ���k
;�ز�l��53/jziV�}��@�^x"J*f$Q��X���K�ھՖ���:XI
�l���e���A.�8^O����+�O<�/֎�y���}��r��
!�: Hd=����,!a���`0�p|�1C<A�Ǭ��.rg��)�N�i�śc�)�iV��.��v��q
���+�љ�������÷��ݻ�`_��>d���� r��aP�8mjW��Z
k���͝��9��x�(��Yr���AxY0{�fK"!�Cb"��]�/1��6@0���r`�e\S)�%L�if�lF���!f����z���n��s
;� 8���cJ���f��V v�@3W���Bv�IW���x�e����_�u�g~�p|�3(o$���X�!�Y0$��P�TP)���{�̔��7�D�q�0�a�J��Sa�\[.G���5�Kf�V�O�\i�Ƿ5�����f�BK?��7��	'��%���sT�o6�+:5��I��ܴ�-��y#I��4��ħ�o	PK�u_�^ ��ֽ3�ݽ=;|������������3�E�t.��B)�)p��&-LȨ�9B�a�X�*����C%A�6�|Q3z��z5m��0n	�DCj��Q�@�3�p�d.��"���B|0|x�Yk�������[y��2z�g��[�+��!�H�0 iq�jp��o(�ݼm}/�V�k���'��싗��?@6�$��������;�Ԝ�xĿ1!���حL31��+d���d $!�ؤb {$���R�����X�+M�|��_ �PX����?���Qu���'���u�n�b�����T��}���b�On~Ca���zU�#oD����1�O�z !3$����\�4R����"�2�e�w�UҐ����NOLBr�%�\������z�y�����=WWR&�Aq�/�?8���<��38p D����o�0��,�����ծ'my=�V�0W$�E���V$l/a�gK��~����޿���o���?�E��� 
��z� ��d�B� Ό0�.W��H���KNH  O�IDAT���,K��fGN��d�%�D|�����Y >S8ERfx�K���uOy���q�_��c�# [�z�˭����u�������~j�@. ��Y\����k�: p��/x�mG�=����E,�υ�r싍,�Je�H�5I��hdǭ�J�jvD8V!+z����j»�wK�	!t0���#���#c?n�� ��3L
�������Z�k�Q��o6U��8̠밇N0n,ӯ��Ϲ�9���Y,�V���c��Eb�!U�@D�Ȓ�҉(�\�Ǆ`�#��q�->��2 y}�l�z�1�� �eJ/� u�d��Uv)��;#3 %2٬(x2(�|�ʟ�pS;��[Ɓ��g�A�������_J�!�z�t=�����r��K�ep�i�@,�0#wA��>�o���O�?�D�E��?!�OG����2<m�W��R61hD�(���C�p��l�
I}���@� �i�#��b�u��=|�o�~�Y���'��^ ����K����*��$0ئ?���X��<cK?�gg�����3�S�*{�Ǟ��:ϑ?��͂����@%��P��`x_��Z��8������)�G��,Rΐ�� ��A*���>��x�G ��6�{ ���Zv�D�����kO*N�b$G�=�@�������>�
�.�e�\.�&��e"���|>���HJ���.% ,� �,�e%�A�z����q��5�8���*���z�),@~��}���NN8����Q�)�#]}�h��` ��f�����$%C���z���}W~�B��Ctw7��w>�� u¬�����n��R �u-!?G,��X�>0/�[\ȍp� ��ؕE�l�Bw�m��ȫ���,���k �A�cSGؾ�) �* �g��������6�� p앍R����@D0��,���5��^�����񝣷��oA��|^�p�D��7��A��3�ސA����-���E 8��|��7��S���,��l)�;�8C�����:�y>�Cbbe�3 it5R]B�o"	@����#�~x�o9,��O��0)7��9��k& 7�Ԏ��F�!�4���w��l���А�P	t��g���7��3o!m S�����$�"��E�"���qc�ɝU<��?
>f����C�l_�3k( U�3�T���J������3n��bD�|dD�r�\&C�g� غ� Y�޸��	�q��R�����gK��_=뿙�?�ŧ﹂�U
�t��L�KC�c��:h) +���~����E���N��6�UJ���A�xY(Cü�Ԍ���Go��wm�G�@��'��O���~�J9NO��8F��I�rި����FQ �"�������Қ��;�ܴ�����ւ���%:k�y�������1�po/���ɠ{���-3x�Kpʩ���W�NæMg中}�G��2(�����]�@C�`� �o��J�4	�8��C`y���������}O��{�g��� �s����6�M0�?�l����MH���(\���\��}�������l#Yb"1��v&)@B
�*�5Gr|J�����,�ʀ��^p0���-޼�֠cK� �C
N�ҫNNy�7B!^��V  @Ư�~(cR��� �fk<?�;6�om��I�>>��.�@44�e>Bߠ��Pe�\x�b �U�-��Vi�.o(i����8�.�C�8��[�N�5{�%$���!�CP��J�x2A���w9����e�hAe�:'	�j�.�Ѡ��Y�7���� ��$D3�'�k�/�#���֮��џ�ï ��� 6��u�k�K�-tc�ہ���O���6��`M;a��3@ >�k�y���g�����<>��n�v��P�NI����<�1{a"�e)��q����~X惣�6���c=��{�Yt>��=R`�02Vƶ���d�h����� `t��S�''�P.�/��<N2��6Gs�?
N0�"�[���� �B�� ��`���=�څ�����7U2 �a6r�*
��o�D/Dq����Ҫ�ѿ0�r<���KB0I�9[{�t�<���?���K�V�����Ҭ��(�����Zۥ!�6���Jz����n�n�c%�/�<�կ���8���" �΍�LLd(H�_M�W%e�o��+����Fı�1� �6�|s�jܷZ�$6�JA�L ����0S@$f�����P��2�u�3�}��׮C>��oDcJ@=�P�s��|?p���Y������k�2&����w[D1�lF3���2���::�l���訴��1,��bV?�iݳ��|�q9��A�,�d�΂��X���eE�W( � ��9Ϣ*���*3�`�e��>^W��]8'߁��؅9���(EpU�0 ��'G�1����32��,%�H�B���L_Y��U����O-��L�s
���\��̢��
z���@��X��-�zZi��IL$6�e f	����j*^4Oٺ`-��Ҏ��@	~?��V����#�(Z�p�<�%�SJ���V D���g��^���X����wi.���} 8�vY3.`�
�k�����x.�-[X��<������ �=Mo�8��[b�4c�����ab�q�Q`M'c�c���臉IN�u1�v�"�c��%01A�U��|�_n��⫸~@�qdy�I2�ڬi�P!'eX&��:b��d���9�1jݬsx�P�^�{��o�w��;���E����*fF@����J.-�:�}�́/^@��"#R ��2W��m
��>���/W�?r��(��<Pj8�h��?�66b�Wۯ@����cm`5� 7@��M�/#�񣗭=<�/��z���'ۿ=�|!H<� �ĐL�I$��;������%3�/�ׯ�$��Y����|.��0�JG�`kY�`)ۙ�D<I%�Ȁ/�2|�q��ﳯ�o�s��8s�U��a�b���U�k�B4�lP��{	m'�8w�|@Uq3뇇	ݯc�"%�q�Ɍ��]ۀm���=�1�g"���vC�nT�W�N^�z����)q��`k��/����c�˙�"
%��� �����R��w��(~iʤ���Ŧ�s\���5� �+����f{���%}��r�2Dt�l>�¹u�`!$1��«���n\w]?�R��&�oӧ�-��oV;�Ij	�X�� g�"�]��
��~��?�������]{��*��!	�K"�)�L��j�9�+3Ũ�X�[6S��(m�z�/��d3���F�ЯhE���NÊF��㰔�,��,O�d�9��Ԏ�C���<ԃ<�����fL8���)P��wcR�}���H!��v��ow޻]@�0#��aF����ʷ�P�0�W�}��BY��ꃑa`��?��z�{�]�������Tp���D�b�Z<c��)�g�&W�m��%�R��Y�D ��BE��Z�d�^���<K�VީM���h��a���;M&���y�Og��t!�|�H�o�9���G��k
�x�a������J�6�Tl�l���2�mZ��V)�v�
�d�a��ֆ�'g��K�s[;K��_/%���3U*U��3���}v~v�{ĦZ�F�*�Nz7���BA1�n�
v�m�@W�S�8�0�$��D(R�	��m��~{�g��o�� =ۅe�����I}�k0��S�֙�`��iw��^Wxƅ�O���L�S3��P
��e;�=��; ��H!M�fؠR��ԾZ���C�H�i&����0H
!��^������c.�����׿����2~�I7�����eYJ���v ��1��@��n����'?r���^X��-�9�Yٴ?%>ݓH�ot_TY�B�f�Q���$W��wa�^�E�J8���O������*��wˍ$�ۀ��h$<���=� �ƮX�[��jQ�(ӽ��8F�s�/il�}�,8���z ܽ��b��D��	kg
	��T,�npd����]w��P�_}����]�KTIc�t#º��Okw1��1n��C�N�����^|��]�3Gg��əW"f�x
�k�X%�g�%&8�϶���}q�I�0ySYB�F��SlW�a�ڠv�X"�*���ps�k��WS�COI�}�� ԧOO��I��<O�����ĕ���n\~y�{g�Zٯ.(�W���K�37��
�-G�uiX�c��a5+ �^�4IUo�e��(�> �7���O�޼�!���7���_~�s�7IpA��Q>Z�I��*8���86��&�a��f�m�A��K���Ǎ��oeE#�xؒF$	,I�ec#E ��f�FO�$�����T�k���?��^Ӂ;w8�,��0ad���6���Yl74ıϥ�.``�sߖ9rCi|�<3��9��s��tdI�5J���k��F0z?jȖ�2�����%#�5>t6�. *��<�� U KxOff�G��rpۺ���K}��_Ӂ��@���eNֿQX�]�J}����}:'Suy��:+x,_|�f�Q��+n6A��U�k��u�㏟6�3����9����}�������Ǆ)� $IfvF-%�]E�⭫������K7 ��V�VTj#H������ ����>��r�'����#��N<�3N��.?��s%�z=͛	��(�B|P����|��#9�y�G}6��=�9o9���7é�k),O�) ��L��y�i#T�A�ܩX�De ���bR ��A=Æ���@ ?�$6.��.HS�A������������I~��O\� ����?�4�H�h��Bt.��_�d]��& �G���W฾88�g$5ŹPR���r�~��S���(�|�����Uw����:��e!�7t*AO��@�w����o�&��hڀn�N�W*�t��d��=��b,���ky��;~Q��������w}�(/�ՙ�L���?4��	1�|�s�HN1"w��k~�2S�JG��#d����"��C:~~uL�h[�@�[�u�����b�eH=&�:	s�et����!VS.�� � ��B�*E�D��LF�i*��>1v��kz�+n�@�iE�͓�w���,��?�12y^��F��j�B)h1 
IZ������L ����3�|^���������ٶ�£_0!d���r������%��W��0y��G�uƌ-��K گ�#0e�,�,�^236q����7���g�g��j�ZhTYHcҦ"V���sp��Z���l�m���7��+}.����@���K���z��K�� v����/��|�������	�ʜ�
h����� "dI�� ����0�*��Ù��ލ�G/�8g�(���,:���:���o��[�)Xx�*�3�����-�>,S!�$p���|Oǖ�2 �]�w[=��D}y��i�ӹ^V�Ft�2��!$)k�XbQ0Yϩ!  fNL���S!`z�G��z_ `�๊�1��[��4ո�M�����H�o�[��������� .�7���|"���OSB&�	���r��w�$�\�S�wNep	����vP&���U?�`� 9���c��w����II8��^L�s߲LP)��\���3��~�?��.m��>����BrG5�{����V��}�'�v��f^���4�4u!�� �T�?k����YUd��>�xU�jH�ҷ�Pm<MCK�/ Z@���T0^��u��Fػ���8�M��?)��絍v�>r�-W��/`�_�pn�PH;�����붨Kl�3r�#���Z�:���f���Wp3:l��_�!���dcwZ	�A��$�,yPl
Ǌ�><�o]������}����B�fL3�7+!�����MC����ڥ���{��š���ɏ����E]��S��5(zb_8�:����p��^-6��  
�Z�L�)j���9�u��5�R�^.��í��a�S�`!����L��=a�?�������B;�-�����~>X����1j���?�c����'���ն_ƨ��3J� c��J�8�����w��D��	�	&>!� $K
M=w��AtJ]
g}T1��KVs�%��c(���P�(&��9�lF�F�9�9�2�>�,�T~Fy��/�����~�/�����%�!�]��L���i���%�]@.���n?�	G>]��6�J[�PV1w��`a�3�+�c����z!�*�r� ��I灓�H*��X��U�R����r�c=�7a1'�8V[WO������J�� ��]������;q�wd0��ԨI�����]�\(�}__���1����ؼ<�R �������x�%l��m߾����o����k���K�i��E�*�� 3Ǚ##ݱ�q����UWD����i6�R4���*��� �B#:�wX���A�9ꖵ&0�2�,{r|�������?����o�6�~�$��*#@�D8W�>�MC*�H�0z��ʜ�v�wy��CGn'�/\�p�%f� ��J@�v����Ă����^)�#W���54�ǒe��b�A�*n�(g�%�+B�cP{�Y n�{#L �"J�1BD��0&��fʼ�{��?�����wf0���} �;ǿ�K�������Ըu>[+��~�]X�r�ق�V�7+�?�<��P_i��_qb�����%K~2$<ÿ�#����!#��F�����h����a]o�[PQຈ�W@Zc�Zw�m�t�����p��(�Ib0�䉬b��5�O���?�0�[o��y>cdE����������7�X�.�|��,1�O��\@,�`Yb"�H�	e��M����]���Hd T�QI{۞���	m](JR����I�g�N�� ?��!��u��~�.��K��EڽL��¶m�����p��m�yfr�[[��	�x[;��`o�B���|��S�o�p��P��A���b�?Ȼ!1� �\�����>S|Zx�]��i/��HPE� Nߎϖ�}뿏r�&O��[@O�������	f��r`����&���iu&� 1�ǒ�"�J����c�?������Cl듸u��H.n�ײ��PJ�@�۾W���q�G&�*���@2 ���j���xq��_�w��н,�?'9�n�ă(�'R'm��e8��<&Fl��&a� $�%�o_�!��]$��F9 شI������={`�',��|������}G���w)���@=��/�
�}q`���/W8V�ź<�B�56c@ [	=�����3_}B��(�����d�!3Dz�g��l��O��F`�;	`�7�_bU�`�k�IcR�-#�3���d�6��% ��r)I�B�ߓ������\�ţ?��(���`� C���F�4����u)�� �z���t5OO]AO@�����} ��q���������T���ʋ!"s����L؊�\�T"ᷱ� �x��oo��B;{˱Y ��}W	�����)7�b(�	���oK0t,>�x��+TP��������J��ǹ����4�BR�I<��L�+7��
6�/��k+�Bxz7:��������ł�
�����@	9��Ĕ��ALVa��H�|&�,E��'t~䥧��?����}6�C��w׏�^(W�Q:vAؠ?#�;����'��'�<z��>�_Md9�2	)*r��n��������i�!��i�qc]���pl̏��A�lT<� �*i�m3-�	�Q���z�7���"_�"U�굄{�Ss9�|x��}�0�@b�n(�ү��X������%�2xW5VP�VS zY�=0����gH/�e�W�� �@�*. c�;H����o��)6�#�ʍ:���ɖv�3L��������'f꣮F���H��1��Б�o;�k�p����lJ�9�,�ک������0~�p��!�`���*]L��)$?aȌP*�Kƥ���ͬ��"�m>�j�%z7iPt��%�B<t.]�)�N�}��*f 3�2 ��q׿i��{���cǎ  T� @� �=���a��ڝ�`f?� ���aq�R � ����*x�{	( �3���G~���$�6��U�y#L~�d�`�b	S̝[ *�B����Ǒ�1�L=d��,��S庤"�c׈�!8��ː�L��\��跞p�m�>a�Nǉ�"�a�<tu��S���a߹�?������+�닝����ug_�F����<Q��§�� ���M���8�Fjl�����j��fI�A+��-��]����}f�F({Y�,f2����#@��=�l����OF�T�L�P1�A���Fl��=o��0����pQݳ��9_4��hu�����a�7:��/ ��g7�����;e�/%p�,1 ��#���I��� ����i�ӑDB;� #B�¤�@�yl(���I\A���͉3K0&&�#�@� ݍ�u��ִ}��������hEi���&�}]��3Ge��r-����&�~��n�����������I3�'ϗA�G���I:9���,ӫ����"Z��Ћ��i�{0��"�_�8��'u� u_(چ����X�,�2�R��x_h;��ۃw|u/��c�6��$��YV�گ6M�	�lݾt��B��&\���2D��T��5�K䱉��/7<�M'�c�Px	�D,g � �Q�\Z�0d|�	�3�iR0�#@������
@,���hT)D�4���V"f��&�D�>����m�]ޚ�?�8~�����'��O� ��4�?]�'Ì�=���*Ohz��p�ac��)�� �r!����1_8�����+��{|B^����-�j$��P���[��:��#�K�ɼh�f�X0'۞��:`��F}3�@�v P��l4T�a��O����k:�o��c�V�D짢�_�!��r]5�W`�B������<�$�ӹ�J,#tL�h���ct��]�61���-�|��|6K|�?&C"� ʀ�1�8r+�I��4��ҧ��X�V���Q�>f���6��s�T �0^fK<j��v��u�:s �`"���K�~���^����������7ܗR�F y`��a���������.	�Hd�#N}�{N�|��g�N�����p<An�s(Ir�iJV�>S4��X�&��M�l����u%u�L>����:g�c��F Ar4]ԆbƟM�J� � ) ��,yt���Xw������4�|l���ړ
A=� f�]3���Po�s��	�@��X
 ���C����p���2��,q@' rR��pL곑������x��q^Y�"$�O��\#kա����i�%plqHB�H���l
���<"?,<����?�Y�^�^�tv�;���=�y�Kg����c�tA?į�=M�1d�k0Q�X,�˙�Se1|R9�F2|��D��$_Q�,�j�1��?�q�D�tud(uW= g���*X�,��Y�"��2��L��;�^�=T�$3GC�J %��_d��lG��G��n ����*������� M	H�t�
���ԗ�Pk��f�)-�`��1��b� ��� ?D��1 ��[	垞��N�n�%�2d~��De�A�z�1=#6@rL�uߍ@�� �a���`+�M��d����]��ft���Y1 O�� �-� �2F��Q�ᴔ<#��,�)%�#o��,3�	�5DX`-�k���(5r�L\&��VAHp{U �t�-���i3'ZU�U��P(Ό@�F|ڦaL�o �s��A�c�*� `O���hBd��2kڮ=��/?�[��=gQL��B��?.jex�M���` ��Ј���-��њ�����
3��j�2�9F~�P������k��M��k���2�����(�R�fN?Q��-!ԙ���W�����$�j6V��4�Ǘ�pD��-���V�F����/ =�|��.FPd2,1����������ы|�?���^�����>h�`�|x��J̧C��e� �"(,��$�>�=@
[��m(��d��k���}��F�5��4s��c[bA�1N��6�����~)rB�c�=�FK
2��B�7٬Y�9��/?���J��[_��7QS�)���m��w#�>���S�Sڪ5�-�t���K�Z�"�7`��F1D(��v	���/��پ����K</�rm��@�!=��(o�<6ыc��y@c!&�"�?RԸb|Ά0k�~�7k�?�&�v#&���:�0���`@� �Lm���
��UFtR"��k߅16��:0�iG�̩��51��L6�d����0t>&��;>�n��ױ�e{
`����I�=y��q��k�����6�ڧ�����}}�[/lO�]��`V~�fb!����\��k��H���-,Z
��C=�X0��e��g�>v
�������O����/�Ӊ��:���4�H��f��E�*���v�|���~	@Y��i��#X�܆�E�m�Ű4;i��A���A]��'w�{���DN�#�ء�]EG��>o8��Y�V8�= ����(Q��0Dw����=&Z��m�b��(7Jt�Ȳ*�"GH� ��!=9���O��o�ҡ_~�Q���a��ͮ��l��f�� +I��&�Q Z���� ��I�j�n��9��V����{?xb���W��C <��Y�����xa���ӂ�"�-��!m��^��秕��	�T�J���p��h/�G��%r�;"=j;N雅�K��6�@��Ⱥ�	ؤ<  �t{m���������=CUM�0	�@��3�� �&������~�����J��� =*�B��!B>~)��{K��N�[~H����^�h) +I �U{)���(C��.������S�SSo{ŠS�a	� ���ƒ�\�
�'1U��w7�Ltd�Oqa�ųӳ6�M�Vӷ� ���zV!�+*a�Q�qz]7WcܭP �P	�e��E��tr�%v�̦@E-���B�hY6�$�I���W7+�QfB%�"������= ����gbO��忘����i4[ں٠� ,C�� W�fh���,_d��!z�=�w^�ỿ��)�=�Q@��w����,$H�E2L(-ᘐR� �Kr���=b��O��ٵɣ2������N'cljgӆ{G�]#%�G�"aK��aC�úK�� l��9�9����9o�C����(j�n�c��������Q�6���i���o��!I� �Aw���������=�{г=���!�s�g� �i�\��K�vѨ�Oލ
�'�k����
DKX���g#�6	}�'� v�m]��[�������煗�G��~���@ F��F;�T#"Vܵu�e�3M��J�Vm���mN�l0�QSHW2��t]D=��i��Ñ�]���[���ʑ߉@���(�@E[1vƨ��E""��
AO����CC���8sTbw<!�C�LA���!�ݟ�Z������G��s��c�o7��[XFh) +�y6[%`��� Wk��% �ؽ���SO�w��}cO����]�#&�>�b��α ��H�Lu@ �t��l��XS��bv�Ө]�uVt��f�;@f�1�9��jj#�����ּg]Y1�8]~7��)v��l��dF��?�	�*5�=5���Hr�*}��������NKn.�}@����,S!!h�@�e�}��xM�C���rA]!�L$��sI�k�Y��?�=�w�-`�aRq�2�`�!����g\؎�m(��w�-�����n��E�� �2X�nV$�h����x�;%եTa %vՇg�i�UU�8v�ۤ���|3!�|����tZ݄���~dN6���h���n�}r�2)�9CD��8�hV��
$�x�2�������?�.��c�u/r�,FF�aU?��
��Zn�$�~���a�<*������*DK86�H/�,;=�?�ܩ2n�������=_���'����b�@�$2*B���g��Ǩ5�
J)Q)�X�Ȭwu
���pY�țͱ����#AMg�����f.�LP��5��+$�Y�nM��|%l�����M��۴۾=�UXG8}��F	��3�H�>�C�N�+�|��>v�7_y�/m��ؽMV��W�� )����\ 1m�΢�GKXyhĴ[B4#�m�@w�����|v�/����-7dDv;��D�� ~;1I0e�Gt~ڥ3q��"C���7&=ҹ�1��״��pD�f�l�(5�$ w�#\A]q��ߎR;YW]��N�w�۹�J���
G-���:P���	I!X����ILB��L��t���������k��vz_�V~3�
y#�g�u�2�^_���;[X]h) +.[[)O*������\۶I��lϠg{��}����g�r������,�����%�kR�jT����=y�,tŤ1�UH�I $���y��W33O����ĆPG� W�T�]��0�q���Lsb�$��?�������1@���,���|�QA	@*���'0A�����s�
���a�b!D;��},�.s��wށ\>���>��.���Q���F�7��bm$�~R)HۦZ;�OHSs�J��gZX�h�ܕ�Fi�E��&��|�!��q{o+��g��w�,]F�Lk�����r�s̆������)��Xiy��Bh� 3Q��nm6�4�N�s��R
�� +���i%�%����BJ���jk1���i�x-�'�Ί�Ũ�J-`+���K2$JD�! !w�>]{����/O='߱��/@g'c�&�Ȉj}Ӧ�[��9�3�~.1K�J,�.�Eha��� �<��r.O��J��� 8��0����2r�6_�6��+wv���!����� $ 
es����	��0�C�X�I�92��u�n�[��
�Tbݹ	6U��O�pv=QL��s�nZaCY���cQ�� HP���f-ݯ�v3�z)��h��#ك1B�H�t$o̶�]|��[��������m#e�y���FF�6��뿔1 �����t�0m�٦�U���:�j������@8������=�y����w�ߑ/.a~ �A~���d�n+ʬ�	�Jb�t�%����ky񑁝�}��v:s�߅ �O�i`�1鎓ֿ�)�{���p[��I"��iR	aB�;�X��{=/�7�/�x��=���>M.�(�r�l�U�g����K^��G�����^���$��b�����e������+%�K@����A�߼�Ҷ�{o�ޚ��ɣϰ�@�OD>X�5}NƄ�Ih)d��q|�;G*��ەT��I_2U\k�ʨJ:7��I�N���B�ՒxE���*��kj(�ޡ���Ɖ`;F����)�S���	���D�-c��|��a���>y�<�qDbbX522B��w1W�a�}�R ע�&�?��K������qb}��j�@�F�<�/���յ�er��O��z�����q�4 �Z�Ϲ�K��s�� ,Y'�*j#HKjmm����fD�=�洏VEI�L��=�1 ���q��(
&x��D}ܨ؎s�:>@��^KQu��S`� �4nvtV}� �`�R���]b��nf	�Bd�q0������o~�/mC�QF>`׮����s�@��j�ys�n;�-�����n����-��b V �1 K��ϥLp������/y�B�|v���;�׼�@��,f>Hd�"�a$��&�� Ħ�������M��%��8m�l�b���"h�@�&�2Jԫ �I������i���		���I���a���S��p���7?�3.l��ϖ�!���~��70�~��4=ۈ��Y�Fڪ�M5�����]��O��B��2la�g��ڧ��{�� �u��#��.���%�:����힠m`�I���$ɃPv���Wf* $���?EapZq "2��i�L���^��1 f���q��
������B����@�;`7q��*k]yH�gt����ueXՀ�+�ts����4y����O>~�-�����#����ݻA��泲��O<+�2 i����&�iY�-4-`����]ӵ��ﺥkm�L�ə)ؽMb� ##40�>v����{���>F��HHA^L!�$�>Y����YS�g�pV���OH|��+46g���!2Ҹ��w\l�̬�Z�����XN vC�V�cY����$)��L����we����[������ُ "�o���0+��@��b_���!�cǙeq��a��-�6��c����A�N�[�On|�_l.�~o��jO������S���r�q�k���C�G9�#�<n�3l���5ï���7��mݙ�o�� s~l�kD3E-��:�c��c�nK���.�� ��X��U*T�L`�I
!�C �D�g�p�uw��i���ί�������5��w�`�YQ�zW�9����b Z����n�!�[��+^��'s��_�;��o���ȼ]B�Z�	����#/9�IO�7�Տ��$ɰ���hןd�"׼��|���vf�'9yM��?���i���M����څ����gN4V�OC�� �G?�f�����wܱ^�g�] fc��g��w�����y}+`h�Yh��c�/q5=��vz�'0P�z�m���ߔ��+�x-X�*.6O�|�l}�6J��������N7� Wp�}�6� GV���F�G-�� Rq,M�a�}z;�'D��+4�9��B�}O�1a��H���/Y�	��\w}���7?���:;۶I�#��>oT��d j��]�X	���
�j�[��z��ۭ��Ü7�g���/�7=��'��L�%��|dr(%;M����@=�0Q��#q�:ܿ���H�o���v9qL��uq$E����@�=f<�����W�ґ��c���>��?;V|�Mx�����eq�t�
~��CS��d�_����O�[9J�r>�V	Z.�cT��jC$��Cl}����G���=vm{����OA��A@"�����p��4�	TW�'Gh��\5��mp���27t{���9�Q(�Hw��d�q"�h\q��BBB���Le���k����x�2zzT��ۢ�Fл����*I&�Wq�1 �ń���jƫyh���c��K�\��Z�	�1v�
��2�=9<4���]k��<|^�8
���%E�t���Ar�J�#Y�I��O#>@�}\h]�;�Q��"�xDQu?��(:�3����F
��.�dB�a���q��C��WG�������$��F��� ͈����OG��Q���.�VE��e��p���@�7�^��m���N�i[�{�g_>�m'\��f.�_��U�{9�B�L������<�j��MiB�y �j@d����ړ�n��������.��4��	��CI�)���Bb����!@��G�-������{�6����F$�Cq�i��u>�`�>Ԟ
�|��J��b��C��cH�����J�t�>��	fy��z�D��^�	.�$�!�XyD�NJ�hlVAyZ �f6�U����=7ɐ�����飲4T�7m%�����������~ ���|��/�G������~`{[��-�۔@�d$�:ON�s��ZeYZ���Z]-4ǈ h!�f���f9���Пc`��u��{w�s��������K2�gx:a1��ɼ�
V.'�y7�������y�ub�x~ Ӥ\@g��\	���)U+�ִ��b �$� �/ ��}���N���;�~=���+�)����
�f�'�k`@�xɴ���ٺ�\.�����h� Zh6�������*T�����ֶ��K��g���Y��L6�q)�Q&�D����.���ٓ�e 2%Ͼ�2� )YmCH�2����Ax{,��L�$!�|q����u��7=��ϔ�u���N���!����Wi�9M��eɹ�I������u'"Mi���燄S��{5X�P�Ϩ�R����͸��)3�-�3��`�"��7���޻.��:B���އ �|��!3� ��6��8�5Ǣ����v���&������X;T`�T<�)�vuB�Q8n�[�?���) u�`�BX���P�=qm��������n���8�p�he���1�;��>�1z���b0s}A-,(Z���� �U��;���A�?��{O���t���]��}���2xU&C���� �TN{�)̱�}�A�&j@Gݛ�Ȯ>�����կZ 	351ك�l���o��*�<�u`N�%1X�o�Dt���5*'?<r��F6��y��J����Ut��������Vҵ�i[�;�?��j;�.�AXh���c�~l�Q���4[�d<[�:C�����!z�g�+��@�W�0|1��0M��2�!�;�7c(ۺy���f�B��|���nV
���
�ŏM�D ����#&�!��D��FD?$_���o�[w	LL:;9V�w޹�Z �( ��޵�{�~��a�-,!��_́=��i=W�W ��_k����|.�/����wa��'%v��A�hӘR� ��Ƶ`}z=�[��65�_�]S� r0�`���y����7��/�}�!
���Y�?2B�Q ���
��Z
@���� ��LBsq,ԛ_�D��~I����{~��`�I�ܞm{� ��LC0��f�eIr��C���QA�\���̊���gg���Cn(B�/��J��%��0<_�������wv}R	��%p晑������
�Z���ҽ�=���W�;��j�2��ZX�s��"YF�T������@^`����!1��yoX72�=r���D~�R�$�LL 2D���
� 6Uy���=`�{��ֱ@vU���1������ ����c�Q!�_�t�g��W�!�5a�߾k��;��R� �-�1m-��hXF�u� I?P9(��V�3Uo�yBi�r9Ƈ�$8��7��	&{|��� � �62K��D��̰� �X��u�����*{չQ��"�a>�ߟL �,A��D����1�
$�֍�6�_�=�Q((����V�g�X�>�儖�`�-,2��*�VT�V�3���S�Z����x}ב�`3g� ��H2���bf��,�I$��'A��ޙ�@ɸJ��c�bfiW�ł���D@@5��'AmB�� �n��?K���y�^�O�C�=���0�}܄IM/�L��R����E�*�[hj�����	+�в�(� г=s�Tpr)�z�����"H�"ǃ%�9`p�ARxD�KI>iN�p��IY�V�L`��0@��e��' Y�%��xP���'�Iwv�c��P)U�/Ғ��Z ��۶���h�n�IH�I�^k`[e
 ��������N�1�j��4	<��|^�gxN"�'B0B	�2�P���!0e��e��߲� �$"��2�@B9�e����{D�L��~��o�_2 ��^����T ��@�{1��ZhV�@��<���6�U� �P�nص;4��Ax�;�M��Ùғ3�?Kxrs�<U�`3@��"K$�$�6~�Y�h fAh��I?��#�&d������/gK'_��0n��L��m�� �I4�M�j�}��[B��%�*�[�%Ҩ���t=7
9�<g�L��#�m�%���@xN����?���D��&ϗ'3����D򼍒�.0ڙ�L����L��4.��`@�0�Y��+�m�v8�����8"�?�cb��U�'�ObQ�j��1� �c���[�A��ch _2����V@ڶiX�@�ut�I�;q�������d�C�n-�����Ƈ�:�DqMX��3>{�@*&��)�0��L6c'�m�7��
���[o�0���m�8"+��/)�,��o�s�&��mg�F���-ڿ�e�U6P�0���mV��O�Z�*���*��d��1��4!�y##��	��j�Ƒx�d?`	��d�����}�k�Ȥ	�4�����hX�x�Dr@����4�U���a�T `z��qc�� �� ��/���]��;;9�o-,�PMػ�W��+jͤj�_-��hXŃx�Dڳ�FS
 0��u�*�2`�*=��(�����>z��=q��H����,��%��i��W���Qc�J���rw��&xzYa��-����l�
�LV3K̦Ln������j}��_p,Get�	��M����3�|����9������i>�Zht[7�߼`z�ڶ��1�iEy��U8�s8Fߵj��\����8�U���B�D�ڮe}W�6���������a̦��<��Zh.�s��1w�-TE2X��˳J��&�d^�� -v`6�����'��W��'�Yt,'�j9�+��T�˷�/��Z��<����o#��k�?�5Q��O�����
V$��g������7�r�����R Z � ��xY�`���s��M��f*1�	�4˾��න�
A3����JTnVb,�fͧ)y�9Ɗ~&Z
@-$Q(
ɅMV�}_$���Q�+b�'>kQ��-�BV����U{a-,
V��Sp�b�f����ѫ��ͱ�4�^>�f���F��K2���峨�/���/�8-�.��y���/�	�������f�Bz�/Ep�&����u��o��\	XV{���VO�7�+}w,be�s5�*/��%E�gj��D�����* @�Pm�TF`%M�[v�b���g��=����U�V@��?&�_���}b�S7���)�yf��d>�$��V���\ι�́�M��g�� ��l$���	�j��rw��@B�s��)��$�I���3XHkE�T�{-�+��i) -,��K�&���F�I�J@Z��\��S�Zha�`1ߕ�����R ZXH,�$*iT~�x���k� ͡�g�?m�Z�)e"I�7��jM\�X�{�bߥ����%�/f#��z��Pa��i� �OкT}�Ex��0������\�5��u�EbVk�t4��)���~�jg.�-K��c��e/n�+Q�>�z|5$�Its U����O����W-s�<��T�Z�H��_:�&i�;�h6�,�5r��L�/}
���Z	S�@����6�< ��WsM4��yiE{ܶ=n����&��j��3}�XDZ_��繴]�s����<���/Z���FX�Ti���r0����+0[�r��|f4�X1�ߠ���_i׵�H�f�d${-Ec!�Y2�dE�� {H�����[4#�`�mT���*0����yz�Q�z'��m�aU���_}3�ޗ4�f����R ���|_��+�����ň?��H�ǔ�fR�.��J�\��..)�%��u+�]��f�P�R�Ҭ��_,��c��`�yA�3.�Y��2��ۯi��MX��>�T4Zԧ��BS/��iX(+qqiW7���u���U��A�Ɯ������E�5�8�H4�����؍��wѨpo���ج�҅����Zh.�������tl���jY-?��?os����|I!�l��%Xp�c.�]뜖e�߹"�L��!�S����X�9Po��K��S��͒�U�\�-Z.��4�m6����xa̼�X���\wZM��fjq=�>���,[Մ�|�c�,����x.������f�ZZ�|h���sI�L೜-*je	4Azɿj�7�[���h�����a�1E����t��<n�}_qJ^Kha6�Fm���:��y��P��@�o1�U�u	�Y~�8V���a.�n�����RM�X�����\�젩��u~hT�WK���%�W0������^�ؒjm���K�4h�ܽǜ�>W$�Eڽ9&���Գ���m    IEND�B`�
```

## app\lawazem\page.tsx

```
// app/lawazem/page.tsx
'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useRecentViews } from '@/hooks/useRecentViews';
import { Input } from '@/components/ui/Field';
import { ReportModal } from '@/components/ReportModal';
import { postJson } from '@/lib/api-client';
import type { LectureNote, Subject, Track } from '@/lib/types';

type SubjectWithNotes = Subject & { lecture_notes: LectureNote[] };

// ==================== Tag Colors ====================
const TAG_COLORS: Record<string, string> = {
  'نظري': 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  'عملي': 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  'محاضرة': 'bg-teal/10 text-teal',
  'ملخص': 'bg-amber/15 text-amber-800 dark:bg-amber/20 dark:text-amber-300',
  'أساسيات': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  'مراجعة': 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
  'سلايدات': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  'امتحان': 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  'واجب': 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  'فاينل': 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
};

function getTagColor(tag: string): string {
  return TAG_COLORS[tag] || 'bg-ink/5 text-ink/60';
}

// ==================== Icons ====================
function IconSearch() {
  return (
    <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconFolder({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18" />
    </svg>
  ) : (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg className={`h-5 w-5 flex-shrink-0 text-ink/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconEmpty() {
  return (
    <svg className="mx-auto h-12 w-12 text-ink/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconTelegram() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
function IconDoctor() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
function IconBookmark({ filled }: { filled: boolean }) {
  return (
    <svg className="h-4 w-4" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}
function IconFlag() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-3xl border border-line bg-white/80 p-5 backdrop-blur-sm dark:bg-paper/80">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 skeleton-shimmer rounded-lg" />
            <div className="h-5 w-40 skeleton-shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/" className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal">
      <span className="transition-transform duration-200 group-hover:translate-x-1"><IconArrowLeft /></span>
      رجوع إلى لوحة الأقسام
    </Link>
  );
}

// ==================== Sorting ====================
function sortNotes(notes: LectureNote[]): LectureNote[] {
  return [...notes].sort((a, b) => {
    const aNum = a.lecture_number ?? Number.POSITIVE_INFINITY;
    const bNum = b.lecture_number ?? Number.POSITIVE_INFINITY;
    if (aNum !== bNum) return aNum - bNum;
    return a.title.localeCompare(b.title, 'ar');
  });
}

// ==================== Doctor Group ====================
interface DoctorGroup {
  name: string;
  notes: LectureNote[];
  totalNotes: number;
  subjectName: string;
}

function groupByDoctor(notes: LectureNote[], subjectName: string): DoctorGroup[] {
  const groups: Record<string, LectureNote[]> = {};
  for (const note of notes) {
    const doctor = note.professor_name?.trim() || 'غير محدد';
    if (!groups[doctor]) groups[doctor] = [];
    groups[doctor].push(note);
  }
  return Object.entries(groups)
    .map(([name, notes]) => ({
      name,
      notes: sortNotes(notes),
      totalNotes: notes.length,
      subjectName,
    }))
    .sort((a, b) => {
      if (a.name === 'غير محدد') return 1;
      if (b.name === 'غير محدد') return -1;
      return a.name.localeCompare(b.name, 'ar');
    });
}

// ==================== Track Badge ====================
function TrackBadge({ track }: { track: Track | null }) {
  if (!track) return null;
  const styles =
    track === 'نظري'
      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
      : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300';
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${styles}`}>
      {track}
    </span>
  );
}

// ==================== Doctor Accordion ====================
function DoctorAccordion({
  doctor,
  isOpen,
  onToggle,
  reportCounts,
  onReport,
}: {
  doctor: DoctorGroup;
  isOpen: boolean;
  onToggle: () => void;
  reportCounts: Record<string, number>;
  onReport: (note: LectureNote) => void;
}) {
  const initial = doctor.name === 'غير محدد' ? '?' : doctor.name.trim().charAt(0);

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 dark:bg-paper ${
      isOpen ? 'border-teal/30 shadow-[0_4px_16px_rgba(14,74,74,0.08)]' : 'border-line'
    }`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 p-4 text-right transition-colors hover:bg-ink/[0.02] dark:hover:bg-white/[0.03]"
      >
        <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black transition-all duration-300 ${
          isOpen
            ? 'bg-amber text-ink shadow-[0_4px_14px_rgba(224,166,58,0.30)]'
            : 'bg-amber/15 text-amber-800'
        }`}>
          {doctor.name === 'غير محدد' ? <IconDoctor /> : initial}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-extrabold text-ink">
            {doctor.name === 'غير محدد' ? 'بدون دكتور' : `د. ${doctor.name}`}
          </h3>
          <p className="mt-0.5 text-xs font-bold text-ink/50">
            {doctor.totalNotes} {doctor.totalNotes === 1 ? 'ملزمة' : 'ملازم'}
          </p>
        </div>

        <IconChevron open={isOpen} />
      </button>

      <div className={`grid transition-all duration-300 ease-out ${
        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      }`}>
        <div className="overflow-hidden">
          <div className="border-t border-line/60 bg-paper/40 px-4 py-3 dark:bg-white/[0.02]">
            <ul className="space-y-1.5">
              {doctor.notes.map((note) => (
                <LectureItem
                  key={note.id}
                  note={note}
                  subjectName={doctor.subjectName}
                  reportCount={reportCounts[note.id] ?? 0}
                  onReport={() => onReport(note)}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Lecture Item ====================
function LectureItem({
  note,
  subjectName,
  reportCount,
  onReport,
}: {
  note: LectureNote;
  subjectName: string;
  reportCount: number;
  onReport: () => void;
}) {
  const { isBookmarked, toggle } = useBookmarks();
  const { addView } = useRecentViews();
  const bookmarked = isBookmarked(note.id);

  const hasLecture = note.lecture_number != null;
  const isTelegram = note.file_path.includes('t.me');
  const noteTags = Array.isArray(note.tags) ? note.tags : [];
  const hasWarning = reportCount >= 3;

  function handleOpen() {
    addView({
      id: note.id,
      title: note.title,
      subject_name: subjectName,
      file_path: note.file_path,
    });
  }

  return (
    <li>
      <div className="group flex items-start gap-2 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-teal/20 hover:bg-white hover:shadow-[0_2px_8px_rgba(14,74,74,0.06)] dark:hover:bg-paper">
        {/* المحتوى */}
        <a
          href={note.file_path}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpen}
          className="flex min-w-0 flex-1 flex-col gap-2"
        >
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-mono text-sm font-black transition-all duration-200 ${
              hasLecture
                ? 'bg-teal/10 text-teal group-hover:bg-teal group-hover:text-white'
                : 'bg-ink/5 text-ink/40'
            }`}>
              {hasLecture ? note.lecture_number : '—'}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <IconDoc />
                <span className="truncate font-bold text-ink transition-colors group-hover:text-teal">
                  {note.title}
                </span>
                <TrackBadge track={note.track} />
                {note.year != null && (
                  <span className="rounded-md bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink/50 dark:bg-white/10">
                    {note.year}
                  </span>
                )}
                {hasWarning && (
                  <span
                    className="inline-flex items-center gap-1 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-black text-red-700 dark:bg-red-950/50 dark:text-red-300"
                    title={`${reportCount} بلاغ`}
                  >
                    🚩 {reportCount}
                  </span>
                )}
              </div>
            </div>

            <span className="flex-shrink-0 text-ink/30 transition-all duration-200 group-hover:text-teal group-hover:translate-x-[-2px]">
              {isTelegram ? <IconTelegram /> : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </span>
          </div>

          {noteTags.length > 0 && (
            <div className="flex flex-wrap gap-1 pr-12">
              {noteTags.map((tag, i) => (
                <span
                  key={i}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${getTagColor(tag)}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </a>

        {/* الأزرار */}
        <div className="flex flex-shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={() => toggle(note.id)}
            aria-label={bookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
            title={bookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 active:scale-95 ${
              bookmarked
                ? 'bg-amber/20 text-amber-700'
                : 'text-ink/30 hover:bg-ink/5 hover:text-ink/60'
            }`}
          >
            <IconBookmark filled={bookmarked} />
          </button>
          <button
            type="button"
            onClick={onReport}
            aria-label="بلّغ عن مشكلة"
            title="بلّغ عن مشكلة"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/20 transition-all duration-200 hover:bg-amber/10 hover:text-amber-700 active:scale-95 dark:hover:text-amber-400"
          >
            <IconFlag />
          </button>
        </div>
      </div>
    </li>
  );
}

// ==================== Subject Folder ====================
function SubjectFolder({
  subject,
  isOpen,
  onToggle,
  forceOpen,
  reportCounts,
  onReport,
}: {
  subject: SubjectWithNotes;
  isOpen: boolean;
  onToggle: () => void;
  forceOpen: boolean;
  reportCounts: Record<string, number>;
  onReport: (note: LectureNote) => void;
}) {
  const notesCount = subject.lecture_notes.length;
  const open = isOpen || forceOpen;
  const doctorGroups = useMemo(
    () => groupByDoctor(subject.lecture_notes, subject.name),
    [subject.lecture_notes, subject.name]
  );
  const [expandedDoctors, setExpandedDoctors] = useState<Record<string, boolean>>({});

  function toggleDoctor(name: string) {
    setExpandedDoctors((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  return (
    <div className={`overflow-hidden rounded-3xl border bg-white/80 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-300 dark:bg-paper/80 ${
      open
        ? 'border-teal/30 shadow-[0_8px_24px_rgba(14,74,74,0.08)]'
        : 'border-line hover:border-teal/20 hover:shadow-[0_4px_16px_rgba(14,74,74,0.06)]'
    }`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-5 text-right transition-colors hover:bg-ink/[0.02] dark:hover:bg-white/[0.03]"
      >
        <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
          open ? 'bg-teal text-white shadow-[0_4px_14px_rgba(14,74,74,0.30)]' : 'bg-teal/8 text-teal'
        }`}>
          <IconFolder open={open} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-extrabold text-ink sm:text-xl">{subject.name}</h2>
          <p className="mt-0.5 text-xs font-bold text-ink/50">
            {notesCount === 0
              ? 'لا توجد ملفات حالياً'
              : `${notesCount} ${notesCount === 1 ? 'ملزمة' : 'ملازم'} · ${doctorGroups.length} ${doctorGroups.length === 1 ? 'دكتور' : 'دكاترة'}`}
          </p>
        </div>

        <IconChevron open={open} />
      </button>

      <div className={`grid transition-all duration-300 ease-out ${
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      }`}>
        <div className="overflow-hidden">
          <div className="space-y-2 border-t border-line/60 bg-paper/40 px-4 py-4 dark:bg-white/[0.02]">
            {notesCount === 0 ? (
              <p className="py-2 text-center text-sm text-ink/40">لا توجد ملفات حالياً.</p>
            ) : (
              doctorGroups.map((doc, idx) => (
                <DoctorAccordion
                  key={doc.name}
                  doctor={doc}
                  isOpen={expandedDoctors[doc.name] ?? idx === 0}
                  onToggle={() => toggleDoctor(doc.name)}
                  reportCounts={reportCounts}
                  onReport={onReport}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Page ====================
export default function LawazemPage() {
  const { stage, ready } = useStudentStage();
  const [subjects, setSubjects] = useState<SubjectWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [reportingNote, setReportingNote] = useState<LectureNote | null>(null);

  const deferredSearch = useDeferredValue(searchTerm);
  const term = deferredSearch.trim().toLowerCase();

  // ===== تحميل البيانات =====
  useEffect(() => {
    if (!stage) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('subjects')
        .select('*, lecture_notes(*)')
        .eq('stage', stage)
        .order('name');

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setSubjects([]);
        setLoading(false);
        return;
      }

      const list = (data ?? []) as SubjectWithNotes[];
      setSubjects(list);
      setLoading(false);

      const allIds: string[] = [];
      for (const s of list) {
        for (const n of s.lecture_notes) allIds.push(n.id);
      }

      if (allIds.length > 0) {
        try {
          const res = await postJson<{ counts: Record<string, number> }>(
            '/api/reports',
            { action: 'counts', lecture_note_ids: allIds }
          );
          if (!cancelled) setReportCounts(res.counts ?? {});
        } catch {
          /* فشل صامت */
        }
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [stage]);

  // ===== فلترة =====
  const filteredSubjects = useMemo(() => {
    return subjects.map((s) => ({
      ...s,
      lecture_notes: s.lecture_notes.filter((n) => {
        const noteTags = Array.isArray(n.tags) ? n.tags : [];
        if (selectedTag && !noteTags.includes(selectedTag)) return false;
        if (term) {
          const inTitle = n.title.toLowerCase().includes(term);
          const inDoctor = n.professor_name?.toLowerCase().includes(term) ?? false;
          const inTrack = n.track?.toLowerCase().includes(term) ?? false;
          const inTags = noteTags.some((t) => t.toLowerCase().includes(term));
          if (!inTitle && !inDoctor && !inTrack && !inTags) return false;
        }
        return true;
      }),
    }));
  }, [subjects, term, selectedTag]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const s of subjects) {
      for (const n of s.lecture_notes) {
        if (Array.isArray(n.tags)) {
          for (const t of n.tags) tagSet.add(t);
        }
      }
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [subjects]);

  const totalNotes = useMemo(
    () => subjects.reduce((sum, s) => sum + s.lecture_notes.length, 0),
    [subjects]
  );

  const forceOpenIds = useMemo(() => {
    if (!term && !selectedTag) return new Set<string>();
    return new Set(filteredSubjects.filter((s) => s.lecture_notes.length > 0).map((s) => s.id));
  }, [term, selectedTag, filteredSubjects]);

  const visibleCount = useMemo(
    () => filteredSubjects.reduce((sum, s) => sum + s.lecture_notes.length, 0),
    [filteredSubjects]
  );

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
      <BackLink />

      <div className="mt-6 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">الملازم والمصادر</h1>
        {!loading && totalNotes > 0 && (
          <p className="mt-2 text-sm text-ink/50">
            <span className="font-bold text-teal">{totalNotes}</span> ملزمة موزعة على{' '}
            <span className="font-bold text-teal">{subjects.length}</span> مادة
          </p>
        )}
      </div>

      {totalNotes > 0 && (
        <div className="relative mt-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <IconSearch />
          <Input
            type="text"
            placeholder="ابحث باسم الملزمة، الدكتور، أو وسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-3 pr-11 shadow-[0_2px_8px_rgba(26,33,31,0.04)]"
            aria-label="بحث في الملازم"
          />
        </div>
      )}

      {allTags.length > 0 && (
        <div className="mt-4 mb-8 flex flex-wrap items-center gap-1.5 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <span className="text-xs font-bold text-ink/50">تصفية:</span>
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-150 active:scale-95 ${
              !selectedTag
                ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.20)]'
                : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
            }`}
          >
            الكل
          </button>
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-150 active:scale-95 ${
                  isSelected
                    ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.20)]'
                    : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
                }`}
              >
                #{tag}
                {isSelected && <IconClose />}
              </button>
            );
          })}
        </div>
      )}

      {loading && <Skeleton />}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
          <p className="mt-1 text-red-600/80">{error}</p>
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up dark:bg-paper/80">
          <IconEmpty />
          <p className="mt-4 font-bold text-ink/70">لا توجد مواد مضافة لمرحلتك حالياً.</p>
        </div>
      )}

      {!loading && !error && subjects.length > 0 && (term || selectedTag) && visibleCount === 0 && (
        <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up dark:bg-paper/80">
          <IconSearch />
          <p className="mt-4 font-bold text-ink/70">لا توجد نتائج مطابقة</p>
          <p className="mt-1 text-sm text-ink/50">
            {selectedTag ? `الوسم: #${selectedTag}` : `البحث: «${searchTerm}»`}
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {filteredSubjects.map((s, idx) => {
            if ((term || selectedTag) && s.lecture_notes.length === 0) return null;
            return (
              <div key={s.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-slide-up">
                <SubjectFolder
                  subject={s}
                  isOpen={!!expanded[s.id]}
                  onToggle={() => toggle(s.id)}
                  forceOpen={forceOpenIds.has(s.id)}
                  reportCounts={reportCounts}
                  onReport={(note) => setReportingNote(note)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        note={reportingNote}
        onClose={() => setReportingNote(null)}
        onReported={() => {
          if (reportingNote) {
            setReportCounts((prev) => ({
              ...prev,
              [reportingNote.id]: (prev[reportingNote.id] ?? 0) + 1,
            }));
          }
        }}
      />
    </main>
  );
}
```

## app\layout.tsx

```
// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { ThemeProvider } from '@/components/ThemeProvider';
import { NavBar } from '@/components/NavBar';
import { MobileBottomNav } from '@/components/MobileBottomNav';  // ✅ جديد

export const metadata: Metadata = {
  title: 'لوازم — كلية طب جامعة العميد',
  description: 'منصة تعاونية لملازم ومصادر وجميع احتياجات طلاب كلية الطب جامعة العميد',
};

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var prefers = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var theme = saved || prefers;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-paper">
        <ThemeProvider>
          <ToastProvider>
            <ConfirmProvider>
              <NavBar />
              {/* ✅ جديد: padding-bottom على الجوال لإفراغ مساحة للشريط */}
              <main className="pb-20 md:pb-0">
                {children}
              </main>
              <MobileBottomNav />
            </ConfirmProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## app\page.tsx

```
// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { STAGES, STORAGE_KEYS } from '@/lib/constants';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { RecentViewsCard } from '@/components/RecentViewsCard';
import { ContinueCard } from '@/components/ContinueCard';
import { LiveFeed } from '@/components/LiveFeed';
import type { Stage } from '@/lib/types';

// ==================== Icons ====================
function IconBook() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function IconSwap() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

// ==================== Section Config ====================
interface Section {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accent: 'teal' | 'amber';
  requiresStage?: Stage;
}

const SECTIONS: Section[] = [
  { title: 'الملازم', description: 'ملازم الدكاترة مرتبة حسب المادة', href: '/lawazem', icon: <IconBook />, accent: 'teal' },
  { title: 'القنوات الدراسية', description: 'دليل قنوات التليكرام الدراسية', href: '/channels', icon: <IconChat />, accent: 'teal' },
  { title: 'الجدول', description: 'جدول المحاضرات الأسبوعي لمرحلتك', href: '/schedule', icon: <IconCalendar />, accent: 'amber' },
  { title: 'جات الدراسة', description: 'برومبت ذكي يدرس معك بالـAI', href: '/study-prompt', icon: <IconSparkles />, accent: 'amber' },
  { title: 'المعدل', description: 'احفظ درجاتك واحسب معدلك الموزون حسب وحدات موادك', href: '/gpa', icon: <IconChart />, accent: 'teal' },
  {
    title: 'تبديل الكروبات',
    description: 'تبديل كروبات العملي — متاح للمرحلة الثانية فقط',
    href: '/group-swap',
    icon: <IconSwap />,
    accent: 'amber',
    requiresStage: 'المرحلة الثانية',
  },
];

// ==================== Stage Card ====================
function StageCard({ stage, index, onClick }: { stage: string; index: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${index * 80}ms` }}
      className="group relative w-full overflow-hidden rounded-2xl border-2 border-line bg-white/80 p-6 text-right shadow-[0_2px_8px_rgba(26,33,31,0.05)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal hover:shadow-[0_12px_30px_rgba(14,74,74,0.15)] active:scale-[0.98] animate-slide-up dark:bg-paper/80"
    >
      <div className="absolute inset-x-0 top-0 h-1 origin-right scale-x-0 bg-gradient-to-l from-teal via-teal-light to-teal transition-transform duration-500 group-hover:scale-x-100" />
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/8 text-teal transition-all duration-300 group-hover:bg-teal group-hover:text-white group-hover:shadow-[0_4px_14px_rgba(14,74,74,0.30)]">
          <IconBook />
        </span>
        <span className="font-mono text-xs uppercase tracking-widest text-ink/30">0{index + 1}</span>
      </div>
      <h3 className="mt-4 text-lg font-black text-ink">{stage}</h3>
      <div className="mt-2 flex items-center gap-1 text-sm font-bold text-teal opacity-70 transition-all duration-300 group-hover:gap-2 group-hover:opacity-100">
        <span>اختر</span>
        <span className="transition-transform duration-300 group-hover:-translate-x-1"><IconArrowLeft /></span>
      </div>
    </button>
  );
}

// ==================== Section Card ====================
function SectionCard({
  section,
  index,
  currentStage,
}: {
  section: Section;
  index: number;
  currentStage: Stage;
}) {
  const isTeal = section.accent === 'teal';
  const accentText = isTeal ? 'text-teal' : 'text-amber-700 dark:text-amber-300';
  const isLocked = !!section.requiresStage && section.requiresStage !== currentStage;

  if (isLocked) {
    return (
      <div
        style={{ animationDelay: `${index * 60}ms` }}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white/40 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.02)] backdrop-blur-sm animate-slide-up dark:bg-paper/40"
        aria-disabled="true"
      >
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink/5 text-ink/30 dark:bg-white/5">
              {section.icon}
            </div>
            <span className="flex h-7 items-center gap-1 rounded-full bg-ink/5 px-2.5 text-[10px] font-black text-ink/40 dark:bg-white/5">
              <IconLock />
              مقفل
            </span>
          </div>
          <h2 className="mt-4 text-base font-extrabold text-ink/50">{section.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/35">{section.description}</p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink/30">
            <span>متاح فقط للمرحلة الثانية</span>
          </div>
        </div>
      </div>
    );
  }

  const gradient = isTeal
    ? 'from-teal/8 to-teal/4 group-hover:from-teal/12 group-hover:to-teal/6'
    : 'from-amber/12 to-amber/6 group-hover:from-amber/18 group-hover:to-amber/10';
  const iconBg = isTeal
    ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] group-hover:shadow-[0_6px_18px_rgba(14,74,74,0.34)]'
    : 'bg-amber text-ink shadow-[0_2px_8px_rgba(224,166,58,0.30)] group-hover:shadow-[0_6px_18px_rgba(224,166,58,0.42)]';

  return (
    <Link
      href={section.href}
      style={{ animationDelay: `${index * 60}ms` }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal/30 hover:shadow-[0_12px_30px_rgba(14,74,74,0.10)] active:scale-[0.99] animate-slide-up dark:bg-paper/80 dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.40)]"
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-bl opacity-0 transition-opacity duration-300 ${gradient} group-hover:opacity-100`} />
      <div className="relative">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 ${iconBg}`}>
          {section.icon}
        </div>
        <h2 className="mt-4 text-base font-extrabold text-ink">{section.title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink/55">{section.description}</p>
        <div className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold ${accentText} transition-all duration-300 group-hover:gap-2.5`}>
          <span>فتح</span>
          <span className="transition-transform duration-300 group-hover:-translate-x-1"><IconArrowLeft /></span>
        </div>
      </div>
    </Link>
  );
}

// ==================== Page ====================
export default function HomePage() {
  const [stage, setStage] = useState<Stage | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.studentStage) as Stage | null;
    if (saved) setStage(saved);
    setLoaded(true);
  }, []);

  function chooseStage(s: Stage) {
    localStorage.setItem(STORAGE_KEYS.studentStage, s);
    setStage(s);
  }
  function changeStage() {
    localStorage.removeItem(STORAGE_KEYS.studentStage);
    setStage(null);
  }

  if (!loaded) return <main className="min-h-screen bg-paper" />;

  return (
    <>
      <AnimatedBackground />

      {!stage ? (
        <main className="relative mx-auto flex min-h-[calc(100vh-70px)] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
          <div className="relative animate-slide-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/5 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-teal backdrop-blur-sm dark:border-teal/30 dark:bg-teal/15">
              <IconCheck />
              منصة لطلبة جامعة العميد
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-black leading-tight text-ink sm:text-4xl animate-slide-up" style={{ animationDelay: '80ms' }}>
            اختر مرحلتك الدراسية
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-ink/60 animate-slide-up" style={{ animationDelay: '160ms' }}>
            في لوازم نعرض لك المحتوى المناسب لمرحلتك — قنوات، جداول، وكل ما تحتاجه.
          </p>

          <div className="relative mt-12 grid w-full gap-4 sm:grid-cols-3">
            {STAGES.map((s, i) => (
              <StageCard key={s} stage={s} index={i} onClick={() => chooseStage(s)} />
            ))}
          </div>

          <p className="mt-10 text-xs text-ink/40 animate-slide-up" style={{ animationDelay: '400ms' }}>
            يمكنك تغييرها لاحقاً
          </p>
        </main>
      ) : (
        <main className="relative mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
          <div className="flex flex-wrap items-end justify-between gap-3 animate-slide-up">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal backdrop-blur-sm dark:border-teal/30 dark:bg-teal/15">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
                {stage}
              </span>
              <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">ماذا تحتاج اليوم؟</h1>
              <p className="mt-2 text-sm text-ink/50">كل شيء في مكان واحد — اختر القسم الذي تحتاجه</p>
            </div>
            <button
              onClick={changeStage}
              className="rounded-lg border border-line bg-white/80 px-3.5 py-2 text-xs font-bold text-ink/70 shadow-[0_1px_2px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-200 hover:border-ink/20 hover:bg-paper hover:text-ink active:scale-95 dark:bg-paper/80"
            >
              تغيير المرحلة
            </button>
          </div>

          {/* تابع من حيث توقفت */}
          <div className="mt-6">
            <ContinueCard />
          </div>

          {/* شبكة الأقسام */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((sec, i) => (
              <SectionCard key={sec.href} section={sec} index={i} currentStage={stage} />
            ))}
          </div>

          {/* آخر التحديثات */}
          <div className="mt-8">
            <LiveFeed stage={stage} />
          </div>

          {/* آخر ما زرته */}
          <div className="mt-6">
            <RecentViewsCard />
          </div>

          <p className="mt-12 text-center text-xs text-ink/40 animate-slide-up" style={{ animationDelay: '400ms' }}>
            صُنع بكل حب لطلاب كلية الطب · جامعة العميد · برمجة وإعداد الطالب: علي مازن @E_W_9
          </p>
        </main>
      )}
    </>
  );
}
```

## app\schedule\page.tsx

```
// app/schedule/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import type { Schedule } from '@/lib/types';

type ScheduleImage = Pick<Schedule, 'image_url'>;

// ==================== Icons ====================
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="mt-8 space-y-4">
      <div className="h-4 w-40 skeleton-shimmer rounded" />
      <div className="aspect-[3/4] w-full skeleton-shimmer rounded-3xl sm:aspect-[4/3]" />
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/" className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal">
      <span className="transition-transform duration-200 group-hover:translate-x-1"><IconArrowLeft /></span>
      رجوع إلى لوحة الأقسام
    </Link>
  );
}

// ==================== Page ====================
export default function SchedulePage() {
  const { stage, ready } = useStudentStage();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!stage) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');
      setImageLoaded(false);

      const { data, error: fetchError } = await supabase
        .from('schedules')
        .select('image_url')
        .eq('stage', stage)
        .maybeSingle<ScheduleImage>();

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setImageUrl(null);
      } else {
        setImageUrl(data?.image_url ?? null);
      }
      setLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, [stage]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <BackLink />

      <div className="mt-6 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">جدول المحاضرات</h1>
      </div>

      {loading && <Skeleton />}

      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
          <p className="mt-1 text-red-600/80 dark:text-red-300/80">{error}</p>
        </div>
      )}

      {!loading && !error && !imageUrl && (
        <div className="mt-6 rounded-3xl border border-line bg-white/80 p-12 text-center backdrop-blur-sm animate-slide-up dark:bg-paper/80">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber/10 text-amber dark:bg-amber/15">
            <IconCalendar />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا يوجد جدول مرفوع لمرحلتك حالياً.</p>
          <p className="mt-1 text-sm text-ink/50">يرجى العودة لاحقاً</p>
        </div>
      )}

      {!loading && !error && imageUrl && (
        <div className="mt-6 animate-slide-up">
          <div className="group relative overflow-hidden rounded-3xl border border-line bg-white/80 p-3 shadow-[0_4px_16px_rgba(26,33,31,0.06)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_12px_30px_rgba(14,74,74,0.10)] dark:bg-paper/80 dark:shadow-[0_4px_16px_rgba(0,0,0,0.30)] dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
            {!imageLoaded && (
              <div className="aspect-[3/4] w-full skeleton-shimmer rounded-2xl sm:aspect-[4/3]" />
            )}
            <img
              src={imageUrl}
              alt={`جدول ${stage}`}
              onLoad={() => setImageLoaded(true)}
              className={`w-full rounded-2xl transition-all duration-500 dark:brightness-90 ${
                imageLoaded ? 'opacity-100' : 'absolute h-0 w-0 opacity-0'
              }`}
            />
          </div>

          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-4 inline-flex items-center gap-2 rounded-xl border border-teal/20 bg-teal/5 px-4 py-2.5 text-sm font-bold text-teal transition-all duration-200 hover:border-teal/40 hover:bg-teal/10 active:scale-95 dark:border-teal/30 dark:bg-teal/10 dark:hover:bg-teal/15"
          >
            <IconExternal />
            فتح الصورة بحجم كامل
          </a>
        </div>
      )}
    </main>
  );
}
```

## app\study-prompt\page.tsx

```
// app/study-prompt/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import { Button } from '@/components/ui/Button';
import { Checkbox, Select } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { postJson } from '@/lib/api-client';
import {
  MATERIAL_METHODS,
  STUDY_FORMATS,
  STUDY_FORMAT_LABELS,
  type StudyFormat,
} from '@/lib/constants';

interface SubjectOption { id: string; name: string }
interface StudyPromptResponse { prompt: string }

// ==================== Icons ====================
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
function IconCopy() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="mt-6 space-y-5 rounded-3xl border border-line bg-white/80 p-6 backdrop-blur-sm dark:bg-paper/80">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 skeleton-shimmer rounded" />
          <div className="h-12 w-full skeleton-shimmer rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/" className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal">
      <span className="transition-transform duration-200 group-hover:translate-x-1"><IconArrowLeft /></span>
      رجوع إلى لوحة الأقسام
    </Link>
  );
}

// ==================== Page ====================
export default function StudyPromptPage() {
  const { stage, ready } = useStudentStage();
  const toast = useToast();

  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const [subject, setSubject] = useState('');
  const [materialMethod, setMaterialMethod] = useState<string>(MATERIAL_METHODS[0].value);
  const [selectedFormats, setSelectedFormats] = useState<StudyFormat[]>([STUDY_FORMATS[0]]);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!stage) return;
    let cancelled = false;

    async function loadSubjects() {
      setLoadingSubjects(true);
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('stage', stage)
        .order('name');

      if (cancelled) return;
      if (error) {
        toast.show('فشل تحميل المواد', 'error');
        setSubjects([]);
      } else {
        const list = (data ?? []) as SubjectOption[];
        setSubjects(list);
        if (list.length > 0) setSubject((prev) => prev || list[0].name);
      }
      setLoadingSubjects(false);
    }
    loadSubjects();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const toggleFormat = (format: StudyFormat) => {
    setSelectedFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
  };

  const canGenerate = useMemo(
    () => subject.trim() !== '' && selectedFormats.length > 0 && !generating,
    [subject, selectedFormats.length, generating]
  );

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!canGenerate) return;

    setGenerating(true);
    setResult('');
    setCopied(false);

    try {
      const data = await postJson<StudyPromptResponse>('/api/study-prompt', {
        subject,
        materialMethod,
        formats: selectedFormats,
        language,
      });
      setResult(data.prompt);
      toast.show('تم توليد البرومبت', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ، يرجى المحاولة مرة أخرى.';
      toast.show(message, 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast.show('تم النسخ', 'success');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.show('فشل النسخ — يرجى النسخ يدوياً', 'error');
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton />
      </main>
    );
  }

  const noSubjects = !loadingSubjects && subjects.length === 0;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <BackLink />

      <div className="mt-6 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">أدوات الدراسة</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          اختر مادتك وطريقة إرسال المحتوى، وسنصيغ لك برومبت احترافياً تنسخه وتستخدمه في أي أداة ذكاء اصطناعي.
        </p>
      </div>

      {loadingSubjects && <Skeleton />}

      {noSubjects && (
        <div className="mt-6 rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up dark:bg-paper/80">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber/10 text-amber dark:bg-amber/15">
            <IconSparkles />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد مواد مضافة لمرحلتك حالياً.</p>
        </div>
      )}

      {!loadingSubjects && !noSubjects && (
        <form
          onSubmit={handleGenerate}
          className="mt-6 space-y-6 rounded-3xl border border-line bg-white/80 p-6 shadow-[0_2px_8px_rgba(26,33,31,0.04)] backdrop-blur-sm animate-slide-up dark:bg-paper/80"
        >
          {/* المادة */}
          <div>
            <label htmlFor="sp-subject" className="mb-2 block text-sm font-bold text-ink/70">
              المادة
            </label>
            <Select
              id="sp-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </Select>
          </div>

          {/* طريقة الإرسال */}
          <div>
            <label htmlFor="sp-method" className="mb-2 block text-sm font-bold text-ink/70">
              كيف ستزود المحتوى للذكاء الاصطناعي؟
            </label>
            <Select
              id="sp-method"
              value={materialMethod}
              onChange={(e) => setMaterialMethod(e.target.value)}
              className="w-full"
            >
              {MATERIAL_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
          </div>

          {/* أشكال الشرح */}
          <fieldset>
            <legend className="mb-3 block text-sm font-bold text-ink/70">
              شكل الشرح المطلوب <span className="text-ink/40">(يمكنك اختيار أكثر من خيار)</span>
            </legend>
            <div className="space-y-2">
              {STUDY_FORMATS.map((f) => (
                <Checkbox
                  key={f}
                  checked={selectedFormats.includes(f)}
                  onChange={() => toggleFormat(f)}
                >
                  {STUDY_FORMAT_LABELS[f]}
                </Checkbox>
              ))}
            </div>
            {selectedFormats.length === 0 && (
              <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400" role="alert">
                اختر طريقة شرح واحدة على الأقل.
              </p>
            )}
          </fieldset>

          {/* اللغة */}
          <div>
            <label htmlFor="sp-lang" className="mb-2 block text-sm font-bold text-ink/70">
              لغة البرومبت
            </label>
            <Select
              id="sp-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
              className="w-full"
            >
              <option value="ar">بالعربية</option>
              <option value="en">بالإنجليزية</option>
            </Select>
          </div>

          <Button
            type="submit"
            size="lg"
            loading={generating}
            disabled={!canGenerate}
            icon={!generating ? <IconSparkles /> : undefined}
            className="w-full"
          >
            {generating ? 'جاري التوليد...' : 'توليد البرومبت'}
          </Button>
        </form>
      )}

      {result && (
        <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-white/80 shadow-[0_4px_16px_rgba(14,74,74,0.06)] backdrop-blur-sm animate-slide-up dark:bg-paper/80 dark:shadow-[0_4px_16px_rgba(0,0,0,0.30)]">
          <div className="flex items-center justify-between gap-3 border-b border-line/60 bg-gradient-to-l from-teal/5 to-transparent px-6 py-4 dark:from-teal/10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-teal">
              <IconSparkles />
              البرومبت جاهز
            </h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              icon={copied ? <IconCheck /> : <IconCopy />}
            >
              {copied ? 'تم النسخ' : 'نسخ'}
            </Button>
          </div>
          <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words p-6 text-sm leading-relaxed text-ink/80 scrollbar-thin">
            {result}
          </pre>
          <p className="border-t border-line/60 bg-paper/50 px-6 py-3 text-xs text-ink/50 dark:bg-white/[0.03]">
            انسخ هذا النص والصقه في أي أداة ذكاء اصطناعي تفضلها، ثم ابدأ بإرسال سلايداتك حسب الطريقة التي اخترتها.
          </p>
        </div>
      )}
    </main>
  );
}
```

## CLAUDE.md

```
@AGENTS.md

```

## components\AnimatedBackground.tsx

```
// components/AnimatedBackground.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider'; // ✅ جديد

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme(); // ✅ جديد: نقرأ الثيمة الحالية

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) return;

    // على أجهزة اللمس لا توجد فايدة من تفاعل الماوس، ونوفر المعالج كليًا.
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (isCoarsePointer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let running = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      color: string;
    }

    const particles: Particle[] = [];

    // ✅ جديد: ألوان ديناميكية حسب الثيمة
    const isDark = theme === 'dark';
    const TEAL = isDark
      ? 'rgba(42, 136, 136, 0.45)'
      : 'rgba(14, 74, 74, 0.35)';
    const AMBER = isDark
      ? 'rgba(240, 199, 105, 0.40)'
      : 'rgba(224, 166, 58, 0.30)';
    const LINE_RGB = isDark ? '42, 136, 136' : '14, 74, 74';
    const CONNECT_DISTANCE = 140;

    const mouse = { x: -9999, y: -9999 };

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      particles.length = 0;
      const area = width * height;
      const count = Math.min(70, Math.max(30, Math.round(area / 30000)));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.8 + 1,
          color: Math.random() > 0.75 ? AMBER : TEAL,
        });
      }
    }

    function step() {
      if (!ctx || !running) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < CONNECT_DISTANCE * CONNECT_DISTANCE) {
            const opacity = 1 - Math.sqrt(dist2) / CONNECT_DISTANCE;
            // ✅ جديد: يستخدم LINE_RGB الديناميكي
            ctx.strokeStyle = `rgba(${LINE_RGB}, ${opacity * 0.12})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) {
          const force = (200 - dist) / 200;
          p.vx += (dx / dist) * force * 0.015;
          p.vy += (dy / dist) * force * 0.015;
        }

        p.x += p.vx;
        p.y += p.vy;

        p.vx *= 0.98;
        p.vy *= 0.98;

        if (Math.abs(p.vx) < 0.05) p.vx += (Math.random() - 0.5) * 0.02;
        if (Math.abs(p.vy) < 0.05) p.vy += (Math.random() - 0.5) * 0.02;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.x = Math.max(0, Math.min(width, p.x));
        p.y = Math.max(0, Math.min(height, p.y));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      rafId = requestAnimationFrame(step);
    }

    function onMouseMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    function onMouseLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }
    function onResize() {
      resize();
      init();
    }
    function onVisibilityChange() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafId);
      } else if (!running) {
        running = true;
        step();
      }
    }

    resize();
    init();
    step();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
    // ✅ جديد: أضفنا theme للتبعيات، فيُعاد التشغيل عند تغيير الثيمة
  }, [theme]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-paper via-paper to-paper-deep" />
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-teal/10 blur-[120px]" />
      <div className="absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-amber/12 blur-[120px]" />
      <div className="absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-teal-glow/8 blur-[100px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-paper/60" />
    </div>
  );
}
```

## components\ContinueCard.tsx

```
// components/ContinueCard.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRecentViews, formatRelativeTime } from '@/hooks/useRecentViews';

// ==================== Icons ====================
function IconBookmark() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
function IconTelegram() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
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
function IconClose() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ==================== Component ====================
export function ContinueCard() {
  const { recent, addView, mounted } = useRecentViews();
  const [dismissed, setDismissed] = useState(false);

  // لا تظهر قبل mount (تجنّب hydration mismatch)
  if (!mounted) return null;

  // لا تظهر لو مافيه سجل أو تم الإخفاء
  if (recent.length === 0 || dismissed) return null;

  const last = recent[0];
  const isTelegram = last.file_path.includes('t.me');
  const hasMore = recent.length > 1;

  return (
    <div className="group relative overflow-hidden rounded-3xl border-2 border-amber/40 bg-gradient-to-bl from-amber/12 via-amber/6 to-transparent shadow-[0_4px_20px_rgba(224,166,58,0.12)] backdrop-blur-sm animate-slide-up dark:border-amber/50 dark:from-amber/20 dark:via-amber/10">
      {/* زر إغلاق */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="إخفاء"
        className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink dark:hover:bg-white/10"
      >
        <IconClose />
      </button>

      <div className="flex flex-col gap-4 p-5 pr-14 sm:flex-row sm:items-center sm:justify-between">
        {/* المحتوى */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber text-ink shadow-[0_4px_14px_rgba(224,166,58,0.30)]">
            <IconBookmark />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              تابع من حيث توقفت
            </p>
            <h3 className="mt-0.5 truncate text-base font-black text-ink sm:text-lg">
              {last.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink/55">
              <span className="font-bold text-teal">{last.subject_name}</span>
              <span className="text-ink/30">·</span>
              <span className="inline-flex items-center gap-1">
                <IconClock />
                {formatRelativeTime(last.viewed_at)}
              </span>
            </div>
          </div>
        </div>

        {/* الأزرار */}
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          <a
            href={last.file_path}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              addView({
                id: last.id,
                title: last.title,
                subject_name: last.subject_name,
                file_path: last.file_path,
              })
            }
            className="inline-flex items-center gap-2 rounded-xl bg-amber px-5 py-2.5 text-sm font-black text-ink shadow-[0_2px_10px_rgba(224,166,58,0.30)] transition-all duration-200 hover:bg-amber-soft active:scale-95"
          >
            {isTelegram ? <IconTelegram /> : <IconPlay />}
            متابعة القراءة
          </a>

          {hasMore && (
            <Link
              href="/lawazem"
              className="inline-flex items-center rounded-xl border border-line bg-white/80 px-4 py-2.5 text-sm font-bold text-ink/70 transition-all hover:border-ink/20 hover:bg-paper active:scale-95 dark:bg-white/[0.06]"
            >
              كل الملازم
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
```

## components\LiveFeed.tsx

```
// components/LiveFeed.tsx
'use client';

import { useEffect, useState } from 'react';
import { postJson } from '@/lib/api-client';
import type { Stage } from '@/lib/types';

// ==================== Types ====================
type FeedType = 'lecture_note' | 'channel' | 'subject' | 'channel_content';

interface FeedItem {
  id: string;
  type: FeedType;
  title: string;
  context: string;
  created_at: string;
  link: string | null;
}

interface Props {
  stage: Stage;
}

// ==================== Icons ====================
function IconDoc() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconChannel() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v6.75L6 15v1.5h12V15l-3-3.75V4.5M12 16.5V21" />
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
function IconExternal() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

// ==================== Helpers ====================
function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'الآن';
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  if (hours < 24) return `قبل ${hours} ساعة`;
  if (days === 1) return 'أمس';
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
  return `قبل ${Math.floor(days / 30)} شهر`;
}

function getTypeConfig(type: FeedType): {
  label: string;
  icon: React.ReactNode;
  styles: string;
} {
  switch (type) {
    case 'lecture_note':
      return {
        label: 'ملزمة جديدة',
        icon: <IconDoc />,
        styles: 'bg-teal/10 text-teal dark:bg-teal/20',
      };
    case 'channel':
      return {
        label: 'قناة جديدة',
        icon: <IconChannel />,
        styles: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
      };
    case 'subject':
      return {
        label: 'مادة جديدة',
        icon: <IconBook />,
        styles: 'bg-amber/15 text-amber-800 dark:bg-amber/25 dark:text-amber-300',
      };
    case 'channel_content':
      return {
        label: 'محتوى جديد',
        icon: <IconPin />,
        styles: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
      };
  }
}

// ==================== Feed Item ====================
function FeedItemRow({ item }: { item: FeedItem }) {
  const cfg = getTypeConfig(item.type);

  const inner = (
    <div className="flex items-start gap-3">
      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${cfg.styles} ${item.link ? 'group-hover:scale-110' : ''}`}>
        {cfg.icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink transition-colors group-hover:text-teal">
          {item.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink/50">
          {item.context && <span className="truncate">{item.context}</span>}
          {item.context && <span className="text-ink/30">·</span>}
          <span className="inline-flex items-center gap-0.5">
            <IconClock />
            {formatRelativeTime(item.created_at)}
          </span>
        </div>
      </div>

      {item.link && (
        <span className="flex-shrink-0 text-ink/20 transition-colors group-hover:text-teal">
          <IconExternal />
        </span>
      )}
    </div>
  );

  if (item.link) {
    return (
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-xl border border-transparent p-2.5 transition-all duration-200 hover:border-teal/20 hover:bg-white hover:shadow-[0_2px_8px_rgba(14,74,74,0.06)] dark:hover:bg-paper"
      >
        {inner}
      </a>
    );
  }

  return (
    <div className="group rounded-xl border border-transparent p-2.5">
      {inner}
    </div>
  );
}

// ==================== Component ====================
export function LiveFeed({ stage }: Props) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await postJson<{ items: FeedItem[] }>('/api/feed', { stage });
        if (cancelled) return;
        setItems(data.items ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'فشل تحميل التحديثات');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [stage]);

  // Skeleton
  if (loading) {
    return (
      <div className="rounded-3xl border border-line bg-white/70 p-5 backdrop-blur-sm dark:bg-paper/70">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-7 w-7 skeleton-shimmer rounded-lg" />
          <div className="h-5 w-32 skeleton-shimmer rounded" />
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 skeleton-shimmer rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="rounded-3xl border border-line bg-white/70 p-5 backdrop-blur-sm dark:bg-paper/70">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal/10 text-teal">
            <IconSparkles />
          </span>
          <h2 className="text-base font-extrabold text-ink">آخر التحديثات</h2>
        </div>
        <p className="text-sm text-ink/50">تعذّر تحميل التحديثات الآن.</p>
      </div>
    );
  }

  // Empty
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-line bg-white/70 p-6 text-center backdrop-blur-sm dark:bg-paper/70">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/8 text-teal">
          <IconSparkles />
        </div>
        <p className="mt-3 text-sm font-bold text-ink/60">
          لا توجد تحديثات بعد
        </p>
        <p className="mt-1 text-xs text-ink/40">
          كل جديد سيظهر هنا تلقائياً
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-line bg-white/70 p-3 backdrop-blur-sm dark:bg-paper/70">
      <div className="mb-1 flex items-center justify-between gap-2 px-2 pt-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal/10 text-teal">
            <IconSparkles />
          </span>
          <h2 className="text-base font-extrabold text-ink">آخر التحديثات</h2>
        </div>
        <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-black text-teal dark:bg-teal/20">
          مباشر
        </span>
      </div>

      <div className="space-y-0.5">
        {items.map((item) => (
          <FeedItemRow key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  );
}
```

## components\MobileBottomNav.tsx

```
// components/MobileBottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  accent?: 'amber';
}

const BASE_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'الرئيسية',
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    href: '/lawazem',
    label: 'الملازم',
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    href: '/channels',
    label: 'القنوات',
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
  {
    href: '/dictionary',
    label: 'القاموس',
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6v0a6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3M8 15v1a6 6 0 006 6v0a6 6 0 006-6v-4"
        />
        <circle cx="20" cy="10" r="2" />
      </svg>
    ),
  },
  {
    href: '/schedule',
    label: 'الجدول',
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    href: '/gpa',
    label: 'المعدل',
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

const STAGE_2_ITEM: NavItem = {
  href: '/group-swap',
  label: 'تبديل',
  accent: 'amber',
  icon: (
    <svg
      className="h-[18px] w-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
      />
    </svg>
  ),
};

export function MobileBottomNav() {
  const pathname = usePathname();
  const [stage, setStage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      setStage(localStorage.getItem('student_stage'));
    } catch {
      /* تجاهل */
    }
    setMounted(true);
  }, []);

  // لا تظهر في صفحات الإدارة أو بوابة القناة
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/channel-portal')
  ) {
    return null;
  }

  const showSwap = mounted && stage === 'المرحلة الثانية';
  const items = showSwap ? [...BASE_ITEMS, STAGE_2_ITEM] : BASE_ITEMS;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="التنقل السفلي"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href + '/'));
          const isAmber = item.accent === 'amber';

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold transition-all duration-200 active:scale-95 ${
                active
                  ? isAmber
                    ? 'bg-amber/15 text-amber-800 dark:bg-amber/25 dark:text-amber-300'
                    : 'bg-teal/10 text-teal'
                  : isAmber
                  ? 'text-amber-700 hover:bg-amber/10 dark:text-amber-300 dark:hover:bg-amber/15'
                  : 'text-ink/55 hover:bg-ink/5 hover:text-ink'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {item.icon}
              <span className="whitespace-nowrap leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

## components\NavBar.tsx

```
// components/NavBar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { href: '/lawazem', label: 'الملازم' },
  { href: '/channels', label: 'القنوات' },
  { href: '/schedule', label: 'الجدول' },
  { href: '/dictionary', label: 'القاموس' },    // ← جديد
  { href: '/gpa', label: 'المعدل' },
] as const;

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-paper/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex flex-shrink-0 items-center gap-2 transition-transform active:scale-95">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </span>
          <span className="text-base font-black text-ink sm:text-lg">لوازم</span>
        </Link>

        <div className="hidden flex-1 items-center justify-end gap-1.5 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex-shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-bold transition-all duration-200 ${
                  active
                    ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.20)]'
                    : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-shrink-0 items-center md:border-r-0 md:pr-0">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
```

## components\RecentViewsCard.tsx

```
// components/RecentViewsCard.tsx
'use client';

import { useRecentViews, formatRelativeTime } from '@/hooks/useRecentViews';

function IconClock() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconTelegram() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function RecentViewsCard() {
  const { recent, clearAll, mounted } = useRecentViews();

  // لا تظهر شيئًا قبل mount (تجنب hydration mismatch)
  if (!mounted) return null;

  // لا تظهر شيئًا إن كانت فارغة
  if (recent.length === 0) return null;

  return (
    <section className="animate-slide-up">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber/15 text-amber-800">
            <IconClock />
          </span>
          آخر ما زرته
        </h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-bold text-ink/40 transition-colors hover:text-red-600"
        >
          مسح
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {recent.map((view) => {
          const isTelegram = view.file_path.includes('t.me');
          return (
            <a
              key={view.id}
              href={view.file_path}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-line bg-white/80 p-3 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/30 hover:shadow-[0_4px_16px_rgba(14,74,74,0.08)] active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal/8 text-teal transition-all duration-200 group-hover:bg-teal group-hover:text-white">
                <IconDoc />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink transition-colors group-hover:text-teal">
                  {view.title}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink/50">
                  <span className="truncate">{view.subject_name}</span>
                  <span>·</span>
                  <span className="flex-shrink-0">{formatRelativeTime(view.viewed_at)}</span>
                </div>
              </div>

              <span className="flex-shrink-0 text-ink/30 transition-colors group-hover:text-teal">
                {isTelegram ? <IconTelegram /> : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
```

## components\ReportModal.tsx

```
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
```

## components\ThemeProvider.tsx

```
// components/ThemeProvider.tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  // ===== تحميل الثيم المحفوظ أو المفضّل =====
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme') as Theme | null;
      const preferred: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      const initial = saved ?? preferred;
      setThemeState(initial);
      document.documentElement.classList.toggle('dark', initial === 'dark');
    } catch {
      /* في حال فشل localStorage */
    }
  }, []);

  // ===== تغيير الثيم =====
  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* تجاهل */
    }
    document.documentElement.classList.toggle('dark', next === 'dark');
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

## components\ThemeToggle.tsx

```
// components/ThemeToggle.tsx
'use client';

import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'التحويل إلى الوضع الليلي' : 'التحويل إلى الوضع النهاري'}
      title={theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}
      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg text-ink/60 transition-all duration-200 hover:bg-ink/5 hover:text-ink active:scale-95"
    >
      {/* الشمس */}
      <svg
        className={`absolute h-4 w-4 transition-all duration-300 ${
          theme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      {/* القمر */}
      <svg
        className={`absolute h-4 w-4 transition-all duration-300 ${
          theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
  );
}
```

## components\ui\Button.tsx

```
// components/ui/Button.tsx
'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'amber';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] hover:bg-teal-light hover:shadow-[0_4px_14px_rgba(14,74,74,0.30)] dark:bg-teal dark:hover:bg-teal-light',
  secondary:
    'bg-white text-ink border border-line shadow-[0_1px_2px_rgba(26,33,31,0.04)] hover:bg-paper hover:border-ink/20 dark:bg-white/[0.06] dark:text-ink dark:hover:bg-white/[0.10] dark:hover:border-ink/30',
  outline:
    'bg-transparent text-teal border-2 border-teal/30 hover:bg-teal/5 hover:border-teal/60 dark:text-teal dark:border-teal/40 dark:hover:bg-teal/10 dark:hover:border-teal/60',
  danger:
    'bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/50 dark:hover:border-red-800',
  ghost: 'bg-transparent text-ink/70 hover:bg-ink/5 hover:text-ink dark:text-ink/70 dark:hover:bg-white/5 dark:hover:text-ink',
  amber:
    'bg-amber text-ink shadow-[0_2px_8px_rgba(224,166,58,0.28)] hover:bg-amber-soft dark:bg-amber dark:text-ink dark:hover:bg-amber-soft',
};

const SIZES: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-md',
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-13 px-7 text-base gap-2.5 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, disabled, children, className = '', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex select-none items-center justify-center font-bold tracking-tight transition-all duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <svg className="h-4 w-4 flex-shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
});
```

## components\ui\ConfirmDialog.tsx

```
// components/ui/ConfirmDialog.tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Button } from './Button';

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
}

interface State extends ConfirmOptions {
  message: string;
  resolve: (v: boolean) => void;
}

interface ConfirmContextValue {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);

  const confirm = useCallback(
    (message: string, options?: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setState({ message, ...options, resolve })),
    []
  );

  const close = useCallback((result: boolean) => {
    setState((current) => {
      if (!current) return null;
      current.resolve(result);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!state) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, close]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => close(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-line bg-paper p-6 shadow-[0_24px_60px_rgba(26,33,31,0.30)] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            {state.title && <h3 className="mt-4 text-lg font-extrabold text-ink">{state.title}</h3>}
            <p className="mt-2 text-sm leading-relaxed text-ink/70">{state.message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => close(false)}>
                {state.cancelLabel ?? 'إلغاء'}
              </Button>
              <Button variant={state.variant ?? 'danger'} size="sm" onClick={() => close(true)}>
                {state.confirmLabel ?? 'تأكيد'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx.confirm;
}
```

## components\ui\DropZone.tsx

```
// components/ui/DropZone.tsx
'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';

interface DropZoneProps {
  onFileSelected: (file: File) => void | Promise<void>;
  accept?: Record<string, string[]>;
  maxSizeMB?: number;
  uploading?: boolean;
  disabled?: boolean;
}

const DEFAULT_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
};

export function DropZone({
  onFileSelected,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 50,
  uploading = false,
  disabled = false,
}: DropZoneProps) {
  const [error, setError] = useState('');

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setError('');

      if (rejectedFiles.length > 0) {
        const reason = rejectedFiles[0].errors[0]?.code;
        if (reason === 'file-too-large') {
          setError(`حجم الملف كبير جداً (بحد أقصى ${maxSizeMB} ميجا)`);
        } else if (reason === 'file-invalid-type') {
          setError('نوع الملف غير مدعوم');
        } else if (reason === 'too-many-files') {
          setError('اختر ملفاً واحداً فقط');
        } else {
          setError('فشل اختيار الملف');
        }
        return;
      }

      if (acceptedFiles[0]) {
        try {
          await onFileSelected(acceptedFiles[0]);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'فشل رفع الملف');
        }
      }
    },
    [onFileSelected, maxSizeMB]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
    disabled: uploading || disabled,
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
          isDragActive
            ? 'border-teal bg-teal/5 dark:bg-teal/10'
            : 'border-line bg-paper/50 hover:border-teal/40 hover:bg-teal/[0.03] dark:bg-paper-deep/40 dark:hover:bg-teal/5'
        } ${uploading ? 'cursor-wait opacity-60' : ''} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <input {...getInputProps()} />

        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${
            isDragActive ? 'bg-teal/15 text-teal' : 'bg-teal/8 text-teal'
          }`}
        >
          {uploading ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : isDragActive ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
        </span>

        <div>
          <p className="text-sm font-bold text-ink/80">
            {uploading
              ? 'جاري الرفع...'
              : isDragActive
              ? 'أفلت الملف هنا'
              : 'اسحب الملف هنا أو اضغط للاختيار'}
          </p>
          <p className="mt-1 text-xs text-ink/50">
            PDF, Word, PowerPoint, صور — بحد أقصى {maxSizeMB} ميجا
          </p>
        </div>
      </div>

      {error && (
        <p
          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
```

## components\ui\Field.tsx

```
// components/ui/Field.tsx
'use client';

import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react';

const BASE =
  'w-full rounded-xl border-2 border-line bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/35 transition-all duration-200 focus:border-teal focus:bg-white focus:outline-none focus:shadow-[0_0_0_4px_rgba(14,74,74,0.10)] hover:border-ink/20 disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-60 dark:bg-white/[0.06] dark:text-ink dark:placeholder:text-ink/40 dark:hover:bg-white/[0.08] dark:hover:border-ink/30 dark:focus:bg-white/[0.08] dark:focus:border-teal dark:focus:shadow-[0_0_0_4px_rgba(77,184,184,0.15)] dark:disabled:bg-white/[0.02]';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...rest }, ref) {
    return <input ref={ref} className={`${BASE} ${className}`} {...rest} />;
  }
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...rest }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`${BASE} cursor-pointer appearance-none pl-10 pr-4 ${className}`}
          {...rest}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={`${BASE} resize-none leading-relaxed ${className}`}
        {...rest}
      />
    );
  }
);

export function FieldGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`space-y-3 rounded-2xl border border-line bg-white/70 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] dark:bg-white/[0.03] ${className}`}
    >
      {children}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
  className = '',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`group flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink/80 transition-all duration-200 hover:border-teal/40 has-[:checked]:border-teal has-[:checked]:bg-teal/5 has-[:checked]:text-ink dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:hover:border-teal/40 dark:has-[:checked]:bg-teal/15 ${className}`}
    >
      <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-line bg-white transition-all duration-200 checked:border-teal checked:bg-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 focus-visible:ring-offset-2 dark:bg-white/[0.06] dark:border-line"
        />
        <svg
          className="pointer-events-none absolute h-3 w-3 scale-0 text-white opacity-0 transition-all duration-150 peer-checked:scale-100 peer-checked:opacity-100"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <span className="flex-1">{children}</span>
    </label>
  );
}
```

## components\ui\TagInput.tsx

```
// components/ui/TagInput.tsx
'use client';

import { useState, type KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
}

export function TagInput({
  tags,
  onChange,
  placeholder = 'أضف وسماً...',
  maxTags = 10,
  suggestions = [],
}: TagInputProps) {
  const [input, setInput] = useState('');

  function addTag(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setInput('');
      return;
    }
    if (tags.length >= maxTags) return;
    onChange([...tags, trimmed]);
    setInput('');
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  const filteredSuggestions = suggestions
    .filter((s) => !tags.includes(s) && s.includes(input.trim()))
    .slice(0, 6);

  const reachedMax = tags.length >= maxTags;

  return (
    <div className="space-y-2">
      <div className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl border-2 border-line bg-white px-3 py-2 transition-all duration-200 focus-within:border-teal focus-within:shadow-[0_0_0_4px_rgba(14,74,74,0.10)] dark:bg-white/[0.06] dark:focus-within:bg-white/[0.08] dark:focus-within:shadow-[0_0_0_4px_rgba(77,184,184,0.15)]">
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-bold text-teal dark:bg-teal/20"
          >
            <span>#{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-teal/20 dark:hover:bg-teal/30"
              aria-label={`حذف ${tag}`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(input)}
          placeholder={tags.length === 0 ? placeholder : ''}
          disabled={reachedMax}
          className="min-w-[100px] flex-1 bg-transparent text-sm text-ink placeholder:text-ink/35 focus:outline-none disabled:cursor-not-allowed dark:placeholder:text-ink/40"
        />
      </div>

      {input && filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink/70 transition-all duration-150 hover:border-teal hover:bg-teal/5 hover:text-teal active:scale-95 dark:bg-white/[0.06] dark:hover:bg-teal/10"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-ink/40">
        {reachedMax
          ? `وصلت إلى الحد الأقصى (${maxTags} وسوم)`
          : `اضغط Enter أو فاصلة لإضافة وسم — ${tags.length}/${maxTags}`}
      </p>
    </div>
  );
}
```

## components\ui\Toast.tsx

```
// components/ui/Toast.tsx
'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; message: string; type: ToastType }
interface ToastContextValue { show: (msg: string, type?: ToastType) => void }

const ToastContext = createContext<ToastContextValue | null>(null);

const STYLES: Record<ToastType, { bg: string; icon: ReactNode }> = {
  success: {
    bg: 'bg-teal text-white',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    bg: 'bg-red-600 text-white',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  info: {
    bg: 'bg-ink text-white',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const s = STYLES[t.type];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl px-5 py-3 text-sm font-bold shadow-[0_10px_30px_rgba(26,33,31,0.20)] ${s.bg} animate-slide-up`}
            >
              <span className="flex-shrink-0">{s.icon}</span>
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
```

## eslint.config.mjs

```
// eslint.config.mjs
import { globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    rules: {
      // React 19's new rule is too strict for client-side data fetching.
      // Next.js's own docs still recommend useEffect for this pattern.
      "react-hooks/set-state-in-effect": "off",
      // We use <img> for user-uploaded Supabase images. next/image would
      // require configuring remotePatterns and would add Vercel costs.
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
];

export default eslintConfig;
```

## export-project.ps1

```
$exclude = @('node_modules', '.next', '.git', '.env.local', 'package-lock.json', 'public\notes', '.ico')
$outputFile = "project-export.md"
$root = (Get-Location).Path

if (Test-Path $outputFile) { Remove-Item $outputFile }

$sb = New-Object System.Text.StringBuilder

Get-ChildItem -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($root.Length + 1)
    $skip = $false
    foreach ($ex in $exclude) {
        if ($rel -like "*$ex*") { $skip = $true }
    }
    -not $skip
} | Sort-Object FullName | ForEach-Object {
    $rel = $_.FullName.Substring($root.Length + 1)
    $content = [System.IO.File]::ReadAllText($_.FullName)
    [void]$sb.AppendLine("`n## $rel`n")
    [void]$sb.AppendLine('```')
    [void]$sb.AppendLine($content)
    [void]$sb.AppendLine('```')
}

[System.IO.File]::WriteAllText("$root\$outputFile", $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Host "تم إنشاء الملف: $outputFile"
```

## hooks\useBookmarks.ts

```
// hooks/useBookmarks.ts
'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lawazem_bookmarked_notes';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // ===== تحميل المحفوظ =====
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBookmarks(parsed.filter((id): id is string => typeof id === 'string'));
        }
      }
    } catch {
      /* تجاهل الأخطاء */
    }
    setMounted(true);
  }, []);

  // ===== تبديل حالة الحفظ =====
  const toggle = useCallback((noteId: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* قد تكون المساحة ممتلئة */
      }
      return next;
    });
  }, []);

  // ===== التحقق =====
  const isBookmarked = useCallback(
    (noteId: string) => bookmarks.includes(noteId),
    [bookmarks]
  );

  // ===== مسح الكل =====
  const clearAll = useCallback(() => {
    setBookmarks([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* تجاهل */
    }
  }, []);

  return {
    bookmarks,
    toggle,
    isBookmarked,
    clearAll,
    mounted,
    count: bookmarks.length,
  };
}
```

## hooks\useRecentViews.ts

```
// hooks/useRecentViews.ts
'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lawazem_recent_views';
const MAX_ITEMS = 6;

export interface RecentView {
  id: string;
  title: string;
  subject_name: string;
  file_path: string;
  viewed_at: number;
}

export function useRecentViews() {
  const [recent, setRecent] = useState<RecentView[]>([]);
  const [mounted, setMounted] = useState(false);

  // ===== تحميل المحفوظ =====
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecent(parsed);
        }
      }
    } catch {
      /* تجاهل */
    }
    setMounted(true);
  }, []);

  // ===== إضافة زيارة جديدة =====
  const addView = useCallback(
    (view: Omit<RecentView, 'viewed_at'>) => {
      setRecent((prev) => {
        // إزالة الزيارة احاليابقة لنفس الملزمة (لتحديث وقتها)
        const filtered = prev.filter((v) => v.id !== view.id);
        // إضافة في المقدمة + تحديد الحد الأقصى
        const next = [
          { ...view, viewed_at: Date.now() },
          ...filtered,
        ].slice(0, MAX_ITEMS);

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* تجاهل */
        }
        return next;
      });
    },
    []
  );

  // ===== مسح الكل =====
  const clearAll = useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* تجاهل */
    }
  }, []);

  return { recent, addView, clearAll, mounted };
}

// ===== تنسيق الوقت النسبي =====
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'الآن';
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  if (hours < 24) return `قبل ${hours} ساعة`;
  if (days === 1) return 'أمس';
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
  return 'منذ فترة';
}
```

## hooks\useStudentStage.ts

```
// hooks/useStudentStage.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Stage } from '@/lib/types';

interface Result {
  stage: Stage | null;
  ready: boolean;
}

/**
 * يقرأ المرحلة المختارة من localStorage ويحوّل الطالب للرئيسية إذا ما اختار.
 */
export function useStudentStage(): Result {
  const router = useRouter();
  const [stage, setStage] = useState<Stage | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.studentStage) as Stage | null;
    if (!saved) {
      router.replace('/');
      return;
    }
    setStage(saved);
    setReady(true);
  }, [router]);

  return { stage, ready };
}
```

## lib\api-client.ts

```
// lib/api-client.ts
import { supabase } from './supabaseClient';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function postJson<TResponse = unknown, TBody = unknown>(
  url: string,
  body: TBody,
  init?: RequestInit
): Promise<TResponse> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...init,
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* response wasn't JSON */
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : null) || `فشل الطلب (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as TResponse;
}

export async function uploadToStorage(
  bucket: string,
  filePath: string,
  file: File | Blob,
  options?: { upsert?: boolean }
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, options);
  if (error) throw new ApiError(`فشل رفع الملف: ${error.message}`, 500);
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

export function buildStoragePath(prefix: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  return `${prefix}/${Date.now()}-${safeName}`;
}
```

## lib\api-server.ts

```
// lib/api-server.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from './supabaseAdmin';

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T extends object>(data: T) {
  return NextResponse.json(data);
}

export function requireAdminPassword(password: unknown): boolean {
  return typeof password === 'string' && password === process.env.ADMIN_PASSWORD;
}

type AdminGuardResult =
  | { ok: true; supabaseAdmin: ReturnType<typeof getSupabaseAdmin> }
  | { ok: false; response: NextResponse };

export function adminGuard(password: unknown): AdminGuardResult {
  if (!requireAdminPassword(password)) {
    return { ok: false, response: jsonError('كلمة المرور غير صحيحة', 401) };
  }
  return { ok: true, supabaseAdmin: getSupabaseAdmin() };
}

export function safeString(value: unknown, max = 5000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export function safeOptionalString(value: unknown, max = 5000): string | null {
  const s = safeString(value, max);
  return s === '' ? null : s;
}
```

## lib\constants.ts

```
// lib/constants.ts
import type { ContentType, Stage } from './types';

export const STAGES: readonly Stage[] = [
  'المرحلة الأولى',
  'المرحلة الثانية',
  'المرحلة الثالثة',
] as const;

export const CONTENT_TYPES: readonly ContentType[] = [
  'assignment',
  'lecture_note',
  'summary',
  'task',
] as const;

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  assignment: 'واجب',
  lecture_note: 'ملزمة',
  summary: 'ملخص',
  task: 'مهمة | سشن',
};

export const STORAGE_KEYS = {
  studentStage: 'student_stage',
  adminPassword: 'admin_password',
  channelId: 'channel_id',
  channelPassword: 'channel_password',
} as const;

export const STORAGE_BUCKETS = {
  scheduleImages: 'schedule-images',
  channelImages: 'channel-images',
  channelFiles: 'channel-files',
} as const;

export const STUDY_FORMATS = [
  'شرح مبسط وواضح لمحتوى السلايد خطوة بخطوة',
  'أسئلة اختيار من متعدد (MCQ) للمراجعة مع الإجابات الصحيحة وتوضيح كل خيار',
  'فلاش كاردز (سؤال وجواب) للحفظ السريع',
  'ملخص نقطي سريع ومركز',
  'أسئلة نقاش عميقة تساعد على الفهم لا الحفظ',
  'مراجعة شاملة وتجميعية آخر المحاضرة بعد إرسال كل السلايدات',
] as const;

export type StudyFormat = (typeof STUDY_FORMATS)[number];

export const STUDY_FORMAT_LABELS: Record<StudyFormat, string> = {
  'شرح مبسط وواضح لمحتوى السلايد خطوة بخطوة': 'شرح مبسط',
  'أسئلة اختيار من متعدد (MCQ) للمراجعة مع الإجابات الصحيحة وتوضيح كل خيار': 'أسئلة اختيار من متعدد (MCQ)',
  'فلاش كاردز (سؤال وجواب) للحفظ السريع': 'فلاش كاردز',
  'ملخص نقطي سريع ومركز': 'ملخص نقطي',
  'أسئلة نقاش عميقة تساعد على الفهم لا الحفظ': 'أسئلة نقاش عميقة',
  'مراجعة شاملة وتجميعية آخر المحاضرة بعد إرسال كل السلايدات': 'مراجعة شاملة آخر المحاضرة',
};

export const MATERIAL_METHODS = [
  {
    value: 'الطالب راح يرسل صورة سلايد واحد بكل رسالة، سلايد بعد سلايد لين نهاية المحاضرة',
    label: 'إرسال صور السلايدات (سلايد بكل رسالة)',
  },
  {
    value: 'الطالب راح يرسل ملف الملزمة (PDF) كامل دفعة وحدة برسالة وحدة',
    label: 'إرسال ملف الملزمة كامل دفعة وحدة',
  },
  {
    value: 'الطالب راح ينسخ نص جزء من الملزمة ويلصقه بكل رسالة، جزء بعد جزء',
    label: 'نسخ ولصق نص الملزمة على أجزاء',
  },
] as const;
```

## lib\strings.ts

```
// lib/strings.ts
/**
 * ملف النصوص المركزي
 * كل النصوص العربية للموقع موجودة هنا بصيغة فصحى رسمية.
 * تعديل أي نص هنا يظهر في كل مكان يستخدمه.
 */

export const strings = {
  // ==================== عام ====================
  common: {
    appName: 'لوازم',
    loading: 'جاري التحميل...',
    backToHome: 'العودة إلى لوحة الأقسام',
    backToChannels: 'العودة إلى القنوات',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    confirm: 'تأكيد',
    retry: 'إعادة المحاولة',
    all: 'الكل',
    filter: 'تصفية',
    remove: 'إزالة',
    copied: 'تم النسخ',
    copy: 'نسخ',
    close: 'إغلاق',
  },

  // ==================== التنقل ====================
  nav: {
    home: 'الرئيسية',
    lawazem: 'الملازم',
    channels: 'القنوات',
    schedule: 'الجدول',
    studyPrompt: 'أدوات الدراسة',
    gpa: 'المعدل',
    bottomNavLabel: 'التنقل السفلي',
  },

  // ==================== الصفحة الرئيسية ====================
  home: {
    badge: 'منصة لطلبة جامعة العميد',
    chooseStage: 'اختر مرحلتك الدراسية',
    chooseStageDesc: 'نعرض لك المحتوى المناسب لمرحلتك — قنوات، جداول، وكل ما تحتاجه.',
    changeStageHint: 'يمكنك تغييرها لاحقاً في أي وقت',
    greeting: 'ماذا تحتاج اليوم؟',
    greetingDesc: 'كل شيء في مكان واحد — اختر القسم الذي تحتاجه',
    changeStage: 'تغيير المرحلة',
    chooseAction: 'اختر',
    openAction: 'فتح',
    footer:
      'صُنع بكل حب لطلاب كلية الطب · جامعة العميد · برمجة وإعداد الطالب: علي مازن @E_W_9',
    sections: {
      lawazem: 'الملازم',
      lawazemDesc: 'ملازم الدكاترة مرتبة حسب المادة',
      channels: 'القنوات الدراسية',
      channelsDesc: 'دليل قنوات التلغرام الدراسية',
      schedule: 'الجدول',
      scheduleDesc: 'جدول المحاضرات الأسبوعي لمرحلتك',
      studyPrompt: 'أدوات الدراسة',
      studyPromptDesc: 'برومبت ذكي يدرس معك بالذكاء الاصطناعي',
      gpa: 'المعدل',
      gpaDesc: 'احفظ درجاتك واحسب معدلك الموزون حسب وحدات موادك',
    },
  },

  // ==================== الملازم ====================
  lawazem: {
    title: 'الملازم والمصادر',
    backLink: 'العودة إلى لوحة الأقسام',
    searchPlaceholder: 'ابحث باسم الملزمة، الدكتور، أو وسم...',
    filterLabel: 'تصفية:',
    summaryPrefix: 'ملزمة موزعة على',
    summaryMiddle: 'مادة',
    emptySubjects: 'لا توجد مواد مضافة لمرحلتك حالياً.',
    emptyNotes: 'لا توجد ملفات حالياً.',
    emptyNotesShort: 'لا توجد ملفات حالياً',
    noResults: 'لا توجد نتائج مطابقة',
    noResultsFor: (search: string) => `البحث: «${search}»`,
    noResultsTag: (tag: string) => `الوسم: #${tag}`,
    doctorCount: (n: number) => (n === 1 ? 'دكتور' : 'دكاترة'),
    noteCount: (n: number) => (n === 1 ? 'ملزمة' : 'ملازم'),
    withoutDoctor: 'بدون دكتور',
    doctorPrefix: 'د.',
    lectureLabel: 'محاضرة',
    trackTheoretical: 'نظري',
    trackPractical: 'عملي',
    bookmark: 'إضافة إلى المفضلة',
    removeBookmark: 'إزالة من المفضلة',
    openOnTelegram: 'فتح على تلغرام',
    openFile: 'فتح الملف',
  },

  // ==================== آخر ما زرته ====================
  recent: {
    title: 'آخر ما زرته',
    clear: 'مسح',
    justNow: 'الآن',
    minutesAgo: (n: number) => `قبل ${n} دقيقة`,
    hoursAgo: (n: number) => `قبل ${n} ساعة`,
    yesterday: 'أمس',
    daysAgo: (n: number) => `قبل ${n} أيام`,
    weeksAgo: (n: number) => `قبل ${n} أسابيع`,
    longAgo: 'منذ فترة',
  },

  // ==================== القنوات ====================
  channels: {
    title: 'قنوات الدراسة',
    backLink: 'العودة إلى لوحة الأقسام',
    searchPlaceholder: 'ابحث باسم القناة...',
    searchContentPlaceholder: 'ابحث بعنوان المحتوى...',
    channelsCount: (n: number) =>
      n === 1 ? 'قناة متاحة لمرحلتك' : `${n} قناة متاحة لمرحلتك`,
    empty: 'لا توجد قنوات مضافة لمرحلتك حالياً.',
    checkLater: 'يرجى العودة لاحقاً',
    noResults: 'لا توجد نتائج مطابقة',
    openChannel: 'فتح صفحة القناة',
    openTelegram: 'فتح القناة على تلغرام',
    notFound: 'لم نجد هذه القناة.',
    pinned: 'مثبّت',
    emptyContent: 'لا يوجد محتوى مضاف لهذه القناة حالياً.',
    emptySearchContent: 'لا توجد نتائج مطابقة لبحثك',
    filePrefix: (n: number) => `ملف ${n}`,
    dueDateLabel: 'تاريخ التسليم:',
    dueExpired: 'انتهى الموعد',
    dueToday: 'التسليم اليوم!',
    dueSoon: (days: number, date: string) =>
      `تاريخ التسليم: ${date} (بعد ${days} ${days === 1 ? 'يوم' : 'أيام'})`,
  },

  // ==================== الجدول ====================
  schedule: {
    title: 'جدول المحاضرات',
    backLink: 'العودة إلى لوحة الأقسام',
    empty: 'لا يوجد جدول مرفوع لمرحلتك حالياً.',
    checkLater: 'يرجى العودة لاحقاً',
    openFullSize: 'فتح الصورة بحجم كامل',
  },

  // ==================== المعدل ====================
  gpa: {
    title: 'المعدل',
    backLink: 'العودة إلى لوحة الأقسام',
    description:
      'افتح كل مادة وأدخل درجاتك أولاً بأول على مدار السنة. يمكنك تعديل «من كم» لكل محطة إذا كانت تختلف بكل مادة. الدرجات تُحفظ في متصفحك فقط.',
    empty: 'لا توجد مواد مضافة لمرحلتك حالياً.',
    progress: 'التقدم',
    progressText: (entered: number, total: number) => `${entered} من ${total} مادة`,
    units: 'وحدة',
    noScores: 'لا توجد درجات',
    yourScorePlaceholder: 'درجتك',
    fromLabel: 'من',
    finalAverage: 'معدلك النهائي',
    partialAverage: 'معدلك الحالي (جزئي)',
    enterScores: 'أدخل درجاتك ليظهر معدلك.',
    clearAll: 'مسح كل الدرجات',
    confirmClear: 'حذف كل الدرجات المدخلة لهذه المرحلة. هل أنت متأكد؟',
    components: {
      first: 'الفصل الأول',
      mid: 'المد',
      second: 'الفصل الثاني',
      finalTheory: 'الفاينل (نظري)',
      finalPractical: 'الفاينل (عملي)',
    },
  },

  // ==================== أدوات الدراسة ====================
  studyPrompt: {
    title: 'أدوات الدراسة',
    backLink: 'العودة إلى لوحة الأقسام',
    description:
      'اختر مادتك وطريقة إرسال المحتوى، وسنصيغ لك برومبت احترافي تنسخه وتستخدمه في أي أداة ذكاء اصطناعي.',
    empty: 'لا توجد مواد مضافة لمرحلتك حالياً.',
    subjectLabel: 'المادة',
    methodLabel: 'كيف ستزود المحتوى للذكاء الاصطناعي؟',
    formatsLabel: 'شكل الشرح المطلوب',
    formatsHint: '(يمكنك اختيار أكثر من خيار)',
    formatsError: 'اختر طريقة شرح واحدة على الأقل.',
    languageLabel: 'لغة البرومبت',
    arabic: 'بالعربية',
    english: 'بالإنجليزية',
    generateBtn: 'توليد البرومبت',
    generatingBtn: 'جاري التوليد...',
    resultReady: 'البرومبت جاهز',
    resultNote:
      'انسخ هذا النص والصقه في أي أداة ذكاء اصطناعي تفضلها، ثم ابدأ بإرسال سلايداتك حسب الطريقة التي اخترتها.',
    generateSuccess: 'تم توليد البرومبت',
    generateFailed: 'حدث خطأ، يرجى المحاولة مرة أخرى.',
    copySuccess: 'تم النسخ',
    copyFailed: 'فشل النسخ — يرجى النسخ يدوياً',
    loadFailed: 'فشل تحميل المواد',
  },

  // ==================== لوحة التحكم ====================
  admin: {
    title: 'لوحة التحكم',
    badge: 'مشرف',
    logout: 'تسجيل الخروج',
    loginTitle: 'دخول المشرف',
    loginDesc: 'أدخل كلمة مرور المشرف للوصول إلى لوحة التحكم',
    passwordPlaceholder: 'كلمة المرور',
    passwordRequired: 'أدخل كلمة المرور',
    loginBtn: 'دخول',
    loggingIn: 'جاري التحقق...',
    passwordIncorrect: 'كلمة المرور غير صحيحة',
    genericError: 'حدث خطأ، يرجى المحاولة مرة أخرى.',
    tabs: {
      subjects: 'المواد',
      materials: 'الملازم',
      channels: 'القنوات',
      schedules: 'الجدول',
    },
  },

  // ==================== المواد (لوحة التحكم) ====================
  subjects: {
    addPlaceholder: 'اسم المادة الجديدة',
    chooseStagePlaceholder: 'اختر المرحلة',
    addBtn: 'إضافة',
    empty: 'لا توجد مواد مضافة حالياً.',
    emptyHint: 'أضف أول مادة من الأعلى',
    editBtn: 'تعديل',
    deleteBtn: 'حذف',
    saveBtn: 'حفظ',
    cancelBtn: 'إلغاء',
    confirmDelete: (name: string) =>
      `حذف مادة «${name}» سيحذف جميع الملازم والأسئلة المرتبطة بها نهائياً. هل أنت متأكد؟`,
    loadFailed: 'فشل تحميل المواد',
    addSuccess: 'تمت إضافة المادة',
    addFailed: 'فشل إضافة المادة',
    editSuccess: 'تم الحفظ',
    editFailed: 'فشل الحفظ',
    deleteSuccess: 'تم الحذف',
    deleteFailed: 'فشل الحذف',
  },

  // ==================== الملازم (لوحة التحكم) ====================
  materials: {
    warningNoSubjects:
      'أضف مادة أولاً من تبويب «المواد» لتتمكن من إضافة الملازم.',
    chooseSubjectPlaceholder: 'اختر المادة',
    chooseTrackPlaceholder: 'نظري / عملي',
    trackTheoretical: 'نظري',
    trackPractical: 'عملي',
    titlePlaceholder: 'اسم الملزمة / المحاضرة',
    professorPlaceholder: 'اسم الدكتور (اختياري)',
    lectureNumberPlaceholder: 'رقم المحاضرة',
    fileSectionLabel: 'ملف الملزمة',
    fileUrlPlaceholder: 'الصق رابط تلغرام أو Supabase يدوياً',
    fileReady: 'الملف جاهز',
    telegramLink: 'رابط تلغرام',
    tagsLabel: 'الوسوم (Tags)',
    tagsSuggestions: [
      'نظري',
      'عملي',
      'محاضرة',
      'ملخص',
      'أساسيات',
      'مراجعة',
      'سلايدات',
      'امتحان',
      'واجب',
      'فاينل',
    ],
    addBtn: 'إضافة ملزمة',
    empty: 'لا توجد ملازم مضافة حالياً.',
    saveBtn: 'حفظ',
    cancelBtn: 'إلغاء',
    editBtn: 'تعديل',
    deleteBtn: 'حذف',
    confirmDelete: (title: string) =>
      `حذف الملزمة «${title}» نهائياً. هل أنت متأكد؟`,
    loadFailed: 'فشل تحميل البيانات',
    addSuccess: 'تمت إضافة الملزمة',
    addFailed: 'فشل الإضافة',
    editSuccess: 'تم الحفظ',
    editFailed: 'فشل الحفظ',
    deleteSuccess: 'تم الحذف',
    deleteFailed: 'فشل الحذف',
    uploadSuccess: 'تم رفع الملف',
    uploadFailed: 'فشل رفع الملف',
  },

  // ==================== القنوات (لوحة التحكم) ====================
  adminChannels: {
    namePlaceholder: 'اسم القناة',
    descriptionPlaceholder: 'وصف قصير (اختياري)',
    descriptionEditPlaceholder: 'الوصف',
    telegramPlaceholder: 'رابط تلغرام (https://t.me/channelname)',
    telegramEditPlaceholder: 'رابط تلغرام',
    passwordPlaceholder: 'كلمة مرور القناة',
    generateBtn: 'توليد',
    copyBtn: 'نسخ',
    copiedBtn: 'تم',
    copyFailed: 'فشل النسخ — يرجى النسخ يدوياً',
    addBtn: 'إضافة قناة',
    empty: 'لا توجد قنوات مضافة حالياً.',
    saveBtn: 'حفظ',
    cancelBtn: 'إلغاء',
    editBtn: 'تعديل',
    deleteBtn: 'حذف',
    confirmDelete: (name: string) =>
      `حذف القناة «${name}» نهائياً. هل أنت متأكد؟`,
    loadFailed: 'فشل تحميل القنوات',
    addSuccess: 'تمت إضافة القناة',
    addFailed: 'فشل الإضافة',
    editSuccess: 'تم الحفظ',
    editFailed: 'فشل الحفظ',
    deleteSuccess: 'تم الحذف',
    deleteFailed: 'فشل الحذف',
    passwordLabel: 'كلمة المرور:',
    passwordNotSet: 'غير محددة',
  },

  // ==================== الجدول (لوحة التحكم) ====================
  adminSchedules: {
    description:
      'ارفع صورة جدول المحاضرات لكل مرحلة، وستظهر للطلاب مباشرة في صفحة «الجدول».',
    changeBtn: 'تغيير',
    uploadPrompt: 'رفع صورة الجدول',
    uploadHint: 'PNG / JPG / WebP — بحد أقصى 5 ميجا',
    uploadingImage: 'جاري رفع الصورة...',
    saving: 'جاري الحفظ...',
    uploadSuccess: (stage: string) => `تم رفع جدول ${stage}`,
    uploadFailed: 'فشل رفع الصورة',
    imageLoadError: 'تعذّر تحميل الصورة الحالية.',
    uploadNew: 'رفع صورة جديدة',
    fileTypeError: 'نوع الملف غير مدعوم. استخدم PNG أو JPG أو WebP.',
    fileSizeError: 'حجم الصورة كبير جداً (بحد أقصى 5 ميجا).',
    loadFailed: 'فشل تحميل الجداول',
  },

  // ==================== بوابة القناة ====================
  channelPortal: {
    loginTitle: 'دخول صاحب القناة',
    loginDesc: 'اختر قناتك وأدخل كلمة المرور التي أعطاك إياها المشرف.',
    chooseChannelPlaceholder: 'اختر قناتك',
    passwordPlaceholder: 'كلمة مرور القناة',
    loginBtn: 'دخول',
    loggingIn: 'جاري التحقق...',
    passwordIncorrect: 'كلمة المرور غير صحيحة',
    genericError: 'حدث خطأ، يرجى المحاولة مرة أخرى.',
    channelPrefix: 'قناة:',
    viewsLabel: (n: number) => `${n} زيارة`,
    logout: 'تسجيل الخروج',
    tabs: {
      content: 'المحتوى',
      settings: 'الإعدادات',
    },
  },

  // ==================== محتوى القناة ====================
  channelContent: {
    filesLabel: 'الملفات والروابط',
    fileNamePlaceholder: (n: number) => `اسم الملف ${n} (اختياري)`,
    deleteBtn: 'حذف',
    uploading: 'جاري الرفع...',
    urlPlaceholder: 'أو الصق رابطاً بديلاً',
    addSlotBtn: '+ إضافة ملف / رابط',
    searchPlaceholder: 'ابحث بعنوان المحتوى...',
    filterAll: 'جميع الأنواع',
    folderPlaceholder: 'اسم المجلد (اختياري)',
    descriptionPlaceholder: 'تفاصيل إضافية (اختياري)',
    pinLabel: 'تثبيت هذا المنشور في أعلى القناة',
    pinned: 'مثبّت',
    dueDate: (date: string) => `تاريخ التسليم: ${date}`,
    pinTooltip: 'تثبيت',
    unpinTooltip: 'إلغاء التثبيت',
    titlePlaceholder: 'العنوان',
    addBtn: 'إضافة',
    saveBtn: 'حفظ',
    cancelBtn: 'إلغاء',
    editBtn: 'تعديل',
    deleteBtnFull: 'حذف',
    empty: 'لا يوجد محتوى مضاف حالياً.',
    emptyHint: 'أضف أول منشور من الأعلى',
    noResults: 'لا توجد نتائج مطابقة',
    fileSizeError: 'حجم الملف كبير جداً (بحد أقصى 20 ميجا).',
    loadFailed: 'فشل تحميل المحتوى',
    uploadSuccess: 'تم رفع الملف',
    uploadFailed: 'فشل رفع الملف',
    addSuccess: 'تمت إضافة المحتوى',
    addFailed: 'فشل الإضافة',
    editSuccess: 'تم الحفظ',
    editFailed: 'فشل الحفظ',
    pinFailed: 'فشل التثبيت',
    confirmDelete: (title: string) => `حذف «${title}» نهائياً. هل أنت متأكد؟`,
    deleteSuccess: 'تم الحذف',
    deleteFailed: 'فشل الحذف',
  },

  // ==================== إعدادات القناة ====================
  channelSettings: {
    infoText:
      'الاسم والمرحلة ورابط تلغرام يديرها المشرف. يمكنك تعديل الصورة والوصف فقط.',
    imageLabel: 'صورة القناة',
    changeImageBtn: 'تغيير',
    imageLoadError: 'تعذّر تحميل الصورة الحالية.',
    uploadNewImage: 'رفع صورة جديدة',
    imageUploadPrompt: 'رفع صورة للقناة',
    imageUploading: 'جاري الرفع...',
    imageHint: 'PNG / JPG / WebP / GIF — بحد أقصى 5 ميجا',
    descriptionLabel: 'وصف القناة',
    descriptionPlaceholder: 'وصف مختصر للقناة...',
    saveBtn: 'حفظ',
    unsavedChanges: 'توجد تغييرات غير محفوظة',
    imageTypeError: 'نوع الصورة غير مدعوم (PNG / JPG / WebP / GIF).',
    imageSizeError: 'حجم الصورة كبير جداً (بحد أقصى 5 ميجا).',
    imageUploadSuccess: 'تم رفع الصورة — لا تنسَ الحفظ',
    imageUploadFailed: 'فشل رفع الصورة',
    saveSuccess: 'تم حفظ بيانات القناة',
    saveFailed: 'فشل الحفظ',

    passwordSection: 'تغيير كلمة المرور',
    passwordNote:
      'بعد التغيير، لن تعمل كلمة المرور القديمة. تأكد من حفظ الجديدة في مكان آمن.',
    newPasswordLabel: 'كلمة المرور الجديدة',
    newPasswordPlaceholder: '4 أحرف على الأقل',
    confirmPasswordLabel: 'تأكيد كلمة المرور',
    confirmPasswordPlaceholder: 'أعد كتابتها',
    passwordMismatch: 'كلمتا المرور غير متطابقتين.',
    changePasswordBtn: 'تغيير كلمة المرور',
    passwordChangeSuccess: 'تم تغيير كلمة المرور',
    passwordChangeFailed: 'فشل التغيير',
  },

  // ==================== Drop Zone ====================
  dropZone: {
    dragActive: 'أفلت الملف هنا',
    dragIdle: 'اسحب الملف هنا أو اضغط للاختيار',
    uploading: 'جاري الرفع...',
    hint: (maxSize: number) =>
      `PDF، Word، PowerPoint، صور — بحد أقصى ${maxSize} ميجا`,
    fileSizeError: (maxSize: number) =>
      `حجم الملف كبير جداً (بحد أقصى ${maxSize} ميجا)`,
    fileTypeError: 'نوع الملف غير مدعوم',
    tooManyFiles: 'اختر ملفاً واحداً فقط',
    selectFailed: 'فشل اختيار الملف',
  },

  // ==================== Tag Input ====================
  tagInput: {
    placeholder: 'أضف وسماً...',
    removeAria: (tag: string) => `حذف وسم ${tag}`,
    maxReached: (max: number) => `وصلت إلى الحد الأقصى (${max} وسوم)`,
    hint: (count: number, max: number) =>
      `اضغط Enter أو فاصلة لإضافة وسم — ${count}/${max}`,
  },

  // ==================== رسائل الأخطاء ====================
  errors: {
    invalidRequest: 'الطلب غير صالح',
    unknownAction: 'إجراء غير معروف',
    idRequired: 'المعرّف مطلوب',
    unauthorized: 'غير مصرح',
    channelNotFound: 'القناة غير موجودة',
    passwordIncorrect: 'كلمة المرور غير صحيحة',
    dbError: 'حدث خطأ في الاتصال بقاعدة البيانات',
    loadFailed: 'فشل تحميل البيانات',
    saveFailed: 'فشل الحفظ',
    deleteFailed: 'فشل الحذف',
    addFailed: 'فشل الإضافة',
  },
} as const;

// ==================== Type Helpers ====================
export type Strings = typeof strings;
```

## lib\supabaseAdmin.ts

```
// lib/supabaseAdmin.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      'متغيرات بيئة Supabase Admin ناقصة: تأكد من NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SECRET_KEY'
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
```

## lib\supabaseClient.js

```
// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'متغيرات بيئة Supabase ناقصة: تأكد من NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## lib\types.ts

```
// lib/types.ts

export type Stage = 'المرحلة الأولى' | 'المرحلة الثانية' | 'المرحلة الثالثة';

export type ContentType = 'assignment' | 'lecture_note' | 'summary' | 'task';

export type Track = 'نظري' | 'عملي';

export interface Subject {
  id: string;
  name: string;
  stage: Stage;
  units: number | null;
  created_at?: string;
}

export interface LectureNote {
  id: string;
  subject_id: string;
  title: string;
  professor_name: string | null;
  lecture_number: number | null;
  track: Track | null;
  tags: string[];
  year: number | null;                 // ← جديد
  file_path: string;
  status?: string;
  created_at?: string;
  subjects?: { name: string } | null;
}

export type ReportReason = 'dead_link' | 'outdated';

export interface LectureNoteReport {
  id: string;
  lecture_note_id: string;
  reason: ReportReason;
  note: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_action: 'deleted' | 'ignored' | null;
  lecture_notes?: {
    id: string;
    title: string;
    subject_id: string;
    professor_name: string | null;
    year: number | null;
    file_path: string;
    subjects?: { name: string } | null;
  } | null;
}

export interface FileEntry {
  label: string | null;
  url: string;
}

export interface Channel {
  id: string;
  name: string;
  stage: Stage;
  description: string | null;
  telegram_link: string;
  channel_password: string | null;
  image_url: string | null;
  views: number;
  created_at?: string;
}

export interface ChannelContent {
  id: string;
  channel_id: string;
  content_type: ContentType;
  title: string;
  description: string | null;
  due_date: string | null;
  track: Track | null;
  tags: string[];
  file_urls: FileEntry[];
  folder: string | null;
  pinned: boolean;
  created_at?: string;
}

export interface Schedule {
  stage: Stage;
  image_url: string | null;
  updated_at?: string;
}

export interface ChannelListItem {
  id: string;
  name: string;
}
```

## next.config.ts

```
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

```

## next-env.d.ts

```
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/types/routes.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

## package.json

```
{
  "name": "lawazem-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.110.8",
    "next": "16.2.11",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-dropzone": "^20.1.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.11",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}

```

## postcss.config.mjs

```
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;

```

## public\file.svg

```
<svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M14.5 13.5V5.41a1 1 0 0 0-.3-.7L9.8.29A1 1 0 0 0 9.08 0H1.5v13.5A2.5 2.5 0 0 0 4 16h8a2.5 2.5 0 0 0 2.5-2.5m-1.5 0v-7H8v-5H3v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1M9.5 5V2.12L12.38 5zM5.13 5h-.62v1.25h2.12V5zm-.62 3h7.12v1.25H4.5zm.62 3h-.62v1.25h7.12V11z" clip-rule="evenodd" fill="#666" fill-rule="evenodd"/></svg>
```

## public\globe.svg

```
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><g clip-path="url(#a)"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.27 14.1a6.5 6.5 0 0 0 3.67-3.45q-1.24.21-2.7.34-.31 1.83-.97 3.1M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.48-1.52a7 7 0 0 1-.96 0H7.5a4 4 0 0 1-.84-1.32q-.38-.89-.63-2.08a40 40 0 0 0 3.92 0q-.25 1.2-.63 2.08a4 4 0 0 1-.84 1.31zm2.94-4.76q1.66-.15 2.95-.43a7 7 0 0 0 0-2.58q-1.3-.27-2.95-.43a18 18 0 0 1 0 3.44m-1.27-3.54a17 17 0 0 1 0 3.64 39 39 0 0 1-4.3 0 17 17 0 0 1 0-3.64 39 39 0 0 1 4.3 0m1.1-1.17q1.45.13 2.69.34a6.5 6.5 0 0 0-3.67-3.44q.65 1.26.98 3.1M8.48 1.5l.01.02q.41.37.84 1.31.38.89.63 2.08a40 40 0 0 0-3.92 0q.25-1.2.63-2.08a4 4 0 0 1 .85-1.32 7 7 0 0 1 .96 0m-2.75.4a6.5 6.5 0 0 0-3.67 3.44 29 29 0 0 1 2.7-.34q.31-1.83.97-3.1M4.58 6.28q-1.66.16-2.95.43a7 7 0 0 0 0 2.58q1.3.27 2.95.43a18 18 0 0 1 0-3.44m.17 4.71q-1.45-.12-2.69-.34a6.5 6.5 0 0 0 3.67 3.44q-.65-1.27-.98-3.1" fill="#666"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h16v16H0z"/></clipPath></defs></svg>
```

## public\next.svg

```
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 394 80"><path fill="#000" d="M262 0h68.5v12.7h-27.2v66.6h-13.6V12.7H262V0ZM149 0v12.7H94v20.4h44.3v12.6H94v21h55v12.6H80.5V0h68.7zm34.3 0h-17.8l63.8 79.4h17.9l-32-39.7 32-39.6h-17.9l-23 28.6-23-28.6zm18.3 56.7-9-11-27.1 33.7h17.8l18.3-22.7z"/><path fill="#000" d="M81 79.3 17 0H0v79.3h13.6V17l50.2 62.3H81Zm252.6-.4c-1 0-1.8-.4-2.5-1s-1.1-1.6-1.1-2.6.3-1.8 1-2.5 1.6-1 2.6-1 1.8.3 2.5 1a3.4 3.4 0 0 1 .6 4.3 3.7 3.7 0 0 1-3 1.8zm23.2-33.5h6v23.3c0 2.1-.4 4-1.3 5.5a9.1 9.1 0 0 1-3.8 3.5c-1.6.8-3.5 1.3-5.7 1.3-2 0-3.7-.4-5.3-1s-2.8-1.8-3.7-3.2c-.9-1.3-1.4-3-1.4-5h6c.1.8.3 1.6.7 2.2s1 1.2 1.6 1.5c.7.4 1.5.5 2.4.5 1 0 1.8-.2 2.4-.6a4 4 0 0 0 1.6-1.8c.3-.8.5-1.8.5-3V45.5zm30.9 9.1a4.4 4.4 0 0 0-2-3.3 7.5 7.5 0 0 0-4.3-1.1c-1.3 0-2.4.2-3.3.5-.9.4-1.6 1-2 1.6a3.5 3.5 0 0 0-.3 4c.3.5.7.9 1.3 1.2l1.8 1 2 .5 3.2.8c1.3.3 2.5.7 3.7 1.2a13 13 0 0 1 3.2 1.8 8.1 8.1 0 0 1 3 6.5c0 2-.5 3.7-1.5 5.1a10 10 0 0 1-4.4 3.5c-1.8.8-4.1 1.2-6.8 1.2-2.6 0-4.9-.4-6.8-1.2-2-.8-3.4-2-4.5-3.5a10 10 0 0 1-1.7-5.6h6a5 5 0 0 0 3.5 4.6c1 .4 2.2.6 3.4.6 1.3 0 2.5-.2 3.5-.6 1-.4 1.8-1 2.4-1.7a4 4 0 0 0 .8-2.4c0-.9-.2-1.6-.7-2.2a11 11 0 0 0-2.1-1.4l-3.2-1-3.8-1c-2.8-.7-5-1.7-6.6-3.2a7.2 7.2 0 0 1-2.4-5.7 8 8 0 0 1 1.7-5 10 10 0 0 1 4.3-3.5c2-.8 4-1.2 6.4-1.2 2.3 0 4.4.4 6.2 1.2 1.8.8 3.2 2 4.3 3.4 1 1.4 1.5 3 1.5 5h-5.8z"/></svg>
```

## public\vercel.svg

```
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1155 1000"><path d="m577.3 0 577.4 1000H0z" fill="#fff"/></svg>
```

## public\window.svg

```
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M7 4.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5" fill="#666"/></svg>
```

## README.md

```
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```

## tsconfig.json

```
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}

```
