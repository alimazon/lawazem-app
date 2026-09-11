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