
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
      toast.show('فشل النسخ — انسخ يدويًا', 'error');
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
      <Button type="button" variant="outline" size="sm" onClick={() => onChange(generateChannelPassword())} icon={<IconSparkles />}>
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
    const ok = await confirm(`حذف القناة «${c.name}» نهائي. متأكد؟`, { variant: 'danger', confirmLabel: 'احذف' });
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
        className="mb-5 space-y-3 rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm"
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
          placeholder="رابط تليكرام (https://t.me/channelname)"
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
        <div className="rounded-3xl border border-line bg-white/80 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/8 text-teal">
            <IconChat />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا يوجد قنوات مضافة حاليا.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {channels.map((c) => {
            const isEditing = editingId === c.id;
            return (
              <div key={c.id} className="rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-200 hover:border-teal/20">
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
                      placeholder="رابط تليكرام"
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
                        <span className="rounded-full bg-teal/8 px-2 py-0.5 font-mono text-xs text-teal/70">{c.stage}</span>
                      </div>
                      {c.description && <p className="mt-1 text-sm text-ink/55">{c.description}</p>}
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
                        <code className="rounded-md bg-ink/5 px-2 py-0.5 font-mono text-ink/80">
                          {c.channel_password || 'غير محددة'}
                        </code>
                        {c.channel_password && <CopyButton value={c.channel_password} />}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => startEdit(c)} icon={<IconEdit />}>تعديل</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(c)} icon={<IconTrash />}>حذف</Button>
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
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { postJson } from '@/lib/api-client';
import type { LectureNote, Subject } from '@/lib/types';

interface Props { password: string }

interface MaterialForm {
  subject_id: string;
  title: string;
  professor_name: string;
  lecture_number: string;
  file_path: string;
}

function emptyForm(): MaterialForm {
  return { subject_id: '', title: '', professor_name: '', lecture_number: '', file_path: '' };
}
function formFromNote(n: LectureNote): MaterialForm {
  return {
    subject_id: n.subject_id,
    title: n.title,
    professor_name: n.professor_name ?? '',
    lecture_number: n.lecture_number != null ? String(n.lecture_number) : '',
    file_path: n.file_path,
  };
}
function isFormValid(f: MaterialForm): boolean {
  return f.subject_id.trim() !== '' && f.title.trim() !== '' && f.file_path.trim() !== '';
}

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

export function MaterialsSection({ password }: Props) {
  const toast = useToast();
  const confirm = useConfirm();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<LectureNote[]>([]);
  const [loading, setLoading] = useState(true);

  const [newForm, setNewForm] = useState<MaterialForm>(emptyForm());
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MaterialForm>(emptyForm());
  const [saving, setSaving] = useState(false);

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
      setSubjects([]); setMaterials([]);
    } finally { setLoading(false); }
  }, [password, toast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const subjectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of subjects) map.set(s.id, s.name);
    return map;
  }, [subjects]);

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
        file_path: newForm.file_path.trim(),
      });
      const keptSubject = newForm.subject_id;
      setNewForm({ ...emptyForm(), subject_id: keptSubject });
      toast.show('تمت إضافة الملزمة', 'success');
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الإضافة', 'error');
    } finally { setAdding(false); }
  }

  function startEdit(n: LectureNote) {
    setEditingId(n.id); setEditForm(formFromNote(n));
  }
  function cancelEdit() {
    setEditingId(null); setEditForm(emptyForm());
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
        file_path: editForm.file_path.trim(),
      });
      cancelEdit();
      toast.show('تم الحفظ', 'success');
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحفظ', 'error');
    } finally { setSaving(false); }
  }

  async function handleDelete(n: LectureNote) {
    const ok = await confirm(`حذف الملزمة «${n.title}» نهائي. متأكد؟`, { variant: 'danger', confirmLabel: 'احذف' });
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
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber/8 p-4 text-sm">
          <span className="text-amber"><IconAlert /></span>
          <p className="font-medium text-ink/70">أضف مادة أولًا من تبويب «المواد» حتى تكدر تضيف ملازم.</p>
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="mb-5 space-y-3 rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm"
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
          <Input
            type="text"
            value={newForm.title}
            onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
            placeholder="اسم الملزمة/المحاضرة"
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
        </div>
        <Input
          type="url"
          value={newForm.file_path}
          onChange={(e) => setNewForm({ ...newForm, file_path: e.target.value })}
          placeholder="رابط الملف (من Supabase Storage)"
          required
          maxLength={2000}
        />
        <Button type="submit" loading={adding} disabled={!isFormValid(newForm) || subjects.length === 0}>
          إضافة ملزمة
        </Button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 skeleton-shimmer rounded-2xl" />)}
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-3xl border border-line bg-white/80 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/8 text-teal">
            <IconDoc />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد ملازم مضافة حاليا.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map((m) => {
            const isEditing = editingId === m.id;
            return (
              <div key={m.id} className="rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-200 hover:border-teal/20">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Select
                        value={editForm.subject_id}
                        onChange={(e) => setEditForm({ ...editForm, subject_id: e.target.value })}
                        className="w-44"
                        aria-label="المادة"
                      >
                        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                    </div>
                    <Input
                      type="url"
                      value={editForm.file_path}
                      onChange={(e) => setEditForm({ ...editForm, file_path: e.target.value })}
                      placeholder="رابط الملف"
                      maxLength={2000}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(m.id)} loading={saving} disabled={!isFormValid(editForm)}>حفظ</Button>
                      <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={saving}>إلغاء</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-bold text-ink">{m.title}</span>
                        <span className="rounded-full bg-teal/8 px-2 py-0.5 font-mono text-xs text-teal/70">
                          {m.subjects?.name ?? subjectNameById.get(m.subject_id) ?? '—'}
                        </span>
                      </div>
                      {(m.professor_name || m.lecture_number != null) && (
                        <p className="mt-1 text-sm text-ink/50">
                          {m.professor_name && `د. ${m.professor_name}`}
                          {m.professor_name && m.lecture_number != null && ' · '}
                          {m.lecture_number != null && `محاضرة ${m.lecture_number}`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => startEdit(m)} icon={<IconEdit />}>تعديل</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(m)} icon={<IconTrash />}>حذف</Button>
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
    const ok = await confirm(`حذف مادة «${s.name}» سيحذف كل الملازم والأسئلة المرتبطة بها نهائيًا. متأكد؟`, { variant: 'danger', confirmLabel: 'احذف' });
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
        className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm"
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
        <div className="rounded-3xl border border-line bg-white/80 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/8 text-teal">
            <IconBook />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد مواد مضافة حاليا.</p>
          <p className="mt-1 text-sm text-ink/50">أضف أول مادة من فوق</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subjects.map((s) => {
            const isEditing = editingId === s.id;
            return (
              <div
                key={s.id}
                className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-200 hover:border-teal/20 hover:shadow-[0_4px_16px_rgba(14,74,74,0.06)]"
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
                        <span className="rounded-full bg-teal/8 px-2 py-0.5 font-mono text-xs text-teal/70">{s.stage}</span>
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

type Tab = 'subjects' | 'materials' | 'channels' | 'schedules';

const TABS: ReadonlyArray<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'subjects', label: 'المواد', icon: <IconBook /> },
  { id: 'materials', label: 'الملازم', icon: <IconDoc /> },
  { id: 'channels', label: 'القنوات', icon: <IconChat /> },
  { id: 'schedules', label: 'الجدول', icon: <IconCalendar /> },
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
      <div className="w-full rounded-3xl border border-line bg-white/80 p-8 shadow-[0_8px_30px_rgba(14,74,74,0.08)] backdrop-blur-sm animate-slide-up">
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
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-bold text-red-600" role="alert">
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
            مشرف
          </span>
          <h1 className="mt-3 text-3xl font-black text-ink sm:text-4xl">لوحة التحكم</h1>
        </div>
        <Button variant="secondary" size="sm" onClick={logout} icon={<IconLogout />}>
          تسجيل خروج
        </Button>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="أقسام لوحة التحكم"
        className="mt-6 flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-white/60 p-1.5 backdrop-blur-sm [-ms-overflow-style:none] [scrollbar-width:none] sm:overflow-visible [&::-webkit-scrollbar]:hidden animate-slide-up"
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
                  ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)]'
                  : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
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

function parseLectureNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
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

    case 'add': {
      const subject_id = safeString(body.subject_id, 100);
      const title = safeString(body.title, 300);
      const professor_name = safeOptionalString(body.professor_name, 200);
      const lecture_number = parseLectureNumber(body.lecture_number);
      const file_path = safeString(body.file_path, 2000);

      if (!subject_id) return jsonError('اختر المادة');
      if (!title) return jsonError('عنوان الملزمة مطلوب');
      if (!file_path) return jsonError('رابط الملف مطلوب');

      const { error } = await supabaseAdmin.from('lecture_notes').insert({
        subject_id,
        title,
        professor_name,
        lecture_number,
        file_path,
        status: 'approved',
      });

      if (error) {
        console.error('lecture-notes add error:', error.message);
        return jsonError('فشل إضافة الملزمة', 500);
      }
      return NextResponse.json({ success: true });
    }

    case 'edit': {
      const id = safeString(body.id, 100);
      const subject_id = safeString(body.subject_id, 100);
      const title = safeString(body.title, 300);
      const professor_name = safeOptionalString(body.professor_name, 200);
      const lecture_number = parseLectureNumber(body.lecture_number);
      const file_path = safeString(body.file_path, 2000);

      if (!id) return jsonError('id مطلوب');
      if (!subject_id) return jsonError('اختر المادة');
      if (!title) return jsonError('عنوان الملزمة مطلوب');
      if (!file_path) return jsonError('رابط الملف مطلوب');

      const { error } = await supabaseAdmin
        .from('lecture_notes')
        .update({
          subject_id,
          title,
          professor_name,
          lecture_number,
          file_path,
        })
        .eq('id', id);

      if (error) {
        console.error('lecture-notes edit error:', error.message);
        return jsonError('فشل تعديل الملزمة', 500);
      }
      return NextResponse.json({ success: true });
    }

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

## app\channel-portal\_components\ContentSection.tsx

```
// app/channel-portal/_components/ContentSection.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { buildStoragePath, postJson, uploadToStorage } from '@/lib/api-client';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS, STORAGE_BUCKETS } from '@/lib/constants';
import type { ChannelContent, ContentType, FileEntry } from '@/lib/types';

// ==================== Constants ====================
const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,image/*,audio/*,video/*';
const MAX_FILE_SIZE_MB = 20;

// ==================== Types ====================
interface Props { channelId: string; password: string }

interface ContentForm {
  content_type: ContentType;
  title: string;
  folder: string;
  description: string;
  due_date: string;
  pinned: boolean;
  files: FileEntry[];
}

function emptyFileEntry(): FileEntry { return { label: null, url: '' }; }

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
  function addSlot() { onChange([...files, emptyFileEntry()]); }
  function removeSlot(index: number) { onChange(files.filter((_, i) => i !== index)); }

  async function handleUpload(index: number, file: File) {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.show(`حجم الملف كبير جدًا (الحد ${MAX_FILE_SIZE_MB} ميجا).`, 'error');
      return;
    }
    setUploadingIndex(index);
    try {
      const filePath = buildStoragePath(channelId, file.name);
      const publicUrl = await uploadToStorage(STORAGE_BUCKETS.channelFiles, filePath, file);
      updateSlot(index, { url: publicUrl, label: files[index]?.label || file.name });
      toast.show('تم رفع الملف', 'success');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل رفع الملف', 'error');
    } finally { setUploadingIndex(null); }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-line bg-paper/40 p-4">
      <p className="flex items-center gap-1.5 text-sm font-bold text-ink/70">
        <IconUpload />
        الملفات والروابط
      </p>

      {files.map((f, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-line bg-white p-3">
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
              <Button type="button" variant="danger" size="sm" onClick={() => removeSlot(i)} disabled={disabled}>
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
              onChange={(e) => updateSlot(i, { url: e.target.value })}
              placeholder="أو الصق رابط بديل"
              maxLength={2000}
              disabled={disabled}
              className="w-full pr-9 text-sm"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addSlot}
        disabled={disabled}
        className="text-sm font-bold text-teal transition-all hover:gap-2 hover:underline disabled:opacity-50"
      >
        + إضافة ملف/رابط
      </button>
    </div>
  );
}

// ==================== Filters Bar ====================
function FiltersBar({
  search, onSearchChange, typeFilter, onTypeFilterChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  typeFilter: 'all' | ContentType;
  onTypeFilterChange: (v: 'all' | ContentType) => void;
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
        className="w-44"
        aria-label="فلترة حسب النوع"
      >
        <option value="all">كل الأنواع</option>
        {CONTENT_TYPES.map((t) => (
          <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>
        ))}
      </Select>
    </div>
  );
}

// ==================== Content Item Card ====================
interface ItemCardProps {
  item: ChannelContent;
  isEditing: boolean;
  editForm: ContentForm;
  onEditFormChange: (form: ContentForm) => void;
  channelId: string;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

function ItemCard({
  item, isEditing, editForm, onEditFormChange, channelId, saving,
  onStartEdit, onCancelEdit, onSave, onTogglePin, onDelete,
}: ItemCardProps) {
  if (isEditing) {
    return (
      <div className="space-y-3 rounded-2xl border border-teal/30 bg-white p-4 shadow-[0_2px_8px_rgba(14,74,74,0.06)]">
        <div className="flex flex-wrap gap-2">
          <Select
            value={editForm.content_type}
            onChange={(e) => onEditFormChange({ ...editForm, content_type: e.target.value as ContentType })}
            className="w-36"
            aria-label="نوع المحتوى"
          >
            {CONTENT_TYPES.map((t) => <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>)}
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

        <Input
          type="text"
          value={editForm.folder}
          onChange={(e) => onEditFormChange({ ...editForm, folder: e.target.value })}
          placeholder="اسم المجلد (اختياري)"
          maxLength={200}
        />

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

        <Checkbox checked={editForm.pinned} onChange={(v) => onEditFormChange({ ...editForm, pinned: v })}>
          تثبيت هذا المنشور بأعلى القناة
        </Checkbox>

        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} loading={saving} disabled={!isFormValid(editForm)}>حفظ</Button>
          <Button size="sm" variant="secondary" onClick={onCancelEdit} disabled={saving}>إلغاء</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-200 hover:border-teal/20 hover:shadow-[0_4px_16px_rgba(14,74,74,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-bold text-teal">
              {CONTENT_TYPE_LABELS[item.content_type]}
            </span>
            {item.folder && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                <IconFolder />
                {item.folder}
              </span>
            )}
            {item.pinned && (
              <span className="rounded-full bg-teal px-2.5 py-0.5 text-xs font-bold text-white">مثبّت</span>
            )}
            <span className="font-bold text-ink">{item.title}</span>
          </div>

          {item.due_date && (
            <p className="mt-1.5 text-sm font-bold text-amber-700">
              تاريخ التسليم: {item.due_date}
            </p>
          )}

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

        <div className="flex flex-shrink-0 gap-1.5">
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
          <Button size="sm" variant="secondary" onClick={onStartEdit} icon={<IconEdit />}>تعديل</Button>
          <Button size="sm" variant="danger" onClick={onDelete} icon={<IconTrash />}>حذف</Button>
        </div>
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

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await postJson<{ items: ChannelContent[] }>('/api/channel/content', {
        action: 'list', channel_id: channelId, password,
      });
      setItems(data.items ?? []);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل تحميل المحتوى', 'error');
      setItems([]);
    } finally { setLoading(false); }
  }, [channelId, password, toast]);

  useEffect(() => { loadItems(); }, [loadItems]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid(newForm)) return;
    setAdding(true);
    try {
      await postJson('/api/channel/content', {
        action: 'add', channel_id: channelId, password,
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
    } finally { setAdding(false); }
  }

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
        action: 'edit', channel_id: channelId, password, id,
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
    } finally { setSaving(false); }
  }

  async function togglePin(item: ChannelContent) {
    const nextPinned = !item.pinned;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, pinned: nextPinned } : i)));
    try {
      await postJson('/api/channel/content', {
        action: 'toggle_pin', channel_id: channelId, password, id: item.id,
      });
    } catch (err) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, pinned: item.pinned } : i)));
      toast.show(err instanceof Error ? err.message : 'فشل التثبيت', 'error');
    }
  }

  async function handleDelete(item: ChannelContent) {
    const ok = await confirm(`حذف «${item.title}» نهائي. متأكد؟`, { variant: 'danger', confirmLabel: 'احذف' });
    if (!ok) return;
    try {
      await postJson('/api/channel/content', {
        action: 'delete', channel_id: channelId, password, id: item.id,
      });
      toast.show('تم الحذف', 'success');
      loadItems();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحذف', 'error');
    }
  }

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items
      .filter((i) => typeFilter === 'all' || i.content_type === typeFilter)
      .filter((i) => (term ? i.title.toLowerCase().includes(term) : true))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [items, search, typeFilter]);

  return (
    <section>
      {/* Add Form */}
      <form
        onSubmit={handleAdd}
        className="mb-6 space-y-3 rounded-3xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm"
      >
        <div className="flex flex-wrap gap-2">
          <Select
            value={newForm.content_type}
            onChange={(e) => setNewForm({ ...newForm, content_type: e.target.value as ContentType })}
            className="w-36"
            aria-label="نوع المحتوى"
          >
            {CONTENT_TYPES.map((t) => <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>)}
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

        <Input
          type="text"
          value={newForm.folder}
          onChange={(e) => setNewForm({ ...newForm, folder: e.target.value })}
          placeholder="اسم المجلد (اختياري)"
          maxLength={200}
        />

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

        <Checkbox checked={newForm.pinned} onChange={(v) => setNewForm({ ...newForm, pinned: v })}>
          تثبيت هذا المنشور بأعلى القناة
        </Checkbox>

        <Button type="submit" loading={adding} disabled={!isFormValid(newForm)}>إضافة</Button>
      </form>

      {items.length > 0 && (
        <FiltersBar
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
        />
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 skeleton-shimmer rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-line bg-white/80 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/8 text-teal">
            <IconEmpty />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا يوجد محتوى مضاف حاليا.</p>
          <p className="mt-1 text-sm text-ink/50">أضف أول منشور من فوق</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-line bg-white/80 p-12 text-center backdrop-blur-sm">
          <IconSearch />
          <p className="mt-4 font-bold text-ink/70">لا نتائج مطابقة</p>
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
              onStartEdit={() => startEdit(item)}
              onCancelEdit={cancelEdit}
              onSave={() => saveEdit(item.id)}
              onTogglePin={() => togglePin(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </div>
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
      toast.show(`حجم الصورة كبير جدًا (الحد ${MAX_IMAGE_SIZE_MB} ميجا).`, 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const ext = getFileExtension(file.name);
      const filePath = `${channelId}-${Date.now()}.${ext}`;
      const publicUrl = await uploadToStorage(STORAGE_BUCKETS.channelImages, filePath, file, { upsert: true });
      setImageUrl(publicUrl);
      setImageError(false);
      toast.show('تم رفع الصورة — لا تنسى الحفظ', 'success');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل رفع الصورة', 'error');
    } finally { setUploadingImage(false); }
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
    } finally { setSaving(false); }
  }

  function openFilePicker() { fileInputRef.current?.click(); }

  return (
    <section>
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-teal/20 bg-teal/[0.04] p-4 text-sm">
        <span className="text-teal"><IconInfo /></span>
        <p className="font-medium text-ink/70">
          الاسم والمرحلة ورابط تليكرام يديرها المشرف. تكدر تعدّل الصورة والوصف بس.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-5 rounded-3xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm"
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
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              تعذّر تحميل الصورة الحالية.
              <button type="button" onClick={openFilePicker} className="mr-2 font-bold underline">
                ارفع صورة جديدة
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploadingImage}
              className="group mb-3 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-paper/50 py-6 transition-all duration-200 hover:border-teal/40 hover:bg-teal/[0.03] disabled:opacity-60"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/8 text-teal transition-all group-hover:bg-teal/15">
                <IconImage />
              </span>
              <span className="text-sm font-bold text-ink/70">ارفع صورة للقناة</span>
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
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-teal/5 px-3 py-2 text-sm font-bold text-teal">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              جاري الرفع...
            </div>
          )}

          <p className="text-xs text-ink/40">
            PNG / JPG / WebP / GIF — الحد {MAX_IMAGE_SIZE_MB} ميجا
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
            <span className="flex items-center gap-1 text-xs font-bold text-amber-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber" />
              فيه تغييرات ما محفوظة
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
    } finally { setChanging(false); }
  }

  return (
    <section>
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber/8 p-4 text-sm">
        <span className="text-amber"><IconLock /></span>
        <p className="font-medium text-ink/70">
          بعد التغيير . تأكد إنك تحفظ الرمز الجديد بمكان آمن.
        </p>
      </div>

      <form
        onSubmit={handleChange}
        className="space-y-4 rounded-3xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm"
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
            <p className="mt-1.5 text-xs font-bold text-red-600" role="alert">
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
      <div className="w-full rounded-3xl border border-line bg-white/80 p-8 shadow-[0_8px_30px_rgba(14,74,74,0.08)] backdrop-blur-sm animate-slide-up">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-teal">
          <IconLock />
        </div>
        <h1 className="mt-5 text-center text-2xl font-black text-ink">دخول صاحب القناة</h1>
        <p className="mt-2 text-center text-sm text-ink/55">
          اختر قناتك وأدخل كلمة المرور اللي انطاك ياها الادمن
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
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-bold text-red-600" role="alert">
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
            {channelInfo.stage}
          </span>
          <h1 className="mt-3 truncate text-2xl font-black text-ink sm:text-3xl">
            قناة: {channelInfo.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-bold text-ink/60">
              <IconEye />
              {channelInfo.views ?? 0} زيارة
            </span>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={logout} icon={<IconLogout />}>
          تسجيل خروج
        </Button>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="أقسام بوابة القناة"
        className="mt-6 flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-white/60 p-1.5 backdrop-blur-sm [-ms-overflow-style:none] [scrollbar-width:none] sm:overflow-visible [&::-webkit-scrollbar]:hidden animate-slide-up"
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
                  ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)]'
                  : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
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
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
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

  if (Number.isNaN(diffDays)) return { text: `تسليم: ${dueDateStr}`, className: 'bg-amber/20 text-amber-800' };
  if (diffDays < 0) return { text: 'انتهى الموعد', className: 'bg-ink/10 text-ink/50' };
  if (diffDays === 0) return { text: 'تسليم اليوم!', className: 'bg-red-100 text-red-700 ring-1 ring-red-200' };
  if (diffDays <= 3) return { text: `تسليم: ${dueDateStr} (بعد ${diffDays} يوم)`, className: 'bg-red-100 text-red-700' };
  return { text: `تسليم: ${dueDateStr}`, className: 'bg-amber/20 text-amber-800' };
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
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal/20 bg-teal/5 px-3 py-1.5 text-xs font-bold text-teal transition-all duration-200 hover:border-teal/40 hover:bg-teal/10 active:scale-95"
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
    <div className="group rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-300 hover:border-teal/20 hover:shadow-[0_4px_16px_rgba(14,74,74,0.06)]">
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
          <div key={i} className="rounded-2xl border border-line bg-white/80 p-4">
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
    <div className="mt-8 rounded-3xl border border-line bg-white/80 p-10 text-center text-sm font-medium text-ink/60 backdrop-blur-sm animate-slide-up">
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
        setError('ما لقينا هاي القناة.');
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
          رجوع للقنوات
        </Link>
        <h1 className="mt-6 text-2xl font-extrabold text-ink">{error || 'ما لقينا هاي القناة.'}</h1>
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
        رجوع للقنوات
      </Link>

      {/* Header */}
      <div className="mt-6 flex items-center gap-4 animate-slide-up">
        {channel.image_url ? (
          <img
            src={channel.image_url}
            alt={channel.name}
            className="h-20 w-20 flex-shrink-0 rounded-2xl border border-line/60 object-cover shadow-[0_4px_14px_rgba(26,33,31,0.10)]"
          />
        ) : (
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal to-teal-light text-2xl font-black text-white shadow-[0_4px_14px_rgba(14,74,74,0.24)]">
            {channel.name.trim().slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black text-ink sm:text-3xl">{channel.name}</h1>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-2.5 py-0.5 font-mono text-xs uppercase tracking-widest text-teal">
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
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-bold text-white shadow-[0_2px_10px_rgba(14,74,74,0.28)] transition-all duration-200 hover:bg-teal-light hover:shadow-[0_4px_16px_rgba(14,74,74,0.34)] active:scale-95 animate-slide-up"
        style={{ animationDelay: '120ms' }}
      >
        <IconTelegram />
        فتح القناة بتليكرام
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

      {!hasItems && <EmptyState>لا يوجد محتوى مضاف لهذه القناة حاليا.</EmptyState>}
      {hasItems && !hasResults && <EmptyState>لا نتائج مطابقة لبحثك &laquo;{searchTerm}&raquo;.</EmptyState>}
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
        className="h-12 w-12 flex-shrink-0 rounded-xl border border-line/60 object-cover shadow-[0_2px_6px_rgba(26,33,31,0.06)]"
        loading="lazy"
      />
    );
  }
  const initials = name.trim().slice(0, 2);
  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-teal-light text-base font-black text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)]">
      {initials}
    </div>
  );
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-line bg-white/80 p-5 backdrop-blur-sm">
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
      رجوع للوحة الأقسام
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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal">
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
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up">
          <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
          <p className="mt-1 text-red-600/80">{error}</p>
        </div>
      )}

      {!loading && !error && channels.length === 0 && (
        <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/8 text-teal">
            <IconChat />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد قنوات مضافة لمرحلتك حاليا.</p>
          <p className="mt-1 text-sm text-ink/50">تفقدها لاحقًا</p>
        </div>
      )}

      {!loading && !error && channels.length > 0 && visibleChannels.length === 0 && (
        <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up">
          <IconSearch />
          <p className="mt-4 font-bold text-ink/70">لا نتائج مطابقة</p>
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
              className="group relative overflow-hidden rounded-2xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal/30 hover:shadow-[0_12px_30px_rgba(14,74,74,0.10)] active:scale-[0.99] animate-slide-up"
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

## app\globals.css

```
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap');
@import "tailwindcss";

/* ==================== Design Tokens ==================== */
@theme {
  --color-paper: #F7F6F2;
  --color-paper-deep: #EFEDE7;
  --color-ink: #1A211F;
  --color-ink-soft: #2C3532;
  --color-teal: #0E4A4A;
  --color-teal-light: #1A6E6E;
  --color-teal-glow: #2A8888;
  --color-amber: #E0A63A;
  --color-amber-soft: #F0C769;
  --color-line: #E4E0D6;
  --color-line-soft: #EFECE4;

  --font-display: "Cairo", system-ui, sans-serif;
  --font-body: "Tajawal", system-ui, sans-serif;

  --animate-fade-in: fadeIn 0.3s ease-out;
  --animate-slide-up: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  --animate-scale-in: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  --animate-shimmer: shimmer 1.6s ease-in-out infinite;
}

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
html { scroll-behavior: smooth; }

body {
  background-color: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -0.015em;
}

:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
  border-radius: 6px;
}

/* ==================== Utilities ==================== */
@utility skeleton-shimmer {
  background: linear-gradient(
    90deg,
    rgba(26, 33, 31, 0.06) 0%,
    rgba(26, 33, 31, 0.10) 50%,
    rgba(26, 33, 31, 0.06) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
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

// ==================== Types ====================
interface ComponentData {
  max: string;
  score: string;
}
type SubjectScores = Record<string, ComponentData>;
type AllScores = Record<string, SubjectScores>;
interface SubjectWithPercentage extends Subject {
  percentage: number | null;
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

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="mt-6 space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between rounded-2xl border border-line bg-white/80 p-4 backdrop-blur-sm">
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
      رجوع للوحة الأقسام
    </Link>
  );
}

// ==================== Score Color ====================
function getScoreColor(pct: number): string {
  if (pct >= 85) return 'bg-teal/10 text-teal';
  if (pct >= 70) return 'bg-teal/8 text-teal-light';
  if (pct >= 50) return 'bg-amber/15 text-amber-800';
  return 'bg-red-100 text-red-700';
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

  const storageKey = stage ? `gpa_scores_${stage}` : '';

  useEffect(() => {
    if (!stage) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');
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
      'حذف كل الدرجات المدخلة لهذه المرحلة. متأكد؟',
      { variant: 'danger', confirmLabel: 'احذف' }
    );
    if (!ok) return;
    const cleared: AllScores = {};
    for (const s of subjects) cleared[s.id] = defaultSubjectScores();
    setScores(cleared);
    persistScores(cleared);
  }, [confirm, subjects, persistScores]);

  const subjectsWithPercentage: SubjectWithPercentage[] = useMemo(
    () => subjects.map((s) => ({ ...s, percentage: calculatePercentage(scores[s.id]) })),
    [subjects, scores]
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
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <BackLink />

      <div className="mt-6 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">المعدل</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          افتح كل مادة وأدخل درجاتك أول بأول على مدار السنة. تكدر تعدّل &laquo;من كم&raquo; لكل محطة إذا كانت تختلف بمادتك. الدرجات تنحفظ بمتصفحك بس.
        </p>
      </div>

      {loading && <Skeleton />}

      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up">
          <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
          <p className="mt-1 text-red-600/80">{error}</p>
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="mt-6 rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-teal/8 text-teal">
            <IconChart />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا يوجد مواد مضافة لمرحلتك حاليا.</p>
        </div>
      )}

      {!loading && !error && subjects.length > 0 && (
        <>
          {/* شريط التقدم */}
          {stats.enteredCount > 0 && !stats.allFilled && (
            <div className="mt-6 animate-slide-up">
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-ink/60">
                <span>التقدم</span>
                <span>{stats.enteredCount} من {subjects.length} مادة</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink/8">
                <div className="h-full rounded-full bg-gradient-to-l from-teal to-teal-light transition-all duration-500" style={{ width: `${stats.progress}%` }} />
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
                  className="overflow-hidden rounded-2xl border border-line bg-white/80 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-200 animate-slide-up"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(s.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-3 p-4 text-right transition-colors hover:bg-ink/[0.02]"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-ink">{s.name}</span>
                      {s.units != null && (
                        <span className="mr-2 text-xs text-ink/40">({s.units} وحدة)</span>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {s.percentage !== null ? (
                        <span className={`rounded-full px-3 py-1 text-sm font-bold ${scoreColor}`}>
                          {s.percentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-sm text-ink/40">لا توجد درجات</span>
                      )}
                      <IconChevron open={isOpen} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="space-y-3 border-t border-line/60 bg-paper/40 p-4">
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
                  )}
                </div>
              );
            })}
          </div>

          {/* المعدل */}
          <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-gradient-to-bl from-teal/5 via-teal/3 to-amber/5 p-6 text-center shadow-[0_4px_16px_rgba(14,74,74,0.06)] animate-slide-up">
            {stats.average !== null ? (
              <>
                <p className="text-sm font-bold text-ink/60">
                  {stats.allFilled ? 'معدلك النهائي' : 'معدلك الحالي (جزئي)'}
                </p>
                <p className="mt-2 bg-gradient-to-l from-teal to-teal-light bg-clip-text text-5xl font-black text-transparent">
                  {stats.average.toFixed(2)}
                </p>
              </>
            ) : (
              <p className="text-sm text-ink/50">أدخل درجاتك حتى يظهر معدلك.</p>
            )}
          </div>

          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" onClick={resetScores} className="text-red-600 hover:bg-red-50">
              مسح كل الدرجات
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
```

## app\lawazem\page.tsx

```
// app/lawazem/page.tsx
'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import { Input } from '@/components/ui/Field';
import type { LectureNote, Subject } from '@/lib/types';

type SubjectWithNotes = Subject & { lecture_notes: LectureNote[] };

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

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="space-y-6">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-3xl border border-line bg-white/80 p-6 backdrop-blur-sm">
          <div className="mb-4 h-6 w-40 skeleton-shimmer rounded" />
          <div className="space-y-3">
            <div className="h-4 w-3/4 skeleton-shimmer rounded" />
            <div className="h-4 w-2/3 skeleton-shimmer rounded" />
            <div className="h-4 w-1/2 skeleton-shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== Back Link ====================
function BackLink() {
  return (
    <Link href="/" className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal">
      <span className="transition-transform duration-200 group-hover:translate-x-1"><IconArrowLeft /></span>
      رجوع للوحة الأقسام
    </Link>
  );
}

// ==================== Page ====================
export default function LawazemPage() {
  const { stage, ready } = useStudentStage();
  const [subjects, setSubjects] = useState<SubjectWithNotes[]>([]);
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
        .from('subjects')
        .select('*, lecture_notes(*)')
        .eq('stage', stage)
        .order('name');

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setSubjects([]);
      } else {
        setSubjects((data ?? []) as SubjectWithNotes[]);
      }
      setLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, [stage]);

  const filteredSubjects = useMemo(() => {
    if (!term) return subjects;
    return subjects.map((s) => ({
      ...s,
      lecture_notes: s.lecture_notes.filter((n) => n.title.toLowerCase().includes(term)),
    }));
  }, [subjects, term]);

  const totalNotes = useMemo(() => subjects.reduce((sum, s) => sum + s.lecture_notes.length, 0), [subjects]);
  const visibleCount = useMemo(() => filteredSubjects.reduce((sum, s) => sum + s.lecture_notes.length, 0), [filteredSubjects]);

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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">الملازم والمصادر</h1>
        {!loading && totalNotes > 0 && (
          <p className="mt-2 text-sm text-ink/50">
            <span className="font-bold text-teal">{totalNotes}</span> ملزمة موزعة على <span className="font-bold text-teal">{subjects.length}</span> مادة
          </p>
        )}
      </div>

      {totalNotes > 0 && (
        <div className="relative mt-6 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <IconSearch />
          <Input
            type="text"
            placeholder="ابحث باسم الملزمة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-3 pr-11 shadow-[0_2px_8px_rgba(26,33,31,0.04)]"
            aria-label="بحث في الملازم"
          />
        </div>
      )}

      {loading && <Skeleton />}

      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up">
          <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
          <p className="mt-1 text-red-600/80">{error}</p>
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="mt-6 rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up">
          <IconEmpty />
          <p className="mt-4 font-bold text-ink/70">لا توجد مواد مضافة لمرحلتك حاليا.</p>
          <p className="mt-1 text-sm text-ink/50">تفقدها لاحقًا</p>
        </div>
      )}

      {!loading && !error && subjects.length > 0 && visibleCount === 0 && (
        <div className="mt-6 rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up">
          <IconSearch />
          <p className="mt-4 font-bold text-ink/70">لا نتائج مطابقة</p>
          <p className="mt-1 text-sm text-ink/50">&laquo;{searchTerm}&raquo;</p>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6 space-y-5">
          {filteredSubjects.map((s, idx) => {
            if (term && s.lecture_notes.length === 0) return null;
            return (
              <section
                key={s.id}
                style={{ animationDelay: `${idx * 80}ms` }}
                className="group overflow-hidden rounded-3xl border border-line bg-white/80 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-300 hover:border-teal/20 hover:shadow-[0_8px_24px_rgba(14,74,74,0.08)] animate-slide-up"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/60 px-6 py-4">
                  <h2 className="text-lg font-extrabold text-ink sm:text-xl">{s.name}</h2>
                  <span className="rounded-full bg-teal/8 px-2.5 py-0.5 font-mono text-xs text-teal/70">{s.stage}</span>
                </div>

                <div className="p-6">
                  {s.lecture_notes.length === 0 ? (
                    <p className="text-sm text-ink/40">لا توجد ملازم لهذه المادة حاليا.</p>
                  ) : (
                    <ul className="space-y-3">
                      {s.lecture_notes.map((note) => {
                        const hasProfessor = !!note.professor_name;
                        const hasLecture = note.lecture_number != null;
                        return (
                          <li key={note.id} className="group/item">
                            <a
                              href={note.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-3 rounded-xl border border-transparent p-3 -m-3 transition-all duration-200 hover:border-teal/20 hover:bg-teal/[0.03]"
                            >
                              <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal/8 transition-all duration-200 group-hover/item:bg-teal/15">
                                <IconDoc />
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-ink transition-colors group-hover/item:text-teal">
                                  {note.title}
                                </span>
                                {(hasProfessor || hasLecture) && (
                                  <p className="mt-0.5 text-sm text-ink/50">
                                    {hasProfessor && <span>د. {note.professor_name}</span>}
                                    {hasProfessor && hasLecture && <span> · </span>}
                                    {hasLecture && <span>محاضرة {note.lecture_number}</span>}
                                  </p>
                                )}
                              </div>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
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
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'لوازم — كلية طب جامعة العميد',
  description: 'منصة تعاونية لملازم ومصادر وجميع احتياجات طلاب كلية الطب جامعة العميد',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-paper">
        <ToastProvider>
          <ConfirmProvider>
            <NavBar />
            {children}
          </ConfirmProvider>
        </ToastProvider>
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

// ==================== Section Config ====================
interface Section {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accent: 'teal' | 'amber';
}

const SECTIONS: Section[] = [
  { title: 'الملازم', description: 'ملازم الدكاترة مرتبة حسب المادة', href: '/lawazem', icon: <IconBook />, accent: 'teal' },
  { title: 'القنوات الدراسية', description: 'دليل قنوات التليكرام الدراسية', href: '/channels', icon: <IconChat />, accent: 'teal' },
  { title: 'الجدول', description: 'جدول المحاضرات الأسبوعي لمرحلتك', href: '/schedule', icon: <IconCalendar />, accent: 'amber' },
  { title: 'جات الدراسة', description: 'برومبت ذكي يذاكر معك بالـAI', href: '/study-prompt', icon: <IconSparkles />, accent: 'amber' },
  { title: 'المعدل', description: 'احفظ درجاتك واحسب معدلك الموزون حسب وحدات موادك', href: '/gpa', icon: <IconChart />, accent: 'teal' },
];

// ==================== Stage Card ====================
function StageCard({ stage, index, onClick }: { stage: string; index: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${index * 80}ms` }}
      className="group relative w-full overflow-hidden rounded-2xl border-2 border-line bg-white/80 p-6 text-right shadow-[0_2px_8px_rgba(26,33,31,0.05)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal hover:shadow-[0_12px_30px_rgba(14,74,74,0.15)] active:scale-[0.98] animate-slide-up"
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
function SectionCard({ section, index }: { section: Section; index: number }) {
  const isTeal = section.accent === 'teal';
  const gradient = isTeal
    ? 'from-teal/8 to-teal/4 group-hover:from-teal/12 group-hover:to-teal/6'
    : 'from-amber/12 to-amber/6 group-hover:from-amber/18 group-hover:to-amber/10';
  const iconBg = isTeal
    ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] group-hover:shadow-[0_6px_18px_rgba(14,74,74,0.34)]'
    : 'bg-amber text-ink shadow-[0_2px_8px_rgba(224,166,58,0.30)] group-hover:shadow-[0_6px_18px_rgba(224,166,58,0.42)]';
  const accentText = isTeal ? 'text-teal' : 'text-amber-700';

  return (
    <Link
      href={section.href}
      style={{ animationDelay: `${index * 60}ms` }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal/30 hover:shadow-[0_12px_30px_rgba(14,74,74,0.10)] active:scale-[0.99] animate-slide-up"
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
            <span className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/5 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-teal backdrop-blur-sm">
              <IconCheck />
              منصة طلابية
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-black leading-tight text-ink sm:text-4xl animate-slide-up" style={{ animationDelay: '80ms' }}>
            اختر مرحلتك الدراسية
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-ink/60 animate-slide-up" style={{ animationDelay: '160ms' }}>
            في لوازم نعرض لك المحتوى المناسب لمرحلتك قنوات، جداول، وكل شي.
          </p>

          <div className="relative mt-12 grid w-full gap-4 sm:grid-cols-3">
            {STAGES.map((s, i) => (
              <StageCard key={s} stage={s} index={i} onClick={() => chooseStage(s)} />
            ))}
          </div>

          <p className="mt-10 text-xs text-ink/40 animate-slide-up" style={{ animationDelay: '400ms' }}>
            تكدر تغيّرها لاحقًا من أي وقت
          </p>
        </main>
      ) : (
        <main className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-wrap items-end justify-between gap-3 animate-slide-up">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
                {stage}
              </span>
              <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">شنو تحتاج اليوم؟</h1>
              <p className="mt-2 text-sm text-ink/50">كل شي بمكان واحد — اختر القسم اللي تحتاجه</p>
            </div>
            <button
              onClick={changeStage}
              className="rounded-lg border border-line bg-white/80 px-3.5 py-2 text-xs font-bold text-ink/70 shadow-[0_1px_2px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-200 hover:border-ink/20 hover:bg-paper hover:text-ink active:scale-95"
            >
              تغيير المرحلة
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((sec, i) => (
              <SectionCard key={sec.href} section={sec} index={i} />
            ))}
          </div>

          <p className="mt-12 text-center text-xs text-ink/40 animate-slide-up" style={{ animationDelay: '400ms' }}>
            صُنع بكل حب لطلاب كلية الطب · جامعةالعميد · برمجة واعدادالطالب : علي مازن @E_W_9
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
      رجوع للوحة الأقسام
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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">جدول المحاضرات</h1>
      </div>

      {loading && <Skeleton />}

      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up">
          <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
          <p className="mt-1 text-red-600/80">{error}</p>
        </div>
      )}

      {!loading && !error && !imageUrl && (
        <div className="mt-6 rounded-3xl border border-line bg-white/80 p-12 text-center backdrop-blur-sm animate-slide-up">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber/10 text-amber">
            <IconCalendar />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا يوجد جدول مرفوع لمرحلتك حاليا.</p>
          <p className="mt-1 text-sm text-ink/50">تفقده لاحقًا</p>
        </div>
      )}

      {!loading && !error && imageUrl && (
        <div className="mt-6 animate-slide-up">
          <div className="group relative overflow-hidden rounded-3xl border border-line bg-white/80 p-3 shadow-[0_4px_16px_rgba(26,33,31,0.06)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_12px_30px_rgba(14,74,74,0.10)]">
            {!imageLoaded && (
              <div className="aspect-[3/4] w-full skeleton-shimmer rounded-2xl sm:aspect-[4/3]" />
            )}
            <img
              src={imageUrl}
              alt={`جدول ${stage}`}
              onLoad={() => setImageLoaded(true)}
              className={`w-full rounded-2xl transition-all duration-500 ${
                imageLoaded ? 'opacity-100' : 'absolute h-0 w-0 opacity-0'
              }`}
            />
          </div>

          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-4 inline-flex items-center gap-2 rounded-xl border border-teal/20 bg-teal/5 px-4 py-2.5 text-sm font-bold text-teal transition-all duration-200 hover:border-teal/40 hover:bg-teal/10 active:scale-95"
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
    <div className="mt-6 space-y-5 rounded-3xl border border-line bg-white/80 p-6 backdrop-blur-sm">
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
      رجوع للوحة الأقسام
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
      const message = err instanceof Error ? err.message : 'صار خطأ، حاول مرة ثانية.';
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
      toast.show('فشل النسخ — انسخ يدويًا', 'error');
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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">جات الدراسة</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          اختر مادتك وشلون راح تزوّد المحتوى، وراح نصيغ لك برومبت احترافي تنسخه وتستخدمه بأي أداة ذكاء اصطناعي.
        </p>
      </div>

      {loadingSubjects && <Skeleton />}

      {noSubjects && (
        <div className="mt-6 rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber/10 text-amber">
            <IconSparkles />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد مواد مضافة لمرحلتك حاليا.</p>
        </div>
      )}

      {!loadingSubjects && !noSubjects && (
        <form
          onSubmit={handleGenerate}
          className="mt-6 space-y-6 rounded-3xl border border-line bg-white/80 p-6 shadow-[0_2px_8px_rgba(26,33,31,0.04)] backdrop-blur-sm animate-slide-up"
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
              شلون راح تزوّد المحتوى للذكاء الاصطناعي؟
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
              شكل الشرح المطلوب <span className="text-ink/40">(تكدر تختار أكثر من وحدة)</span>
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
              <p className="mt-2 text-xs font-bold text-red-600" role="alert">
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
              <option value="ar">بالعربي</option>
              <option value="en">بالإنكليزي</option>
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
            {generating ? 'جاري التوليد...' : 'ولّد البرومبت'}
          </Button>
        </form>
      )}

      {result && (
        <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-white/80 shadow-[0_4px_16px_rgba(14,74,74,0.06)] backdrop-blur-sm animate-slide-up">
          <div className="flex items-center justify-between gap-3 border-b border-line/60 bg-gradient-to-l from-teal/5 to-transparent px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-teal">
              <IconSparkles />
              البرومبت جاهز
            </h2>
            <Button variant="secondary" size="sm" onClick={handleCopy} icon={copied ? <IconCheck /> : <IconCopy />}>
              {copied ? 'تم النسخ' : 'نسخ'}
            </Button>
          </div>
          <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words p-6 text-sm leading-relaxed text-ink/80 scrollbar-thin">
            {result}
          </pre>
          <p className="border-t border-line/60 bg-paper/50 px-6 py-3 text-xs text-ink/50">
            انسخ هذا النص والصقه بأي أداة ذكاء اصطناعي تحبها، وابدأ ترسل سلايداتك حسب الطريقة اللي اخترتها.
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

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
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
    const TEAL = 'rgba(14, 74, 74, 0.35)';
    const AMBER = 'rgba(224, 166, 58, 0.30)';
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
      if (!ctx) return;
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
            ctx.strokeStyle = `rgba(14, 74, 74, ${opacity * 0.12})`;
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

    resize();
    init();
    step();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', onResize);
    };
  }, []);

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

## components\NavBar.tsx

```
// components/NavBar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/lawazem', label: 'الملازم' },
  { href: '/channels', label: 'القنوات' },
  { href: '/schedule', label: 'الجدول' },
  { href: '/study-prompt', label: 'جات الدراسة' },
  { href: '/gpa', label: 'المعدل' },
] as const;

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-paper/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <Link href="/" className="group flex flex-shrink-0 items-center gap-2 transition-transform active:scale-95">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] transition-all group-hover:shadow-[0_4px_14px_rgba(14,74,74,0.32)]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </span>
          <span className="text-base font-black text-ink sm:text-lg">لوازم</span>
        </Link>

        <div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1.5 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
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
      </nav>
    </header>
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
    'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] hover:bg-teal-light hover:shadow-[0_4px_14px_rgba(14,74,74,0.30)]',
  secondary:
    'bg-white text-ink border border-line shadow-[0_1px_2px_rgba(26,33,31,0.04)] hover:bg-paper hover:border-ink/20',
  outline:
    'bg-transparent text-teal border-2 border-teal/30 hover:bg-teal/5 hover:border-teal/60',
  danger:
    'bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300',
  ghost: 'bg-transparent text-ink/70 hover:bg-ink/5 hover:text-ink',
  amber:
    'bg-amber text-ink shadow-[0_2px_8px_rgba(224,166,58,0.28)] hover:bg-amber-soft',
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

## components\ui\Field.tsx

```
// components/ui/Field.tsx
'use client';

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';

const BASE =
  'w-full rounded-xl border-2 border-line bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/35 transition-all duration-200 focus:border-teal focus:bg-white focus:outline-none focus:shadow-[0_0_0_4px_rgba(14,74,74,0.10)] hover:border-ink/20 disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-60';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...rest }, ref) {
    return <input ref={ref} className={`${BASE} ${className}`} {...rest} />;
  }
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...rest }, ref) {
    return (
      <div className="relative">
        <select ref={ref} className={`${BASE} cursor-pointer appearance-none pl-10 pr-4 ${className}`} {...rest}>
          {children}
        </select>
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', ...rest }, ref) {
    return <textarea ref={ref} className={`${BASE} resize-none leading-relaxed ${className}`} {...rest} />;
  }
);

export function FieldGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`space-y-3 rounded-2xl border border-line bg-white/70 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function Checkbox({
  checked, onChange, children, className = '',
}: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; className?: string }) {
  return (
    <label
      className={`group flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink/80 transition-all duration-200 hover:border-teal/40 has-[:checked]:border-teal has-[:checked]:bg-teal/5 has-[:checked]:text-ink ${className}`}
    >
      <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-line bg-white transition-all duration-200 checked:border-teal checked:bg-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 focus-visible:ring-offset-2"
        />
        <svg className="pointer-events-none absolute h-3 w-3 scale-0 text-white opacity-0 transition-all duration-150 peer-checked:scale-100 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <span className="flex-1">{children}</span>
    </label>
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
  file_path: string;
  status?: string;
  created_at?: string;
  subjects?: { name: string } | null;
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
import "./.next/dev/types/routes.d.ts";

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
    "react-dom": "19.2.4"
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

## tsconfig.tsbuildinfo

```
{"fileNames":["./node_modules/typescript/lib/lib.es5.d.ts","./node_modules/typescript/lib/lib.es2015.d.ts","./node_modules/typescript/lib/lib.es2016.d.ts","./node_modules/typescript/lib/lib.es2017.d.ts","./node_modules/typescript/lib/lib.es2018.d.ts","./node_modules/typescript/lib/lib.es2019.d.ts","./node_modules/typescript/lib/lib.es2020.d.ts","./node_modules/typescript/lib/lib.es2021.d.ts","./node_modules/typescript/lib/lib.es2022.d.ts","./node_modules/typescript/lib/lib.es2023.d.ts","./node_modules/typescript/lib/lib.es2024.d.ts","./node_modules/typescript/lib/lib.esnext.d.ts","./node_modules/typescript/lib/lib.dom.d.ts","./node_modules/typescript/lib/lib.dom.iterable.d.ts","./node_modules/typescript/lib/lib.es2015.core.d.ts","./node_modules/typescript/lib/lib.es2015.collection.d.ts","./node_modules/typescript/lib/lib.es2015.generator.d.ts","./node_modules/typescript/lib/lib.es2015.iterable.d.ts","./node_modules/typescript/lib/lib.es2015.promise.d.ts","./node_modules/typescript/lib/lib.es2015.proxy.d.ts","./node_modules/typescript/lib/lib.es2015.reflect.d.ts","./node_modules/typescript/lib/lib.es2015.symbol.d.ts","./node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts","./node_modules/typescript/lib/lib.es2016.array.include.d.ts","./node_modules/typescript/lib/lib.es2016.intl.d.ts","./node_modules/typescript/lib/lib.es2017.arraybuffer.d.ts","./node_modules/typescript/lib/lib.es2017.date.d.ts","./node_modules/typescript/lib/lib.es2017.object.d.ts","./node_modules/typescript/lib/lib.es2017.sharedmemory.d.ts","./node_modules/typescript/lib/lib.es2017.string.d.ts","./node_modules/typescript/lib/lib.es2017.intl.d.ts","./node_modules/typescript/lib/lib.es2017.typedarrays.d.ts","./node_modules/typescript/lib/lib.es2018.asyncgenerator.d.ts","./node_modules/typescript/lib/lib.es2018.asynciterable.d.ts","./node_modules/typescript/lib/lib.es2018.intl.d.ts","./node_modules/typescript/lib/lib.es2018.promise.d.ts","./node_modules/typescript/lib/lib.es2018.regexp.d.ts","./node_modules/typescript/lib/lib.es2019.array.d.ts","./node_modules/typescript/lib/lib.es2019.object.d.ts","./node_modules/typescript/lib/lib.es2019.string.d.ts","./node_modules/typescript/lib/lib.es2019.symbol.d.ts","./node_modules/typescript/lib/lib.es2019.intl.d.ts","./node_modules/typescript/lib/lib.es2020.bigint.d.ts","./node_modules/typescript/lib/lib.es2020.date.d.ts","./node_modules/typescript/lib/lib.es2020.promise.d.ts","./node_modules/typescript/lib/lib.es2020.sharedmemory.d.ts","./node_modules/typescript/lib/lib.es2020.string.d.ts","./node_modules/typescript/lib/lib.es2020.symbol.wellknown.d.ts","./node_modules/typescript/lib/lib.es2020.intl.d.ts","./node_modules/typescript/lib/lib.es2020.number.d.ts","./node_modules/typescript/lib/lib.es2021.promise.d.ts","./node_modules/typescript/lib/lib.es2021.string.d.ts","./node_modules/typescript/lib/lib.es2021.weakref.d.ts","./node_modules/typescript/lib/lib.es2021.intl.d.ts","./node_modules/typescript/lib/lib.es2022.array.d.ts","./node_modules/typescript/lib/lib.es2022.error.d.ts","./node_modules/typescript/lib/lib.es2022.intl.d.ts","./node_modules/typescript/lib/lib.es2022.object.d.ts","./node_modules/typescript/lib/lib.es2022.string.d.ts","./node_modules/typescript/lib/lib.es2022.regexp.d.ts","./node_modules/typescript/lib/lib.es2023.array.d.ts","./node_modules/typescript/lib/lib.es2023.collection.d.ts","./node_modules/typescript/lib/lib.es2023.intl.d.ts","./node_modules/typescript/lib/lib.es2024.arraybuffer.d.ts","./node_modules/typescript/lib/lib.es2024.collection.d.ts","./node_modules/typescript/lib/lib.es2024.object.d.ts","./node_modules/typescript/lib/lib.es2024.promise.d.ts","./node_modules/typescript/lib/lib.es2024.regexp.d.ts","./node_modules/typescript/lib/lib.es2024.sharedmemory.d.ts","./node_modules/typescript/lib/lib.es2024.string.d.ts","./node_modules/typescript/lib/lib.esnext.array.d.ts","./node_modules/typescript/lib/lib.esnext.collection.d.ts","./node_modules/typescript/lib/lib.esnext.intl.d.ts","./node_modules/typescript/lib/lib.esnext.disposable.d.ts","./node_modules/typescript/lib/lib.esnext.promise.d.ts","./node_modules/typescript/lib/lib.esnext.decorators.d.ts","./node_modules/typescript/lib/lib.esnext.iterator.d.ts","./node_modules/typescript/lib/lib.esnext.float16.d.ts","./node_modules/typescript/lib/lib.esnext.error.d.ts","./node_modules/typescript/lib/lib.esnext.sharedmemory.d.ts","./node_modules/typescript/lib/lib.decorators.d.ts","./node_modules/typescript/lib/lib.decorators.legacy.d.ts","./node_modules/@types/react/global.d.ts","./node_modules/csstype/index.d.ts","./node_modules/@types/react/index.d.ts","./node_modules/next/dist/styled-jsx/types/css.d.ts","./node_modules/next/dist/styled-jsx/types/macro.d.ts","./node_modules/next/dist/styled-jsx/types/style.d.ts","./node_modules/next/dist/styled-jsx/types/global.d.ts","./node_modules/next/dist/styled-jsx/types/index.d.ts","./node_modules/next/dist/server/get-page-files.d.ts","./node_modules/@types/node/compatibility/disposable.d.ts","./node_modules/@types/node/compatibility/indexable.d.ts","./node_modules/@types/node/compatibility/iterators.d.ts","./node_modules/@types/node/compatibility/index.d.ts","./node_modules/@types/node/globals.typedarray.d.ts","./node_modules/@types/node/buffer.buffer.d.ts","./node_modules/@types/node/globals.d.ts","./node_modules/@types/node/web-globals/abortcontroller.d.ts","./node_modules/@types/node/web-globals/domexception.d.ts","./node_modules/@types/node/web-globals/events.d.ts","./node_modules/undici-types/header.d.ts","./node_modules/undici-types/readable.d.ts","./node_modules/undici-types/file.d.ts","./node_modules/undici-types/fetch.d.ts","./node_modules/undici-types/formdata.d.ts","./node_modules/undici-types/connector.d.ts","./node_modules/undici-types/client.d.ts","./node_modules/undici-types/errors.d.ts","./node_modules/undici-types/dispatcher.d.ts","./node_modules/undici-types/global-dispatcher.d.ts","./node_modules/undici-types/global-origin.d.ts","./node_modules/undici-types/pool-stats.d.ts","./node_modules/undici-types/pool.d.ts","./node_modules/undici-types/handlers.d.ts","./node_modules/undici-types/balanced-pool.d.ts","./node_modules/undici-types/agent.d.ts","./node_modules/undici-types/mock-interceptor.d.ts","./node_modules/undici-types/mock-agent.d.ts","./node_modules/undici-types/mock-client.d.ts","./node_modules/undici-types/mock-pool.d.ts","./node_modules/undici-types/mock-errors.d.ts","./node_modules/undici-types/proxy-agent.d.ts","./node_modules/undici-types/env-http-proxy-agent.d.ts","./node_modules/undici-types/retry-handler.d.ts","./node_modules/undici-types/retry-agent.d.ts","./node_modules/undici-types/api.d.ts","./node_modules/undici-types/interceptors.d.ts","./node_modules/undici-types/util.d.ts","./node_modules/undici-types/cookies.d.ts","./node_modules/undici-types/patch.d.ts","./node_modules/undici-types/websocket.d.ts","./node_modules/undici-types/eventsource.d.ts","./node_modules/undici-types/filereader.d.ts","./node_modules/undici-types/diagnostics-channel.d.ts","./node_modules/undici-types/content-type.d.ts","./node_modules/undici-types/cache.d.ts","./node_modules/undici-types/index.d.ts","./node_modules/@types/node/web-globals/fetch.d.ts","./node_modules/@types/node/assert.d.ts","./node_modules/@types/node/assert/strict.d.ts","./node_modules/@types/node/async_hooks.d.ts","./node_modules/@types/node/buffer.d.ts","./node_modules/@types/node/child_process.d.ts","./node_modules/@types/node/cluster.d.ts","./node_modules/@types/node/console.d.ts","./node_modules/@types/node/constants.d.ts","./node_modules/@types/node/crypto.d.ts","./node_modules/@types/node/dgram.d.ts","./node_modules/@types/node/diagnostics_channel.d.ts","./node_modules/@types/node/dns.d.ts","./node_modules/@types/node/dns/promises.d.ts","./node_modules/@types/node/domain.d.ts","./node_modules/@types/node/events.d.ts","./node_modules/@types/node/fs.d.ts","./node_modules/@types/node/fs/promises.d.ts","./node_modules/@types/node/http.d.ts","./node_modules/@types/node/http2.d.ts","./node_modules/@types/node/https.d.ts","./node_modules/@types/node/inspector.generated.d.ts","./node_modules/@types/node/module.d.ts","./node_modules/@types/node/net.d.ts","./node_modules/@types/node/os.d.ts","./node_modules/@types/node/path.d.ts","./node_modules/@types/node/perf_hooks.d.ts","./node_modules/@types/node/process.d.ts","./node_modules/@types/node/punycode.d.ts","./node_modules/@types/node/querystring.d.ts","./node_modules/@types/node/readline.d.ts","./node_modules/@types/node/readline/promises.d.ts","./node_modules/@types/node/repl.d.ts","./node_modules/@types/node/sea.d.ts","./node_modules/@types/node/stream.d.ts","./node_modules/@types/node/stream/promises.d.ts","./node_modules/@types/node/stream/consumers.d.ts","./node_modules/@types/node/stream/web.d.ts","./node_modules/@types/node/string_decoder.d.ts","./node_modules/@types/node/test.d.ts","./node_modules/@types/node/timers.d.ts","./node_modules/@types/node/timers/promises.d.ts","./node_modules/@types/node/tls.d.ts","./node_modules/@types/node/trace_events.d.ts","./node_modules/@types/node/tty.d.ts","./node_modules/@types/node/url.d.ts","./node_modules/@types/node/util.d.ts","./node_modules/@types/node/v8.d.ts","./node_modules/@types/node/vm.d.ts","./node_modules/@types/node/wasi.d.ts","./node_modules/@types/node/worker_threads.d.ts","./node_modules/@types/node/zlib.d.ts","./node_modules/@types/node/index.d.ts","./node_modules/@types/react/canary.d.ts","./node_modules/@types/react/experimental.d.ts","./node_modules/@types/react-dom/index.d.ts","./node_modules/@types/react-dom/canary.d.ts","./node_modules/@types/react-dom/experimental.d.ts","./node_modules/next/dist/lib/fallback.d.ts","./node_modules/next/dist/compiled/webpack/webpack.d.ts","./node_modules/next/dist/shared/lib/modern-browserslist-target.d.ts","./node_modules/next/dist/shared/lib/entry-constants.d.ts","./node_modules/next/dist/shared/lib/constants.d.ts","./node_modules/next/dist/lib/bundler.d.ts","./node_modules/next/dist/server/config.d.ts","./node_modules/next/dist/lib/load-custom-routes.d.ts","./node_modules/next/dist/shared/lib/image-config.d.ts","./node_modules/next/dist/build/webpack/plugins/subresource-integrity-plugin.d.ts","./node_modules/next/dist/server/body-streams.d.ts","./node_modules/next/dist/server/request/search-params.d.ts","./node_modules/next/dist/shared/lib/segment-cache/vary-params-decoding.d.ts","./node_modules/next/dist/server/app-render/vary-params.d.ts","./node_modules/next/dist/server/request/params.d.ts","./node_modules/next/dist/server/route-kind.d.ts","./node_modules/next/dist/server/route-definitions/route-definition.d.ts","./node_modules/next/dist/server/route-matches/route-match.d.ts","./node_modules/next/dist/client/components/app-router-headers.d.ts","./node_modules/next/dist/server/lib/cache-control.d.ts","./node_modules/next/dist/shared/lib/app-router-types.d.ts","./node_modules/next/dist/server/lib/cache-handlers/types.d.ts","./node_modules/next/dist/server/use-cache/use-cache-wrapper.d.ts","./node_modules/next/dist/server/resume-data-cache/cache-store.d.ts","./node_modules/next/dist/server/resume-data-cache/resume-data-cache.d.ts","./node_modules/next/dist/lib/constants.d.ts","./node_modules/next/dist/server/render-result.d.ts","./node_modules/next/dist/server/response-cache/types.d.ts","./node_modules/next/dist/server/response-cache/index.d.ts","./node_modules/@types/react/jsx-runtime.d.ts","./node_modules/next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup.d.ts","./node_modules/next/dist/build/static-paths/types.d.ts","./node_modules/next/dist/server/route-definitions/app-page-route-definition.d.ts","./node_modules/next/dist/build/adapter/setup-node-env.external.d.ts","./node_modules/next/dist/server/instrumentation/types.d.ts","./node_modules/next/dist/lib/setup-exception-listeners.d.ts","./node_modules/next/dist/lib/worker.d.ts","./node_modules/next/dist/server/lib/experimental/ppr.d.ts","./node_modules/next/dist/lib/page-types.d.ts","./node_modules/next/dist/build/segment-config/app/app-segment-config.d.ts","./node_modules/next/dist/build/segment-config/pages/pages-segment-config.d.ts","./node_modules/next/dist/build/analysis/get-page-static-info.d.ts","./node_modules/next/dist/build/webpack/loaders/get-module-build-info.d.ts","./node_modules/next/dist/build/webpack/plugins/middleware-plugin.d.ts","./node_modules/next/dist/server/require-hook.d.ts","./node_modules/next/dist/server/node-polyfill-crypto.d.ts","./node_modules/next/dist/server/node-environment-baseline.d.ts","./node_modules/next/dist/server/node-environment-extensions/error-inspect.d.ts","./node_modules/next/dist/server/node-environment-extensions/console-file.d.ts","./node_modules/next/dist/server/node-environment-extensions/console-exit.d.ts","./node_modules/next/dist/server/node-environment-extensions/console-dim.external.d.ts","./node_modules/next/dist/server/node-environment-extensions/unhandled-rejection.external.d.ts","./node_modules/next/dist/server/node-environment-extensions/random.d.ts","./node_modules/next/dist/server/node-environment-extensions/date.d.ts","./node_modules/next/dist/server/node-environment-extensions/web-crypto.d.ts","./node_modules/next/dist/server/node-environment-extensions/node-crypto.d.ts","./node_modules/next/dist/server/node-environment-extensions/fast-set-immediate.external.d.ts","./node_modules/next/dist/server/node-environment.d.ts","./node_modules/next/dist/build/page-extensions-type.d.ts","./node_modules/next/dist/server/route-modules/app-page/module.compiled.d.ts","./node_modules/next/dist/server/route-definitions/app-route-route-definition.d.ts","./node_modules/next/dist/server/lib/i18n-provider.d.ts","./node_modules/next/dist/server/web/next-url.d.ts","./node_modules/next/dist/compiled/@edge-runtime/cookies/index.d.ts","./node_modules/next/dist/server/web/spec-extension/cookies.d.ts","./node_modules/next/dist/server/web/spec-extension/request.d.ts","./node_modules/next/dist/shared/lib/deep-readonly.d.ts","./node_modules/next/dist/server/lib/incremental-cache/index.d.ts","./node_modules/next/dist/shared/lib/router/utils/middleware-route-matcher.d.ts","./node_modules/next/dist/build/webpack/plugins/flight-manifest-plugin.d.ts","./node_modules/next/dist/build/webpack/plugins/next-font-manifest-plugin.d.ts","./node_modules/next/dist/server/route-definitions/locale-route-definition.d.ts","./node_modules/next/dist/server/route-definitions/pages-route-definition.d.ts","./node_modules/next/dist/shared/lib/mitt.d.ts","./node_modules/next/dist/client/with-router.d.ts","./node_modules/next/dist/client/router.d.ts","./node_modules/next/dist/client/route-loader.d.ts","./node_modules/next/dist/client/page-loader.d.ts","./node_modules/next/dist/shared/lib/bloom-filter.d.ts","./node_modules/next/dist/shared/lib/router/router.d.ts","./node_modules/next/dist/shared/lib/router-context.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/loadable-context.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/loadable.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/image-config-context.shared-runtime.d.ts","./node_modules/next/dist/client/components/readonly-url-search-params.d.ts","./node_modules/next/dist/shared/lib/hooks-client-context.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/head-manager-context.shared-runtime.d.ts","./node_modules/next/dist/client/flight-data-helpers.d.ts","./node_modules/next/dist/client/components/segment-cache/cache-key.d.ts","./node_modules/next/dist/client/components/router-reducer/fetch-server-response.d.ts","./node_modules/next/dist/client/components/segment-cache/types.d.ts","./node_modules/next/dist/shared/lib/segment-cache/segment-value-encoding.d.ts","./node_modules/next/dist/client/components/segment-cache/scheduler.d.ts","./node_modules/next/dist/client/components/segment-cache/cache-map.d.ts","./node_modules/next/dist/client/components/segment-cache/vary-path.d.ts","./node_modules/next/dist/client/components/segment-cache/cache.d.ts","./node_modules/next/dist/client/components/router-reducer/ppr-navigations.d.ts","./node_modules/next/dist/client/components/segment-cache/navigation.d.ts","./node_modules/next/dist/client/components/router-reducer/router-reducer-types.d.ts","./node_modules/next/dist/shared/lib/app-router-context.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/server-inserted-html.shared-runtime.d.ts","./node_modules/next/dist/server/route-modules/pages/vendored/contexts/entrypoints.d.ts","./node_modules/next/dist/server/route-modules/pages/module.compiled.d.ts","./node_modules/next/dist/build/templates/pages.d.ts","./node_modules/next/dist/server/route-modules/pages/module.d.ts","./node_modules/next/dist/server/render.d.ts","./node_modules/next/dist/build/webpack/plugins/pages-manifest-plugin.d.ts","./node_modules/next/dist/server/route-definitions/pages-api-route-definition.d.ts","./node_modules/next/dist/server/route-matches/pages-api-route-match.d.ts","./node_modules/next/dist/server/route-matchers/route-matcher.d.ts","./node_modules/next/dist/server/route-matcher-providers/route-matcher-provider.d.ts","./node_modules/next/dist/server/route-matcher-managers/route-matcher-manager.d.ts","./node_modules/next/dist/server/normalizers/normalizer.d.ts","./node_modules/next/dist/server/normalizers/locale-route-normalizer.d.ts","./node_modules/next/dist/server/normalizers/request/pathname-normalizer.d.ts","./node_modules/next/dist/server/normalizers/request/suffix.d.ts","./node_modules/next/dist/server/normalizers/request/rsc.d.ts","./node_modules/next/dist/server/normalizers/request/next-data.d.ts","./node_modules/next/dist/server/after/builtin-request-context.d.ts","./node_modules/next/dist/server/normalizers/request/segment-prefix-rsc.d.ts","./node_modules/next/dist/server/route-modules/pages/builtin/_error.d.ts","./node_modules/next/dist/server/load-default-error-components.d.ts","./node_modules/next/dist/server/base-server.d.ts","./node_modules/next/dist/server/after/after.d.ts","./node_modules/next/dist/server/after/after-context.d.ts","./node_modules/next/dist/server/use-cache/cache-life.d.ts","./node_modules/next/dist/server/app-render/work-async-storage-instance.d.ts","./node_modules/next/dist/server/lib/lazy-result.d.ts","./node_modules/next/dist/server/app-render/create-error-handler.d.ts","./node_modules/next/dist/shared/lib/action-revalidation-kind.d.ts","./node_modules/next/dist/server/app-render/work-async-storage.external.d.ts","./node_modules/next/dist/server/async-storage/work-store.d.ts","./node_modules/next/dist/server/web/http.d.ts","./node_modules/next/dist/client/components/hooks-server-context.d.ts","./node_modules/next/dist/server/route-modules/app-route/shared-modules.d.ts","./node_modules/next/dist/client/components/redirect-status-code.d.ts","./node_modules/next/dist/client/components/redirect-error.d.ts","./node_modules/next/dist/server/web/spec-extension/adapters/request-cookies.d.ts","./node_modules/next/dist/server/async-storage/draft-mode-provider.d.ts","./node_modules/next/dist/server/web/spec-extension/adapters/headers.d.ts","./node_modules/next/dist/server/app-render/cache-signal.d.ts","./node_modules/next/dist/server/app-render/instant-validation/boundary-tracking.d.ts","./node_modules/next/dist/server/app-render/instant-validation/instant-validation-error.d.ts","./node_modules/next/dist/shared/lib/router/utils/parse-relative-url.d.ts","./node_modules/next/dist/server/app-render/instant-validation/instant-samples.d.ts","./node_modules/next/dist/server/app-render/dynamic-rendering.d.ts","./node_modules/next/dist/server/app-render/work-unit-async-storage-instance.d.ts","./node_modules/next/dist/server/lib/implicit-tags.d.ts","./node_modules/next/dist/server/app-render/staged-rendering.d.ts","./node_modules/next/dist/server/app-render/work-unit-async-storage.external.d.ts","./node_modules/next/dist/build/templates/app-route.d.ts","./node_modules/next/dist/server/app-render/action-async-storage-instance.d.ts","./node_modules/next/dist/server/app-render/action-async-storage.external.d.ts","./node_modules/next/dist/server/route-modules/app-route/module.d.ts","./node_modules/next/dist/server/route-modules/app-route/module.compiled.d.ts","./node_modules/next/dist/build/segment-config/app/app-segments.d.ts","./node_modules/next/dist/build/get-supported-browsers.d.ts","./node_modules/next/dist/build/utils.d.ts","./node_modules/next/dist/build/rendering-mode.d.ts","./node_modules/next/dist/server/lib/router-utils/build-prefetch-segment-data-route.d.ts","./node_modules/next/dist/server/lib/cpu-profile.d.ts","./node_modules/next/dist/build/turborepo-access-trace/types.d.ts","./node_modules/next/dist/build/turborepo-access-trace/result.d.ts","./node_modules/next/dist/build/turborepo-access-trace/helpers.d.ts","./node_modules/next/dist/build/turborepo-access-trace/index.d.ts","./node_modules/next/dist/export/routes/types.d.ts","./node_modules/next/dist/export/types.d.ts","./node_modules/next/dist/export/worker.d.ts","./node_modules/next/dist/build/worker.d.ts","./node_modules/next/dist/build/index.d.ts","./node_modules/next/dist/lib/coalesced-function.d.ts","./node_modules/next/dist/server/lib/router-utils/types.d.ts","./node_modules/next/dist/trace/types.d.ts","./node_modules/next/dist/trace/trace.d.ts","./node_modules/next/dist/trace/shared.d.ts","./node_modules/next/dist/trace/index.d.ts","./node_modules/next/dist/build/load-jsconfig.d.ts","./node_modules/@next/env/dist/index.d.ts","./node_modules/next/dist/build/webpack/plugins/telemetry-plugin/use-cache-tracker-utils.d.ts","./node_modules/next/dist/build/webpack/plugins/telemetry-plugin/telemetry-plugin.d.ts","./node_modules/next/dist/telemetry/storage.d.ts","./node_modules/next/dist/build/build-context.d.ts","./node_modules/next/dist/build/webpack-config.d.ts","./node_modules/next/dist/build/swc/generated-native.d.ts","./node_modules/next/dist/build/define-env.d.ts","./node_modules/next/dist/build/swc/index.d.ts","./node_modules/next/dist/build/swc/types.d.ts","./node_modules/next/dist/server/dev/parse-version-info.d.ts","./node_modules/next/dist/next-devtools/shared/types.d.ts","./node_modules/next/dist/server/dev/dev-indicator-server-state.d.ts","./node_modules/next/dist/next-devtools/dev-overlay/cache-indicator.d.ts","./node_modules/next/dist/server/lib/parse-stack.d.ts","./node_modules/next/dist/next-devtools/server/shared.d.ts","./node_modules/next/dist/next-devtools/shared/stack-frame.d.ts","./node_modules/next/dist/next-devtools/dev-overlay/utils/get-error-by-type.d.ts","./node_modules/next/dist/next-devtools/dev-overlay/container/runtime-error/render-error.d.ts","./node_modules/next/dist/next-devtools/dev-overlay/shared.d.ts","./node_modules/next/dist/server/dev/debug-channel.d.ts","./node_modules/next/dist/server/dev/hot-reloader-types.d.ts","./node_modules/next/dist/server/web/spec-extension/fetch-event.d.ts","./node_modules/next/dist/server/web/spec-extension/response.d.ts","./node_modules/next/dist/build/segment-config/middleware/middleware-config.d.ts","./node_modules/next/dist/server/web/types.d.ts","./node_modules/next/dist/shared/lib/router/utils/parse-url.d.ts","./node_modules/next/dist/server/base-http/node.d.ts","./node_modules/next/dist/server/lib/async-callback-set.d.ts","./node_modules/next/dist/shared/lib/router/utils/route-regex.d.ts","./node_modules/next/dist/shared/lib/router/utils/route-matcher.d.ts","./node_modules/sharp/lib/index.d.ts","./node_modules/next/dist/server/image-optimizer.d.ts","./node_modules/next/dist/server/next-server.d.ts","./node_modules/next/dist/server/lib/types.d.ts","./node_modules/next/dist/server/lib/lru-cache.d.ts","./node_modules/next/dist/server/lib/dev-bundler-service.d.ts","./node_modules/next/dist/server/dev/static-paths-worker.d.ts","./node_modules/next/dist/server/dev/next-dev-server.d.ts","./node_modules/next/dist/server/next.d.ts","./node_modules/next/dist/server/lib/render-server.d.ts","./node_modules/next/dist/server/lib/router-server.d.ts","./node_modules/next/dist/shared/lib/router/utils/path-match.d.ts","./node_modules/next/dist/server/lib/router-utils/filesystem.d.ts","./node_modules/next/dist/server/lib/router-utils/setup-dev-bundler.d.ts","./node_modules/next/dist/server/lib/router-utils/router-server-context.d.ts","./node_modules/next/dist/server/route-modules/route-module.d.ts","./node_modules/next/dist/server/load-components.d.ts","./node_modules/next/dist/server/web/adapter.d.ts","./node_modules/next/dist/server/app-render/types.d.ts","./node_modules/next/dist/build/webpack/loaders/metadata/types.d.ts","./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.d.ts","./node_modules/next/dist/server/lib/app-dir-module.d.ts","./node_modules/next/dist/server/app-render/app-render.d.ts","./node_modules/next/dist/server/route-modules/app-page/vendored/contexts/entrypoints.d.ts","./node_modules/next/dist/client/components/error-boundary.d.ts","./node_modules/next/dist/client/components/layout-router.d.ts","./node_modules/next/dist/client/components/render-from-template-context.d.ts","./node_modules/next/dist/client/components/client-page.d.ts","./node_modules/next/dist/client/components/client-segment.d.ts","./node_modules/next/dist/client/components/http-access-fallback/error-boundary.d.ts","./node_modules/next/dist/lib/metadata/types/alternative-urls-types.d.ts","./node_modules/next/dist/lib/metadata/types/extra-types.d.ts","./node_modules/next/dist/lib/metadata/types/metadata-types.d.ts","./node_modules/next/dist/lib/metadata/types/manifest-types.d.ts","./node_modules/next/dist/lib/metadata/types/opengraph-types.d.ts","./node_modules/next/dist/lib/metadata/types/twitter-types.d.ts","./node_modules/next/dist/lib/metadata/types/metadata-interface.d.ts","./node_modules/next/dist/lib/metadata/types/resolvers.d.ts","./node_modules/next/dist/lib/metadata/types/icons.d.ts","./node_modules/next/dist/lib/metadata/resolve-metadata.d.ts","./node_modules/next/dist/lib/metadata/metadata.d.ts","./node_modules/next/dist/lib/framework/boundary-components.d.ts","./node_modules/next/dist/server/app-render/rsc/preloads.d.ts","./node_modules/next/dist/server/app-render/rsc/postpone.d.ts","./node_modules/next/dist/server/app-render/rsc/taint.d.ts","./node_modules/next/dist/server/app-render/collect-segment-data.d.ts","./node_modules/next/dist/server/app-render/instant-validation/instant-validation.d.ts","./node_modules/next/dist/next-devtools/userspace/app/segment-explorer-node.d.ts","./node_modules/next/dist/server/app-render/entry-base.d.ts","./node_modules/next/dist/build/templates/app-page.d.ts","./node_modules/next/dist/server/route-modules/app-page/helpers/prerender-manifest-matcher.d.ts","./node_modules/@types/react/jsx-dev-runtime.d.ts","./node_modules/@types/react/compiler-runtime.d.ts","./node_modules/next/dist/server/route-modules/app-page/vendored/rsc/entrypoints.d.ts","./node_modules/@types/react-dom/client.d.ts","./node_modules/@types/react-dom/static.d.ts","./node_modules/@types/react-dom/server.d.ts","./node_modules/next/dist/server/route-modules/app-page/vendored/ssr/entrypoints.d.ts","./node_modules/next/dist/server/route-modules/app-page/module.d.ts","./node_modules/next/dist/server/request/fallback-params.d.ts","./node_modules/next/dist/server/web/spec-extension/image-response.d.ts","./node_modules/next/dist/server/web/spec-extension/user-agent.d.ts","./node_modules/next/dist/server/web/spec-extension/url-pattern.d.ts","./node_modules/next/dist/server/after/index.d.ts","./node_modules/next/dist/server/request/connection.d.ts","./node_modules/next/dist/server/web/exports/index.d.ts","./node_modules/next/dist/server/request-meta.d.ts","./node_modules/next/dist/cli/next-test.d.ts","./node_modules/next/dist/shared/lib/size-limit.d.ts","./node_modules/next/dist/server/config-shared.d.ts","./node_modules/next/dist/server/base-http/index.d.ts","./node_modules/next/dist/server/api-utils/index.d.ts","./node_modules/next/dist/build/adapter/build-complete.d.ts","./node_modules/next/dist/types.d.ts","./node_modules/next/dist/shared/lib/html-context.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/utils.d.ts","./node_modules/next/dist/pages/_app.d.ts","./node_modules/next/app.d.ts","./node_modules/next/dist/server/web/spec-extension/unstable-cache.d.ts","./node_modules/next/dist/server/web/spec-extension/revalidate.d.ts","./node_modules/next/dist/server/web/spec-extension/unstable-no-store.d.ts","./node_modules/next/dist/server/use-cache/cache-tag.d.ts","./node_modules/next/cache.d.ts","./node_modules/next/dist/pages/_document.d.ts","./node_modules/next/document.d.ts","./node_modules/next/dist/shared/lib/dynamic.d.ts","./node_modules/next/dynamic.d.ts","./node_modules/next/dist/pages/_error.d.ts","./node_modules/next/dist/client/components/catch-error.d.ts","./node_modules/next/dist/api/error.d.ts","./node_modules/next/error.d.ts","./node_modules/next/dist/shared/lib/head.d.ts","./node_modules/next/head.d.ts","./node_modules/next/dist/server/request/cookies.d.ts","./node_modules/next/dist/server/request/headers.d.ts","./node_modules/next/dist/server/request/draft-mode.d.ts","./node_modules/next/headers.d.ts","./node_modules/next/dist/shared/lib/get-img-props.d.ts","./node_modules/next/dist/client/image-component.d.ts","./node_modules/next/dist/shared/lib/image-external.d.ts","./node_modules/next/image.d.ts","./node_modules/next/dist/client/link.d.ts","./node_modules/next/link.d.ts","./node_modules/next/dist/client/components/unrecognized-action-error.d.ts","./node_modules/next/dist/client/components/redirect.d.ts","./node_modules/next/dist/client/components/not-found.d.ts","./node_modules/next/dist/client/components/forbidden.d.ts","./node_modules/next/dist/client/components/unauthorized.d.ts","./node_modules/next/dist/client/components/unstable-rethrow.server.d.ts","./node_modules/next/dist/client/components/unstable-rethrow.d.ts","./node_modules/next/dist/client/components/navigation.react-server.d.ts","./node_modules/next/dist/client/components/navigation.d.ts","./node_modules/next/navigation.d.ts","./node_modules/next/router.d.ts","./node_modules/next/dist/client/script.d.ts","./node_modules/next/script.d.ts","./node_modules/next/dist/compiled/@edge-runtime/primitives/url.d.ts","./node_modules/next/dist/compiled/@vercel/og/satori/index.d.ts","./node_modules/next/dist/compiled/@vercel/og/types.d.ts","./node_modules/next/server.d.ts","./node_modules/next/types/global.d.ts","./node_modules/next/types/compiled.d.ts","./node_modules/next/types.d.ts","./node_modules/next/index.d.ts","./node_modules/next/image-types/global.d.ts","./.next/types/routes.d.ts","./next-env.d.ts","./next.config.ts","./node_modules/@supabase/functions-js/dist/module/types.d.ts","./node_modules/@supabase/functions-js/dist/module/functionsclient.d.ts","./node_modules/@supabase/functions-js/dist/module/index.d.ts","./node_modules/@supabase/postgrest-js/dist/index.d.mts","./node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.d.ts","./node_modules/@supabase/realtime-js/dist/module/lib/serializer.d.ts","./node_modules/@supabase/phoenix/priv/static/types/constants.d.ts","./node_modules/@supabase/phoenix/priv/static/types/longpoll.d.ts","./node_modules/@supabase/phoenix/priv/static/types/types.d.ts","./node_modules/@supabase/phoenix/priv/static/types/timer.d.ts","./node_modules/@supabase/phoenix/priv/static/types/socket.d.ts","./node_modules/@supabase/phoenix/priv/static/types/push.d.ts","./node_modules/@supabase/phoenix/priv/static/types/channel.d.ts","./node_modules/@supabase/phoenix/priv/static/types/presence.d.ts","./node_modules/@supabase/phoenix/priv/static/types/serializer.d.ts","./node_modules/@supabase/phoenix/priv/static/types/index.d.ts","./node_modules/@supabase/realtime-js/dist/module/phoenix/types.d.ts","./node_modules/@supabase/realtime-js/dist/module/lib/constants.d.ts","./node_modules/@supabase/realtime-js/dist/module/realtimepresence.d.ts","./node_modules/@supabase/realtime-js/dist/module/realtimepostgresfilterbuilder.d.ts","./node_modules/@supabase/realtime-js/dist/module/realtimechannel.d.ts","./node_modules/@supabase/realtime-js/dist/module/realtimeclient.d.ts","./node_modules/@supabase/realtime-js/dist/module/index.d.ts","./node_modules/iceberg-js/dist/index.d.ts","./node_modules/@supabase/storage-js/dist/index.d.mts","./node_modules/@supabase/auth-js/dist/module/lib/error-codes.d.ts","./node_modules/@supabase/auth-js/dist/module/lib/errors.d.ts","./node_modules/@supabase/auth-js/dist/module/lib/web3/ethereum.d.ts","./node_modules/@supabase/auth-js/dist/module/lib/web3/solana.d.ts","./node_modules/@supabase/auth-js/dist/module/lib/webauthn.dom.d.ts","./node_modules/@supabase/auth-js/dist/module/lib/helpers.d.ts","./node_modules/@supabase/auth-js/dist/module/gotrueclient.d.ts","./node_modules/@supabase/auth-js/dist/module/lib/webauthn.errors.d.ts","./node_modules/@supabase/auth-js/dist/module/lib/webauthn.d.ts","./node_modules/@supabase/auth-js/dist/module/lib/types.d.ts","./node_modules/@supabase/auth-js/dist/module/lib/fetch.d.ts","./node_modules/@supabase/auth-js/dist/module/gotrueadminapi.d.ts","./node_modules/@supabase/auth-js/dist/module/authadminapi.d.ts","./node_modules/@supabase/auth-js/dist/module/authclient.d.ts","./node_modules/@supabase/auth-js/dist/module/lib/locks.d.ts","./node_modules/@supabase/auth-js/dist/module/index.d.ts","./node_modules/@supabase/supabase-js/dist/index.d.mts","./lib/supabaseclient.js","./lib/api-client.ts","./lib/types.ts","./lib/constants.ts","./app/admin/_components/useadminauth.ts","./lib/supabaseadmin.ts","./lib/api-server.ts","./app/api/admin/channels/route.ts","./app/api/admin/lecture-notes/route.ts","./app/api/admin/schedules/route.ts","./app/api/admin/subjects/route.ts","./app/api/channel/content/route.ts","./app/api/channel/view/route.ts","./app/api/study-prompt/route.ts","./app/channel-portal/_components/usechannelauth.ts","./hooks/usestudentstage.ts","./components/ui/toast.tsx","./components/ui/button.tsx","./components/ui/confirmdialog.tsx","./components/navbar.tsx","./app/layout.tsx","./components/animatedbackground.tsx","./app/page.tsx","./components/ui/field.tsx","./app/admin/_components/subjectssection.tsx","./app/admin/_components/materialssection.tsx","./app/admin/_components/channelssection.tsx","./app/admin/_components/schedulessection.tsx","./app/admin/page.tsx","./app/channel-portal/_components/contentsection.tsx","./app/channel-portal/_components/settingssection.tsx","./app/channel-portal/page.tsx","./app/channels/page.tsx","./app/channels/[id]/page.tsx","./app/gpa/page.tsx","./app/lawazem/page.tsx","./app/schedule/page.tsx","./app/study-prompt/page.tsx","./.next/types/cache-life.d.ts","./.next/types/validator.ts","./.next/dev/types/cache-life.d.ts","./.next/dev/types/routes.d.ts","./.next/dev/types/validator.ts","./node_modules/@types/estree/index.d.ts","./node_modules/@types/json-schema/index.d.ts","./node_modules/@types/json5/index.d.ts"],"fileIdsList":[[97,143,483,484,485,486,613],[97,143,613,615],[97,143,226,524,527,582,583,584,585,586,587,588,595,597,603,606,607,608,609,610,611,612,613,615,616],[97,143,483,484,485,486,615],[97,143,226,524,527,530,582,583,584,585,586,587,588,595,597,603,606,607,608,609,610,611,612,613,615],[85,97,143,226,576,577,578,591,592,593,598,613,615],[85,97,143,226,576,577,591,592,593,598,613,615],[85,97,143,226,576,577,578,591,592,613,615],[85,97,143,226,576,578,613,615],[85,97,143,226,579,592,598,599,600,601,602,613,615],[97,143,226,524,581,613,615],[97,143,226,524,577,578,580,581,613,615],[97,143,226,524,580,581,613,615],[97,143,226,524,578,581,613,615],[85,97,143,226,576,577,578,591,592,598,613,615],[85,97,143,226,575,576,577,578,613,615],[85,97,143,226,589,592,598,604,605,613,615],[85,97,143,226,507,517,575,577,578,598,613,615],[85,97,143,226,507,575,577,590,598,613,615],[85,97,143,226,507,575,577,590,592,593,598,613,615],[97,143,226,525,528,591,593,594,613,615],[85,97,143,226,507,577,578,596,613,615],[85,97,143,226,507,575,577,590,613,615],[85,97,143,226,507,575,576,578,590,591,592,598,613,615],[85,97,143,226,613,615],[97,143,226,507,517,613,615],[85,97,143,226,592,613,615],[85,97,143,226,517,577,578,613,615],[97,143,226,575,613,615],[97,143,226,524,580,613,615],[97,143,226,577,613,615],[97,143,226,574,613,615],[97,143,226,613,615],[97,143,528,529,530,613,615],[97,143,226,528,613,615],[97,143,569,613,615],[97,143,564,613,615],[97,143,559,567,568,613,615],[97,143,559,563,567,568,569,613,615],[97,143,559,564,567,569,570,571,572,613,615],[97,143,558,567,613,615],[97,143,567,613,615],[97,143,562,567,613,615],[97,143,559,560,561,562,566,568,613,615],[97,143,559,562,564,565,567,613,615],[97,143,533,613,615],[97,143,533,534,613,615],[97,143,541,542,543,544,613,615],[97,143,540,541,542,543,544,545,546,547,613,615],[97,143,541,545,613,615],[97,143,541,613,615],[97,143,540,541,542,545,613,615],[97,143,539,540,613,615],[97,143,537,551,553,554,613,615],[97,143,549,613,615],[97,143,548,613,615],[97,143,548,549,550,551,552,554,613,615],[97,143,537,538,549,550,553,613,615],[97,143,553,613,615],[97,143,556,613,615],[97,143,535,536,555,557,573,613,615],[97,140,143,613,615],[97,142,143,613,615],[143,613,615],[97,143,148,176,613,615],[97,143,144,149,154,162,173,184,613,615],[97,143,144,145,154,162,613,615],[92,93,94,97,143,613,615],[97,143,146,185,613,615],[97,143,147,148,155,163,613,615],[97,143,148,173,181,613,615],[97,143,149,151,154,162,613,615],[97,142,143,150,613,615],[97,143,151,152,613,615],[97,143,153,154,613,615],[97,142,143,154,613,615],[97,143,154,155,156,173,184,613,615],[97,143,154,155,156,169,173,176,613,615],[97,143,151,154,157,162,173,184,613,615],[97,143,154,155,157,158,162,173,181,184,613,615],[97,143,157,159,173,181,184,613,615],[95,96,97,98,99,100,101,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,613,615],[97,143,154,160,613,615],[97,143,161,184,189,613,615],[97,143,151,154,162,173,613,615],[97,143,163,613,615],[97,143,164,613,615],[97,142,143,165,613,615],[97,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,613,615],[97,143,167,613,615],[97,143,168,613,615],[97,143,154,169,170,613,615],[97,143,169,171,185,187,613,615],[97,143,154,173,174,176,613,615],[97,143,175,176,613,615],[97,143,173,174,613,615],[97,143,176,613,615],[97,143,177,613,615],[97,140,143,173,178,613,615],[97,143,154,179,180,613,615],[97,143,179,180,613,615],[97,143,148,162,173,181,613,615],[97,143,182,613,615],[97,143,162,183,613,615],[97,143,157,168,184,613,615],[97,143,148,185,613,615],[97,143,173,186,613,615],[97,143,161,187,613,615],[97,143,188,613,615],[97,138,143,613,615],[97,138,143,154,156,165,173,176,184,187,189,613,615],[97,143,173,190,613,615],[85,89,97,143,192,193,194,196,478,523,613,615],[85,97,143,613,615],[85,89,97,143,192,193,194,195,459,478,523,613,615],[85,89,97,143,192,193,195,196,478,523,613,615],[85,97,143,196,459,460,613,615],[85,97,143,196,459,613,615],[85,89,97,143,193,194,195,196,478,523,613,615],[85,89,97,143,192,194,195,196,478,523,613,615],[83,84,97,143,613,615],[97,143,481,613,615],[97,143,483,484,485,486,613,615],[97,143,429,492,493,613,615],[97,143,201,202,204,216,240,355,366,474,613,615],[97,143,204,235,236,237,239,474,613,615],[97,143,204,372,374,376,377,379,474,476,613,615],[97,143,204,238,275,474,613,615],[97,143,202,204,215,216,222,228,233,354,355,356,365,474,476,613,615],[97,143,474,613,615],[97,143,211,217,236,256,351,613,615],[97,143,204,613,615],[97,143,197,211,217,613,615],[97,143,383,613,615],[97,143,380,381,383,613,615],[97,143,380,382,474,613,615],[97,143,157,256,453,471,613,615],[97,143,157,327,330,346,351,471,613,615],[97,143,157,299,471,613,615],[97,143,359,613,615],[97,143,358,359,360,613,615],[97,143,358,613,615],[91,97,143,157,197,204,216,222,228,234,236,240,241,254,255,322,352,353,366,474,478,613,615],[97,143,201,204,238,275,372,373,378,474,526,613,615],[97,143,238,526,613,615],[97,143,201,255,424,474,526,613,615],[97,143,526,613,615],[97,143,204,238,239,526,613,615],[97,143,375,526,613,615],[97,143,241,354,357,364,613,615],[85,97,143,429,613,615],[97,143,168,211,226,613,615],[97,143,211,226,613,615],[85,97,143,296,613,615],[85,97,143,217,226,429,613,615],[97,143,211,282,296,297,508,515,613,615],[97,143,281,509,510,511,512,514,613,615],[97,143,332,613,615],[97,143,332,333,613,615],[97,143,215,217,284,285,613,615],[97,143,217,291,292,613,615],[97,143,217,286,294,613,615],[97,143,291,613,615],[97,143,209,217,284,285,286,287,288,289,290,291,294,613,615],[97,143,217,284,291,292,293,295,613,615],[97,143,217,285,287,288,613,615],[97,143,285,287,290,292,613,615],[97,143,513,613,615],[97,143,217,613,615],[85,97,143,205,502,613,615],[85,97,143,184,613,615],[85,97,143,238,273,613,615],[85,97,143,238,366,613,615],[97,143,271,276,613,615],[85,97,143,272,480,613,615],[85,89,97,143,157,192,193,194,195,196,478,522,613,615],[97,143,157,217,613,615],[97,143,157,216,221,302,319,361,362,366,421,423,474,475,613,615],[97,143,254,363,613,615],[97,143,478,613,615],[97,143,203,613,615],[85,97,143,208,211,426,442,444,613,615],[97,143,168,211,426,441,442,443,525,613,615],[97,143,435,436,437,438,439,440,613,615],[97,143,437,613,615],[97,143,441,613,615],[97,143,226,390,391,393,613,615],[85,97,143,217,384,385,386,387,392,613,615],[97,143,390,392,613,615],[97,143,388,613,615],[97,143,389,613,615],[85,97,143,226,272,480,613,615],[85,97,143,226,479,480,613,615],[85,97,143,226,480,613,615],[97,143,319,320,613,615],[97,143,320,613,615],[97,143,157,475,480,613,615],[97,143,349,613,615],[97,142,143,348,613,615],[97,143,211,217,223,225,327,340,344,346,423,426,463,464,471,475,613,615],[97,143,217,266,288,613,615],[97,143,327,338,341,346,613,615],[85,97,143,208,211,327,330,346,349,383,430,431,432,433,434,445,446,447,448,449,450,451,452,526,613,615],[97,143,208,211,236,327,334,335,336,339,340,613,615],[97,143,173,217,236,338,345,426,427,471,613,615],[97,143,342,613,615],[97,143,157,168,205,217,221,231,263,264,267,319,322,387,421,422,463,474,475,476,478,526,613,615],[97,143,208,209,211,613,615],[97,143,327,613,615],[97,142,143,236,263,264,321,322,323,324,325,326,475,613,615],[97,143,346,613,615],[97,142,143,210,211,221,225,261,327,334,335,336,337,338,341,342,343,344,345,464,613,615],[97,143,157,261,262,334,475,476,613,615],[97,143,236,264,319,322,327,423,475,613,615],[97,143,157,474,476,613,615],[97,143,157,173,471,475,476,613,615],[97,143,157,168,197,211,216,223,225,228,231,238,258,263,264,265,266,267,302,303,305,308,310,313,314,315,316,318,366,421,423,471,474,475,476,613,615],[97,143,157,173,613,615],[97,143,204,205,206,234,471,472,473,478,480,526,613,615],[97,143,201,202,474,613,615],[97,143,395,613,615],[97,143,157,173,184,213,379,383,384,385,386,387,393,394,526,613,615],[97,143,168,184,197,211,213,225,228,264,303,308,318,319,372,399,400,401,407,410,411,421,423,471,474,613,615],[97,143,228,234,241,254,264,322,474,613,615],[97,143,157,184,205,216,225,264,405,471,474,613,615],[97,143,425,613,615],[97,143,157,395,408,409,418,613,615],[97,143,471,474,613,615],[97,143,324,464,613,615],[97,143,225,263,366,480,613,615],[97,143,157,168,203,308,368,372,401,407,410,413,471,613,615],[97,143,157,241,254,372,414,613,615],[97,143,204,265,366,416,474,476,613,615],[97,143,157,184,387,474,613,615],[97,143,157,238,265,366,367,368,377,395,415,417,474,613,615],[91,97,143,157,263,420,478,480,613,615],[97,143,317,421,613,615],[97,143,157,168,211,214,216,217,223,225,231,240,241,254,264,267,303,305,315,318,319,366,399,400,401,402,404,406,421,423,471,480,613,615],[97,143,157,173,241,407,412,418,471,613,615],[97,143,244,245,246,247,248,249,250,251,252,253,613,615],[97,143,258,309,613,615],[97,143,311,613,615],[97,143,309,613,615],[97,143,311,312,613,615],[97,143,157,215,216,217,221,222,475,613,615],[97,143,157,168,203,205,223,227,263,266,267,301,421,471,476,478,480,613,615],[97,143,157,168,184,207,214,215,225,227,264,419,464,470,475,613,615],[97,143,334,613,615],[97,143,335,613,615],[97,143,217,228,463,613,615],[97,143,336,613,615],[97,143,210,613,615],[97,143,212,224,613,615],[97,143,157,212,216,223,613,615],[97,143,219,224,613,615],[97,143,220,613,615],[97,143,212,213,613,615],[97,143,212,268,613,615],[97,143,212,613,615],[97,143,214,258,307,613,615],[97,143,306,613,615],[97,143,211,213,214,613,615],[97,143,214,304,613,615],[97,143,211,213,613,615],[97,143,263,366,613,615],[97,143,463,613,615],[97,143,157,184,223,225,229,263,366,420,423,426,427,428,454,455,458,462,464,471,475,613,615],[97,143,277,280,282,283,296,297,613,615],[85,97,143,194,196,226,456,457,613,615],[85,97,143,194,196,226,456,457,461,613,615],[97,143,350,613,615],[97,143,236,257,262,263,327,328,329,330,331,333,346,347,349,352,420,423,474,476,613,615],[97,143,296,613,615],[97,143,157,301,471,613,615],[97,143,301,613,615],[97,143,157,223,269,298,300,302,420,471,478,480,613,615],[97,143,277,278,279,280,282,283,296,297,479,613,615],[91,97,143,157,168,184,212,213,225,231,263,264,267,366,418,419,421,471,474,475,478,613,615],[97,143,208,211,218,613,615],[97,143,262,264,396,399,613,615],[97,143,262,397,465,466,467,468,469,613,615],[97,143,157,258,474,613,615],[97,143,157,613,615],[97,143,261,346,613,615],[97,143,260,613,615],[97,143,262,315,613,615],[97,143,259,261,474,613,615],[97,143,157,207,262,396,397,398,471,474,475,613,615],[85,97,143,211,217,295,613,615],[85,97,143,209,613,615],[97,143,199,200,613,615],[85,97,143,205,613,615],[85,97,143,211,281,613,615],[85,91,97,143,263,267,478,480,613,615],[97,143,205,502,503,613,615],[85,97,143,276,613,615],[85,97,143,168,184,203,270,272,274,275,480,613,615],[97,143,211,238,475,613,615],[97,143,211,403,613,615],[85,97,143,155,157,168,201,203,276,374,478,479,613,615],[85,97,143,192,193,194,195,196,478,523,613,615],[85,86,87,88,89,97,143,613,615],[97,143,148,613,615],[97,143,369,370,371,613,615],[97,143,369,613,615],[85,89,97,143,157,159,168,191,192,193,194,195,196,197,203,231,236,413,441,476,477,480,523,613,615],[97,143,488,613,615],[97,143,490,613,615],[97,143,494,613,615],[97,143,496,613,615],[97,143,498,499,500,613,615],[97,143,504,613,615],[90,97,143,482,487,489,491,495,497,501,505,507,517,518,520,524,525,526,527,613,615],[97,143,506,613,615],[97,143,516,613,615],[97,143,272,613,615],[97,143,519,613,615],[97,142,143,262,396,397,399,465,466,468,469,521,523,613,615],[97,143,191,613,615],[97,143,173,191,613,615],[97,110,114,143,184,613,615],[97,110,143,173,184,613,615],[97,105,143,613,615],[97,107,110,143,181,184,613,615],[97,143,162,181,613,615],[97,105,143,191,613,615],[97,107,110,143,162,184,613,615],[97,102,103,106,109,143,154,173,184,613,615],[97,110,117,143,613,615],[97,102,108,143,613,615],[97,110,131,132,143,613,615],[97,106,110,143,176,184,191,613,615],[97,131,143,191,613,615],[97,104,105,143,191,613,615],[97,110,143,613,615],[97,104,105,106,107,108,109,110,111,112,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,132,133,134,135,136,137,143,613,615],[97,110,125,143,613,615],[97,110,117,118,143,613,615],[97,108,110,118,119,143,613,615],[97,109,143,613,615],[97,102,105,110,143,613,615],[97,110,114,118,119,143,613,615],[97,114,143,613,615],[97,108,110,113,143,184,613,615],[97,102,107,110,117,143,613,615],[97,143,173,613,615],[97,105,110,131,143,189,191,613,615]],"fileInfos":[{"version":"c430d44666289dae81f30fa7b2edebf186ecc91a2d4c71266ea6ae76388792e1","affectsGlobalScope":true,"impliedFormat":1},{"version":"45b7ab580deca34ae9729e97c13cfd999df04416a79116c3bfb483804f85ded4","impliedFormat":1},{"version":"3facaf05f0c5fc569c5649dd359892c98a85557e3e0c847964caeb67076f4d75","impliedFormat":1},{"version":"e44bb8bbac7f10ecc786703fe0a6a4b952189f908707980ba8f3c8975a760962","impliedFormat":1},{"version":"5e1c4c362065a6b95ff952c0eab010f04dcd2c3494e813b493ecfd4fcb9fc0d8","impliedFormat":1},{"version":"68d73b4a11549f9c0b7d352d10e91e5dca8faa3322bfb77b661839c42b1ddec7","impliedFormat":1},{"version":"5efce4fc3c29ea84e8928f97adec086e3dc876365e0982cc8479a07954a3efd4","impliedFormat":1},{"version":"feecb1be483ed332fad555aff858affd90a48ab19ba7272ee084704eb7167569","impliedFormat":1},{"version":"ee7bad0c15b58988daa84371e0b89d313b762ab83cb5b31b8a2d1162e8eb41c2","impliedFormat":1},{"version":"27bdc30a0e32783366a5abeda841bc22757c1797de8681bbe81fbc735eeb1c10","impliedFormat":1},{"version":"8fd575e12870e9944c7e1d62e1f5a73fcf23dd8d3a321f2a2c74c20d022283fe","impliedFormat":1},{"version":"2ab096661c711e4a81cc464fa1e6feb929a54f5340b46b0a07ac6bbf857471f0","impliedFormat":1},{"version":"080941d9f9ff9307f7e27a83bcd888b7c8270716c39af943532438932ec1d0b9","affectsGlobalScope":true,"impliedFormat":1},{"version":"2e80ee7a49e8ac312cc11b77f1475804bee36b3b2bc896bead8b6e1266befb43","affectsGlobalScope":true,"impliedFormat":1},{"version":"c57796738e7f83dbc4b8e65132f11a377649c00dd3eee333f672b8f0a6bea671","affectsGlobalScope":true,"impliedFormat":1},{"version":"dc2df20b1bcdc8c2d34af4926e2c3ab15ffe1160a63e58b7e09833f616efff44","affectsGlobalScope":true,"impliedFormat":1},{"version":"515d0b7b9bea2e31ea4ec968e9edd2c39d3eebf4a2d5cbd04e88639819ae3b71","affectsGlobalScope":true,"impliedFormat":1},{"version":"0559b1f683ac7505ae451f9a96ce4c3c92bdc71411651ca6ddb0e88baaaad6a3","affectsGlobalScope":true,"impliedFormat":1},{"version":"0dc1e7ceda9b8b9b455c3a2d67b0412feab00bd2f66656cd8850e8831b08b537","affectsGlobalScope":true,"impliedFormat":1},{"version":"ce691fb9e5c64efb9547083e4a34091bcbe5bdb41027e310ebba8f7d96a98671","affectsGlobalScope":true,"impliedFormat":1},{"version":"8d697a2a929a5fcb38b7a65594020fcef05ec1630804a33748829c5ff53640d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"4ff2a353abf8a80ee399af572debb8faab2d33ad38c4b4474cff7f26e7653b8d","affectsGlobalScope":true,"impliedFormat":1},{"version":"fb0f136d372979348d59b3f5020b4cdb81b5504192b1cacff5d1fbba29378aa1","affectsGlobalScope":true,"impliedFormat":1},{"version":"d15bea3d62cbbdb9797079416b8ac375ae99162a7fba5de2c6c505446486ac0a","affectsGlobalScope":true,"impliedFormat":1},{"version":"68d18b664c9d32a7336a70235958b8997ebc1c3b8505f4f1ae2b7e7753b87618","affectsGlobalScope":true,"impliedFormat":1},{"version":"eb3d66c8327153d8fa7dd03f9c58d351107fe824c79e9b56b462935176cdf12a","affectsGlobalScope":true,"impliedFormat":1},{"version":"38f0219c9e23c915ef9790ab1d680440d95419ad264816fa15009a8851e79119","affectsGlobalScope":true,"impliedFormat":1},{"version":"69ab18c3b76cd9b1be3d188eaf8bba06112ebbe2f47f6c322b5105a6fbc45a2e","affectsGlobalScope":true,"impliedFormat":1},{"version":"a680117f487a4d2f30ea46f1b4b7f58bef1480456e18ba53ee85c2746eeca012","affectsGlobalScope":true,"impliedFormat":1},{"version":"2f11ff796926e0832f9ae148008138ad583bd181899ab7dd768a2666700b1893","affectsGlobalScope":true,"impliedFormat":1},{"version":"4de680d5bb41c17f7f68e0419412ca23c98d5749dcaaea1896172f06435891fc","affectsGlobalScope":true,"impliedFormat":1},{"version":"954296b30da6d508a104a3a0b5d96b76495c709785c1d11610908e63481ee667","affectsGlobalScope":true,"impliedFormat":1},{"version":"ac9538681b19688c8eae65811b329d3744af679e0bdfa5d842d0e32524c73e1c","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a969edff4bd52585473d24995c5ef223f6652d6ef46193309b3921d65dd4376","affectsGlobalScope":true,"impliedFormat":1},{"version":"9e9fbd7030c440b33d021da145d3232984c8bb7916f277e8ffd3dc2e3eae2bdb","affectsGlobalScope":true,"impliedFormat":1},{"version":"811ec78f7fefcabbda4bfa93b3eb67d9ae166ef95f9bff989d964061cbf81a0c","affectsGlobalScope":true,"impliedFormat":1},{"version":"717937616a17072082152a2ef351cb51f98802fb4b2fdabd32399843875974ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"d7e7d9b7b50e5f22c915b525acc5a49a7a6584cf8f62d0569e557c5cfc4b2ac2","affectsGlobalScope":true,"impliedFormat":1},{"version":"71c37f4c9543f31dfced6c7840e068c5a5aacb7b89111a4364b1d5276b852557","affectsGlobalScope":true,"impliedFormat":1},{"version":"576711e016cf4f1804676043e6a0a5414252560eb57de9faceee34d79798c850","affectsGlobalScope":true,"impliedFormat":1},{"version":"89c1b1281ba7b8a96efc676b11b264de7a8374c5ea1e6617f11880a13fc56dc6","affectsGlobalScope":true,"impliedFormat":1},{"version":"74f7fa2d027d5b33eb0471c8e82a6c87216223181ec31247c357a3e8e2fddc5b","affectsGlobalScope":true,"impliedFormat":1},{"version":"d6d7ae4d1f1f3772e2a3cde568ed08991a8ae34a080ff1151af28b7f798e22ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"063600664504610fe3e99b717a1223f8b1900087fab0b4cad1496a114744f8df","affectsGlobalScope":true,"impliedFormat":1},{"version":"934019d7e3c81950f9a8426d093458b65d5aff2c7c1511233c0fd5b941e608ab","affectsGlobalScope":true,"impliedFormat":1},{"version":"52ada8e0b6e0482b728070b7639ee42e83a9b1c22d205992756fe020fd9f4a47","affectsGlobalScope":true,"impliedFormat":1},{"version":"3bdefe1bfd4d6dee0e26f928f93ccc128f1b64d5d501ff4a8cf3c6371200e5e6","affectsGlobalScope":true,"impliedFormat":1},{"version":"59fb2c069260b4ba00b5643b907ef5d5341b167e7d1dbf58dfd895658bda2867","affectsGlobalScope":true,"impliedFormat":1},{"version":"639e512c0dfc3fad96a84caad71b8834d66329a1f28dc95e3946c9b58176c73a","affectsGlobalScope":true,"impliedFormat":1},{"version":"368af93f74c9c932edd84c58883e736c9e3d53cec1fe24c0b0ff451f529ceab1","affectsGlobalScope":true,"impliedFormat":1},{"version":"af3dd424cf267428f30ccfc376f47a2c0114546b55c44d8c0f1d57d841e28d74","affectsGlobalScope":true,"impliedFormat":1},{"version":"995c005ab91a498455ea8dfb63aa9f83fa2ea793c3d8aa344be4a1678d06d399","affectsGlobalScope":true,"impliedFormat":1},{"version":"959d36cddf5e7d572a65045b876f2956c973a586da58e5d26cde519184fd9b8a","affectsGlobalScope":true,"impliedFormat":1},{"version":"965f36eae237dd74e6cca203a43e9ca801ce38824ead814728a2807b1910117d","affectsGlobalScope":true,"impliedFormat":1},{"version":"3925a6c820dcb1a06506c90b1577db1fdbf7705d65b62b99dce4be75c637e26b","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a3d63ef2b853447ec4f749d3f368ce642264246e02911fcb1590d8c161b8005","affectsGlobalScope":true,"impliedFormat":1},{"version":"8cdf8847677ac7d20486e54dd3fcf09eda95812ac8ace44b4418da1bbbab6eb8","affectsGlobalScope":true,"impliedFormat":1},{"version":"8444af78980e3b20b49324f4a16ba35024fef3ee069a0eb67616ea6ca821c47a","affectsGlobalScope":true,"impliedFormat":1},{"version":"3287d9d085fbd618c3971944b65b4be57859f5415f495b33a6adc994edd2f004","affectsGlobalScope":true,"impliedFormat":1},{"version":"b4b67b1a91182421f5df999988c690f14d813b9850b40acd06ed44691f6727ad","affectsGlobalScope":true,"impliedFormat":1},{"version":"df83c2a6c73228b625b0beb6669c7ee2a09c914637e2d35170723ad49c0f5cd4","affectsGlobalScope":true,"impliedFormat":1},{"version":"436aaf437562f276ec2ddbee2f2cdedac7664c1e4c1d2c36839ddd582eeb3d0a","affectsGlobalScope":true,"impliedFormat":1},{"version":"8e3c06ea092138bf9fa5e874a1fdbc9d54805d074bee1de31b99a11e2fec239d","affectsGlobalScope":true,"impliedFormat":1},{"version":"87dc0f382502f5bbce5129bdc0aea21e19a3abbc19259e0b43ae038a9fc4e326","affectsGlobalScope":true,"impliedFormat":1},{"version":"b1cb28af0c891c8c96b2d6b7be76bd394fddcfdb4709a20ba05a7c1605eea0f9","affectsGlobalScope":true,"impliedFormat":1},{"version":"2fef54945a13095fdb9b84f705f2b5994597640c46afeb2ce78352fab4cb3279","affectsGlobalScope":true,"impliedFormat":1},{"version":"ac77cb3e8c6d3565793eb90a8373ee8033146315a3dbead3bde8db5eaf5e5ec6","affectsGlobalScope":true,"impliedFormat":1},{"version":"56e4ed5aab5f5920980066a9409bfaf53e6d21d3f8d020c17e4de584d29600ad","affectsGlobalScope":true,"impliedFormat":1},{"version":"4ece9f17b3866cc077099c73f4983bddbcb1dc7ddb943227f1ec070f529dedd1","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a6282c8827e4b9a95f4bf4f5c205673ada31b982f50572d27103df8ceb8013c","affectsGlobalScope":true,"impliedFormat":1},{"version":"1c9319a09485199c1f7b0498f2988d6d2249793ef67edda49d1e584746be9032","affectsGlobalScope":true,"impliedFormat":1},{"version":"e3a2a0cee0f03ffdde24d89660eba2685bfbdeae955a6c67e8c4c9fd28928eeb","affectsGlobalScope":true,"impliedFormat":1},{"version":"811c71eee4aa0ac5f7adf713323a5c41b0cf6c4e17367a34fbce379e12bbf0a4","affectsGlobalScope":true,"impliedFormat":1},{"version":"51ad4c928303041605b4d7ae32e0c1ee387d43a24cd6f1ebf4a2699e1076d4fa","affectsGlobalScope":true,"impliedFormat":1},{"version":"60037901da1a425516449b9a20073aa03386cce92f7a1fd902d7602be3a7c2e9","affectsGlobalScope":true,"impliedFormat":1},{"version":"d4b1d2c51d058fc21ec2629fff7a76249dec2e36e12960ea056e3ef89174080f","affectsGlobalScope":true,"impliedFormat":1},{"version":"22adec94ef7047a6c9d1af3cb96be87a335908bf9ef386ae9fd50eeb37f44c47","affectsGlobalScope":true,"impliedFormat":1},{"version":"196cb558a13d4533a5163286f30b0509ce0210e4b316c56c38d4c0fd2fb38405","affectsGlobalScope":true,"impliedFormat":1},{"version":"73f78680d4c08509933daf80947902f6ff41b6230f94dd002ae372620adb0f60","affectsGlobalScope":true,"impliedFormat":1},{"version":"c5239f5c01bcfa9cd32f37c496cf19c61d69d37e48be9de612b541aac915805b","affectsGlobalScope":true,"impliedFormat":1},{"version":"8e7f8264d0fb4c5339605a15daadb037bf238c10b654bb3eee14208f860a32ea","affectsGlobalScope":true,"impliedFormat":1},{"version":"782dec38049b92d4e85c1585fbea5474a219c6984a35b004963b00beb1aab538","affectsGlobalScope":true,"impliedFormat":1},{"version":"7e29f41b158de217f94cb9676bf9cbd0cd9b5a46e1985141ed36e075c52bf6ad","affectsGlobalScope":true,"impliedFormat":1},{"version":"ac51dd7d31333793807a6abaa5ae168512b6131bd41d9c5b98477fc3b7800f9f","impliedFormat":1},{"version":"dc782ff85b2cb10075ecffc158af7bfb27ff97bf8491c917efea0c3d622d5ac4","impliedFormat":1},{"version":"acd8fd5090ac73902278889c38336ff3f48af6ba03aa665eb34a75e7ba1dccc4","impliedFormat":1},{"version":"d6258883868fb2680d2ca96bc8b1352cab69874581493e6d52680c5ffecdb6cc","impliedFormat":1},{"version":"1b61d259de5350f8b1e5db06290d31eaebebc6baafd5f79d314b5af9256d7153","impliedFormat":1},{"version":"f258e3960f324a956fc76a3d3d9e964fff2244ff5859dcc6ce5951e5413ca826","impliedFormat":1},{"version":"643f7232d07bf75e15bd8f658f664d6183a0efaca5eb84b48201c7671a266979","impliedFormat":1},{"version":"21da358700a3893281ce0c517a7a30cbd46be020d9f0c3f2834d0a8ad1f5fc75","impliedFormat":1},{"version":"70521b6ab0dcba37539e5303104f29b721bfb2940b2776da4cc818c07e1fefc1","affectsGlobalScope":true,"impliedFormat":1},{"version":"ab41ef1f2cdafb8df48be20cd969d875602483859dc194e9c97c8a576892c052","affectsGlobalScope":true,"impliedFormat":1},{"version":"d153a11543fd884b596587ccd97aebbeed950b26933ee000f94009f1ab142848","affectsGlobalScope":true,"impliedFormat":1},{"version":"21d819c173c0cf7cc3ce57c3276e77fd9a8a01d35a06ad87158781515c9a438a","impliedFormat":1},{"version":"98cffbf06d6bab333473c70a893770dbe990783904002c4f1a960447b4b53dca","affectsGlobalScope":true,"impliedFormat":1},{"version":"ba481bca06f37d3f2c137ce343c7d5937029b2468f8e26111f3c9d9963d6568d","affectsGlobalScope":true,"impliedFormat":1},{"version":"6d9ef24f9a22a88e3e9b3b3d8c40ab1ddb0853f1bfbd5c843c37800138437b61","affectsGlobalScope":true,"impliedFormat":1},{"version":"1db0b7dca579049ca4193d034d835f6bfe73096c73663e5ef9a0b5779939f3d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"9798340ffb0d067d69b1ae5b32faa17ab31b82466a3fc00d8f2f2df0c8554aaa","affectsGlobalScope":true,"impliedFormat":1},{"version":"f26b11d8d8e4b8028f1c7d618b22274c892e4b0ef5b3678a8ccbad85419aef43","affectsGlobalScope":true,"impliedFormat":1},{"version":"5929864ce17fba74232584d90cb721a89b7ad277220627cc97054ba15a98ea8f","impliedFormat":1},{"version":"763fe0f42b3d79b440a9b6e51e9ba3f3f91352469c1e4b3b67bfa4ff6352f3f4","impliedFormat":1},{"version":"25c8056edf4314820382a5fdb4bb7816999acdcb929c8f75e3f39473b87e85bc","impliedFormat":1},{"version":"c464d66b20788266e5353b48dc4aa6bc0dc4a707276df1e7152ab0c9ae21fad8","impliedFormat":1},{"version":"78d0d27c130d35c60b5e5566c9f1e5be77caf39804636bc1a40133919a949f21","impliedFormat":1},{"version":"c6fd2c5a395f2432786c9cb8deb870b9b0e8ff7e22c029954fabdd692bff6195","impliedFormat":1},{"version":"1d6e127068ea8e104a912e42fc0a110e2aa5a66a356a917a163e8cf9a65e4a75","impliedFormat":1},{"version":"5ded6427296cdf3b9542de4471d2aa8d3983671d4cac0f4bf9c637208d1ced43","impliedFormat":1},{"version":"7f182617db458e98fc18dfb272d40aa2fff3a353c44a89b2c0ccb3937709bfb5","impliedFormat":1},{"version":"cadc8aced301244057c4e7e73fbcae534b0f5b12a37b150d80e5a45aa4bebcbd","impliedFormat":1},{"version":"385aab901643aa54e1c36f5ef3107913b10d1b5bb8cbcd933d4263b80a0d7f20","impliedFormat":1},{"version":"9670d44354bab9d9982eca21945686b5c24a3f893db73c0dae0fd74217a4c219","impliedFormat":1},{"version":"0b8a9268adaf4da35e7fa830c8981cfa22adbbe5b3f6f5ab91f6658899e657a7","impliedFormat":1},{"version":"11396ed8a44c02ab9798b7dca436009f866e8dae3c9c25e8c1fbc396880bf1bb","impliedFormat":1},{"version":"ba7bc87d01492633cb5a0e5da8a4a42a1c86270e7b3d2dea5d156828a84e4882","impliedFormat":1},{"version":"4893a895ea92c85345017a04ed427cbd6a1710453338df26881a6019432febdd","impliedFormat":1},{"version":"c21dc52e277bcfc75fac0436ccb75c204f9e1b3fa5e12729670910639f27343e","impliedFormat":1},{"version":"13f6f39e12b1518c6650bbb220c8985999020fe0f21d818e28f512b7771d00f9","impliedFormat":1},{"version":"9b5369969f6e7175740bf51223112ff209f94ba43ecd3bb09eefff9fd675624a","impliedFormat":1},{"version":"4fe9e626e7164748e8769bbf74b538e09607f07ed17c2f20af8d680ee49fc1da","impliedFormat":1},{"version":"24515859bc0b836719105bb6cc3d68255042a9f02a6022b3187948b204946bd2","impliedFormat":1},{"version":"ea0148f897b45a76544ae179784c95af1bd6721b8610af9ffa467a518a086a43","impliedFormat":1},{"version":"24c6a117721e606c9984335f71711877293a9651e44f59f3d21c1ea0856f9cc9","impliedFormat":1},{"version":"dd3273ead9fbde62a72949c97dbec2247ea08e0c6952e701a483d74ef92d6a17","impliedFormat":1},{"version":"405822be75ad3e4d162e07439bac80c6bcc6dbae1929e179cf467ec0b9ee4e2e","impliedFormat":1},{"version":"0db18c6e78ea846316c012478888f33c11ffadab9efd1cc8bcc12daded7a60b6","impliedFormat":1},{"version":"e61be3f894b41b7baa1fbd6a66893f2579bfad01d208b4ff61daef21493ef0a8","impliedFormat":1},{"version":"bd0532fd6556073727d28da0edfd1736417a3f9f394877b6d5ef6ad88fba1d1a","impliedFormat":1},{"version":"89167d696a849fce5ca508032aabfe901c0868f833a8625d5a9c6e861ef935d2","impliedFormat":1},{"version":"615ba88d0128ed16bf83ef8ccbb6aff05c3ee2db1cc0f89ab50a4939bfc1943f","impliedFormat":1},{"version":"a4d551dbf8746780194d550c88f26cf937caf8d56f102969a110cfaed4b06656","impliedFormat":1},{"version":"8bd86b8e8f6a6aa6c49b71e14c4ffe1211a0e97c80f08d2c8cc98838006e4b88","impliedFormat":1},{"version":"317e63deeb21ac07f3992f5b50cdca8338f10acd4fbb7257ebf56735bf52ab00","impliedFormat":1},{"version":"4732aec92b20fb28c5fe9ad99521fb59974289ed1e45aecb282616202184064f","impliedFormat":1},{"version":"2e85db9e6fd73cfa3d7f28e0ab6b55417ea18931423bd47b409a96e4a169e8e6","impliedFormat":1},{"version":"c46e079fe54c76f95c67fb89081b3e399da2c7d109e7dca8e4b58d83e332e605","impliedFormat":1},{"version":"bf67d53d168abc1298888693338cb82854bdb2e69ef83f8a0092093c2d562107","impliedFormat":1},{"version":"b52476feb4a0cbcb25e5931b930fc73cb6643fb1a5060bf8a3dda0eeae5b4b68","affectsGlobalScope":true,"impliedFormat":1},{"version":"e2677634fe27e87348825bb041651e22d50a613e2fdf6a4a3ade971d71bac37e","impliedFormat":1},{"version":"7394959e5a741b185456e1ef5d64599c36c60a323207450991e7a42e08911419","impliedFormat":1},{"version":"8c0bcd6c6b67b4b503c11e91a1fb91522ed585900eab2ab1f61bba7d7caa9d6f","impliedFormat":1},{"version":"8cd19276b6590b3ebbeeb030ac271871b9ed0afc3074ac88a94ed2449174b776","affectsGlobalScope":true,"impliedFormat":1},{"version":"696eb8d28f5949b87d894b26dc97318ef944c794a9a4e4f62360cd1d1958014b","impliedFormat":1},{"version":"3f8fa3061bd7402970b399300880d55257953ee6d3cd408722cb9ac20126460c","impliedFormat":1},{"version":"35ec8b6760fd7138bbf5809b84551e31028fb2ba7b6dc91d95d098bf212ca8b4","affectsGlobalScope":true,"impliedFormat":1},{"version":"5524481e56c48ff486f42926778c0a3cce1cc85dc46683b92b1271865bcf015a","impliedFormat":1},{"version":"68bd56c92c2bd7d2339457eb84d63e7de3bd56a69b25f3576e1568d21a162398","affectsGlobalScope":true,"impliedFormat":1},{"version":"3e93b123f7c2944969d291b35fed2af79a6e9e27fdd5faa99748a51c07c02d28","impliedFormat":1},{"version":"9d19808c8c291a9010a6c788e8532a2da70f811adb431c97520803e0ec649991","impliedFormat":1},{"version":"87aad3dd9752067dc875cfaa466fc44246451c0c560b820796bdd528e29bef40","impliedFormat":1},{"version":"4aacb0dd020eeaef65426153686cc639a78ec2885dc72ad220be1d25f1a439df","impliedFormat":1},{"version":"f0bd7e6d931657b59605c44112eaf8b980ba7f957a5051ed21cb93d978cf2f45","impliedFormat":1},{"version":"8db0ae9cb14d9955b14c214f34dae1b9ef2baee2fe4ce794a4cd3ac2531e3255","affectsGlobalScope":true,"impliedFormat":1},{"version":"15fc6f7512c86810273af28f224251a5a879e4261b4d4c7e532abfbfc3983134","impliedFormat":1},{"version":"58adba1a8ab2d10b54dc1dced4e41f4e7c9772cbbac40939c0dc8ce2cdb1d442","impliedFormat":1},{"version":"641942a78f9063caa5d6b777c99304b7d1dc7328076038c6d94d8a0b81fc95c1","impliedFormat":1},{"version":"1123a83f35cf56c97de746f0a7250012153c61a167e4a61668bf50e558162d14","impliedFormat":1},{"version":"855cd5f7eb396f5f1ab1bc0f8580339bff77b68a770f84c6b254e319bbfd1ac7","impliedFormat":1},{"version":"5650cf3dace09e7c25d384e3e6b818b938f68f4e8de96f52d9c5a1b3db068e86","impliedFormat":1},{"version":"1354ca5c38bd3fd3836a68e0f7c9f91f172582ba30ab15bb8c075891b91502b7","affectsGlobalScope":true,"impliedFormat":1},{"version":"7e20d899c28ca26a2a7afc98beaa69e63ff7fba0a8bc47b4e3bf3ede5e09e424","impliedFormat":1},{"version":"2d2fcaab481b31a5882065c7951255703ddbe1c0e507af56ea42d79ac3911201","impliedFormat":1},{"version":"a192fe8ec33f75edbc8d8f3ed79f768dfae11ff5735e7fe52bfa69956e46d78d","impliedFormat":1},{"version":"ca867399f7db82df981d6915bcbb2d81131d7d1ef683bc782b59f71dda59bc85","affectsGlobalScope":true,"impliedFormat":1},{"version":"372413016d17d804e1d139418aca0c68e47a83fb6669490857f4b318de8cccb3","affectsGlobalScope":true,"impliedFormat":1},{"version":"9e043a1bc8fbf2a255bccf9bf27e0f1caf916c3b0518ea34aa72357c0afd42ec","impliedFormat":1},{"version":"b4f70ec656a11d570e1a9edce07d118cd58d9760239e2ece99306ee9dfe61d02","impliedFormat":1},{"version":"3bc2f1e2c95c04048212c569ed38e338873f6a8593930cf5a7ef24ffb38fc3b6","impliedFormat":1},{"version":"6e70e9570e98aae2b825b533aa6292b6abd542e8d9f6e9475e88e1d7ba17c866","impliedFormat":1},{"version":"f9d9d753d430ed050dc1bf2667a1bab711ccbb1c1507183d794cc195a5b085cc","impliedFormat":1},{"version":"9eece5e586312581ccd106d4853e861aaaa1a39f8e3ea672b8c3847eedd12f6e","impliedFormat":1},{"version":"085f552d005479e2e6a7311cdbbe5d8c55c497b4d19274285df161ee9684cd9c","impliedFormat":1},{"version":"37ba7b45141a45ce6e80e66f2a96c8a5ab1bcef0fc2d0f56bb58df96ec67e972","impliedFormat":1},{"version":"45650f47bfb376c8a8ed39d4bcda5902ab899a3150029684ee4c10676d9fbaee","impliedFormat":1},{"version":"007faacc9268357caa21d24169f3f3f2497af3e9241308df2d89f6e6d9bb3f2e","affectsGlobalScope":true,"impliedFormat":1},{"version":"74cf591a0f63db318651e0e04cb55f8791385f86e987a67fd4d2eaab8191f730","impliedFormat":1},{"version":"5eab9b3dc9b34f185417342436ec3f106898da5f4801992d8ff38ab3aff346b5","impliedFormat":1},{"version":"12ed4559eba17cd977aa0db658d25c4047067444b51acfdcbf38470630642b23","affectsGlobalScope":true,"impliedFormat":1},{"version":"f3ffabc95802521e1e4bcba4c88d8615176dc6e09111d920c7a213bdda6e1d65","impliedFormat":1},{"version":"809821b8a065e3234a55b3a9d7846231ed18d66dd749f2494c66288d890daf7f","impliedFormat":1},{"version":"ae56f65caf3be91108707bd8dfbccc2a57a91feb5daabf7165a06a945545ed26","impliedFormat":1},{"version":"a136d5de521da20f31631a0a96bf712370779d1c05b7015d7019a9b2a0446ca9","impliedFormat":1},{"version":"c3b41e74b9a84b88b1dca61ec39eee25c0dbc8e7d519ba11bb070918cfacf656","affectsGlobalScope":true,"impliedFormat":1},{"version":"4737a9dc24d0e68b734e6cfbcea0c15a2cfafeb493485e27905f7856988c6b29","affectsGlobalScope":true,"impliedFormat":1},{"version":"36d8d3e7506b631c9582c251a2c0b8a28855af3f76719b12b534c6edf952748d","impliedFormat":1},{"version":"1ca69210cc42729e7ca97d3a9ad48f2e9cb0042bada4075b588ae5387debd318","impliedFormat":1},{"version":"f5ebe66baaf7c552cfa59d75f2bfba679f329204847db3cec385acda245e574e","impliedFormat":1},{"version":"ed59add13139f84da271cafd32e2171876b0a0af2f798d0c663e8eeb867732cf","affectsGlobalScope":true,"impliedFormat":1},{"version":"b7c5e2ea4a9749097c347454805e933844ed207b6eefec6b7cfd418b5f5f7b28","impliedFormat":1},{"version":"b1810689b76fd473bd12cc9ee219f8e62f54a7d08019a235d07424afbf074d25","impliedFormat":1},{"version":"2beff543f6e9a9701df88daeee3cdd70a34b4a1c11cb4c734472195a5cb2af54","impliedFormat":1},{"version":"2e07abf27aa06353d46f4448c0bbac73431f6065eef7113128a5cd804d0c384d","impliedFormat":1},{"version":"be1cc4d94ea60cbe567bc29ed479d42587bf1e6cba490f123d329976b0fe4ee5","impliedFormat":1},{"version":"42bc0e1a903408137c3df2b06dfd7e402cdab5bbfa5fcfb871b22ebfdb30bd0b","impliedFormat":1},{"version":"9894dafe342b976d251aac58e616ac6df8db91fb9d98934ff9dd103e9e82578f","impliedFormat":1},{"version":"413df52d4ea14472c2fa5bee62f7a40abd1eb49be0b9722ee01ee4e52e63beb2","impliedFormat":1},{"version":"db6d2d9daad8a6d83f281af12ce4355a20b9a3e71b82b9f57cddcca0a8964a96","impliedFormat":1},{"version":"446a50749b24d14deac6f8843e057a6355dd6437d1fac4f9e5ce4a5071f34bff","impliedFormat":1},{"version":"182e9fcbe08ac7c012e0a6e2b5798b4352470be29a64fdc114d23c2bab7d5106","impliedFormat":1},{"version":"2f4e6b4d39426a1b85ecf4bdeb9dddbf4d9b3397d95d8555d46f925c9519ec7d","impliedFormat":1},{"version":"78a2869ad0cbf3f9045dda08c0d4562b7e1b2bfe07b19e0db072f5c3c56e9584","impliedFormat":1},{"version":"89d5d28d4f57e000b836ac273079be1b75710e28ce14750d081fb420d37e2ca5","impliedFormat":1},{"version":"fd4e24ccff3966390600d7f5d6aa1fed5a512e92ada735ea5fbc933d313ad3d3","impliedFormat":1},{"version":"b7cddfe1aa6b86b5fad3c9ccb30d05b3ccb165aebbf112f48d2d8a5f69dd98b1","impliedFormat":1},{"version":"a86f82d646a739041d6702101afa82dcb935c416dd93cbca7fd754fd0282ce1f","impliedFormat":1},{"version":"ad0d1d75d129b1c80f911be438d6b61bfa8703930a8ff2be2f0e1f8a91841c64","impliedFormat":1},{"version":"bd2c7ada3dee03653d3f601011d30072194bc3970cd93208f9588fbdc0c69347","impliedFormat":1},{"version":"e480da45d32313e7174b265674da504f075f59ef326852f0c5a5d863b438ae85","impliedFormat":1},{"version":"ad54850f61fcf5d014e11be80d2f46fea9265cfa7e77456da876f7833ef81769","impliedFormat":1},{"version":"6f7c9e8bd2b5b6a080b07080065f94900bd3c7e5ebbd3047bc33fcce2fab1dd8","impliedFormat":1},{"version":"3e7efde639c6a6c3edb9847b3f61e308bf7a69685b92f665048c45132f51c218","impliedFormat":1},{"version":"df45ca1176e6ac211eae7ddf51336dc075c5314bc5c253651bae639defd5eec5","impliedFormat":1},{"version":"8a0e762ceb20c7e72504feef83d709468a70af4abccb304f32d6b9bac1129b2c","impliedFormat":1},{"version":"da5950ee2a90721df6f3fba45f5d05308f7e4c35835392215dd2cd404505e2de","impliedFormat":1},{"version":"ce75b1aebb33d510ff28af960a9221410a3eaf7f18fc5f21f9404075fba77256","impliedFormat":1},{"version":"f42d5fed19610d485c646a0c430e768115567d078c7fc855c57b0c578b3d6cd3","impliedFormat":1},{"version":"ee8df1cb8d0faaca4013a1b442e99130769ce06f438d18d510fed95890067563","impliedFormat":1},{"version":"d5630f2ad9b4541e5ce891648121022f9412ecdca1820baa1f0104f70fd7eff7","impliedFormat":1},{"version":"4d15375ab13497104bc8fe56fdef2b5fd6853f29255737d23a33fa306ff7fd69","impliedFormat":1},{"version":"2cd3fc1d0d6a1e85baffd2d4f50f5efb192b5446eef567e97c94765402f0aad4","impliedFormat":1},{"version":"e4cbf2f1e89ecccaddd2c045e600ae41b732295953fb06247c7dcbc2d281ed30","impliedFormat":1},{"version":"6dcedaef57dff0d79a05ab0ab602cde74db803d1e765468bf91263786a383e1b","impliedFormat":1},{"version":"8c1697d90c394a6fd955b98eae01238eff628e129b987a68aea10f898a48e7da","impliedFormat":1},{"version":"7580e62139cb2b44a0270c8d01abcbfcba2819a02514a527342447fa69b34ef1","impliedFormat":1},{"version":"b838d4c72740eb0afd284bf7575b74c624b105eff2e8c7b4aeead57e7ac320ff","impliedFormat":1},{"version":"f374cb24e93e7798c4d9e83ff872fa52d2cdb36306392b840a6ddf46cb925cb6","impliedFormat":1},{"version":"d10d63718e1646c2279e3b33831f82c60e31f622b2b7020f1196409ca4c09242","impliedFormat":1},{"version":"106c6025f1d99fd468fd8bf6e5bda724e11e5905a4076c5d29790b6c3745e50c","impliedFormat":1},{"version":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","impliedFormat":1},{"version":"148679c6d0f449210a96e7d2e562d589e56fcde87f843a92808b3ff103f1a774","impliedFormat":1},{"version":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","impliedFormat":1},{"version":"02436d7e9ead85e09a2f8e27d5f47d9464bced31738dec138ca735390815c9f0","impliedFormat":1},{"version":"f8d5ff8eafd37499f2b6a98659dd9b45a321de186b8db6b6142faed0fea3de77","impliedFormat":1},{"version":"c86fe861cf1b4c46a0fb7d74dffe596cf679a2e5e8b1456881313170f092e3fa","impliedFormat":1},{"version":"a22dd55aa4d39906252000ab8e8a1b83b195eef7f4274eb51e457c1f11cf6580","impliedFormat":1},{"version":"540cc83ab772a2c6bc509fe1354f314825b5dba3669efdfbe4693ecd3048e34f","impliedFormat":1},{"version":"121b0696021ab885c570bbeb331be8ad82c6efe2f3b93a6e63874901bebc13e3","impliedFormat":1},{"version":"612d9da66bb046a9c1e2e8d026245ded881fc4b9f98cbfae714415d57ee0ae0b","impliedFormat":1},{"version":"32c2ad9494dad5d11b0564a619fee18f388db6c1e9e2cd3c360b3122549691eb","impliedFormat":1},{"version":"6c301d40aec56a74ec7bd7324e31a728dadf9bfba3e96def02938d3d973534ec","impliedFormat":1},{"version":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","impliedFormat":1},{"version":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","impliedFormat":1},{"version":"8e609bb71c20b858c77f0e9f90bb1319db8477b13f9f965f1a1e18524bf50881","impliedFormat":1},{"version":"8e609bb71c20b858c77f0e9f90bb1319db8477b13f9f965f1a1e18524bf50881","impliedFormat":1},{"version":"aa14cee20aa0db79f8df101fc027d929aec10feb5b8a8da3b9af3895d05b7ba2","impliedFormat":1},{"version":"493c700ac3bd317177b2eb913805c87fe60d4e8af4fb39c41f04ba81fae7e170","impliedFormat":1},{"version":"aeb554d876c6b8c818da2e118d8b11e1e559adbe6bf606cc9a611c1b6c09f670","impliedFormat":1},{"version":"acf5a2ac47b59ca07afa9abbd2b31d001bf7448b041927befae2ea5b1951d9f9","impliedFormat":1},{"version":"8e609bb71c20b858c77f0e9f90bb1319db8477b13f9f965f1a1e18524bf50881","impliedFormat":1},{"version":"d71291eff1e19d8762a908ba947e891af44749f3a2cbc5bd2ec4b72f72ea795f","impliedFormat":1},{"version":"c0480e03db4b816dff2682b347c95f2177699525c54e7e6f6aa8ded890b76be7","impliedFormat":1},{"version":"25a5f6fd3a2243c859eddc99ab5fba11d970af2fe7a5df9c32b7668f76f97b01","impliedFormat":1},{"version":"8d207e1f9d2c30d6f77dfa693f3827c3fbf0d89240297e10bdfe1041d433df68","impliedFormat":1},{"version":"b620391fe8060cf9bedc176a4d01366e6574d7a71e0ac0ab344a4e76576fcbb8","impliedFormat":1},{"version":"6ac6715916fa75a1f7ebdfeacac09513b4d904b667d827b7535e84ff59679aff","impliedFormat":1},{"version":"2652448ac55a2010a1f71dd141f828b682298d39728f9871e1cdf8696ef443fd","impliedFormat":1},{"version":"d682336018141807fb602709e2d95a192828fcb8d5ba06dda3833a8ea98f69e3","impliedFormat":1},{"version":"6124e973eab8c52cabf3c07575204efc1784aca6b0a30c79eb85fe240a857efa","impliedFormat":1},{"version":"0d891735a21edc75df51f3eb995e18149e119d1ce22fd40db2b260c5960b914e","impliedFormat":1},{"version":"3b414b99a73171e1c4b7b7714e26b87d6c5cb03d200352da5342ab4088a54c85","impliedFormat":1},{"version":"4fbd3116e00ed3a6410499924b6403cc9367fdca303e34838129b328058ede40","impliedFormat":1},{"version":"9c82171d836c47486074e4ca8e059735bf97b205e70b196535b5efd40cbe1bc5","impliedFormat":1},{"version":"48dcc919f76c040a999c0d46d2bf25ab089645ca21b837f120b222f56a86cd76","impliedFormat":1},{"version":"2f9c89cbb29d362290531b48880a4024f258c6033aaeb7e59fbc62db26819650","impliedFormat":1},{"version":"a365c4d3bed3be4e4e20793c999c51f5cd7e6792322f14650949d827fbcd170f","impliedFormat":1},{"version":"c5426dbfc1cf90532f66965a7aa8c1136a78d4d0f96d8180ecbfc11d7722f1a5","impliedFormat":1},{"version":"65a15fc47900787c0bd18b603afb98d33ede930bed1798fc984d5ebb78b26cf9","impliedFormat":1},{"version":"9d202701f6e0744adb6314d03d2eb8fc994798fc83d91b691b75b07626a69801","impliedFormat":1},{"version":"de9d2df7663e64e3a91bf495f315a7577e23ba088f2949d5ce9ec96f44fba37d","impliedFormat":1},{"version":"c7af78a2ea7cb1cd009cfb5bdb48cd0b03dad3b54f6da7aab615c2e9e9d570c5","impliedFormat":1},{"version":"1ee45496b5f8bdee6f7abc233355898e5bf9bd51255db65f5ff7ede617ca0027","impliedFormat":1},{"version":"273782b8454e78f6a8b30d2cfbf6860499c930595095fcc1689637115f0eddda","affectsGlobalScope":true,"impliedFormat":1},{"version":"3fbdd025f9d4d820414417eeb4107ffa0078d454a033b506e22d3a23bc3d9c41","affectsGlobalScope":true,"impliedFormat":1},{"version":"dba114fb6a32b355a9cfc26ca2276834d72fe0e94cd2c3494005547025015369","impliedFormat":1},{"version":"a8f8e6ab2fa07b45251f403548b78eaf2022f3c2254df3dc186cb2671fe4996d","affectsGlobalScope":true,"impliedFormat":1},{"version":"fa6c12a7c0f6b84d512f200690bfc74819e99efae69e4c95c4cd30f6884c526e","impliedFormat":1},{"version":"f1c32f9ce9c497da4dc215c3bc84b722ea02497d35f9134db3bb40a8d918b92b","impliedFormat":1},{"version":"b73c319af2cc3ef8f6421308a250f328836531ea3761823b4cabbd133047aefa","affectsGlobalScope":true,"impliedFormat":1},{"version":"e433b0337b8106909e7953015e8fa3f2d30797cea27141d1c5b135365bb975a6","impliedFormat":1},{"version":"9f9bb6755a8ce32d656ffa4763a8144aa4f274d6b69b59d7c32811031467216e","impliedFormat":1},{"version":"5c32bdfbd2d65e8fffbb9fbda04d7165e9181b08dad61154961852366deb7540","impliedFormat":1},{"version":"ddff7fc6edbdc5163a09e22bf8df7bef75f75369ebd7ecea95ba55c4386e2441","impliedFormat":1},{"version":"0c05e9842ec4f8b7bfebfd3ca61604bb8c914ba8da9b5337c4f25da427a005f2","impliedFormat":1},{"version":"faed7a5153215dbd6ebe76dfdcc0af0cfe760f7362bed43284be544308b114cf","impliedFormat":1},{"version":"7029e566b8df176f703fb59fd437a38670c7a0e02c58b2d66dfb5b2e2b2defdb","impliedFormat":1},{"version":"7f2aa4d4989a82530aaac3f72b3dceca90e9c25bee0b1a327e8a08a1262435ad","impliedFormat":1},{"version":"d96b39301d0ded3f1a27b47759676a33a02f6f5049bfcbde81e533fd10f50dcb","impliedFormat":1},{"version":"e9f147ecca73d9346a4c073432843c159ccbe50bdcb678a78f6da10eae2cecf4","impliedFormat":1},{"version":"de061f7d72bd65c06fc1419f841dfdcb29a8e22fe6fa527d1e6eb20b897d4de0","impliedFormat":1},{"version":"663beafc2446079574570cba86e9b15f986f908ddb1b01274509970126fee945","impliedFormat":1},{"version":"a3102887d5058bf4cb5b37fa6964c09e9527c42053b3b5c642b89878620748de","impliedFormat":1},{"version":"0aaaa1727edd29673d85c9b26d7ca4d54e5407a48586903c51b48b7f7d196f61","impliedFormat":1},{"version":"d35bca0b261bff02635758c48e8ab99c61c420d0dfabbcf467e847171d876b7d","impliedFormat":1},{"version":"3bc12c40d90c342ff88a3d876996c555ed5cbee5fe8c3308a240b321f401ee46","impliedFormat":1},{"version":"ba130768aae855a5477e9e148e5c879548e6e7ccbcc56fd1934c8a18ea5b7569","impliedFormat":1},{"version":"2e4f37ffe8862b14d8e24ae8763daaa8340c0df0b859d9a9733def0eee7562d9","impliedFormat":1},{"version":"d38530db0601215d6d767f280e3a3c54b2a83b709e8d9001acb6f61c67e965fc","impliedFormat":1},{"version":"6ac6715916fa75a1f7ebdfeacac09513b4d904b667d827b7535e84ff59679aff","impliedFormat":1},{"version":"b499af2054a037a162b3b72cd886f48bbf32a3502c865c6e29fac7d2ab3ce0b5","impliedFormat":1},{"version":"b83cb14474fa60c5f3ec660146b97d122f0735627f80d82dd03e8caa39b4388c","impliedFormat":1},{"version":"48773ca557b0319c2ee62ae249cf52a81709e8be139920d6479a66274de7c4ed","impliedFormat":1},{"version":"7274fbffbd7c9589d8d0ffba68157237afd5cecff1e99881ea3399127e60572f","impliedFormat":1},{"version":"b73cbf0a72c8800cf8f96a9acfe94f3ad32ca71342a8908b8ae484d61113f647","impliedFormat":1},{"version":"bae6dd176832f6423966647382c0d7ba9e63f8c167522f09a982f086cd4e8b23","impliedFormat":1},{"version":"20865ac316b8893c1a0cc383ccfc1801443fbcc2a7255be166cf90d03fac88c9","impliedFormat":1},{"version":"c9958eb32126a3843deedda8c22fb97024aa5d6dd588b90af2d7f2bfac540f23","impliedFormat":1},{"version":"461d0ad8ae5f2ff981778af912ba71b37a8426a33301daa00f21c6ccb27f8156","impliedFormat":1},{"version":"e927c2c13c4eaf0a7f17e6022eee8519eb29ef42c4c13a31e81a611ab8c95577","impliedFormat":1},{"version":"fcafff163ca5e66d3b87126e756e1b6dfa8c526aa9cd2a2b0a9da837d81bbd72","impliedFormat":1},{"version":"70246ad95ad8a22bdfe806cb5d383a26c0c6e58e7207ab9c431f1cb175aca657","impliedFormat":1},{"version":"f00f3aa5d64ff46e600648b55a79dcd1333458f7a10da2ed594d9f0a44b76d0b","impliedFormat":1},{"version":"772d8d5eb158b6c92412c03228bd9902ccb1457d7a705b8129814a5d1a6308fc","impliedFormat":1},{"version":"802e797bcab5663b2c9f63f51bdf67eff7c41bc64c0fd65e6da3e7941359e2f7","impliedFormat":1},{"version":"b01bd582a6e41457bc56e6f0f9de4cb17f33f5f3843a7cf8210ac9c18472fb0f","impliedFormat":1},{"version":"8b4327413e5af38cd8cb97c59f48c3c866015d5d642f28518e3a891c469f240e","impliedFormat":1},{"version":"4cceef18d7f088e797a463e90b7a9dad10c6bc667724b7686e3e740ae00122be","impliedFormat":1},{"version":"7ee86fbb3754388e004de0ef9e6505485ddfb3be7640783d6d015711c03d302d","impliedFormat":1},{"version":"cc1954b539604b1e562319119ac7e888172208b32ca873f9a357a92c826bd046","impliedFormat":1},{"version":"a67b87d0281c97dfc1197ef28dfe397fc2c865ccd41f7e32b53f647184cc7307","impliedFormat":1},{"version":"771ffb773f1ddd562492a6b9aaca648192ac3f056f0e1d997678ff97dbb6bf9b","impliedFormat":1},{"version":"43e96a3d5d1411ab40ba2f61d6a3192e58177bcf3b133a80ad2a16591611726d","impliedFormat":1},{"version":"232f70c0cf2b432f3a6e56a8dc3417103eb162292a9fd376d51a3a9ea5fbbf6f","impliedFormat":1},{"version":"bb8f2dbc03533abca2066ce4655c119bff353dd4514375beb93c08590c03e023","impliedFormat":1},{"version":"706dd95827e7ebaabda91d5db2b755233e0952d98570e9c032b0f066a15c1177","affectsGlobalScope":true,"impliedFormat":1},{"version":"0b103e9abfe82d14c0ad06a55d9f91d6747154ef7cacc73cf27ecad2bfb3afcf","impliedFormat":1},{"version":"cd9304972e6d616197fb44fce00540a904f38b54306a1951b5dbeaf3c01ab5bd","impliedFormat":1},{"version":"77438e2c397a3db78407621cfc57241a305b310ddea2c185f1d555248297f587","impliedFormat":1},{"version":"120599fd965257b1f4d0ff794bc696162832d9d8467224f4665f713a3119078b","impliedFormat":1},{"version":"43ba4f2fa8c698f5c304d21a3ef596741e8e85a810b7c1f9b692653791d8d97a","impliedFormat":1},{"version":"5433f33b0a20300cca35d2f229a7fc20b0e8477c44be2affeb21cb464af60c76","impliedFormat":1},{"version":"db036c56f79186da50af66511d37d9fe77fa6793381927292d17f81f787bb195","impliedFormat":1},{"version":"a6805fcafed712aea7759f8bc731014f9d22738c1d6ef9d43b8091d1d48346d5","impliedFormat":1},{"version":"c49469a5349b3cc1965710b5b0f98ed6c028686aa8450bcb3796728873eb923e","impliedFormat":1},{"version":"4a889f2c763edb4d55cb624257272ac10d04a1cad2ed2948b10ed4a7fda2a428","impliedFormat":1},{"version":"7bb79aa2fead87d9d56294ef71e056487e848d7b550c9a367523ee5416c44cfa","impliedFormat":1},{"version":"d88ea80a6447d7391f52352ec97e56b52ebec934a4a4af6e2464cfd8b39c3ba8","impliedFormat":1},{"version":"142617b3cdf902b69c6464c9fbd942b60ab3e733ca18c032b19e0f7e2adbefe8","impliedFormat":1},{"version":"0b603555f1881f87256ffd6344d3e3ed6d466c2e701eabf381f28be8c2125892","impliedFormat":1},{"version":"897e4f7662488e3ecc79e743bdd3b78f13bdb69a97851afa5b440c4211e32ea9","impliedFormat":1},{"version":"e2e1c6d3b2d93add5200bd7bc1a8cccb4e446836b2111ece45db8683a2c765de","impliedFormat":1},{"version":"251b03d5cd243854ce870d9a9a39f491faf69898c5d6b5eee28cc7649c57417b","impliedFormat":1},{"version":"27ff4196654e6373c9af16b6165120e2dd2169f9ad6abb5c935af5abd8c7938c","impliedFormat":1},{"version":"2c4de79f406d137390608e8c0a44fba2ff8e00bacfcae7c9d1781fef10e9440d","impliedFormat":1},{"version":"07ba23a10465791be5d22deaf5ef7de7658774ddff53721e5ea17fedea1bc721","impliedFormat":1},{"version":"dca8c645c5afeb03b1ecedbf16323f33e7d0afaa6256c8e047e6e38087a97f53","impliedFormat":1},{"version":"775f181bd4a533d6f8b5e55ec1d9f1624559720ae8a70e9432258da26b38d27c","impliedFormat":1},{"version":"796273b2edc72e78a04e86d7c58ae94d370ab93a0ddf40b1aa85a37a1c29ecd7","impliedFormat":1},{"version":"5df15a69187d737d6d8d066e189ae4f97e41f4d53712a46b2710ff9f8563ec9f","impliedFormat":1},{"version":"7715134a0cf07dd41a9da2895d708625a3a303a0385e355ecaaf0b8bfaef2550","impliedFormat":1},{"version":"6ac6715916fa75a1f7ebdfeacac09513b4d904b667d827b7535e84ff59679aff","impliedFormat":1},{"version":"622694a8522b46f6310c2a9b5d2530dde1e2854cb5829354e6d1ff8f371cf469","impliedFormat":1},{"version":"cd8ce8d68567f62dd580b3c3c37777ac3f5b81944c7417f5ea83030eab533385","impliedFormat":1},{"version":"e5c939d896565dcac0f6fbdbada11284e7728ef26a069561c09aa5aa4a788393","impliedFormat":1},{"version":"9e2739b32f741859263fdba0244c194ca8e96da49b430377930b8f721d77c000","impliedFormat":1},{"version":"a9e6c0ff3f8186fccd05752cf75fc94e147c02645087ac6de5cc16403323d870","impliedFormat":1},{"version":"49af4b52f0d4d2304c5f2c6fe5fab3e153e0acc38830d0202821b877c097dd02","impliedFormat":1},{"version":"49c346823ba6d4b12278c12c977fb3a31c06b9ca719015978cb145eb86da1c61","impliedFormat":1},{"version":"bfac6e50eaa7e73bb66b7e052c38fdc8ccfc8dbde2777648642af33cf349f7f1","impliedFormat":1},{"version":"92f7c1a4da7fbfd67a2228d1687d5c2e1faa0ba865a94d3550a3941d7527a45d","impliedFormat":1},{"version":"f53b120213a9289d9a26f5af90c4c686dd71d91487a0aa5451a38366c70dc64b","impliedFormat":1},{"version":"e68b8e5a1df7c1be2bc105141456ecba70215806e1c28bfbc5c12bfce4be6e68","impliedFormat":1},{"version":"511c8f02329808d47d00b859c532ae9115590048b17325a946c74dac48428650","impliedFormat":1},{"version":"57d67b72e06059adc5e9454de26bbfe567d412b962a501d263c75c2db430f40e","impliedFormat":1},{"version":"b5f9e66625783eefcbe3d2da074b2e7ba2066d61ce3fc6ef4f22805ad946cab4","impliedFormat":1},{"version":"e37115962d284b9f7a37c2bdd2add50f88365dde41f5e0ff591ffc48a8ec7575","impliedFormat":1},{"version":"6459054aabb306821a043e02b89d54da508e3a6966601a41e71c166e4ea1474f","impliedFormat":1},{"version":"bb37588926aba35c9283fe8d46ebf4e79ffe976343105f5c6d45f282793352b2","impliedFormat":1},{"version":"f89488602bec98a142072fae7ea5ba99431a569ff580c64b7be39896474799d8","impliedFormat":1},{"version":"bbbc47961f39a57df103cf4ca3bb8f8732b4b6678a18225a0aa76d59c466956c","impliedFormat":1},{"version":"2e6114a7dd6feeef85b2c80120fdbfb59a5529c0dcc5bfa8447b6996c97a69f5","impliedFormat":1},{"version":"2ffb043dc5163458e473b7010859f86e01dc4edffcae0a93d885d028b426a546","impliedFormat":1},{"version":"c8f004e6036aa1c764ad4ec543cf89a5c1893a9535c80ef3f2b653e370de45e6","impliedFormat":1},{"version":"dd80b1e600d00f5c6a6ba23f455b84a7db121219e68f89f10552c54ba46e4dc9","impliedFormat":1},{"version":"b064c36f35de7387d71c599bfcf28875849a1dbc733e82bd26cae3d1cd060521","impliedFormat":1},{"version":"05c7280d72f3ed26f346cbe7cbbbb002fb7f15739197cbbee6ab3fd1a6cb9347","impliedFormat":1},{"version":"8de9fe97fa9e00ec00666fa77ab6e91b35d25af8ca75dabcb01e14ad3299b150","impliedFormat":1},{"version":"04b7b2e0832dfd3c31e81df3975e8d8fda28e7ff999b0aa2932608a8f6661d5c","impliedFormat":1},{"version":"ca2d34c6ed5cbd3070b8b6f32f42ae54adcc6499c1e4b99f0a5798b3f27cc653","impliedFormat":1},{"version":"9ec68995e66dd6b9dac834bf5ae85fde802714ea2e82151a5d1d53ef01b463ef","impliedFormat":1},{"version":"5c4d626b4902f2ef8a1cc146d761d276cef988016dc674e3b98fbad70e64bc9f","impliedFormat":1},{"version":"fdfaa0aad899524962e2955287b5b991ffe3be50f64e02eb60c933ca44644a94","impliedFormat":1},{"version":"53c972a0f9bc3a4ec70fff7314123ea8cfcf75b3703046f767d2dc1eea87b2fb","impliedFormat":1},{"version":"f974e4a06953682a2c15d5bd5114c0284d5abf8bc0fe4da25cb9159427b70072","impliedFormat":1},{"version":"50256e9c31318487f3752b7ac12ff365c8949953e04568009c8705db802776fb","impliedFormat":1},{"version":"7d73b24e7bf31dfb8a931ca6c4245f6bb0814dfae17e4b60c9e194a631fe5f7b","impliedFormat":1},{"version":"d130c5f73768de51402351d5dc7d1b36eaec980ca697846e53156e4ea9911476","impliedFormat":1},{"version":"413586add0cfe7369b64979d4ec2ed56c3f771c0667fbde1bf1f10063ede0b08","impliedFormat":1},{"version":"06472528e998d152375ad3bd8ebcb69ff4694fd8d2effaf60a9d9f25a37a097a","impliedFormat":1},{"version":"7303b45138d2511035056a5901a1490ebdcbf055cbb1276f8629c5121cbe733e","impliedFormat":1},{"version":"27f874cd5327507eeff699a74567f60c1215b94509f4308633a7b01922471ed2","impliedFormat":1},{"version":"a401617604fa1f6ce437b81689563dfdc377069e4c58465dbd8d16069aede0a5","impliedFormat":1},{"version":"2c6cf04bc525caf6546e859e8ef10bfb9573837ec0bc5ec7b53a7b1b8ca72781","impliedFormat":1},{"version":"8695dec09ad439b0ceef3776ea68a232e381135b516878f0901ed2ea114fd0fe","impliedFormat":1},{"version":"304b44b1e97dd4c94697c3313df89a578dca4930a104454c99863f1784a54357","impliedFormat":1},{"version":"0a437ae178f999b46b6153d79095b60c42c996bc0458c04955f1c996dc68b971","impliedFormat":1},{"version":"74b2a5e5197bd0f2e0077a1ea7c07455bbea67b87b0869d9786d55104006784f","impliedFormat":1},{"version":"4a7baeb6325920044f66c0f8e5e6f1f52e06e6d87588d837bdf44feb6f35c664","impliedFormat":1},{"version":"87cc05fe13108f02e12da7e3efd8e360fef78d96a0c9e11408ea1b1b9fb3e03d","impliedFormat":1},{"version":"1abbf67c218d23c2ce76887caac2df6c7dab3d97ba2b65348432b876f510002a","impliedFormat":1},{"version":"1a82deef4c1d39f6882f28d275cad4c01f907b9b39be9cbc472fcf2cf051e05b","impliedFormat":1},{"version":"4b20fcf10a5413680e39f5666464859fc56b1003e7dfe2405ced82371ebd49b6","impliedFormat":1},{"version":"c06ef3b2569b1c1ad99fcd7fe5fba8d466e2619da5375dfa940a94e0feea899b","impliedFormat":1},{"version":"f7d628893c9fa52ba3ab01bcb5e79191636c4331ee5667ecc6373cbccff8ae12","impliedFormat":1},{"version":"1d879125d1ec570bf04bc1f362fdbe0cb538315c7ac4bcfcdf0c1e9670846aa6","impliedFormat":1},{"version":"5a16e93d5d53d987dddda1ec606c9821f6bd31d1bdf0635e05e3841312cefa8b","impliedFormat":1},{"version":"a6dba407fc287f1e25454e75028c91bbc00675f2d1c4e8b3edcc36c08611a486","impliedFormat":1},{"version":"d663134457d8d669ae0df34eabd57028bddc04fc444c4bc04bc5215afc91e1f4","impliedFormat":1},{"version":"e91f7b1344577a02f051b9b471f33044fef8334a76dc9e1de003d17595a5219b","impliedFormat":1},{"version":"c0723195c85e19656d6b5b9fdb81d3f3403c1ae4679e722c6ea058c516b38d12","impliedFormat":1},{"version":"b55eb9f72166093b5460d34b34f5d8699c968de3bc3fc696e40f2c93f2ebf650","impliedFormat":1},{"version":"71d9eb4c4e99456b78ae182fb20a5dfc20eb1667f091dbb9335b3c017dd1c783","impliedFormat":1},{"version":"cfa846a7b7847a1d973605fbb8c91f47f3a0f0643c18ac05c47077ebc72e71c7","impliedFormat":1},{"version":"1594da19968752a22b2ac48c2d0e60575700e745c577a8a4a676b841238ad5bb","impliedFormat":1},{"version":"e0cee12109e0a10a4c3d6769fcc7644b7c1ea7f52365bea51728f5af29f8a137","impliedFormat":1},{"version":"7d4254b4c6c67a29d5e7f65e67d72540480ac2cfb041ca484847f5ae70480b62","impliedFormat":1},{"version":"3536968defef8a75514f547ead5e2e9c1e984820290ec9b00c5fdfb6ef786535","impliedFormat":1},{"version":"d83773870080c30a230e322ce13a9c6f3398e8dacea4ea8a83e26370f3bac23e","impliedFormat":1},{"version":"dcfeaf98d66314fec29a9076c4290e45d0b196a65827becc19138e9c7b855f37","impliedFormat":1},{"version":"6849fe9210fe4946d5f085bfed36758f33dc6ae15a751338d178dd4daa017c46","impliedFormat":1},{"version":"888cda0fa66d7f74e985a3f7b1af1f64b8ff03eb3d5e80d051c3cbdeb7f32ab7","impliedFormat":1},{"version":"60681e13f3545be5e9477acb752b741eae6eaf4cc01658a25ec05bff8b82a2ef","impliedFormat":1},{"version":"ffae4e1e06aa848a1e4bcef162cd1c48e5909b26223515981310af9c036bdfc7","impliedFormat":1},{"version":"a57b1802794433adec9ff3fed12aa79d671faed86c49b09e02e1ac41b4f1d33a","impliedFormat":1},{"version":"34e16eb7c31768a11a08aebcfb3d70d7b8f0b016197e98d8419e566ceae6d6c8","impliedFormat":1},{"version":"f94ec1f7e4b709d26960306c9082a7a1b728a6e13089346aa48ba57c74cbf47e","impliedFormat":1},{"version":"9a11cb4033405e96c247cd5aa29790212aaffdd127869e8a5219103f0b389fd5","impliedFormat":1},{"version":"01479d9d5a5dda16d529b91811375187f61a06e74be294a35ecce77e0b9e8d6c","impliedFormat":1},{"version":"aff5213585cb72e94054dfe17250ff315f3569b3919d1ef1ad235f37c4ee894e","impliedFormat":1},{"version":"fb2ea35e1be6388d722d7725e2b49c697d34d9c890c3b96758faaeb86d35cef8","impliedFormat":1},{"version":"ce0df82a9ae6f914ba08409d4d883983cc08e6d59eb2df02d8e4d68309e7848b","impliedFormat":1},{"version":"1a4dc28334a926d90ba6a2d811ba0ff6c22775fcc13679521f034c124269fd40","impliedFormat":1},{"version":"f05315ff85714f0b87cc0b54bcd3dde2716e5a6b99aedcc19cad02bf2403e08c","impliedFormat":1},{"version":"5fad3b31fc17a5bc58095118a8b160f5260964787c52e7eb51e3d4fcf5d4a6f0","impliedFormat":1},{"version":"72105519d0390262cf0abe84cf41c926ade0ff475d35eb21307b2f94de985778","impliedFormat":1},{"version":"456006a6975b26c0a1785feddae165f6d307e2d601ffde27e21fc4a790e448a4","impliedFormat":1},{"version":"c857e0aae3f5f444abd791ec81206020fbcc1223e187316677e026d1c1d6fe08","impliedFormat":1},{"version":"ccf6dd45b708fb74ba9ed0f2478d4eb9195c9dfef0ff83a6092fa3cf2ff53b4f","impliedFormat":1},{"version":"1fe0d18b111e1145a7e7601855bccd4ca20f24e3b9a5aba6bb1fa9d1a7059170","impliedFormat":1},{"version":"5632c3c26d420c063eebe64c45b1248b9492a67bf44f1d0c57e9dc8f6cf449bb","impliedFormat":1},{"version":"0df5aa619ab12993a39ea6dae062ee46eadbb4d738916460e636ada52bced75b","impliedFormat":1},{"version":"8fca3039857709484e5893c05c1f9126ab7451fa6c29e19bb8c2411a2e937345","impliedFormat":1},{"version":"35069c2c417bd7443ae7c7cafd1de02f665bf015479fec998985ffbbf500628c","impliedFormat":1},{"version":"10ab7be91f87ebe8916b62cf28af2e45b5601fc7b0e311adf838f912c6b31dd8","impliedFormat":1},{"version":"bc636fbc08e0979ceb7eb0731a33000283d77a33b62e1f71ee65be50394e40ba","impliedFormat":1},{"version":"7e0b7f91c5ab6e33f511efc640d36e6f933510b11be24f98836a20a2dc914c2d","impliedFormat":1},{"version":"045b752f44bf9bbdcaffd882424ab0e15cb8d11fa94e1448942e338c8ef19fba","impliedFormat":1},{"version":"2894c56cad581928bb37607810af011764a2f511f575d28c9f4af0f2ef02d1ab","impliedFormat":1},{"version":"0a72186f94215d020cb386f7dca81d7495ab6c17066eb07d0f44a5bf33c1b21a","impliedFormat":1},{"version":"75bbd3be047d539988a0ff0b56384ef7a6a25f3b676ad96bee547d44c31622a7","impliedFormat":1},{"version":"42960001a776b089ade681ab5cfddc936e0afb0615133ec1841f3dee89d3e1bf","impliedFormat":1},{"version":"0aedb02516baf3e66b2c1db9fef50666d6ed257edac0f866ea32f1aa05aa474f","impliedFormat":1},{"version":"da47712b394d944328245482603bc6f416d3949b67c9392279caab595076b510","affectsGlobalScope":true,"impliedFormat":1},{"version":"37d0071d8f0a06dc55c2c5e0ec3391affd4fd107c53410bf358196ec0bf3923f","impliedFormat":1},{"version":"b213dad76ca37fd552274c9499056e1c0d9c1bd38a55bb7f68b22ba6b84c3ad7","impliedFormat":1},{"version":"c30436b130b6218b7714314dc41d3f459590db4bdf099eecd51cb1bda32109a8","impliedFormat":1},{"version":"20fa37b636fdcc1746ea0738f733d0aed17890d1cd7cb1b2f37010222c23f13e","impliedFormat":1},{"version":"d90b9f1520366d713a73bd30c5a9eb0040d0fb6076aff370796bc776fd705943","impliedFormat":1},{"version":"bc03c3c352f689e38c0ddd50c39b1e65d59273991bfc8858a9e3c0ebb79c023b","impliedFormat":1},{"version":"19df3488557c2fc9b4d8f0bac0fd20fb59aa19dec67c81f93813951a81a867f8","affectsGlobalScope":true,"impliedFormat":1},{"version":"b25350193e103ae90423c5418ddb0ad1168dc9c393c9295ef34980b990030617","affectsGlobalScope":true,"impliedFormat":1},{"version":"bef86adb77316505c6b471da1d9b8c9e428867c2566270e8894d4d773a1c4dc2","impliedFormat":1},{"version":"5a49adaef698b7ad7e6127949fa1b0bbd3d46b7cbd11c54e392a4dcdd51f5190","impliedFormat":1},{"version":"6ee598cdfdd0fa52039dca135b3dfff7b49035dc13292143e0a93843e3861967","impliedFormat":1},{"version":"27be6622e2922a1b412eb057faa854831b95db9db5035c3f6d4b677b902ab3b7","impliedFormat":1},{"version":"5c634644d45a1b6bc7b05e71e05e52ec04f3d73d9ac85d5927f647a5f965181a","impliedFormat":1},{"version":"2489bf04d77dc025ba67f49f1a56eb24b9db477d5ff88123d887e163ed1776aa","impliedFormat":1},{"version":"63a7595a5015e65262557f883463f934904959da563b4f788306f699411e9bac","impliedFormat":1},{"version":"4ba137d6553965703b6b55fd2000b4e07ba365f8caeb0359162ad7247f9707a6","impliedFormat":1},{"version":"0b77b819b5417775fccb20c678293cf614c054a5b1a65421a5b933a9124ba998","impliedFormat":1},{"version":"eb5acb58487367e502d994b57e2c58255d8241f481ea8efa8e79af23af3f41c2","impliedFormat":1},{"version":"9252d498a77517aab5d8d4b5eb9d71e4b225bbc7123df9713e08181de63180f6","impliedFormat":1},{"version":"b1f1d57fde8247599731b24a733395c880a6561ec0c882efaaf20d7df968c5af","impliedFormat":1},{"version":"5757b78830c681b3124af568b94c269259ea5e8171a4316508ef67310c2ed1ed","impliedFormat":1},{"version":"35e6379c3f7cb27b111ad4c1aa69538fd8e788ab737b8ff7596a1b40e96f4f90","impliedFormat":1},{"version":"1fffe726740f9787f15b532e1dc870af3cd964dbe29e191e76121aa3dd8693f2","impliedFormat":1},{"version":"5a3ea721d03a361ccbdd7390ccd75f6e84cbca3a3f01f4b331ecc9af31890c49","impliedFormat":1},{"version":"e7dfaee4af38d45b1cab8a1ee0b3bc1f85ddcf64545ed391d675d78ae6526274","affectsGlobalScope":true,"impliedFormat":1},{"version":"e8daa443eaf9a27fd382cc1f8ebe30330c0f4d89511cfb469166874806751d35","impliedFormat":1},{"version":"af48e58339188d5737b608d41411a9c054685413d8ae88b8c1d0d9bfabdf6e7e","impliedFormat":1},{"version":"616775f16134fa9d01fc677ad3f76e68c051a056c22ab552c64cc281a9686790","impliedFormat":1},{"version":"65c24a8baa2cca1de069a0ba9fba82a173690f52d7e2d0f1f7542d59d5eb4db0","impliedFormat":1},{"version":"f9fe6af238339a0e5f7563acee3178f51db37f32a2e7c09f85273098cee7ec49","impliedFormat":1},{"version":"1de8c302fd35220d8f29dea378a4ae45199dc8ff83ca9923aca1400f2b28848a","impliedFormat":1},{"version":"77e71242e71ebf8528c5802993697878f0533db8f2299b4d36aa015bae08a79c","impliedFormat":1},{"version":"98a787be42bd92f8c2a37d7df5f13e5992da0d967fab794adbb7ee18370f9849","impliedFormat":1},{"version":"332248ee37cca52903572e66c11bef755ccc6e235835e63d3c3e60ddda3e9b93","impliedFormat":1},{"version":"94e8cc88ae2ef3d920bb3bdc369f48436db123aa2dc07f683309ad8c9968a1e1","impliedFormat":1},{"version":"4545c1a1ceca170d5d83452dd7c4994644c35cf676a671412601689d9a62da35","impliedFormat":1},{"version":"320f4091e33548b554d2214ce5fc31c96631b513dffa806e2e3a60766c8c49d9","impliedFormat":1},{"version":"a2d648d333cf67b9aeac5d81a1a379d563a8ffa91ddd61c6179f68de724260ff","impliedFormat":1},{"version":"d90d5f524de38889d1e1dbc2aeef00060d779f8688c02766ddb9ca195e4a713d","impliedFormat":1},{"version":"07ed3ddab975995eea41b22f3010506fb9f5fb301d04820b07d7a1aee5477d7c","impliedFormat":1},{"version":"969d8b0965849f4bae7cab0ba90bd1e1220e95999c2c6f01117fa7500901c017","impliedFormat":1},{"version":"6ec840ee5e2bc103f557fe38b1d585ee250540468713d7634ee066de372bf332","impliedFormat":1},{"version":"b0309e1eda99a9e76f87c18992d9c3689b0938266242835dd4611f2b69efe456","impliedFormat":1},{"version":"47699512e6d8bebf7be488182427189f999affe3addc1c87c882d36b7f2d0b0e","impliedFormat":1},{"version":"6ceb10ca57943be87ff9debe978f4ab73593c0c85ee802c051a93fc96aaf7a20","impliedFormat":1},{"version":"1de3ffe0cc28a9fe2ac761ece075826836b5a02f340b412510a59ba1d41a505a","impliedFormat":1},{"version":"e46d6cc08d243d8d0d83986f609d830991f00450fb234f5b2f861648c42dc0d8","impliedFormat":1},{"version":"1c0a98de1323051010ce5b958ad47bc1c007f7921973123c999300e2b7b0ecc0","impliedFormat":1},{"version":"ff863d17c6c659440f7c5c536e4db7762d8c2565547b2608f36b798a743606ca","impliedFormat":1},{"version":"5412ad0043cd60d1f1406fc12cb4fb987e9a734decbdd4db6f6acf71791e36fe","impliedFormat":1},{"version":"ad036a85efcd9e5b4f7dd5c1a7362c8478f9a3b6c3554654ca24a29aa850a9c5","impliedFormat":1},{"version":"fedebeae32c5cdd1a85b4e0504a01996e4a8adf3dfa72876920d3dd6e42978e7","impliedFormat":1},{"version":"e297c0a524edee7677939122f90027bfbe5f2698939d9a85728e5044b39c7124","impliedFormat":1},{"version":"cdf21eee8007e339b1b9945abf4a7b44930b1d695cc528459e68a3adc39a622e","impliedFormat":1},{"version":"bc9ee0192f056b3d5527bcd78dc3f9e527a9ba2bdc0a2c296fbc9027147df4b2","impliedFormat":1},{"version":"b62381cae176db34f003cc6172ee8f3e0122014889d66391aa73698105cf4934","impliedFormat":1},{"version":"1d9c0a9a6df4e8f29dc84c25c5aa0bb1da5456ebede7a03e03df08bb8b27bae6","impliedFormat":1},{"version":"84380af21da938a567c65ef95aefb5354f676368ee1a1cbb4cae81604a4c7d17","impliedFormat":1},{"version":"1af3e1f2a5d1332e136f8b0b95c0e6c0a02aaabd5092b36b64f3042a03debf28","impliedFormat":1},{"version":"30d8da250766efa99490fc02801047c2c6d72dd0da1bba6581c7e80d1d8842a4","impliedFormat":1},{"version":"03566202f5553bd2d9de22dfab0c61aa163cabb64f0223c08431fb3fc8f70280","impliedFormat":1},{"version":"41eb514d9ce0a6e87957f08a4b7af70d93f87637f37dee706e2d92a6601c25a9","impliedFormat":1},{"version":"e7765aa8bcb74a38b3230d212b4547686eb9796621ffb4367a104451c3f9614f","impliedFormat":1},{"version":"1de80059b8078ea5749941c9f863aa970b4735bdbb003be4925c853a8b6b4450","impliedFormat":1},{"version":"1d079c37fa53e3c21ed3fa214a27507bda9991f2a41458705b19ed8c2b61173d","impliedFormat":1},{"version":"5bf5c7a44e779790d1eb54c234b668b15e34affa95e78eada73e5757f61ed76a","impliedFormat":1},{"version":"5835a6e0d7cd2738e56b671af0e561e7c1b4fb77751383672f4b009f4e161d70","impliedFormat":1},{"version":"4b7f74b772140395e7af67c4841be1ab867c11b3b82a51b1aeb692822b76c872","impliedFormat":1},{"version":"7bd01f0f28cd3aeb2046274d85208e245965f6f2948edf4f7b2057bcf9f22ccc","impliedFormat":99},{"version":"d2f2cf2b8cc92bea913cda4a076e0f790b23a21e84f989d12f0116a7fe3906e0","impliedFormat":99},{"version":"6de125ea94866c736c6d58d68eb15272cf7d1020a5b459fea1c660027eca9a90","affectsGlobalScope":true,"impliedFormat":1},{"version":"f5b20bc288ee49989c95b20847fc93b96bf61cc0845598897a6a53a967dd7d07","affectsGlobalScope":true,"impliedFormat":1},{"version":"064ac1c2ac4b2867c2ceaa74bbdce0cb6a4c16e7c31a6497097159c18f74aa7c","impliedFormat":1},{"version":"3dc14e1ab45e497e5d5e4295271d54ff689aeae00b4277979fdd10fa563540ae","impliedFormat":1},{"version":"d3b315763d91265d6b0e7e7fa93cfdb8a80ce7cdd2d9f55ba0f37a22db00bdb8","impliedFormat":1},{"version":"b789bf89eb19c777ed1e956dbad0925ca795701552d22e68fd130a032008b9f9","impliedFormat":1},{"version":"2fe49b7e08bea323f00dce20a38e20202b83af98c44b8feff26f2a8c4f7e277f","affectsGlobalScope":true},"7b550dda9686c16f36a17bf9051d5dbf31e98555b30d114ac49fc49a1e712651",{"version":"614bce25b089c3f19b1e17a6346c74b858034040154c6621e7d35303004767cc","signature":"435a1e418e8338be3f39614b96b81a9aa2700bc8c27bc6b98f064ff9ce17c363"},{"version":"5a6237f90ea7b312ce8e331ad5ab88661ca01c64aad1fdfa4d8a9f2f64caf57d","impliedFormat":1},{"version":"3b60785a15e0a0c942cfceaa26c338425c6606fe025643efb54b900a8c3744d3","impliedFormat":1},{"version":"a3628f430f8d502a5c026a0c932a5c41e6361d8e0248287872cd8999bc534399","impliedFormat":1},{"version":"e0955fb05a28dceb694e499e3a828ac2fc2f24fd6bfd4a9f3edb8550c05779b3","impliedFormat":99},{"version":"5a800cb44fd70e436adf02e020dea317b0026786910e4bbc7ca014208c894ffd","impliedFormat":1},{"version":"2b6c6039f4d2f656904d66f82231488f4852f861d27147884895097f74e3e812","impliedFormat":1},{"version":"1621da3c4da45c37b79d6d361f7de9f0ea40b171dd11ef1ef1bb026665965fc9","impliedFormat":1},{"version":"3878700a966f0201a3e2b9aea8b75cc65008741c359889314e7b0c56c0c07b56","impliedFormat":1},{"version":"f040575209f695a7616fba0045e6a0c88d19d77b246a0098caeb4c9384447d15","impliedFormat":1},{"version":"1fcc4bb6d083b31e1587711ab5a8b0467b52a125f9735467774285bc8cc127e6","impliedFormat":1},{"version":"2193f35e13aee12b162670006604b914edb47fa0e391f39a8fe94a5402b60139","impliedFormat":1},{"version":"0e085cc503ad1332728d56244e9f7a603404beca17c0c5b2d815ed29e0727d4b","impliedFormat":1},{"version":"deda38d3245acb0404dd845dae172547c895c99c442082f176071cbb40d092f3","impliedFormat":1},{"version":"89659dc89f3a21d2a29c898297c96d56ef49f25eee0ee54aace7bd00758b6334","impliedFormat":1},{"version":"df4e0cf0d4a4ea996065de24fb0f621f96321f048869fbf4ef58a55593084d16","impliedFormat":1},{"version":"e6f3d02d69394dae0771c088b3c0b982cf15b6a91678c59f1d5fbd7c5e6ad8f8","impliedFormat":1},{"version":"ef182902b33ac9b9ad90c163b313722d2bc9d8c2cfefeb418b3205d70504a486","impliedFormat":1},{"version":"4868d3290ec2ee01d1b5d0f003d0cafd88febc985653b4ba40f4216ad9cf72ac","impliedFormat":1},{"version":"95bdd836ed77c23e530fcd3a0823df8fd611035590dfd8d38ee164c56f2bd2c4","impliedFormat":1},{"version":"f96537f0fcfd0379e3254479573ffebc8a67c13a2cd3144c744b032af33800b9","impliedFormat":1},{"version":"c2d50e73c775fee10c2361880cd227f3497a67677536208cd0e8a5d5ab562a0d","impliedFormat":1},{"version":"6af18d77b9656786783ce0f1296403e1f998ec8af4c1d16fe3728a3b2ec5751f","impliedFormat":1},{"version":"435279e408da8dba444c8ba93bbefddcae9e99b33acfc9a7c3318583e8f4a745","impliedFormat":1},{"version":"447b6a80636a59c918ed18af1019de1efa94109a086e8fd8f3d20eb9b9a6937b","impliedFormat":99},{"version":"541b6ece6e4191ef7d4f8865ae34246a0a78b4dc54017149742da44bc9353a1e","impliedFormat":99},{"version":"05c9c065eadecdce0ee370455e3c36674bfb08673f1a268a398002a0d2d801b7","impliedFormat":1},{"version":"3f94e04c73c5ffd66fecf2ab2a199372a5321739ac4a3a6e286e39b62430dc49","impliedFormat":1},{"version":"0eae63800777384563d5727e572982c220d47acf736dcdb569a2749a32378f19","impliedFormat":1},{"version":"9bf41a89bd0bbd4f8a23a7925d04f99267cb84a5a5b239185f3320edea329b9c","impliedFormat":1},{"version":"c8699f2b983bbc3117260c84d2f9f11c83eb2b396ea881a69d4cf10ac73a339f","impliedFormat":1},{"version":"b688a3daef72eae05635460146810781dab458476b855c4366371e17f1a0b546","impliedFormat":1},{"version":"9280a569eb85c1dab325f5fcd8dae26557147d8f5781f57b49a65570d51313c3","impliedFormat":1},{"version":"964de3d129316ff79eccce67973270c01d0ed9c61947535ff8f35509a46fe536","impliedFormat":1},{"version":"e444a4edd02caac4c129adb1033df87601f443a38b3b505ab368da6b9c5c5560","impliedFormat":1},{"version":"572fb2a517241d42d3fee85ec193f099303793305a8d988c9ea1574d0866fb9e","impliedFormat":1},{"version":"170decb46fc69c7e82174fe44f308115628d033f11ee51c9d554f5ca735353f3","impliedFormat":1},{"version":"5a2c66c68291a04dd668558d7f23ebf128d253ded80f61da746ad145d9f1f44a","impliedFormat":1},{"version":"4ae9b50481136302de9c77668621ed3a0b34998f3e091ca3701426f4fe369c8a","impliedFormat":1},{"version":"9ba9ecc57d2f52b3ed3ac229636ee9a36e92e18b80eeae11ffb546c12e56d5e5","impliedFormat":1},{"version":"8f9bd109c51a702d1dbae7d0ef356765679726e4af5ad0e61afbf7ac6ae19b3d","impliedFormat":1},{"version":"d182d419bb30a1408784ed95fbabd973dde7517641e04525f0ce761df5d193a5","impliedFormat":1},{"version":"95907cde646ba4005f68148eb8840f275865556b231d781b434f9258b1f230b1","impliedFormat":99},{"version":"bc45ca7ccef9585e83a4c16024ac35dde2965b1c17fbce6ad62561629986e2ac","signature":"21b3439d278d4bc5530437128c65748bd57de2b046bca786056c605f61c6eb83"},{"version":"4e35f7e80e9a9f60d6aa29a6b0e8a851973bcb252974df22d38f6a7cb63ee1aa","signature":"d6305d85351f4add01ff0568a48265e0b3390ef26d6fa0829c52b80164d37414"},{"version":"f94c7e31970a6ae2a3ec7922aad25cbecdb6fc338b630984ffb0d828f67cb4d8","signature":"45ce3eedff9ffed441a0192223ad86da104a52abc117b9be3479dc693285c4d1"},{"version":"2d81d55a4b241f44944bef2b3ed8c015bf16f9446a6362914afaae0f9251f81e","signature":"512f8326104bbf84bda380571002beefac83a19bb31239d58b4fd358ab0610bd"},{"version":"e75811e6b0c520c7bfb2a0eeee7f8f5e2b2b5ca1a232cc7ae89667b751c0290e","signature":"e6857809b725e958fc01125d02517b7852474ea968f788a299d6ec8456c3c44e"},{"version":"d55a6155658932117862c7a22ff72ed4f760abc2071013fbe569fd0e51e76b5e","signature":"4e36e3ceeaa0b69851f7d51dce98327af3a707ec67e65e26160a9dd800c410c9"},{"version":"44898fc933e91b7dae4d4b3061d730afd8d57f2e0ec53c9c18a921882c8d1980","signature":"4f8b0d80dcd985d31984c73940375b8e3ea28700fa97d560ba6f4e48d08ce68f"},{"version":"53393db4d50b9c20bb01e37e94b44f7da3a6fe410d47ac6fd2072a303a57a171","signature":"42d7707902d8424a856268f88ff902b27cfeb7daa30984cc59f58bbd39b79bbc"},{"version":"29ad3ff5e86ffe4ef220361532e1785287fa181e73a8dad2a1d91ba84aeae54e","signature":"42d7707902d8424a856268f88ff902b27cfeb7daa30984cc59f58bbd39b79bbc"},{"version":"2e241f305d0f275587af046b0996d2d434b1269611633d7f4dc36b72d8b14771","signature":"42d7707902d8424a856268f88ff902b27cfeb7daa30984cc59f58bbd39b79bbc"},{"version":"9872b70f0d59325447d498fc32215dda19d5b2c8e4d6737bceefaba47adcb808","signature":"42d7707902d8424a856268f88ff902b27cfeb7daa30984cc59f58bbd39b79bbc"},{"version":"1d26147d4e905d760db8bbe0e5c3670247db1a341fda020edca3a7a65b47a2ed","signature":"eaa20ac0e1c9ac580d4c8f1656a1df78713f3b7eff0cee0dfc96ce849fe31396"},{"version":"056e096e6880398a2c429f31319ff7fcfc6afdf62668941be6b1cb1a6439b214","signature":"dbbf19593ce7cb4c948fbc823a74edb26a0ef11335250c4394017d94d3d68887"},{"version":"dbbf746d789238f8071216dfcce6bc7972a847aba8424e6baef2abe470831331","signature":"ec3920cc1afe52199f60ce63421573e1a6cad058c8199c3bf53d734e0750fe27"},{"version":"8c5d57507ed34eec130154cf3e28a928b3ee65eb02ce6910b14bac4b73dea4dc","signature":"a5996e2c4c03896a1964a958b1e1fdb1476f978830718844628ca69454945750"},{"version":"aaeb468bbe8bab5d9b4f3556468b212bbd8f1997810e3be6848dbd0eb12f30b6","signature":"4bce33869b40daf47f62b16f613e4828611989d07624fd1cc0ce1b3a48cc7d88"},{"version":"0d7a776ec04b84520bf5e774ef2d0bfb8a4b1de6e3fe0fa083ac706eb1cd712b","signature":"66fd3c9355ab42b38725840bc163a49598ffb931ca581005c0f0766ef3a3f7f9"},{"version":"834bdb3926b8a25bb7995123ee1bb032ddf79e431fee4ab1b84ad93cd9b5752e","signature":"3b33e7100fa2c27c8d0e70ba2f0c0286228f3952ec652ea228e3fbd4b5ce65fe"},{"version":"0609afeff81bcf57ff11d184c2debea5148f47355af68ad00a0e4a74ee33a019","signature":"0d35686ecac1e35629a3c69d240c3980de75146434854db5e75645c457be5567"},{"version":"0151ec9fde4e17bf1f5b7dca285842fbd2d0f5f9dc45ed230aad8075e5471aef","signature":"b621b119def0f4563b7de95e85703e884e3317e0e0e811fbbc40702afd99a264"},{"version":"e665b8851ef6161dbd2adb3196d879020b8c32e96f07bd9a9afe847be19465cc","signature":"2dcc50c46dcccaadb05bc414e290fd1a75298fcadb47c77c1af84945ec8b6b01"},{"version":"bf779fe393c8021c6881db6702eaf5837c1f431d85844c7f44fb51c3bbcc0cc2","signature":"9031dd00c94b0f4ba7ec0a244ea27f4d530e6a9c9573f37ed9dbb7c5f7281596"},{"version":"a0fc412002192ca37d0c5684d58a04de3ee7aa1323c568eeb7cdbeae2438e674","signature":"9b37defc1cf2817877d82929745263a4741c10b95e7ad1ae1b2386ec1056dc7f"},{"version":"4d5eb32e76b2dfc36ec3be9340425833c3b3cbcb4b57887bd9aa70109480d6d2","signature":"37a99d01a85a4f1272255f7a3e21a0dd04286cbdbba27fd77bb17eeb603a4734"},{"version":"84da7078861bf778dc6fd7a3c5a6f4eb34f916e3fc367bbd063f764ab4c4a5d1","signature":"aa5fdbfd931126e88ae344ed36ae7bbc4e527910b285610e0e41c18581e1ca87"},{"version":"44d8e6792d0c5c966c149e0c3ed9a5922ea89607332acdee96a5ce51e6aeeef7","signature":"6035484166ccfdf28701961cb5ffbd87ac5e80fe7f69bcee8f95f449f659e197"},{"version":"113c1c5890aca422602872d84e604535c5e89f8810c021306f4cd1696f6f3553","signature":"036123b9345a96584fb50686e1029debed6955aa623548ed841b82d72e4b20c4"},{"version":"9f28e81620684a392b02a414ec3c70a14c2224df4d6d9cbd6c29d2822dc5d393","signature":"60a663e9e57434348288fa77c43b8d7e57fe36859c497a1bce837f42f3988e52"},{"version":"fe0672d799a32680ae1b6eb2a8de93c1c6f2452360e99c85fad6128202b9104c","signature":"7386e8d29c70abdbff62defcc2e3028a50c6d70f7ca131239e0bace41c0e3d51"},{"version":"26161119a28d6c11f9f7d7e011218c60a20dbc2166569d65cccab816ea914d7a","signature":"f184dc470a3c3516f27cfdc73432fa02c1cce21b2178e2b1c68c2a1981124238"},{"version":"9ce1fed9afeb7b28aa84e9e1130a43ec1d642c9721d52f6e16015d342f28f0a9","signature":"b4df131954cee9915fbf881c86b2ee20acea3ba7014a53a4e658563fe41953b5"},{"version":"c4c68597bbea116b89b16723736356341d9a7423f4552bb448a1693f785e2c34","signature":"566c8be8016873a214eb2943cfba1d6930f52210b4fbf87844f80c82dc9815da"},{"version":"125bc26b761e06b4ea0911d06722d04b613a6da3ae4b11b9a9b94232c7a84a63","signature":"239fcef72bd1083d0bcac04706129fd3024e0f6578c8f62c77604097fe6afc05"},{"version":"24de2ea23e8d88f42f4cbe723f0ed8f31b2bbf6a75df68013e3a36d12eca579d","signature":"dc00b018cb4198078e226437782626513d95ae3a15f0eab46c03bbf430a1cb00"},{"version":"d1dcbb4940dcc729fe948db7ac389587f32b546a91aca44a71a55baff9ed76df","signature":"1e27db8e328f7852f995fa57b7e497dc7d14e9d84592eaf4ecd1c8ee318b8218"},{"version":"daff27a30006bc58aee0beeb319d59cb0b64f3bcc2fcd41a44201caaa7967c26","signature":"321d15561dcb873c4b0a7c7b5910e59a07ba63d052a7ec9792ea656609f53f7f"},{"version":"334fc370b82021e4de70b7e28b567a3329271a9bcc50699dfe17145553a22a50","signature":"a13118733a589d6e08a408e5c867623a292b66d7f8b96c0786f2298fffd9fa47"},{"version":"a3f5433400c40e7628bcd4779db8f6947d5108c73fe870b4219c3cbe313eb581","signature":"c57cfabe70e1e875e2a79c824f8d7f350892c11ef6b960b7a0bd08e0b25b5819"},"d1986184a09a52db8228cb2bb2a61a8c05c9354e5b93cec8e2628d8579c892d7",{"version":"0d3aea41464b63e0241edac60a8d34094f41d53674fea73172b1b6246d47cf67","signature":"8e609bb71c20b858c77f0e9f90bb1319db8477b13f9f965f1a1e18524bf50881"},"d1986184a09a52db8228cb2bb2a61a8c05c9354e5b93cec8e2628d8579c892d7",{"version":"2fe49b7e08bea323f00dce20a38e20202b83af98c44b8feff26f2a8c4f7e277f","affectsGlobalScope":true},{"version":"e6dcd49c9ba560162a364cd35e158e5066091702d55880cdb4c686e4b43f5a71","signature":"8e609bb71c20b858c77f0e9f90bb1319db8477b13f9f965f1a1e18524bf50881"},{"version":"751764bb94219b4ce8f5475dc35d3de2e432fea01a0c9610cd7f69ad05e398c6","impliedFormat":1},{"version":"f3d8c757e148ad968f0d98697987db363070abada5f503da3c06aefd9d4248c1","impliedFormat":1},{"version":"96d14f21b7652903852eef49379d04dbda28c16ed36468f8c9fa08f7c14c9538","impliedFormat":1}],"root":[[530,532],[576,617]],"options":{"allowJs":true,"esModuleInterop":true,"jsx":4,"module":99,"skipLibCheck":true,"strict":true,"target":4},"referencedMap":[[615,1],[616,2],[617,3],[613,4],[530,2],[614,5],[601,6],[600,7],[602,8],[599,6],[579,9],[603,10],[582,11],[583,11],[584,11],[585,11],[586,12],[587,13],[588,14],[604,6],[605,15],[589,16],[606,17],[608,18],[607,19],[609,20],[610,19],[595,21],[597,22],[611,23],[612,24],[596,25],[594,26],[592,25],[593,27],[598,25],[591,25],[590,28],[576,29],[581,30],[578,31],[580,32],[575,32],[577,33],[531,34],[532,35],[374,2],[570,36],[571,37],[569,38],[564,39],[573,40],[558,2],[559,41],[568,42],[563,43],[572,2],[567,44],[560,2],[561,2],[566,45],[562,42],[565,43],[534,46],[535,47],[533,2],[545,48],[539,2],[548,49],[540,2],[546,50],[544,50],[547,51],[543,52],[542,2],[541,53],[536,2],[555,54],[550,55],[538,2],[537,2],[549,56],[553,57],[554,58],[552,2],[551,59],[557,60],[574,61],[618,2],[619,2],[620,2],[140,62],[141,62],[142,63],[97,64],[143,65],[144,66],[145,67],[92,2],[95,68],[93,2],[94,2],[146,69],[147,70],[148,71],[149,72],[150,73],[151,74],[152,74],[153,75],[154,76],[155,77],[156,78],[98,2],[96,2],[157,79],[158,80],[159,81],[191,82],[160,83],[161,84],[162,85],[163,86],[164,87],[165,88],[166,89],[167,90],[168,91],[169,92],[170,92],[171,93],[172,2],[173,94],[175,95],[174,96],[176,97],[177,98],[178,99],[179,100],[180,101],[181,102],[182,103],[183,104],[184,105],[185,106],[186,107],[187,108],[188,109],[99,2],[100,2],[101,2],[139,110],[189,111],[190,112],[195,113],[459,114],[196,115],[194,116],[461,117],[460,118],[192,119],[457,2],[193,120],[83,2],[85,121],[456,114],[226,114],[84,2],[556,2],[482,122],[487,123],[494,124],[477,125],[230,2],[238,126],[378,127],[381,128],[353,2],[366,129],[373,130],[255,2],[355,2],[236,2],[352,131],[398,132],[237,2],[228,133],[380,134],[382,135],[383,136],[454,137],[347,138],[300,139],[360,140],[361,141],[359,142],[358,2],[354,143],[379,144],[239,145],[424,2],[425,146],[266,147],[240,148],[267,147],[303,147],[206,147],[376,149],[375,2],[365,150],[472,2],[215,2],[493,151],[432,152],[433,153],[429,154],[511,2],[330,2],[434,25],[430,155],[516,156],[515,157],[510,2],[281,2],[333,158],[332,2],[509,159],[431,114],[286,160],[293,161],[295,162],[285,2],[290,163],[292,164],[294,165],[289,166],[287,2],[291,167],[512,2],[508,2],[514,168],[513,2],[284,169],[503,170],[506,171],[274,172],[273,173],[272,174],[519,114],[271,175],[260,2],[521,2],[522,114],[523,176],[198,2],[362,177],[363,178],[364,179],[202,2],[367,2],[222,180],[197,2],[446,114],[204,181],[445,182],[444,183],[435,2],[436,2],[443,2],[438,2],[441,184],[437,2],[439,185],[442,186],[440,185],[235,2],[232,2],[233,147],[387,2],[392,187],[393,188],[391,189],[389,190],[390,191],[385,2],[452,25],[227,25],[481,192],[488,193],[492,194],[321,195],[320,2],[315,2],[468,196],[476,197],[348,198],[349,199],[427,200],[337,2],[450,201],[325,114],[342,202],[453,203],[338,2],[341,204],[339,2],[451,205],[448,206],[447,2],[449,2],[345,2],[423,207],[210,208],[323,209],[327,210],[343,211],[346,212],[335,213],[328,214],[475,215],[401,216],[319,217],[207,218],[474,219],[203,220],[394,221],[386,2],[395,222],[412,223],[384,2],[411,224],[91,2],[406,225],[231,2],[426,226],[402,2],[216,2],[218,2],[357,2],[410,227],[234,2],[258,228],[344,229],[264,230],[324,2],[409,2],[388,2],[414,231],[415,232],[356,2],[417,233],[419,234],[418,235],[368,2],[408,218],[421,236],[318,237],[407,238],[413,239],[243,2],[247,2],[246,2],[245,2],[250,2],[244,2],[253,2],[252,2],[249,2],[248,2],[251,2],[254,240],[242,2],[310,241],[309,2],[314,242],[311,243],[313,244],[316,242],[312,243],[223,245],[302,246],[471,247],[469,2],[498,248],[500,249],[464,250],[499,251],[211,252],[208,252],[241,2],[225,253],[224,254],[220,255],[221,256],[229,257],[257,257],[268,257],[304,258],[269,258],[213,259],[212,2],[308,260],[307,261],[306,262],[305,263],[214,264],[455,265],[256,266],[463,267],[428,268],[458,269],[462,270],[351,271],[350,272],[331,273],[317,274],[299,275],[301,276],[298,277],[420,278],[322,2],[486,2],[219,279],[422,280],[470,281],[329,2],[259,282],[336,283],[334,284],[261,285],[396,286],[465,2],[262,287],[397,287],[484,2],[483,2],[485,2],[467,2],[466,2],[399,288],[326,2],[296,289],[217,290],[275,2],[201,291],[263,2],[490,114],[200,2],[502,292],[283,114],[496,25],[282,293],[479,294],[280,292],[205,2],[504,295],[278,114],[279,114],[270,2],[199,2],[277,296],[276,297],[265,298],[340,91],[400,91],[416,2],[404,299],[403,2],[288,169],[209,2],[297,114],[473,180],[480,300],[86,114],[89,301],[90,302],[87,114],[88,2],[377,303],[372,304],[371,2],[370,305],[369,2],[478,306],[489,307],[491,308],[495,309],[497,310],[501,311],[529,312],[505,312],[528,313],[507,314],[517,315],[518,316],[520,317],[524,318],[527,180],[526,2],[525,319],[405,320],[81,2],[82,2],[13,2],[14,2],[16,2],[15,2],[2,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[3,2],[25,2],[26,2],[4,2],[27,2],[31,2],[28,2],[29,2],[30,2],[32,2],[33,2],[34,2],[5,2],[35,2],[36,2],[37,2],[38,2],[6,2],[42,2],[39,2],[40,2],[41,2],[43,2],[7,2],[44,2],[49,2],[50,2],[45,2],[46,2],[47,2],[48,2],[8,2],[54,2],[51,2],[52,2],[53,2],[55,2],[9,2],[56,2],[57,2],[58,2],[60,2],[59,2],[61,2],[62,2],[10,2],[63,2],[64,2],[65,2],[11,2],[66,2],[67,2],[68,2],[69,2],[70,2],[1,2],[71,2],[72,2],[12,2],[76,2],[74,2],[79,2],[78,2],[73,2],[77,2],[75,2],[80,2],[117,321],[127,322],[116,321],[137,323],[108,324],[107,325],[136,319],[130,326],[135,327],[110,328],[124,329],[109,330],[133,331],[105,332],[104,319],[134,333],[106,334],[111,335],[112,2],[115,335],[102,2],[138,336],[128,337],[119,338],[120,339],[122,340],[118,341],[121,342],[131,319],[113,343],[114,344],[123,345],[103,346],[126,337],[125,335],[129,2],[132,347]],"affectedFilesPendingEmit":[617,614,601,600,602,599,579,603,582,583,584,585,586,587,588,604,605,589,606,608,607,609,610,595,597,611,612,596,594,592,593,598,591,590,576,581,578,580,575,577,532],"version":"5.9.3"}
```
