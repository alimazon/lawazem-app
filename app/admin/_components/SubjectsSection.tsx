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