'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const typeLabels: any = {
  assignment: 'واجب',
  lecture_note: 'ملزمة',
  summary: 'ملخص',
  task: 'مهمة',
};

export default function ChannelPortalPage() {
  const [channelsList, setChannelsList] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [authenticated, setAuthenticated] = useState(false);
  const [channelInfo, setChannelInfo] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');

  const [newType, setNewType] = useState('assignment');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDue, setNewDue] = useState('');
  const [newLink, setNewLink] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState('assignment');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editLink, setEditLink] = useState('');

  const [settingsDesc, setSettingsDesc] = useState('');
  const [settingsImageUrl, setSettingsImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');

  useEffect(() => {
    async function init() {
      const { data } = await supabase.from('channels').select('id, name').order('name');
      setChannelsList(data || []);

      const savedId = sessionStorage.getItem('channel_id');
      const savedPw = sessionStorage.getItem('channel_password');
      if (savedId && savedPw) {
        setSelectedChannelId(savedId);
        setPassword(savedPw);
        doLogin(savedId, savedPw);
      }
    }
    init();
  }, []);

  async function doLogin(channelId: string, pw: string) {
    setLoading(true);
    setLoginError('');

    const res = await fetch('/api/channel/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', channel_id: channelId, password: pw }),
    });

    if (!res.ok) {
      setLoading(false);
      setLoginError('كلمة المرور غير صحيحة');
      sessionStorage.removeItem('channel_id');
      sessionStorage.removeItem('channel_password');
      return;
    }

    sessionStorage.setItem('channel_id', channelId);
    sessionStorage.setItem('channel_password', pw);

    const json = await res.json();
    setChannelInfo(json.channel);
    setSettingsDesc(json.channel.description || '');
    setSettingsImageUrl(json.channel.image_url || '');
    setAuthenticated(true);
    await loadItemsFor(channelId, pw);
    setLoading(false);
  }

  async function handleLogin(e: any) {
    e.preventDefault();
    doLogin(selectedChannelId, password);
  }

  function handleLogout() {
    sessionStorage.removeItem('channel_id');
    sessionStorage.removeItem('channel_password');
    setAuthenticated(false);
    setPassword('');
    setSelectedChannelId('');
  }

  async function loadItemsFor(channelId: string, pw: string) {
    const res = await fetch('/api/channel/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list', channel_id: channelId, password: pw }),
    });
    if (res.ok) {
      const json = await res.json();
      setItems(json.items || []);
    }
  }

  async function handleAdd(e: any) {
    e.preventDefault();
    const res = await fetch('/api/channel/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        channel_id: selectedChannelId,
        password,
        content_type: newType,
        title: newTitle,
        description: newDesc,
        due_date: newDue,
        file_url: newLink,
      }),
    });
    if (res.ok) {
      setNewTitle('');
      setNewDesc('');
      setNewDue('');
      setNewLink('');
      loadItemsFor(selectedChannelId, password);
    }
  }

  function startEdit(item: any) {
    setEditingId(item.id);
    setEditType(item.content_type);
    setEditTitle(item.title);
    setEditDesc(item.description || '');
    setEditDue(item.due_date || '');
    setEditLink(item.file_url || '');
  }

  async function saveEdit(id: string) {
    const res = await fetch('/api/channel/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'edit',
        channel_id: selectedChannelId,
        password,
        id,
        content_type: editType,
        title: editTitle,
        description: editDesc,
        due_date: editDue,
        file_url: editLink,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      loadItemsFor(selectedChannelId, password);
    }
  }

  async function deleteItem(id: string) {
    const confirmed = window.confirm('حذف هذا العنصر نهائي. متأكد؟');
    if (!confirmed) return;

    const res = await fetch('/api/channel/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', channel_id: selectedChannelId, password, id }),
    });
    if (res.ok) {
      loadItemsFor(selectedChannelId, password);
    }
  }

  async function handleImageUpload(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${selectedChannelId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('channel-images').upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploadingImage(false);
      alert('فشل رفع الصورة: ' + uploadError.message);
      return;
    }

    const { data } = supabase.storage.from('channel-images').getPublicUrl(filePath);
    setSettingsImageUrl(data.publicUrl);
    setUploadingImage(false);
  }

  async function handleUpdateChannel(e: any) {
    e.preventDefault();
    setSettingsStatus('');
    const res = await fetch('/api/channel/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_channel',
        channel_id: selectedChannelId,
        password,
        description: settingsDesc,
        image_url: settingsImageUrl,
      }),
    });
    setSettingsStatus(res.ok ? 'تم الحفظ.' : 'صار خطأ، حاول مرة ثانية.');
  }

  async function handleChangePassword(e: any) {
    e.preventDefault();
    setPasswordStatus('');
    if (newPassword !== confirmNewPassword) {
      setPasswordStatus('كلمتا المرور غير متطابقتين.');
      return;
    }
    const res = await fetch('/api/channel/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'change_password',
        channel_id: selectedChannelId,
        password,
        new_password: newPassword,
      }),
    });
    if (res.ok) {
      setPassword(newPassword);
      sessionStorage.setItem('channel_password', newPassword);
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordStatus('تم تغيير كلمة المرور.');
    } else {
      const json = await res.json();
      setPasswordStatus(json.error || 'صار خطأ.');
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">قناة: {channelInfo?.name}</h1>
        <button onClick={handleLogout} className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-ink/5">تسجيل خروج</button>
      </div>

      <div className="mt-6 flex gap-2 border-b border-line">
        <button onClick={() => setActiveTab('content')} className={`px-4 py-2 text-sm font-bold ${activeTab === 'content' ? 'border-b-2 border-teal text-teal' : 'text-ink/50'}`}>المحتوى</button>
        <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 text-sm font-bold ${activeTab === 'settings' ? 'border-b-2 border-teal text-teal' : 'text-ink/50'}`}>الإعدادات</button>
      </div>

      {activeTab === 'content' && (
        <section className="mt-6">
          <form onSubmit={handleAdd} className="mb-6 space-y-2 rounded-lg border border-line bg-white/70 p-4">
            <div className="flex flex-wrap gap-2">
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-36 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20">
                {Object.entries(typeLabels).map(([value, label]: any) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="العنوان" required className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
              <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} className="w-40 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
            </div>
            <input type="text" value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="رابط (اختياري — مثل رابط ملف أو منشور تليجرام)" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
            <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="تفاصيل إضافية (اختياري)" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
            <button type="submit" className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">إضافة</button>
          </form>

          <div className="space-y-2">
            {items.length === 0 && <p className="text-ink/50">ما أضفت شي لسا.</p>}
            {items.map((item: any) => (
              <div key={item.id} className="rounded-lg border border-line bg-white/70 p-3">
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <select value={editType} onChange={(e) => setEditType(e.target.value)} className="w-36 rounded-lg border border-line bg-white px-3 py-1.5 text-sm">
                        {Object.entries(typeLabels).map(([value, label]: any) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                      <input type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)} className="w-40 rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                    </div>
                    <input type="text" value={editLink} onChange={(e) => setEditLink(e.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                    <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-sm" />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(item.id)} className="rounded-lg bg-teal px-3 py-1.5 text-sm font-bold text-white hover:bg-teal/90">حفظ</button>
                      <button onClick={() => setEditingId(null)} className="rounded-lg border border-line px-3 py-1.5 text-sm">إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="ml-2 rounded-full bg-teal/10 px-2 py-0.5 text-xs font-bold text-teal">{typeLabels[item.content_type] || item.content_type}</span>
                      <span className="font-bold">{item.title}</span>
                      {item.due_date && <span className="mr-2 text-sm text-amber">تاريخ التسليم: {item.due_date}</span>}
                      {item.description && <p className="text-sm text-ink/60">{item.description}</p>}
                      {item.file_url && <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-teal underline">فتح الرابط</a>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(item)} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-ink/5">تعديل</button>
                      <button onClick={() => deleteItem(item.id)} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">حذف</button>
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
            <p className="mb-3 text-sm text-ink/50">الاسم والمادة ورابط تليجرام يديرها المشرف. تقدر تعدّل الصورة والوصف بس.</p>
            <form onSubmit={handleUpdateChannel} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-ink/60">صورة القناة</label>
                {settingsImageUrl && <img src={settingsImageUrl} alt="صورة القناة" className="mb-2 h-20 w-20 rounded-lg object-cover" />}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm" />
                {uploadingImage && <p className="mt-1 text-sm text-ink/50">جاري الرفع...</p>}
              </div>
              <textarea value={settingsDesc} onChange={(e) => setSettingsDesc(e.target.value)} placeholder="وصف القناة" rows={3} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
              <button type="submit" className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">حفظ</button>
              {settingsStatus && <p className="text-sm text-ink/60">{settingsStatus}</p>}
            </form>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-extrabold">تغيير كلمة المرور</h2>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="كلمة المرور الجديدة" required className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
              <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="تأكيد كلمة المرور الجديدة" required className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
              <button type="submit" className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">تغيير</button>
              {passwordStatus && <p className="text-sm text-ink/60">{passwordStatus}</p>}
            </form>
          </div>
        </section>
      )}
    </main>
  );
}