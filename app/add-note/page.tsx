'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AddLectureNote() {
  const [subjects, setSubjects] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);

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

    if (!file) {
      setStatus('الرجاء اختيار ملف PDF.');
      return;
    }

    setUploading(true);
    setStatus('جاري الرفع...');

    const fileName = `${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('lecture-files')
      .upload(fileName, file);

    if (uploadError) {
      setStatus('فشل رفع الملف: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('lecture-files')
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase.from('lecture_notes').insert({
      subject_id: subjectId,
      title: title,
      file_path: urlData.publicUrl,
    });

    setUploading(false);

    if (insertError) {
      setStatus('فشل حفظ البيانات: ' + insertError.message);
    } else {
      setStatus('تم الإرسال بنجاح! راح تظهر بعد موافقة المشرف.');
      setTitle('');
      setFile(null);
      setSubjectId('');
    }
  }

  return (
    <main style={{ padding: 24, direction: 'rtl', fontFamily: 'sans-serif', maxWidth: 500 }}>
      <h1>أضف ملزمة جديدة</h1>

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
          <label>عنوان الملزمة:</label><br />
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>ملف PDF:</label><br />
          <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} required />
        </div>

        <button type="submit" disabled={uploading} style={{ padding: '8px 16px' }}>
          {uploading ? 'جاري الرفع...' : 'إرسال'}
        </button>
      </form>

      {status && <p style={{ marginTop: 16 }}>{status}</p>}
    </main>
  );
}