// app/admin/_components/GradesSection.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { postJson } from '@/lib/api-client';
import {
  GRADE_TYPE_COLORS,
  GRADE_TYPE_EMOJIS,
  GRADE_TYPE_LABELS,
  GRADE_TYPES,
  type GradeType,
} from '@/lib/constants';
import type { Subject } from '@/lib/types';

// ==================== Types ====================
interface Props {
  password: string;
}

interface GradeFile {
  id: string;
  subject_id: string;
  title: string;
  grade_type: GradeType;
  professor_name: string | null;
  year: number | null;
  notes: string | null;
  file_path: string;
  created_at: string;
  subjects?: { name: string; stage: string } | null;
}

interface FormState {
  subject_id: string;
  title: string;
  grade_type: GradeType;
  professor_name: string;
  year: string;
  notes: string;
  file_path: string;
}

function emptyForm(subjectId?: string): FormState {
  return {
    subject_id: subjectId ?? '',
    title: '',
    grade_type: 'quiz',
    professor_name: '',
    year: '',
    notes: '',
    file_path: '',
  };
}

function formFromItem(item: GradeFile): FormState {
  return {
    subject_id: item.subject_id,
    title: item.title,
    grade_type: item.grade_type,
    professor_name: item.professor_name ?? '',
    year: item.year != null ? String(item.year) : '',
    notes: item.notes ?? '',
    file_path: item.file_path,
  };
}

function isFormValid(f: FormState): boolean {
  return (
    f.subject_id.trim() !== '' &&
    f.title.trim() !== '' &&
    f.file_path.trim() !== ''
  );
}

// ==================== Icons ====================
function IconGrades() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 4h6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

// ==================== Main ====================
export function GradesSection({ password }: Props) {
  const toast = useToast();
  const confirm = useConfirm();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [items, setItems] = useState<GradeFile[]>([]);
  const [loading, setLoading] = useState(true);

  const [newForm, setNewForm] = useState<FormState>(emptyForm());
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | GradeType>('all');

  // ===== تحميل =====
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [subjectsRes, filesRes] = await Promise.all([
        postJson<{ subjects: Subject[] }>('/api/admin/subjects', {
          password,
          action: 'list',
        }),
        postJson<{ items: GradeFile[] }>('/api/admin/grade-files', {
          password,
          action: 'list',
        }),
      ]);
      setSubjects(subjectsRes.subjects ?? []);
      setItems(filesRes.items ?? []);
      setNewForm((prev) => {
        if (prev.subject_id || !subjectsRes.subjects?.length) return prev;
        return { ...prev, subject_id: subjectsRes.subjects[0].id };
      });
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل التحميل', 'error');
      setSubjects([]);
      setItems([]);
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

  // ===== الفلترة =====
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items
      .filter((i) => filterType === 'all' || i.grade_type === filterType)
      .filter((i) => {
        if (!term) return true;
        const haystack = [
          i.title,
          i.professor_name ?? '',
          i.subjects?.name ?? subjectNameById.get(i.subject_id) ?? '',
          i.notes ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      });
  }, [items, search, filterType, subjectNameById]);

  // ===== إضافة =====
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid(newForm)) return;
    setAdding(true);
    try {
      await postJson('/api/admin/grade-files', {
        password,
        action: 'add',
        subject_id: newForm.subject_id,
        title: newForm.title.trim(),
        grade_type: newForm.grade_type,
        professor_name: newForm.professor_name.trim() || null,
        year: newForm.year ? Number(newForm.year) : null,
        notes: newForm.notes.trim() || null,
        file_path: newForm.file_path.trim(),
      });
      const kept = newForm.subject_id;
      setNewForm({ ...emptyForm(kept), grade_type: newForm.grade_type });
      toast.show('تمت إضافة الملف', 'success');
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الإضافة', 'error');
    } finally {
      setAdding(false);
    }
  }

  // ===== تعديل =====
  function startEdit(item: GradeFile) {
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
      await postJson('/api/admin/grade-files', {
        password,
        action: 'edit',
        id,
        subject_id: editForm.subject_id,
        title: editForm.title.trim(),
        grade_type: editForm.grade_type,
        professor_name: editForm.professor_name.trim() || null,
        year: editForm.year ? Number(editForm.year) : null,
        notes: editForm.notes.trim() || null,
        file_path: editForm.file_path.trim(),
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
  async function handleDelete(item: GradeFile) {
    const ok = await confirm(`حذف «${item.title}» نهائياً. هل أنت متأكد؟`, {
      variant: 'danger',
      confirmLabel: 'حذف',
    });
    if (!ok) return;
    try {
      await postJson('/api/admin/grade-files', {
        password,
        action: 'delete',
        id: item.id,
      });
      toast.show('تم الحذف', 'success');
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحذف', 'error');
    }
  }

  // ===== الرسم =====
  return (
    <section>
      {subjects.length === 0 && !loading && (
        <div className="mb-5 rounded-2xl border border-amber/30 bg-amber/8 p-4 text-sm dark:bg-amber/15">
          <p className="font-medium text-ink/70">
            أضف مادة أولاً من تبويب «المواد» حتى تستطيع رفع ملفات الدرجات.
          </p>
        </div>
      )}

      {/* ===== نموذج الإضافة ===== */}
      <form
        onSubmit={handleAdd}
        className="mb-5 space-y-3 rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.04)] dark:bg-paper/80"
      >
        <div className="flex flex-wrap gap-2">
          <Select
            value={newForm.subject_id}
            onChange={(e) =>
              setNewForm({ ...newForm, subject_id: e.target.value })
            }
            className="w-full sm:w-44"
            disabled={subjects.length === 0}
            aria-label="المادة"
          >
            <option value="">اختر المادة</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>

          <Select
            value={newForm.grade_type}
            onChange={(e) =>
              setNewForm({
                ...newForm,
                grade_type: e.target.value as GradeType,
              })
            }
            className="w-full sm:w-40"
            aria-label="نوع الدرجة"
          >
            {GRADE_TYPES.map((t) => (
              <option key={t} value={t}>
                {GRADE_TYPE_EMOJIS[t]} {GRADE_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>

          <Input
            type="text"
            value={newForm.title}
            onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
            placeholder="عنوان الملف (مثال: كوز تشريح - الفصل الأول)"
            required
            maxLength={300}
            className="min-w-0 flex-1 basis-full sm:basis-auto"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            type="text"
            value={newForm.professor_name}
            onChange={(e) =>
              setNewForm({ ...newForm, professor_name: e.target.value })
            }
            placeholder="اسم الدكتور (اختياري)"
            maxLength={200}
            className="min-w-0 flex-1 basis-full sm:basis-auto"
          />
          <Input
            type="number"
            inputMode="numeric"
            min={1990}
            max={2100}
            value={newForm.year}
            onChange={(e) => setNewForm({ ...newForm, year: e.target.value })}
            placeholder="السنة"
            className="w-full sm:w-32"
          />
        </div>

        <Input
          type="url"
          value={newForm.file_path}
          onChange={(e) =>
            setNewForm({ ...newForm, file_path: e.target.value })
          }
          placeholder="رابط تلغرام أو Supabase"
          required
          maxLength={2000}
        />

        <Textarea
          value={newForm.notes}
          onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
          placeholder="ملاحظات إضافية (اختياري)"
          rows={2}
          maxLength={500}
        />

        <Button
          type="submit"
          loading={adding}
          disabled={!isFormValid(newForm) || subjects.length === 0}
          className="w-full sm:w-auto"
        >
          إضافة ملف
        </Button>
      </form>

      {/* ===== أدوات البحث ===== */}
      {!loading && items.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالعنوان، الدكتور، أو المادة..."
            className="min-w-[180px] flex-1"
          />
          <Select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as 'all' | GradeType)
            }
            className="w-full sm:w-40"
            aria-label="نوع الفلترة"
          >
            <option value="all">كل الأنواع</option>
            {GRADE_TYPES.map((t) => (
              <option key={t} value={t}>
                {GRADE_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* ===== القائمة ===== */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 skeleton-shimmer rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-line bg-white/80 p-12 text-center dark:bg-paper/80">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/8 text-teal">
            <IconGrades />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد ملفات درجات بعد</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-line bg-white/80 p-8 text-center dark:bg-paper/80">
          <p className="font-bold text-ink/70">لا نتائج مطابقة</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const isEditing = editingId === item.id;
            const subjName =
              item.subjects?.name ??
              subjectNameById.get(item.subject_id) ??
              '—';

            if (isEditing) {
              return (
                <div
                  key={item.id}
                  className="space-y-3 rounded-2xl border border-teal/30 bg-paper-soft p-4"
                >
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={editForm.subject_id}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          subject_id: e.target.value,
                        })
                      }
                      className="w-full sm:w-44"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={editForm.grade_type}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          grade_type: e.target.value as GradeType,
                        })
                      }
                      className="w-full sm:w-40"
                    >
                      {GRADE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {GRADE_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </Select>
                    <Input
                      type="text"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      maxLength={300}
                      className="min-w-0 flex-1 basis-full sm:basis-auto"
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      type="text"
                      value={editForm.professor_name}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          professor_name: e.target.value,
                        })
                      }
                      placeholder="اسم الدكتور"
                      maxLength={200}
                      className="min-w-0 flex-1 basis-full sm:basis-auto"
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1990}
                      max={2100}
                      value={editForm.year}
                      onChange={(e) =>
                        setEditForm({ ...editForm, year: e.target.value })
                      }
                      placeholder="السنة"
                      className="w-full sm:w-32"
                    />
                  </div>
                  <Input
                    type="url"
                    value={editForm.file_path}
                    onChange={(e) =>
                      setEditForm({ ...editForm, file_path: e.target.value })
                    }
                    maxLength={2000}
                  />
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    rows={2}
                    maxLength={500}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveEdit(item.id)}
                      loading={saving}
                      disabled={!isFormValid(editForm)}
                    >
                      حفظ
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-paper-soft p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span
                      className={`rounded-chip px-2.5 py-0.5 text-[11px] font-bold ${GRADE_TYPE_COLORS[item.grade_type]}`}
                    >
                      {GRADE_TYPE_EMOJIS[item.grade_type]}{' '}
                      {GRADE_TYPE_LABELS[item.grade_type]}
                    </span>
                    <span className="font-bold text-ink">{item.title}</span>
                    <span className="rounded-chip bg-teal/8 px-2 py-0.5 font-mono text-xs text-teal/70 dark:bg-teal/15 dark:text-teal">
                      {subjName}
                    </span>
                    {item.year != null && (
                      <span className="rounded-md bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink/50 dark:bg-white/10">
                        {item.year}
                      </span>
                    )}
                  </div>
                  {item.professor_name && (
                    <p className="mt-1 text-sm text-ink/50">
                      د. {item.professor_name}
                    </p>
                  )}
                  {item.notes && (
                    <p className="mt-1 text-xs text-ink/40">{item.notes}</p>
                  )}
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => startEdit(item)}
                    icon={<IconEdit />}
                  >
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(item)}
                    icon={<IconTrash />}
                  >
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