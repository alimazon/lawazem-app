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

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDue, setNewDue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDue, setEditDue] = useState('');

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
      <p className="mt-1 text-sm text-ink/60">أضف واجبات أو مهام أو سيشنات مذاكرة لطلابك، وتظهر تلقائيًا بصفحة الموقع.</p>

      <section className="mt-8">
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
    </main>
  );
}