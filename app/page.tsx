'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from('subjects')
        .select('*, lecture_notes(*, exam_questions(*)), professor_focus_notes(*)');
      if (error) {
        setError(error.message);
      } else {
        setSubjects(data || []);
      }
    }
    loadData();
  }, []);

  if (error) {
    return (
      <main style={{ padding: 24, direction: 'rtl', fontFamily: 'sans-serif' }}>
        <h1>خطأ في الاتصال بقاعدة البيانات</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, direction: 'rtl', fontFamily: 'sans-serif' }}>
      <h1>اختبار الاتصال — منصة الملازم</h1>

      <input
        type="text"
        placeholder="ابحث باسم الملزمة..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: '100%', maxWidth: 400, padding: 8, marginBottom: 24 }}
      />

      {subjects.map((s) => {
        const filteredNotes = s.lecture_notes.filter((note) =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
          <div key={s.id} style={{ marginBottom: 32 }}>
            <h2>{s.name} — {s.stage}</h2>

            <h3 style={{ fontSize: 16 }}>الملازم</h3>
            {filteredNotes.length === 0 ? (
              <p style={{ color: '#888' }}>لا توجد ملازم مطابقة.</p>
            ) : (
              <ul>
                {filteredNotes.map((note) => (
                  <li key={note.id} style={{ marginBottom: 12 }}>
                    <a href={note.file_path} target="_blank" rel="noopener noreferrer">
                      {note.title}
                    </a>
                    {note.exam_questions.length > 0 && (
                      <ul>
                        {note.exam_questions.map((q) => (
                          <li key={q.id} style={{ color: '#aaa', fontSize: 14 }}>
                            {q.question_text} {q.exam_term && `(${q.exam_term})`}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <h3 style={{ fontSize: 16 }}>ملاحظات تركيز الدكاترة</h3>
            {s.professor_focus_notes.length === 0 ? (
              <p style={{ color: '#888' }}>لا توجد ملاحظات معتمدة بعد.</p>
            ) : (
              <ul>
                {s.professor_focus_notes.map((n) => (
                  <li key={n.id}><strong>{n.professor_name}:</strong> {n.notes_text}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </main>
  );
}