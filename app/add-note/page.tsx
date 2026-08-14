'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AddLectureNote() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadError, setLoadError] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
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

  async function handleSubmit(e: any) {
    e.preventDefault();

    if (!file) {
      setStatus('الرجاء اختيار ملف PDF.');
      return;
    }

    setUploading(true);
    setStatus('جاري الرفع...');

    const fileName = `${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage.from('lecture-files').upload(fileName, file);

    if (uploadError) {
      setStatus('فشل رفع الملف: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('lecture-files').getPublicUrl(fileName);

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

  const isError = status.includes('فشل') || status.includes('الرجاء');

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="font-mono text-xs uppercase tracking-widest text-teal">مساهمة جديدة</p>
      <h1 className="mt-1 text-3xl font-black">أضف ملزمة</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-xl border border-line bg-white/70 p-6 shadow-sm sm:p-8">
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
          <label className="mb-1.5 block text-sm font-bold text-ink/70">عنوان الملزمة</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-lg border border-line bg-white px-4 py-2.5 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-ink/70">ملف PDF</label>
          <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} required className="w-full text-sm text-ink/70 file:mr-3 file:rounded-lg file:border-0 file:bg-teal file:px-4 file:py-2 file:font-bold file:text-white hover:file:bg-teal/90" />
        </div>

        <button type="submit" disabled={uploading} className="w-full rounded-lg bg-teal px-6 py-3 font-bold text-white transition-colors hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-50">
          {uploading ? 'جاري الرفع...' : 'إرسال'}
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