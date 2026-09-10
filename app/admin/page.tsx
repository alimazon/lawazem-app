'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

function generateChannelPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

const STAGES = ['المرحلة الأولى', 'المرحلة الثانية', 'المرحلة الثالثة'];

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectStage, setNewSubjectStage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStage, setEditStage] = useState('');

  const [materials, setMaterials] = useState<any[]>([]);
  const [newMaterialSubject, setNewMaterialSubject] = useState('');
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialProfessor, setNewMaterialProfessor] = useState('');
  const [newMaterialLectureNum, setNewMaterialLectureNum] = useState('');
  const [newMaterialLink, setNewMaterialLink] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editMaterialSubject, setEditMaterialSubject] = useState('');
  const [editMaterialTitle, setEditMaterialTitle] = useState('');
  const [editMaterialProfessor, setEditMaterialProfessor] = useState('');
  const [editMaterialLectureNum, setEditMaterialLectureNum] = useState('');
  const [editMaterialLink, setEditMaterialLink] = useState('');

  const [channels, setChannels] = useState<any[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelStage, setNewChannelStage] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelLink, setNewChannelLink] = useState('');
  const [newChannelPassword, setNewChannelPassword] = useState('');
  const [copiedNewChannelPassword, setCopiedNewChannelPassword] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelStage, setEditChannelStage] = useState('');
  const [editChannelDesc, setEditChannelDesc] = useState('');
  const [editChannelLink, setEditChannelLink] = useState('');
  const [editChannelPassword, setEditChannelPassword] = useState('');
  const [copiedChannelId, setCopiedChannelId] = useState<string | null>(null);

  const [schedules, setSchedules] = useState<any[]>([]);
  const [uploadingScheduleStage, setUploadingScheduleStage] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_password');
    if (saved) {
      setPassword(saved);
      handleLogin(saved);
    }
  }, []);

  async function handleLogin(pw: string) {
    setLoading(true);
    setLoginError('');
    const res = await fetch('/api/admin/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, action: 'list' }),
    });

    if (!res.ok) {
      setLoading(false);
      setLoginError('كلمة المرور غير صحيحة');
      sessionStorage.removeItem('admin_password');
      return;
    }

    sessionStorage.setItem('admin_password', pw);
    const json = await res.json();
    setSubjects(json.subjects || []);
    setAuthenticated(true);
    await loadMaterials(pw);
    await loadChannels(pw);
    await loadSchedules(pw);
    setLoading(false);
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_password');
    setPassword('');
    setAuthenticated(false);
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

  async function loadMaterials(pw: string) {
    const res = await fetch('/api/admin/lecture-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, action: 'list' }),
    });
    if (res.ok) {
      const json = await res.json();
      setMaterials(json.materials || []);
    }
  }

  async function loadChannels(pw: string) {
    const res = await fetch('/api/admin/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, action: 'list' }),
    });
    if (res.ok) {
      const json = await res.json();
      setChannels(json.channels || []);
    }
  }

  async function loadSchedules(pw: string) {
    const res = await fetch('/api/admin/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, action: 'list' }),
    });
    if (res.ok) {
      const json = await res.json();
      setSchedules(json.schedules || []);
    }
  }

  async function handleScheduleUpload(stage: string, file: File) {
    setUploadingScheduleStage(stage);

    const safeStage = stage.replace(/\s/g, '-');
    const fileExt = file.name.split('.').pop();
    const filePath = `${safeStage}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('schedule-images').upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploadingScheduleStage(null);
      alert('فشل رفع الصورة: ' + uploadError.message);
      return;
    }

    const { data } = supabase.storage.from('schedule-images').getPublicUrl(filePath);

    const res = await fetch('/api/admin/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action: 'update', stage, image_url: data.publicUrl }),
    });

    if (res.ok) {
      await loadSchedules(password);
    }
    setUploadingScheduleStage(null);
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

  async function handleAddMaterial(e: any) {
    e.preventDefault();
    const res = await fetch('/api/admin/lecture-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        action: 'add',
        subject_id: newMaterialSubject,
        title: newMaterialTitle,
        professor_name: newMaterialProfessor,
        lecture_number: newMaterialLectureNum ? Number(newMaterialLectureNum) : null,
        file_path: newMaterialLink,
      }),
    });
    if (res.ok) {
      setNewMaterialSubject('');
      setNewMaterialTitle('');
      setNewMaterialProfessor('');
      setNewMaterialLectureNum('');
      setNewMaterialLink('');
      loadMaterials(password);
    }
  }

  function startEditMaterial(m: any) {
    setEditingMaterialId(m.id);
    setEditMaterialSubject(m.subject_id);
    setEditMaterialTitle(m.title);
    setEditMaterialProfessor(m.professor_name || '');
    setEditMaterialLectureNum(m.lecture_number ? String(m.lecture_number) : '');
    setEditMaterialLink(m.file_path);
  }

  async function saveEditMaterial(id: string) {
    const res = await fetch('/api/admin/lecture-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        action: 'edit',
        id,
        subject_id: editMaterialSubject,
        title: editMaterialTitle,
        professor_name: editMaterialProfessor,
        lecture_number: editMaterialLectureNum ? Number(editMaterialLectureNum) : null,
        file_path: editMaterialLink,
      }),
    });
    if (res.ok) {
      setEditingMaterialId(null);
      loadMaterials(password);
    }
  }

  async function deleteMaterial(id: string) {
    const confirmed = window.confirm('حذف الملزمة نهائي. متأكد؟');
    if (!confirmed) return;

    const res = await fetch('/api/admin/lecture-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action: 'delete', id }),
    });
    if (res.ok) {
      loadMaterials(password);
    }
  }

  async function handleAddChannel(e: any) {
    e.preventDefault();
    const res = await fetch('/api/admin/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        action: 'add',
        name: newChannelName,
        stage: newChannelStage,
        description: newChannelDesc,
        telegram_link: newChannelLink,
        channel_password: newChannelPassword,
      }),
    });
    if (res.ok) {
      setNewChannelName('');
      setNewChannelStage('');
      setNewChannelDesc('');
      setNewChannelLink('');
      setNewChannelPassword('');
      loadChannels(password);
    }
  }

  function startEditChannel(c: any) {
    setEditingChannelId(c.id);
    setEditChannelName(c.name);
    setEditChannelStage(c.stage);
    setEditChannelDesc(c.description || '');
    setEditChannelLink(c.telegram_link);
    setEditChannelPassword(c.channel_password || '');
  }

  async function saveEditChannel(id: string) {
    const res = await fetch('/api/admin/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        action: 'edit',
        id,
        name: editChannelName,
        stage: editChannelStage,
        description: editChannelDesc,
        telegram_link: editChannelLink,
        channel_password: editChannelPassword,
      }),
    });
    if (res.ok) {
      setEditingChannelId(null);
      loadChannels(password);
    }
  }

  async function deleteChannel(id: string) {
    const confirmed = window.confirm('حذف القناة نهائي. متأكد؟');
    if (!confirmed) return;

    const res = await fetch('/api/admin/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action: 'delete', id }),
    });
    if (res.ok) {
      loadChannels(password);
    }
  }

  if (!authenticated) {
    return (
      <main className="mx-auto max-w-sm px-6 py-20">
        <h1 className="text-2xl font-black">دخول المشرف</h1>
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(password); }} className="mt-6 space-y-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full rounded-lg border border-line bg-white px-4 py-2.5 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
          {loginError && <p className="text-sm text-red-600">{loginError}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-teal px-6 py-3 font-bold text-white hover:bg-teal/90">
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">لوحة التحكم</h1>
        <button onClick={handleLogout} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-ink/5">تسجيل خروج</button>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-extrabold text-teal">إدارة المواد</h2>

        <form onSubmit={handleAddSubject} className="mb-4 flex flex-wrap gap-2 rounded-lg border border-line bg-white/70 p-4">
          <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="اسم المادة" required className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
          <select value={newSubjectStage} onChange={(e) => setNewSubjectStage(e.target.value)} required className="w-44 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20">
            <option value="">اختر المرحلة</option>
            {STAGES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">إضافة</button>
        </form>

        <div className="space-y-2">
          {subjects.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-line bg-white/70 p-3">
              {editingId === s.id ? (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                  <select value={editStage} onChange={(e) => setEditStage(e.target.value)} className="w-44 rounded-lg border border-line bg-white px-3 py-1.5 text-sm">
                    {STAGES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
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
        <h2 className="mb-3 text-lg font-extrabold text-teal">ملازم الدكاترة</h2>

        <form onSubmit={handleAddMaterial} className="mb-4 space-y-2 rounded-lg border border-line bg-white/70 p-4">
          <div className="flex flex-wrap gap-2">
            <select value={newMaterialSubject} onChange={(e) => setNewMaterialSubject(e.target.value)} required className="w-44 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20">
              <option value="">اختر المادة</option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input type="text" value={newMaterialTitle} onChange={(e) => setNewMaterialTitle(e.target.value)} placeholder="اسم الملزمة/المحاضرة" required className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
          </div>
          <div className="flex flex-wrap gap-2">
            <input type="text" value={newMaterialProfessor} onChange={(e) => setNewMaterialProfessor(e.target.value)} placeholder="اسم الدكتور (اختياري)" className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
            <input type="number" value={newMaterialLectureNum} onChange={(e) => setNewMaterialLectureNum(e.target.value)} placeholder="رقم المحاضرة" className="w-32 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
          </div>
          <input type="text" value={newMaterialLink} onChange={(e) => setNewMaterialLink(e.target.value)} placeholder="رابط الملف (من Supabase Storage)" required className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
          <button type="submit" className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">إضافة ملزمة</button>
        </form>

        <div className="space-y-2">
          {materials.map((m: any) => (
            <div key={m.id} className="rounded-lg border border-line bg-white/70 p-3">
              {editingMaterialId === m.id ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <select value={editMaterialSubject} onChange={(e) => setEditMaterialSubject(e.target.value)} className="w-44 rounded-lg border border-line bg-white px-3 py-1.5 text-sm">
                      {subjects.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <input type="text" value={editMaterialTitle} onChange={(e) => setEditMaterialTitle(e.target.value)} className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input type="text" value={editMaterialProfessor} onChange={(e) => setEditMaterialProfessor(e.target.value)} className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                    <input type="number" value={editMaterialLectureNum} onChange={(e) => setEditMaterialLectureNum(e.target.value)} className="w-32 rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                  </div>
                  <input type="text" value={editMaterialLink} onChange={(e) => setEditMaterialLink(e.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => saveEditMaterial(m.id)} className="rounded-lg bg-teal px-3 py-1.5 text-sm font-bold text-white hover:bg-teal/90">حفظ</button>
                    <button onClick={() => setEditingMaterialId(null)} className="rounded-lg border border-line px-3 py-1.5 text-sm">إلغاء</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold">{m.title}</span>
                    <span className="mr-2 text-sm text-ink/50">{m.subjects?.name}</span>
                    <p className="text-sm text-ink/60">
                      {m.professor_name && `د. ${m.professor_name}`}
                      {m.professor_name && m.lecture_number ? ' • ' : ''}
                      {m.lecture_number && `محاضرة ${m.lecture_number}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEditMaterial(m)} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-ink/5">تعديل</button>
                    <button onClick={() => deleteMaterial(m.id)} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">حذف</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-extrabold text-teal">إدارة القنوات</h2>

        <form onSubmit={handleAddChannel} className="mb-4 space-y-2 rounded-lg border border-line bg-white/70 p-4">
          <div className="flex flex-wrap gap-2">
            <input type="text" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="اسم القناة" required className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
            <select value={newChannelStage} onChange={(e) => setNewChannelStage(e.target.value)} required className="w-44 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20">
              <option value="">اختر المرحلة</option>
              {STAGES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          <input type="text" value={newChannelDesc} onChange={(e) => setNewChannelDesc(e.target.value)} placeholder="وصف قصير (اختياري)" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
          <input type="text" value={newChannelLink} onChange={(e) => setNewChannelLink(e.target.value)} placeholder="رابط تليجرام (مثل https://t.me/channelname)" required className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
          <div className="flex flex-wrap gap-2">
            <input type="text" value={newChannelPassword} onChange={(e) => setNewChannelPassword(e.target.value)} placeholder="كلمة مرور القناة" className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
            <button type="button" onClick={() => setNewChannelPassword(generateChannelPassword())} className="rounded-lg border border-teal px-3 py-2 text-sm font-bold text-teal hover:bg-teal/5">توليد</button>
            {newChannelPassword && (
              <button type="button" onClick={() => { navigator.clipboard.writeText(newChannelPassword); setCopiedNewChannelPassword(true); setTimeout(() => setCopiedNewChannelPassword(false), 1500); }} className="rounded-lg border border-line px-3 py-2 text-sm hover:bg-ink/5">
                {copiedNewChannelPassword ? 'تم النسخ!' : 'نسخ'}
              </button>
            )}
          </div>
          <button type="submit" className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">إضافة قناة</button>
        </form>

        <div className="space-y-2">
          {channels.map((c: any) => (
            <div key={c.id} className="rounded-lg border border-line bg-white/70 p-3">
              {editingChannelId === c.id ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <input type="text" value={editChannelName} onChange={(e) => setEditChannelName(e.target.value)} className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                    <select value={editChannelStage} onChange={(e) => setEditChannelStage(e.target.value)} className="w-44 rounded-lg border border-line bg-white px-3 py-1.5 text-sm">
                      {STAGES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <input type="text" value={editChannelDesc} onChange={(e) => setEditChannelDesc(e.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                  <input type="text" value={editChannelLink} onChange={(e) => setEditChannelLink(e.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                  <div className="flex flex-wrap gap-2">
                    <input type="text" value={editChannelPassword} onChange={(e) => setEditChannelPassword(e.target.value)} placeholder="كلمة مرور القناة" className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                    <button type="button" onClick={() => setEditChannelPassword(generateChannelPassword())} className="rounded-lg border border-teal px-3 py-1.5 text-sm font-bold text-teal hover:bg-teal/5">توليد</button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEditChannel(c.id)} className="rounded-lg bg-teal px-3 py-1.5 text-sm font-bold text-white hover:bg-teal/90">حفظ</button>
                    <button onClick={() => setEditingChannelId(null)} className="rounded-lg border border-line px-3 py-1.5 text-sm">إلغاء</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold">{c.name}</span>
                    <span className="mr-2 text-sm text-ink/50">{c.stage}</span>
                    {c.description && <p className="text-sm text-ink/60">{c.description}</p>}
                    <a href={c.telegram_link} target="_blank" rel="noopener noreferrer" className="text-sm text-teal underline">{c.telegram_link}</a>
                    <p className="flex flex-wrap items-center gap-2 text-sm text-ink/50">
                      كلمة مرور القناة: {c.channel_password || 'غير محددة'}
                      {c.channel_password && (
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(c.channel_password); setCopiedChannelId(c.id); setTimeout(() => setCopiedChannelId(null), 1500); }}
                          className="rounded border border-line px-2 py-0.5 text-xs hover:bg-ink/5"
                        >
                          {copiedChannelId === c.id ? 'تم النسخ!' : 'نسخ'}
                        </button>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEditChannel(c)} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-ink/5">تعديل</button>
                    <button onClick={() => deleteChannel(c.id)} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">حذف</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-extrabold text-teal">الجدول</h2>
        <p className="mb-3 text-sm text-ink/50">ارفع صورة جدول المحاضرات لكل مرحلة، تظهر للطلاب مباشرة بصفحة "الجدول".</p>

        <div className="space-y-4">
          {STAGES.map((st) => {
            const sched = schedules.find((s: any) => s.stage === st);
            return (
              <div key={st} className="rounded-lg border border-line bg-white/70 p-4">
                <h3 className="mb-2 font-bold">{st}</h3>
                {sched?.image_url && (
                  <img src={sched.image_url} alt={`جدول ${st}`} className="mb-3 max-h-48 rounded-lg border border-line object-contain" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScheduleUpload(st, file);
                  }}
                  className="w-full text-sm"
                />
                {uploadingScheduleStage === st && <p className="mt-1 text-sm text-ink/50">جاري الرفع...</p>}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}