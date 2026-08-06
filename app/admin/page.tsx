'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({ lectureNotes: [], examQuestions: [], professorNotes: [] });
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectStage, setNewSubjectStage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStage, setEditStage] = useState('');

  async function loadPending(pw: string) {
    setLoading(true);
    setLoginError('');
    const res = await fetch('/api/admin/pending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });

    if (!res.ok) {
      setLoading(false);
      setLoginError('كلمة المرور غير صحيحة');
      return;
    }

    const json = await res.json();
    setData(json);
    setAuthenticated(true);
    await loadSubjects(pw);
    setLoading(false);
  }

  async function loadSubjects(pw: string) {
    const res = await fetch('/api/admin/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, action: 'list' }),
    });
    if (res.ok) {
      const json = await res.json();
      setSubjects(json.subjects || []);
    }
  }

  async function handleAction(table: string, id: string, action: string) {
    const res = await fetch('/api/admin/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, table, id, action }),
    });
    if (res.ok) {
      loadPending(password);
    }
  }

  async function handleAddSubject(e: any) {
    e.preventDefault();
    const res = await fetch('/api/admin/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action: 'add', name: newSubjectName, stage: newSubjectStage }),
    });
    if (res.ok) {
      setNewSubjectName('');
      setNewSubjectStage('');
      loadSubjects(password);
    }
  }

  function startEdit(s: any) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditStage(s.stage || '');
  }

  async function saveEdit(id: string) {
    const res = await fetch('/api/admin/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action: 'edit', id, name: editName, stage: editStage }),
    });
    if (res.ok) {
      setEditingId(null);
      loadSubjects(password);
    }
  }

  async function deleteSubject(id: string) {
    const confirmed = window.confirm('حذف المادة يحذف كل الملازم والأسئلة المرتبطة بها نهائيًا. متأكد؟');
    if (!confirmed) return;

    const res = await fetch('/api/admin/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action: 'delete', id }),
    });
    if (res.ok) {
      loadSubjects(password);
    }
  }

  if (!authenticated) {
    return (
      <main className="mx-auto max-w-sm px-6 py-20">
        <h1 className="text-2xl font-black">دخول المشرف</h1>
        <form onSubmit={(e) => { e.preventDefault(); loadPending(password); }} className="mt-6 space-y-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full rounded-lg border border-line bg-white px-4 py-2.5 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
          {loginError && <p className="text-sm text-red-600">{loginError}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-teal px-6 py-3 font-bold text-white hover:bg-teal/90">
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>
      </main>
    );
  }

  const totalPending = data.lectureNotes.length + data.examQuestions.length + data.professorNotes.length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-black">لوحة التحكم</h1>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-extrabold text-teal">إدارة المواد</h2>

        <form onSubmit={handleAddSubject} className="mb-4 flex gap-2 rounded-lg border border-line bg-white/70 p-4">
          <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="اسم المادة" required className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
          <input type="text" value={newSubjectStage} onChange={(e) => setNewSubjectStage(e.target.value)} placeholder="المرحلة (اختياري)" className="w-40 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
          <button type="submit" className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">إضافة</button>
        </form>

        <div className="space-y-2">
          {subjects.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-line bg-white/70 p-3">
              {editingId === s.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                  <input type="text" value={editStage} onChange={(e) => setEditStage(e.target.value)} className="w-32 rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                  <button onClick={() => saveEdit(s.id)} className="rounded-lg bg-teal px-3 py-1.5 text-sm font-bold text-white hover:bg-teal/90">حفظ</button>
                  <button onClick={() => setEditingId(null)} className="rounded-lg border border-line px-3 py-1.5 text-sm">إلغاء</button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-bold">{s.name}</span>
                    <span className="mr-2 text-sm text-ink/50">{s.stage}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(s)} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-ink/5">تعديل</button>
                    <button onClick={() => deleteSubject(s.id)} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">حذف</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-extrabold text-teal">مراجعة المحتوى</h2>
        <p className="mt-1 text-sm text-ink/60">{totalPending} عنصر بانتظار المراجعة</p>

        {totalPending === 0 && <p className="mt-4 text-ink/50">لا يوجد شي بانتظار المراجعة حاليًا 🎉</p>}

        {data.lectureNotes.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 font-bold">الملازم</h3>
            <div className="space-y-3">
              {data.lectureNotes.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-line bg-white/70 p-4">
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <p className="text-sm text-ink/50">{item.subjects?.name}</p>
                    <a href={item.file_path} target="_blank" rel="noopener noreferrer" className="text-sm text-teal underline">عرض الملف</a>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction('lecture_notes', item.id, 'approve')} className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">قبول</button>
                    <button onClick={() => handleAction('lecture_notes', item.id, 'reject')} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">رفض</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.examQuestions.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 font-bold">أسئلة الامتحانات</h3>
            <div className="space-y-3">
              {data.examQuestions.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-line bg-white/70 p-4">
                  <div>
                    <p className="font-bold">{item.question_text}</p>
                    <p className="text-sm text-ink/50">{item.lecture_notes?.title} {item.exam_term && `— ${item.exam_term}`}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction('exam_questions', item.id, 'approve')} className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">قبول</button>
                    <button onClick={() => handleAction('exam_questions', item.id, 'reject')} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">رفض</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.professorNotes.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 font-bold">ملاحظات تركيز الدكاترة</h3>
            <div className="space-y-3">
              {data.professorNotes.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-line bg-white/70 p-4">
                  <div>
                    <p className="font-bold">{item.professor_name}</p>
                    <p className="text-sm text-ink/60">{item.notes_text}</p>
                    <p className="text-sm text-ink/50">{item.subjects?.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction('professor_focus_notes', item.id, 'approve')} className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">قبول</button>
                    <button onClick={() => handleAction('professor_focus_notes', item.id, 'reject')} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">رفض</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}