
## AGENTS.md

```
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

```

## app\admin\page.tsx

```
'use client';

import { useState } from 'react';

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
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelSubject, setEditChannelSubject] = useState('');
  const [editChannelDesc, setEditChannelDesc] = useState('');
  const [editChannelLink, setEditChannelLink] = useState('');
  const [editChannelPassword, setEditChannelPassword] = useState('');

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
      return;
    }

    const json = await res.json();
    setSubjects(json.subjects || []);
    setAuthenticated(true);
    await loadChannels(pw);
    await loadAssignments(pw);
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
      <h1 className="text-3xl font-black">لوحة التحكم</h1>

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
          <input type="text" value={newChannelPassword} onChange={(e) => setNewChannelPassword(e.target.value)} placeholder="كلمة مرور القناة (تعطيها لصاحب القناة يدويًا)" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
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
                  <input type="text" value={editChannelPassword} onChange={(e) => setEditChannelPassword(e.target.value)} placeholder="كلمة مرور القناة" className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
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
                    <p className="text-sm text-ink/50">كلمة مرور القناة: {c.channel_password || 'غير محددة'}</p>
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
```

## app\api\admin\assignments\route.ts

```
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(request: Request) {
  const body = await request.json();
  const { password, action } = body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  if (action === 'list') {
    const { data, error } = await supabaseAdmin.from('assignments').select('*, subjects(name)').order('due_date', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assignments: data });
  }

  if (action === 'add') {
    const { subject_id, title, description, due_date } = body;
    const { error } = await supabaseAdmin.from('assignments').insert({ subject_id, title, description, due_date: due_date || null });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'edit') {
    const { id, subject_id, title, description, due_date } = body;
    const { error } = await supabaseAdmin.from('assignments').update({ subject_id, title, description, due_date: due_date || null }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'delete') {
    const { id } = body;
    const { error } = await supabaseAdmin.from('assignments').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
}
```

## app\api\admin\channels\route.ts

```
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(request: Request) {
  const body = await request.json();
  const { password, action } = body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  if (action === 'list') {
    const { data, error } = await supabaseAdmin.from('channels').select('*, subjects(name)').order('created_at');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ channels: data });
  }

  if (action === 'add') {
    const { name, subject_id, description, telegram_link, channel_password } = body;
    const { error } = await supabaseAdmin.from('channels').insert({ name, subject_id, description, telegram_link, channel_password: channel_password || null });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'edit') {
    const { id, name, subject_id, description, telegram_link, channel_password } = body;
    const { error } = await supabaseAdmin.from('channels').update({ name, subject_id, description, telegram_link, channel_password: channel_password || null }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'delete') {
    const { id } = body;
    const { error } = await supabaseAdmin.from('channels').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
}
```

## app\api\admin\subjects\route.ts

```
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(request: Request) {
  const body = await request.json();
  const { password, action } = body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  if (action === 'list') {
    const { data, error } = await supabaseAdmin.from('subjects').select('*').order('created_at');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ subjects: data });
  }

  if (action === 'add') {
    const { name, stage } = body;
    const { error } = await supabaseAdmin.from('subjects').insert({ name, stage });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'edit') {
    const { id, name, stage } = body;
    const { error } = await supabaseAdmin.from('subjects').update({ name, stage }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'delete') {
    const { id } = body;
    const { error } = await supabaseAdmin.from('subjects').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
}
```

## app\api\channel\assignments\route.ts

```
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

async function verifyChannel(supabaseAdmin: any, channel_id: string, password: string) {
  const { data, error } = await supabaseAdmin.from('channels').select('*').eq('id', channel_id).single();
  if (error || !data) return null;
  if (!data.channel_password || data.channel_password !== password) return null;
  return data;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, channel_id, password } = body;

  const supabaseAdmin = getSupabaseAdmin();

  const channel = await verifyChannel(supabaseAdmin, channel_id, password);
  if (!channel) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
  }

  if (action === 'login') {
    return NextResponse.json({ channel: { id: channel.id, name: channel.name, subject_id: channel.subject_id, description: channel.description, telegram_link: channel.telegram_link } });
  }

  if (action === 'list') {
    const { data, error } = await supabaseAdmin.from('assignments').select('*').eq('channel_id', channel_id).order('due_date', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assignments: data });
  }

  if (action === 'add') {
    const { title, description, due_date } = body;
    const { error } = await supabaseAdmin.from('assignments').insert({
      subject_id: channel.subject_id,
      channel_id: channel.id,
      title,
      description,
      due_date: due_date || null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'edit') {
    const { id, title, description, due_date } = body;
    const { data: existing } = await supabaseAdmin.from('assignments').select('channel_id').eq('id', id).single();
    if (!existing || existing.channel_id !== channel.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    const { error } = await supabaseAdmin.from('assignments').update({ title, description, due_date: due_date || null }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'delete') {
    const { id } = body;
    const { data: existing } = await supabaseAdmin.from('assignments').select('channel_id').eq('id', id).single();
    if (!existing || existing.channel_id !== channel.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    const { error } = await supabaseAdmin.from('assignments').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'update_channel') {
    const { name, description, telegram_link } = body;
    const { error } = await supabaseAdmin.from('channels').update({ name, description, telegram_link }).eq('id', channel.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'change_password') {
    const { new_password } = body;
    if (!new_password || new_password.length < 4) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة قصيرة جدًا' }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from('channels').update({ channel_password: new_password }).eq('id', channel.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
}
```

## app\channel-portal\page.tsx

```
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ChannelPortalPage() {
  const [channelsList, setChannelsList] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [authenticated, setAuthenticated] = useState(false);
  const [channelInfo, setChannelInfo] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'assignments' | 'settings'>('assignments');

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDue, setNewDue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDue, setEditDue] = useState('');

  const [settingsName, setSettingsName] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [settingsLink, setSettingsLink] = useState('');
  const [settingsStatus, setSettingsStatus] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');

  useEffect(() => {
    async function loadChannels() {
      const { data } = await supabase.from('channels').select('id, name').order('name');
      setChannelsList(data || []);
    }
    loadChannels();
  }, []);

  async function handleLogin(e: any) {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    const res = await fetch('/api/channel/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', channel_id: selectedChannelId, password }),
    });

    if (!res.ok) {
      setLoading(false);
      setLoginError('كلمة المرور غير صحيحة');
      return;
    }

    const json = await res.json();
    setChannelInfo(json.channel);
    setSettingsName(json.channel.name);
    setSettingsDesc(json.channel.description || '');
    setSettingsLink(json.channel.telegram_link || '');
    setAuthenticated(true);
    await loadAssignments();
    setLoading(false);
  }

  async function loadAssignments() {
    const res = await fetch('/api/channel/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list', channel_id: selectedChannelId, password }),
    });
    if (res.ok) {
      const json = await res.json();
      setAssignments(json.assignments || []);
    }
  }

  async function handleAdd(e: any) {
    e.preventDefault();
    const res = await fetch('/api/channel/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', channel_id: selectedChannelId, password, title: newTitle, description: newDesc, due_date: newDue }),
    });
    if (res.ok) {
      setNewTitle('');
      setNewDesc('');
      setNewDue('');
      loadAssignments();
    }
  }

  function startEdit(a: any) {
    setEditingId(a.id);
    setEditTitle(a.title);
    setEditDesc(a.description || '');
    setEditDue(a.due_date || '');
  }

  async function saveEdit(id: string) {
    const res = await fetch('/api/channel/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'edit', channel_id: selectedChannelId, password, id, title: editTitle, description: editDesc, due_date: editDue }),
    });
    if (res.ok) {
      setEditingId(null);
      loadAssignments();
    }
  }

  async function deleteAssignment(id: string) {
    const confirmed = window.confirm('حذف الواجب نهائي. متأكد؟');
    if (!confirmed) return;

    const res = await fetch('/api/channel/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', channel_id: selectedChannelId, password, id }),
    });
    if (res.ok) {
      loadAssignments();
    }
  }

  async function handleUpdateChannel(e: any) {
    e.preventDefault();
    setSettingsStatus('');
    const res = await fetch('/api/channel/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_channel', channel_id: selectedChannelId, password, name: settingsName, description: settingsDesc, telegram_link: settingsLink }),
    });
    if (res.ok) {
      setSettingsStatus('تم الحفظ بنجاح.');
    } else {
      const json = await res.json();
      setSettingsStatus('صار خطأ: ' + json.error);
    }
  }

  async function handleChangePassword(e: any) {
    e.preventDefault();
    setPasswordStatus('');

    if (newPassword !== confirmNewPassword) {
      setPasswordStatus('كلمتا المرور غير متطابقتين.');
      return;
    }

    const res = await fetch('/api/channel/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change_password', channel_id: selectedChannelId, password, new_password: newPassword }),
    });

    if (res.ok) {
      setPasswordStatus('تم تغيير كلمة المرور بنجاح. استخدمها بالمرة الجاية.');
      setPassword(newPassword);
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      const json = await res.json();
      setPasswordStatus('صار خطأ: ' + json.error);
    }
  }

  if (!authenticated) {
    return (
      <main className="mx-auto max-w-sm px-6 py-20">
        <h1 className="text-2xl font-black">دخول صاحب القناة</h1>
        <p className="mt-2 text-sm text-ink/60">اختر قناتك وأدخل كلمة المرور اللي أعطاك ياها المشرف.</p>
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <select value={selectedChannelId} onChange={(e) => setSelectedChannelId(e.target.value)} required className="w-full rounded-lg border border-line bg-white px-4 py-2.5 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20">
            <option value="">اختر قناتك</option>
            {channelsList.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة مرور القناة" required className="w-full rounded-lg border border-line bg-white px-4 py-2.5 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
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
      <h1 className="text-3xl font-black">قناة: {channelInfo?.name}</h1>

      <div className="mt-6 flex gap-2 border-b border-line">
        <button onClick={() => setActiveTab('assignments')} className={`px-4 py-2 text-sm font-bold ${activeTab === 'assignments' ? 'border-b-2 border-teal text-teal' : 'text-ink/50'}`}>الواجبات</button>
        <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 text-sm font-bold ${activeTab === 'settings' ? 'border-b-2 border-teal text-teal' : 'text-ink/50'}`}>إعدادات القناة</button>
      </div>

      {activeTab === 'assignments' && (
        <section className="mt-6">
          <p className="mb-4 text-sm text-ink/60">أضف واجبات أو مهام أو مواعيد لطلابك، وتظهر تلقائيًا بصفحة الموقع.</p>

          <form onSubmit={handleAdd} className="mb-6 space-y-2 rounded-lg border border-line bg-white/70 p-4">
            <div className="flex flex-wrap gap-2">
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="العنوان (مثل: حل أسئلة الفصل الثالث)" required className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
              <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} className="w-40 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
            </div>
            <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="تفاصيل إضافية (اختياري)" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
            <button type="submit" className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">إضافة</button>
          </form>

          <div className="space-y-2">
            {assignments.length === 0 && <p className="text-ink/50">ما أضفت شي لسا.</p>}
            {assignments.map((a: any) => (
              <div key={a.id} className="rounded-lg border border-line bg-white/70 p-3">
                {editingId === a.id ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                      <input type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)} className="w-40 rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                    </div>
                    <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(a.id)} className="rounded-lg bg-teal px-3 py-1.5 text-sm font-bold text-white hover:bg-teal/90">حفظ</button>
                      <button onClick={() => setEditingId(null)} className="rounded-lg border border-line px-3 py-1.5 text-sm">إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold">{a.title}</span>
                      {a.due_date && <span className="mr-2 text-sm text-amber">تاريخ التسليم: {a.due_date}</span>}
                      {a.description && <p className="text-sm text-ink/60">{a.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(a)} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-ink/5">تعديل</button>
                      <button onClick={() => deleteAssignment(a.id)} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">حذف</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'settings' && (
        <section className="mt-6 max-w-md space-y-8">
          <div>
            <h2 className="mb-3 text-lg font-extrabold">بيانات القناة</h2>
            <form onSubmit={handleUpdateChannel} className="space-y-3 rounded-lg border border-line bg-white/70 p-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-ink/70">اسم القناة</label>
                <input type="text" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} required className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-ink/70">الوصف</label>
                <input type="text" value={settingsDesc} onChange={(e) => setSettingsDesc(e.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-ink/70">رابط تليجرام</label>
                <input type="text" value={settingsLink} onChange={(e) => setSettingsLink(e.target.value)} required className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
              </div>
              <button type="submit" className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">حفظ التغييرات</button>
              {settingsStatus && <p className="text-sm text-ink/70">{settingsStatus}</p>}
            </form>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-extrabold">تغيير كلمة المرور</h2>
            <form onSubmit={handleChangePassword} className="space-y-3 rounded-lg border border-line bg-white/70 p-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-ink/70">كلمة المرور الجديدة</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-ink/70">تأكيد كلمة المرور</label>
                <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
              </div>
              <button type="submit" className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">تغيير كلمة المرور</button>
              {passwordStatus && <p className="text-sm text-ink/70">{passwordStatus}</p>}
            </form>
          </div>
          </section>
      )}
    </main>
  );
}
```

## app\channels\page.tsx

```
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

function getDueInfo(dueDateStr: string) {
  const due = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return { text: 'انتهى الموعد', className: 'bg-ink/10 text-ink/50' };
  }
  if (diffDays <= 3) {
    return { text: `تسليم: ${dueDateStr} (قريب!)`, className: 'bg-red-100 text-red-700' };
  }
  return { text: `تسليم: ${dueDateStr}`, className: 'bg-amber/20 text-ink' };
}

export default function ChannelsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const subjectsRes = await supabase.from('subjects').select('*, channels(id, name, description, telegram_link)');
      const assignmentsRes = await supabase.from('assignments').select('*');

      if (subjectsRes.error) {
        setError(subjectsRes.error.message);
      } else if (assignmentsRes.error) {
        setError(assignmentsRes.error.message);
      } else {
        const allAssignments = assignmentsRes.data || [];
        setAssignments(allAssignments);
        setSubjects((subjectsRes.data || []).filter((s: any) => s.channels.length > 0 || allAssignments.some((a: any) => a.subject_id === s.id)));
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-ink/50">جاري التحميل...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-extrabold">خطأ في الاتصال بقاعدة البيانات</h1>
        <p className="mt-2 text-ink/70">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="font-mono text-xs uppercase tracking-widest text-teal">استكشف حسب المادة</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">قنوات الدراسة</h1>

      {subjects.length === 0 && <p className="mt-8 text-ink/60">لا توجد قنوات مضافة بعد.</p>}

      {subjects.map((s: any) => {
        const subjectAssignments = assignments
          .filter((a: any) => a.subject_id === s.id)
          .sort((a: any, b: any) => {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return a.due_date.localeCompare(b.due_date);
          });

        return (
          <section key={s.id} className="mt-8">
            <h2 className="mb-3 border-b border-line pb-2 text-lg font-extrabold">{s.name}</h2>

            {s.channels.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {s.channels.map((c: any) => {
                  const linkClass = "mt-3 inline-block rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90";
                  return (
                    <div key={c.id} className="rounded-xl border border-line bg-white/70 p-4 shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal/10 font-bold text-teal">{c.name.slice(0, 2)}</div>
                        <span className="font-bold">{c.name}</span>
                      </div>
                      {c.description && <p className="mt-2 text-sm text-ink/60">{c.description}</p>}
                      <a href={c.telegram_link} target="_blank" rel="noopener noreferrer" className={linkClass}>فتح القناة</a>
                    </div>
                  );
                })}
              </div>
            )}

            {subjectAssignments.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-bold text-teal">الواجبات والمواعيد</h3>
                {subjectAssignments.map((a: any) => {
                  const channel = s.channels.find((c: any) => c.id === a.channel_id);
                  const dueInfo = a.due_date ? getDueInfo(a.due_date) : null;
                  return (
                    <div key={a.id} className="rounded-lg border border-line bg-white/70 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold">{a.title}</span>
                        {dueInfo && <span className={`rounded-full px-3 py-1 text-xs font-bold ${dueInfo.className}`}>{dueInfo.text}</span>}
                      </div>
                      {a.description && <p className="mt-1 text-sm text-ink/60">{a.description}</p>}
                      <p className="mt-1 text-xs text-ink/40">{channel ? `من قناة: ${channel.name}` : 'من الإدارة'}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
```

## app\globals.css

```
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800;900&family=Tajawal:wght@400;500;700&display=swap');
@import "tailwindcss";

@theme {
  --color-paper: #F6F5F1;
  --color-ink: #1C2320;
  --color-teal: #0F4C4C;
  --color-amber: #E0A63A;
  --color-line: #DEDAD0;

  --font-display: "Cairo", sans-serif;
  --font-body: "Tajawal", sans-serif;
}

body {
  background-color: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-body);
}

h1, h2, h3 {
  font-family: var(--font-display);
}
```

## app\layout.tsx

```
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "الملازم — كلية طب جامعة العميد",
  description: "منصة تعاونية لملازم ومصادر طلاب كلية طب جامعة العميد",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
          <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <a href="/" className="text-lg font-black text-teal sm:text-xl">الملازم</a>
            <div className="flex gap-4 text-sm sm:gap-5">
              <a href="/channels" className="transition-colors hover:text-teal">قنوات الدراسة</a>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
```

## app\page.tsx

```
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }
    loadData();
  }, []);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-extrabold">خطأ في الاتصال بقاعدة البيانات</h1>
        <p className="mt-2 text-ink/70">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="font-mono text-xs uppercase tracking-widest text-teal">كلية طب جامعة العميد</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">الملازم والمصادر</h1>

      <div className="relative mt-6 mb-8 sm:mb-10">
        <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="ابحث باسم الملزمة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-line bg-white px-4 py-3 pr-11 placeholder:text-ink/40 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
      </div>

      {loading && <p className="text-ink/50">جاري تحميل المواد...</p>}
      {!loading && subjects.length === 0 && <p className="text-ink/60">لا توجد مواد بعد.</p>}

      {subjects.map((s: any) => {
        const filteredNotes = s.lecture_notes.filter((note: any) =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
          <section key={s.id} className="mb-6 rounded-xl border border-line bg-white/70 p-5 shadow-sm transition-shadow hover:shadow-md sm:mb-8 sm:p-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
              <h2 className="text-lg font-extrabold sm:text-xl">{s.name}</h2>
              <span className="font-mono text-xs text-ink/50">{s.stage}</span>
            </div>

            <h3 className="mb-2 text-sm font-bold text-teal">الملازم</h3>
            {filteredNotes.length === 0 ? (
              <p className="mb-6 text-sm text-ink/50">لا توجد ملازم مطابقة.</p>
            ) : (
              <ul className="mb-6 space-y-3">
                {filteredNotes.map((note: any) => (
                  <li key={note.id}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <a href={note.file_path} target="_blank" rel="noopener noreferrer" className="font-medium underline decoration-teal/40 underline-offset-4 hover:text-teal">{note.title}</a>
                      <a href={`/study/${note.id}`} className="rounded-full bg-amber/20 px-3 py-1 text-xs font-bold text-ink hover:bg-amber/30">بطاقات مذاكرة</a>
                    </div>
                    {note.exam_questions.length > 0 && (
                      <ul className="mt-2 space-y-1 border-r-2 border-line pr-4">
                        {note.exam_questions.map((q: any) => (
                          <li key={q.id} className="text-sm text-ink/60">
                            {q.question_text}
                            {q.exam_term && <span className="mr-2 rounded bg-ink/5 px-1.5 py-0.5 font-mono text-xs text-ink/50">{q.exam_term}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <h3 className="mb-2 text-sm font-bold text-teal">ملاحظات تركيز الدكاترة</h3>
            {s.professor_focus_notes.length === 0 ? (
              <p className="text-sm text-ink/50">لا توجد ملاحظات معتمدة بعد.</p>
            ) : (
              <ul className="space-y-2">
                {s.professor_focus_notes.map((n: any) => (
                  <li key={n.id} className="relative rounded-md bg-amber/15 py-2 pl-3 pr-5">
                    <span className="absolute right-0 top-0 h-full w-1.5 rounded-r-md bg-amber" />
                    <strong>{n.professor_name}</strong>
                    <span className="text-ink/80"> — {n.notes_text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}
```

## app\study\[id]\page.tsx

```
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function StudyPage() {
  const params = useParams();
  const noteId = params.id as string;

  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    async function loadCards() {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('lecture_note_id', noteId)
        .eq('status', 'approved');
      if (error) {
        setError(error.message);
      } else {
        setCards(data || []);
      }
      setLoading(false);
    }
    loadCards();
  }, [noteId]);

  function goNext() {
    setFlipped(false);
    setIndex((i) => Math.min(i + 1, cards.length - 1));
  }

  function goPrev() {
    setFlipped(false);
    setIndex((i) => Math.max(i - 1, 0));
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <p className="text-ink/50">جاري تحميل البطاقات...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-extrabold">خطأ في تحميل البطاقات</h1>
        <p className="mt-2 text-ink/70">{error}</p>
      </main>
    );
  }

  if (cards.length === 0) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-black">بطاقات المذاكرة</h1>
        <p className="mt-4 text-ink/60">لا توجد بطاقات لهذه الملزمة بعد.</p>
      </main>
    );
  }

  const card = cards[index];

  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-teal">بطاقات مذاكرة</p>
      <h1 className="mt-1 text-2xl font-black">راجع البطاقات</h1>

      <p className="mt-4 text-sm text-ink/50">{index + 1} / {cards.length}</p>

      <div onClick={() => setFlipped(!flipped)} className="relative mt-4 h-64 cursor-pointer [perspective:1000px]">
        <div className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
          <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-line bg-white p-6 text-center shadow-sm [backface-visibility:hidden]">
            <p className="text-lg font-bold">{card.front_text}</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-line bg-amber/15 p-6 text-center shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-ink">{card.back_text}</p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-ink/40">اضغط على البطاقة لقلبها</p>

      <div className="mt-6 flex justify-between gap-3">
        <button onClick={goPrev} disabled={index === 0} className="flex-1 rounded-lg border border-line px-4 py-2.5 font-bold hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40">
          السابق
        </button>
        <button onClick={goNext} disabled={index === cards.length - 1} className="flex-1 rounded-lg bg-teal px-4 py-2.5 font-bold text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-40">
          التالي
        </button>
      </div>
    </main>
  );
}
```

## CLAUDE.md

```
@AGENTS.md

```

## eslint.config.mjs

```
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

```

## export-project.ps1

```
$exclude = @('node_modules', '.next', '.git', '.env.local', 'package-lock.json', 'public\notes', '.ico')
$outputFile = "project-export.md"
$root = (Get-Location).Path

if (Test-Path $outputFile) { Remove-Item $outputFile }

$sb = New-Object System.Text.StringBuilder

Get-ChildItem -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($root.Length + 1)
    $skip = $false
    foreach ($ex in $exclude) {
        if ($rel -like "*$ex*") { $skip = $true }
    }
    -not $skip
} | Sort-Object FullName | ForEach-Object {
    $rel = $_.FullName.Substring($root.Length + 1)
    $content = [System.IO.File]::ReadAllText($_.FullName)
    [void]$sb.AppendLine("`n## $rel`n")
    [void]$sb.AppendLine('```')
    [void]$sb.AppendLine($content)
    [void]$sb.AppendLine('```')
}

[System.IO.File]::WriteAllText("$root\$outputFile", $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Host "تم إنشاء الملف: $outputFile"
```

## lib\supabaseAdmin.js

```
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  );
}
```

## lib\supabaseClient.js

```
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## next.config.ts

```
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

```

## next-env.d.ts

```
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/types/routes.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

## package.json

```
{
  "name": "lawazem-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.110.8",
    "next": "16.2.11",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.11",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}

```

## postcss.config.mjs

```
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;

```

## public\file.svg

```
<svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M14.5 13.5V5.41a1 1 0 0 0-.3-.7L9.8.29A1 1 0 0 0 9.08 0H1.5v13.5A2.5 2.5 0 0 0 4 16h8a2.5 2.5 0 0 0 2.5-2.5m-1.5 0v-7H8v-5H3v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1M9.5 5V2.12L12.38 5zM5.13 5h-.62v1.25h2.12V5zm-.62 3h7.12v1.25H4.5zm.62 3h-.62v1.25h7.12V11z" clip-rule="evenodd" fill="#666" fill-rule="evenodd"/></svg>
```

## public\globe.svg

```
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><g clip-path="url(#a)"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.27 14.1a6.5 6.5 0 0 0 3.67-3.45q-1.24.21-2.7.34-.31 1.83-.97 3.1M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.48-1.52a7 7 0 0 1-.96 0H7.5a4 4 0 0 1-.84-1.32q-.38-.89-.63-2.08a40 40 0 0 0 3.92 0q-.25 1.2-.63 2.08a4 4 0 0 1-.84 1.31zm2.94-4.76q1.66-.15 2.95-.43a7 7 0 0 0 0-2.58q-1.3-.27-2.95-.43a18 18 0 0 1 0 3.44m-1.27-3.54a17 17 0 0 1 0 3.64 39 39 0 0 1-4.3 0 17 17 0 0 1 0-3.64 39 39 0 0 1 4.3 0m1.1-1.17q1.45.13 2.69.34a6.5 6.5 0 0 0-3.67-3.44q.65 1.26.98 3.1M8.48 1.5l.01.02q.41.37.84 1.31.38.89.63 2.08a40 40 0 0 0-3.92 0q.25-1.2.63-2.08a4 4 0 0 1 .85-1.32 7 7 0 0 1 .96 0m-2.75.4a6.5 6.5 0 0 0-3.67 3.44 29 29 0 0 1 2.7-.34q.31-1.83.97-3.1M4.58 6.28q-1.66.16-2.95.43a7 7 0 0 0 0 2.58q1.3.27 2.95.43a18 18 0 0 1 0-3.44m.17 4.71q-1.45-.12-2.69-.34a6.5 6.5 0 0 0 3.67 3.44q-.65-1.27-.98-3.1" fill="#666"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h16v16H0z"/></clipPath></defs></svg>
```

## public\next.svg

```
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 394 80"><path fill="#000" d="M262 0h68.5v12.7h-27.2v66.6h-13.6V12.7H262V0ZM149 0v12.7H94v20.4h44.3v12.6H94v21h55v12.6H80.5V0h68.7zm34.3 0h-17.8l63.8 79.4h17.9l-32-39.7 32-39.6h-17.9l-23 28.6-23-28.6zm18.3 56.7-9-11-27.1 33.7h17.8l18.3-22.7z"/><path fill="#000" d="M81 79.3 17 0H0v79.3h13.6V17l50.2 62.3H81Zm252.6-.4c-1 0-1.8-.4-2.5-1s-1.1-1.6-1.1-2.6.3-1.8 1-2.5 1.6-1 2.6-1 1.8.3 2.5 1a3.4 3.4 0 0 1 .6 4.3 3.7 3.7 0 0 1-3 1.8zm23.2-33.5h6v23.3c0 2.1-.4 4-1.3 5.5a9.1 9.1 0 0 1-3.8 3.5c-1.6.8-3.5 1.3-5.7 1.3-2 0-3.7-.4-5.3-1s-2.8-1.8-3.7-3.2c-.9-1.3-1.4-3-1.4-5h6c.1.8.3 1.6.7 2.2s1 1.2 1.6 1.5c.7.4 1.5.5 2.4.5 1 0 1.8-.2 2.4-.6a4 4 0 0 0 1.6-1.8c.3-.8.5-1.8.5-3V45.5zm30.9 9.1a4.4 4.4 0 0 0-2-3.3 7.5 7.5 0 0 0-4.3-1.1c-1.3 0-2.4.2-3.3.5-.9.4-1.6 1-2 1.6a3.5 3.5 0 0 0-.3 4c.3.5.7.9 1.3 1.2l1.8 1 2 .5 3.2.8c1.3.3 2.5.7 3.7 1.2a13 13 0 0 1 3.2 1.8 8.1 8.1 0 0 1 3 6.5c0 2-.5 3.7-1.5 5.1a10 10 0 0 1-4.4 3.5c-1.8.8-4.1 1.2-6.8 1.2-2.6 0-4.9-.4-6.8-1.2-2-.8-3.4-2-4.5-3.5a10 10 0 0 1-1.7-5.6h6a5 5 0 0 0 3.5 4.6c1 .4 2.2.6 3.4.6 1.3 0 2.5-.2 3.5-.6 1-.4 1.8-1 2.4-1.7a4 4 0 0 0 .8-2.4c0-.9-.2-1.6-.7-2.2a11 11 0 0 0-2.1-1.4l-3.2-1-3.8-1c-2.8-.7-5-1.7-6.6-3.2a7.2 7.2 0 0 1-2.4-5.7 8 8 0 0 1 1.7-5 10 10 0 0 1 4.3-3.5c2-.8 4-1.2 6.4-1.2 2.3 0 4.4.4 6.2 1.2 1.8.8 3.2 2 4.3 3.4 1 1.4 1.5 3 1.5 5h-5.8z"/></svg>
```

## public\vercel.svg

```
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1155 1000"><path d="m577.3 0 577.4 1000H0z" fill="#fff"/></svg>
```

## public\window.svg

```
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M7 4.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5" fill="#666"/></svg>
```

## README.md

```
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```

## tsconfig.json

```
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}

```
