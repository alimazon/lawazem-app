'use client';

import { useState, useEffect } from 'react';

function generateChannelPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

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

  const [channels, setChannels] = useState<any[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelSubject, setNewChannelSubject] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelLink, setNewChannelLink] = useState('');
  const [newChannelPassword, setNewChannelPassword] = useState('');
  const [copiedNewChannelPassword, setCopiedNewChannelPassword] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelSubject, setEditChannelSubject] = useState('');
  const [editChannelDesc, setEditChannelDesc] = useState('');
  const [editChannelLink, setEditChannelLink] = useState('');
  const [editChannelPassword, setEditChannelPassword] = useState('');
  const [copiedChannelId, setCopiedChannelId] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<any[]>([]);
  const [newAssignmentSubject, setNewAssignmentSubject] = useState('');
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentDesc, setNewAssignmentDesc] = useState('');
  const [newAssignmentDue, setNewAssignmentDue] = useState('');
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [editAssignmentSubject, setEditAssignmentSubject] = useState('');
  const [editAssignmentTitle, setEditAssignmentTitle] = useState('');
  const [editAssignmentDesc, setEditAssignmentDesc] = useState('');
  const [editAssignmentDue, setEditAssignmentDue] = useState('');

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
    await loadChannels(pw);
    await loadAssignments(pw);
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

  async function loadAssignments(pw: string) {
    const res = await fetch('/api/admin/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, action: 'list' }),
    });
    if (res.ok) {
      const json = await res.json();
      setAssignments(json.assignments || []);
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

  async function handleAddChannel(e: any) {
    e.preventDefault();
    const res = await fetch('/api/admin/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        action: 'add',
        name: newChannelName,
        subject_id: newChannelSubject,
        description: newChannelDesc,
        telegram_link: newChannelLink,
        channel_password: newChannelPassword,
      }),
    });
    if (res.ok) {
      setNewChannelName('');
      setNewChannelSubject('');
      setNewChannelDesc('');
      setNewChannelLink('');
      setNewChannelPassword('');
      loadChannels(password);
    }
  }

  function startEditChannel(c: any) {
    setEditingChannelId(c.id);
    setEditChannelName(c.name);
    setEditChannelSubject(c.subject_id);
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
        subject_id: editChannelSubject,
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

  async function handleAddAssignment(e: any) {
    e.preventDefault();
    const res = await fetch('/api/admin/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        action: 'add',
        subject_id: newAssignmentSubject,
        title: newAssignmentTitle,
        description: newAssignmentDesc,
        due_date: newAssignmentDue,
      }),
    });
    if (res.ok) {
      setNewAssignmentSubject('');
      setNewAssignmentTitle('');
      setNewAssignmentDesc('');
      setNewAssignmentDue('');
      loadAssignments(password);
    }
  }

  function startEditAssignment(a: any) {
    setEditingAssignmentId(a.id);
    setEditAssignmentSubject(a.subject_id);
    setEditAssignmentTitle(a.title);
    setEditAssignmentDesc(a.description || '');
    setEditAssignmentDue(a.due_date || '');
  }

  async function saveEditAssignment(id: string) {
    const res = await fetch('/api/admin/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        action: 'edit',
        id,
        subject_id: editAssignmentSubject,
        title: editAssignmentTitle,
        description: editAssignmentDesc,
        due_date: editAssignmentDue,
      }),
    });
    if (res.ok) {
      setEditingAssignmentId(null);
      loadAssignments(password);
    }
  }

  async function deleteAssignment(id: string) {
    const confirmed = window.confirm('حذف الواجب نهائي. متأكد؟');
    if (!confirmed) return;

    const res = await fetch('/api/admin/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action: 'delete', id }),
    });
    if (res.ok) {
      loadAssignments(password);
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
          <input type="text" value={newSubjectStage} onChange={(e) => setNewSubjectStage(e.target.value)} placeholder="المرحلة (اختياري)" className="w-40 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
          <button type="submit" className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">إضافة</button>
        </form>

        <div className="space-y-2">
          {subjects.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-line bg-white/70 p-3">
              {editingId === s.id ? (
                <div className="flex flex-1 flex-wrap items-center gap-2">
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
        <h2 className="mb-3 text-lg font-extrabold text-teal">إدارة القنوات</h2>

        <form onSubmit={handleAddChannel} className="mb-4 space-y-2 rounded-lg border border-line bg-white/70 p-4">
          <div className="flex flex-wrap gap-2">
            <input type="text" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="اسم القناة" required className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
            <select value={newChannelSubject} onChange={(e) => setNewChannelSubject(e.target.value)} required className="w-44 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20">
              <option value="">اختر المادة</option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
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
                    <select value={editChannelSubject} onChange={(e) => setEditChannelSubject(e.target.value)} className="w-44 rounded-lg border border-line bg-white px-3 py-1.5 text-sm">
                      {subjects.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
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
                    <span className="mr-2 text-sm text-ink/50">{c.subjects?.name}</span>
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
        <h2 className="mb-3 text-lg font-extrabold text-teal">إدارة الواجبات</h2>

        <form onSubmit={handleAddAssignment} className="mb-4 space-y-2 rounded-lg border border-line bg-white/70 p-4">
          <div className="flex flex-wrap gap-2">
            <select value={newAssignmentSubject} onChange={(e) => setNewAssignmentSubject(e.target.value)} required className="w-44 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20">
              <option value="">اختر المادة</option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input type="text" value={newAssignmentTitle} onChange={(e) => setNewAssignmentTitle(e.target.value)} placeholder="عنوان الواجب" required className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
            <input type="date" value={newAssignmentDue} onChange={(e) => setNewAssignmentDue(e.target.value)} className="w-40 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
          </div>
          <input type="text" value={newAssignmentDesc} onChange={(e) => setNewAssignmentDesc(e.target.value)} placeholder="تفاصيل إضافية (اختياري)" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
          <button type="submit" className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">إضافة واجب</button>
        </form>

        <div className="space-y-2">
          {assignments.map((a: any) => (
            <div key={a.id} className="rounded-lg border border-line bg-white/70 p-3">
              {editingAssignmentId === a.id ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <select value={editAssignmentSubject} onChange={(e) => setEditAssignmentSubject(e.target.value)} className="w-44 rounded-lg border border-line bg-white px-3 py-1.5 text-sm">
                      {subjects.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <input type="text" value={editAssignmentTitle} onChange={(e) => setEditAssignmentTitle(e.target.value)} className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                    <input type="date" value={editAssignmentDue} onChange={(e) => setEditAssignmentDue(e.target.value)} className="w-40 rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                  </div>
                  <input type="text" value={editAssignmentDesc} onChange={(e) => setEditAssignmentDesc(e.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => saveEditAssignment(a.id)} className="rounded-lg bg-teal px-3 py-1.5 text-sm font-bold text-white hover:bg-teal/90">حفظ</button>
                    <button onClick={() => setEditingAssignmentId(null)} className="rounded-lg border border-line px-3 py-1.5 text-sm">إلغاء</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold">{a.title}</span>
                    <span className="mr-2 text-sm text-ink/50">{a.subjects?.name}</span>
                    {a.due_date && <span className="mr-2 text-sm text-amber">تاريخ التسليم: {a.due_date}</span>}
                    {a.description && <p className="text-sm text-ink/60">{a.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEditAssignment(a)} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-ink/5">تعديل</button>
                    <button onClick={() => deleteAssignment(a.id)} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">حذف</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}