'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AddProfessorNote() {
  const [subjects, setSubjects] = useState([]);
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

  async function handleSubmit(e) {
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

  return (
    <main style={{ padding: 24, direction: 'rtl', fontFamily: 'sans-serif', maxWidth: 500 }}>
      <h1>أضف ملاحظة عن أسلوب دكتور</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>المادة:</label><br />
          {loadError && <p style={{ color: 'red' }}>خطأ بجلب المواد: {loadError}</p>}
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required style={{ width: '100%', padding: 8 }}>
            <option value="">اختر المادة</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>اسم الدكتور:</label><br />
          <input type="text" value={professorName} onChange={(e) => setProfessorName(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>الملاحظات:</label><br />
          <textarea value={notesText} onChange={(e) => setNotesText(e.target.value)} required rows={5} style={{ width: '100%', padding: 8 }} />
        </div>

        <button type="submit" style={{ padding: '8px 16px' }}>إرسال</button>
      </form>

      {status && <p style={{ marginTop: 16 }}>{status}</p>}
    </main>
  );
}