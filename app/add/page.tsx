'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AddProfessorNote() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadError, setLoadError] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [professorName, setProfessorName] = useState('');
  const [notesText, setNotesText] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function loadSubjects() {
      const { data, error } = await supabase.from('subjects').select('id, name');
      if (error) {
        setLoadError(error.message);
      } else {
        setSubjects(data || []);
      }
    }
    loadSubjects();
  }, []);

  async function handleSubmit(e: any) {
    e.preventDefault();
    const { error } = await supabase.from('professor_focus_notes').insert({
      subject_id: subjectId,
      professor_name: professorName,
      notes_text: notesText,
    });

    if (error) {
      setStatus('صار خطأ: ' + error.message);
    } else {
      setStatus('تم الإرسال بنجاح! راح يظهر بعد موافقة المشرف.');
      setProfessorName('');
      setNotesText('');
      setSubjectId('');
    }
  }

  const isError = status.includes('خطأ');

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <p className="font-mono text-xs uppercase tracking-widest text-teal">مساهمة جديدة</p>
      <h1 className="mt-1 text-3xl font-black">أضف ملاحظة عن أسلوب دكتور</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-xl border border-line bg-white/70 p-8 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-bold text-ink/70">المادة</label>
          {loadError && <p className="mb-2 text-sm text-red-600">خطأ بجلب المواد: {loadError}</p>}
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required className="w-full rounded-lg border border-line bg-white px-4 py-2.5 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20">
            <option value="">اختر المادة</option>
            {subjects.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-ink/70">اسم الدكتور</label>
          <input type="text" value={professorName} onChange={(e) => setProfessorName(e.target.value)} required className="w-full rounded-lg border border-line bg-white px-4 py-2.5 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-ink/70">الملاحظات</label>
          <textarea value={notesText} onChange={(e) => setNotesText(e.target.value)} required rows={5} className="w-full rounded-lg border border-line bg-white px-4 py-2.5 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
        </div>

        <button type="submit" className="w-full rounded-lg bg-teal px-6 py-3 font-bold text-white transition-colors hover:bg-teal/90">
          إرسال
        </button>

        {status && (
          <p className={`rounded-lg px-4 py-3 text-sm ${isError ? 'bg-red-50 text-red-700' : 'bg-amber/15 text-ink'}`}>
            {status}
          </p>
        )}
      </form>
    </main>
  );
}