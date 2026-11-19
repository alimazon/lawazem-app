// app/admin/match/page.tsx
'use client';

import { useEffect, useState } from 'react';

// ==================== Types ====================
interface QueueStudent {
  student_id: string;
  joined_at: string;
  status: string;
  student: {
    id: string;
    full_name: string;
    telegram_username: string;
    gender: string;
    study_year: string;
  } | null;
}

interface PreviewGroup {
  size: number;
  males: number;
  females: number;
  students: {
    id: string;
    full_name: string;
    telegram_username: string;
    gender: string;
  }[];
}

interface PreviewData {
  males: number;
  females: number;
  total: number;
  proposedGroups: PreviewGroup[];
}

interface GroupMember {
  id: string;
  role: string;
  student_id: string;
  student: {
    id: string;
    full_name: string;
    telegram_username: string;
    gender: string;
  } | null;
}

interface GroupRequest {
  id: string;
  status: string;
  created_at: string;
  student: {
    id: string;
    full_name: string;
    telegram_username: string;
    gender: string;
  } | null;
}

interface GroupRow {
  id: string;
  code: string;
  serial: number;
  name: string | null;
  leader_id: string | null;
  target_size: number;
  male_count: number;
  female_count: number;
  status: string;
  leader: { id: string; full_name: string; telegram_username: string } | null;
  members: GroupMember[];
  requests: GroupRequest[];
}

type Tab = 'queue' | 'preview' | 'groups';

const STORAGE_KEY = 'admin_match_pwd';

export default function AdminMatchPage() {
  const [password, setPassword] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [tab, setTab] = useState<Tab>('queue');

  const [queue, setQueue] = useState<QueueStudent[]>([]);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [groups, setGroups] = useState<GroupRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // استرجاع كلمة المرور عند إعادة فتح الصفحة (نفس التبويب فقط)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      setPassword(saved);
      (async () => {
        try {
          await fetchApi('queue', {}, saved);
          setIsLogged(true);
          await loadAll(saved);
        } catch {
          sessionStorage.removeItem(STORAGE_KEY);
          setPassword('');
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showMsg(type: 'success' | 'error', text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  }

  async function fetchApi<T = any>(
    action: string,
    extra: Record<string, unknown> = {},
    pwd?: string
  ): Promise<T> {
    const res = await fetch('/api/admin/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd ?? password, action, ...extra }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || `فشل الاتصال (${res.status})`);
    return json.data as T;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await fetchApi('queue');
      sessionStorage.setItem(STORAGE_KEY, password);
      setIsLogged(true);
      await loadAll();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ');
    } finally {
      setLoading(false);
    }
  }

  async function loadAll(pwd?: string) {
    setLoading(true);
    try {
      const [q, p, g] = await Promise.all([
        fetchApi<{ queue: QueueStudent[] }>('queue', {}, pwd),
        fetchApi<PreviewData>('preview', {}, pwd),
        fetchApi<{ groups: GroupRow[] }>('list-groups', {}, pwd),
      ]);
      setQueue(q.queue || []);
      setPreview(p);
      setGroups(g.groups || []);
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ');
    } finally {
      setLoading(false);
    }
  }

  async function refreshQueue() {
    try {
      const [q, p] = await Promise.all([
        fetchApi<{ queue: QueueStudent[] }>('queue'),
        fetchApi<PreviewData>('preview'),
      ]);
      setQueue(q.queue || []);
      setPreview(p);
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ');
    }
  }

  async function refreshGroups() {
    try {
      const g = await fetchApi<{ groups: GroupRow[] }>('list-groups');
      setGroups(g.groups || []);
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ');
    }
  }

  // ==================== Actions ====================
  async function handleRun() {
    if (!confirm('سيتم إنشاء كروبات من قائمة الانتظار. متابعة؟')) return;
    setBusy('run');
    try {
      const data = await fetchApi<{ message: string; warnings?: string[] }>('run');
      showMsg('success', data.message);
      await loadAll();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ');
    } finally {
      setBusy(null);
    }
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm('حذف الكروب نهائياً؟')) return;
    setBusy(`del-${id}`);
    try {
      await fetchApi('delete-group', { group_id: id });
      showMsg('success', 'تم حذف الكروب');
      await refreshGroups();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ');
    } finally {
      setBusy(null);
    }
  }

  async function handleCleanupCancelled() {
    if (!confirm('سيتم حذف جميع الكروبات الملغية (مع أعضائها وطلباتها) نهائياً. متابعة؟')) return;
    setBusy('cleanup');
    try {
      const data = await fetchApi<{ message: string }>('cleanup-cancelled');
      showMsg('success', data.message);
      await refreshGroups();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ');
    } finally {
      setBusy(null);
    }
  }

  async function handleRename(group: GroupRow) {
    const name = prompt('اسم الكروب الجديد (اتركه فارغاً لحذف الاسم):', group.name || '');
    if (name === null) return;
    setBusy(`ren-${group.id}`);
    try {
      await fetchApi('edit-group', { group_id: group.id, name });
      await refreshGroups();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ');
    } finally {
      setBusy(null);
    }
  }

  async function handleEditTarget(group: GroupRow) {
    const val = prompt('الحجم المستهدف الجديد:', String(group.target_size));
    if (val === null) return;
    const n = parseInt(val, 10);
    if (!n || n < 1 || n > 50) return showMsg('error', 'رقم غير صالح (1-50)');
    setBusy(`tsz-${group.id}`);
    try {
      await fetchApi('edit-group', { group_id: group.id, target_size: n });
      await refreshGroups();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ');
    } finally {
      setBusy(null);
    }
  }

  async function handleSetStatus(group: GroupRow, status: string) {
    setBusy(`st-${group.id}`);
    try {
      await fetchApi('edit-group', { group_id: group.id, status });
      await refreshGroups();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ');
    } finally {
      setBusy(null);
    }
  }

  async function handleRemoveMember(groupId: string, studentId: string) {
    if (!confirm('إزالة العضو من الكروب؟')) return;
    setBusy(`rm-${studentId}`);
    try {
      await fetchApi('remove-member', { group_id: groupId, student_id: studentId });
      showMsg('success', 'تم إزالة العضو');
      await refreshGroups();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ');
    } finally {
      setBusy(null);
    }
  }

  async function handleChangeLeader(groupId: string, studentId: string) {
    if (!confirm('تعيين هذا العضو قائداً للكروب؟')) return;
    setBusy(`ld-${studentId}`);
    try {
      await fetchApi('change-leader', { group_id: groupId, student_id: studentId });
      showMsg('success', 'تم تغيير القائد');
      await refreshGroups();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ');
    } finally {
      setBusy(null);
    }
  }

  async function handleAddMember(groupId: string, studentId: string) {
    if (!studentId) return;
    setBusy(`add-${groupId}`);
    try {
      await fetchApi('add-member', { group_id: groupId, student_id: studentId });
      showMsg('success', 'تم إضافة العضو');
      await Promise.all([refreshGroups(), refreshQueue()]);
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ');
    } finally {
      setBusy(null);
    }
  }

  async function handleAdminRequest(requestId: string, action: 'accept' | 'reject') {
    setBusy(`req-${requestId}`);
    try {
      await fetchApi('admin-handle-request', { request_id: requestId, action });
      showMsg('success', action === 'accept' ? 'تم قبول الطالب' : 'تم رفض الطالب');
      await refreshGroups();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ');
    } finally {
      setBusy(null);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setPassword('');
    setIsLogged(false);
    setQueue([]);
    setPreview(null);
    setGroups([]);
  }

  // ==================== Login Screen ====================
  if (!isLogged) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper p-4" dir="rtl">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-ink mb-1 text-center">لوحة إدارة المطابقة</h1>
          <p className="text-xs text-ink-muted text-center mb-4">صفحة مستقلة لإدارة قائمة الانتظار والكروبات</p>
          {msg.text && <div className="mb-4 rounded-lg bg-red-50 p-2 text-sm text-red-600">{msg.text}</div>}
          <input
            type="password"
            placeholder="كلمة مرور الأدمن"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 mb-4 text-center"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal py-2 font-bold text-white hover:bg-teal/90 disabled:opacity-50"
          >
            {loading ? 'جارٍ التحقق...' : 'دخول'}
          </button>
        </form>
      </div>
    );
  }

  // ==================== Main Screen ====================
  const waitingCount = queue.length;
  const proposedCount = preview?.proposedGroups.length ?? 0;

  return (
    <div className="min-h-screen bg-paper p-4 sm:p-6" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Header */}
        <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-ink">لوحة إدارة المطابقة</h1>
              <p className="text-xs sm:text-sm text-ink-muted mt-1">إدارة قائمة الانتظار، معاينة الراندوم، وتعديل الكروبات</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadAll()}
                disabled={loading}
                className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-ink hover:bg-ink/5 disabled:opacity-50"
              >
                {loading ? '...' : '🔄 تحديث الكل'}
              </button>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
              >
                خروج
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl bg-teal/5 border border-teal/10 p-3 text-center">
              <div className="text-xl font-bold text-teal">{waitingCount}</div>
              <div className="text-[10px] text-ink-muted mt-1">في الانتظار</div>
            </div>
            <div className="rounded-xl bg-ink/5 p-3 text-center">
              <div className="text-xl font-bold text-ink">👨 {preview?.males ?? 0}</div>
              <div className="text-[10px] text-ink-muted mt-1">ذكور</div>
            </div>
            <div className="rounded-xl bg-ink/5 p-3 text-center">
              <div className="text-xl font-bold text-ink">👩 {preview?.females ?? 0}</div>
              <div className="text-[10px] text-ink-muted mt-1">إناث</div>
            </div>
            <div className="rounded-xl bg-ink/5 p-3 text-center">
              <div className="text-xl font-bold text-ink">{groups.length}</div>
              <div className="text-[10px] text-ink-muted mt-1">كروب إجمالي</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-line bg-white p-1 shadow-sm overflow-x-auto">
          <TabBtn active={tab === 'queue'} onClick={() => setTab('queue')} badge={waitingCount}>
            📥 قائمة الانتظار
          </TabBtn>
          <TabBtn active={tab === 'preview'} onClick={() => setTab('preview')} badge={proposedCount}>
            🎲 معاينة الراندوم
          </TabBtn>
          <TabBtn active={tab === 'groups'} onClick={() => setTab('groups')} badge={groups.length}>
            👥 الكروبات
          </TabBtn>
        </div>

        {msg.text && (
          <div
            className={`rounded-xl p-3 text-sm font-semibold ${
              msg.type === 'success' ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-600'
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* ==================== Tab: Queue ==================== */}
        {tab === 'queue' && (
          <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-ink">الطلاب في قائمة الانتظار ({waitingCount})</h2>
              <button
                onClick={refreshQueue}
                className="text-xs font-bold text-teal hover:underline"
              >
                🔄 تحديث
              </button>
            </div>

            {queue.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-8">لا يوجد طلاب في قائمة الانتظار حالياً.</p>
            ) : (
              <div className="space-y-2">
                {queue.map((q) => (
                  <div
                    key={q.student_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-line bg-paper-soft p-3 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{q.student?.gender === 'male' ? '👨' : '👩'}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-ink truncate">{q.student?.full_name || '—'}</div>
                        <div className="text-xs text-ink-muted font-mono truncate" dir="ltr">
                          @{q.student?.telegram_username || '—'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-ink-muted bg-white px-2 py-1 rounded-md">
                        {q.student?.study_year || '—'}
                      </span>
                      <span className="text-[10px] text-ink-muted">
                        {new Date(q.joined_at).toLocaleString('ar-IQ', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== Tab: Preview ==================== */}
        {tab === 'preview' && (
          <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-ink">المعاينة ({proposedCount} كروب مقترح)</h2>
              <button
                onClick={refreshQueue}
                className="text-xs font-bold text-teal hover:underline"
              >
                🔄 تحديث
              </button>
            </div>

            {proposedCount === 0 ? (
              <div className="rounded-lg bg-amber/10 border border-amber/30 p-4 text-sm text-amber-800 text-center">
                لا يوجد عدد كافٍ (10 طلاب) لتكوين كروب واحد حالياً.
                <br />
                الموجود: {preview?.total ?? 0} طالب.
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {preview?.proposedGroups.map((g, idx) => (
                    <div key={idx} className="rounded-xl border border-line bg-paper-soft p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-ink text-sm">كروب مقترح {idx + 1}</span>
                        <span className="text-[10px] font-mono bg-white px-2 py-1 rounded shadow-sm">
                          👨 {g.males} | 👩 {g.females}
                        </span>
                      </div>
                      <ul className="space-y-1 text-xs">
                        {g.students.map((s) => (
                          <li key={s.id} className="flex items-center gap-1.5 text-ink-soft">
                            <span>{s.gender === 'male' ? '👨' : '👩'}</span>
                            <span className="font-semibold truncate">{s.full_name}</span>
                            <span className="text-ink-muted font-mono truncate" dir="ltr">
                              @{s.telegram_username}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleRun}
                  disabled={busy === 'run'}
                  className="w-full rounded-lg bg-teal py-3 font-bold text-white hover:bg-teal/90 disabled:opacity-50"
                >
                  {busy === 'run'
                    ? 'جارٍ التنفيذ...'
                    : `▶ تنفيذ الراندوم وإنشاء ${proposedCount} كروب`}
                </button>
                <p className="text-[10px] text-ink-muted text-center">
                  ⚠️ سيتم إنشاء كروبات بالحجم الكامل (10 طلاب). الطلاب المتبقون يبقون في قائمة الانتظار.
                </p>
              </>
            )}
          </div>
        )}

        {/* ==================== Tab: Groups ==================== */}
        {tab === 'groups' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-ink">الكروبات ({groups.length})</h2>
              <div className="flex gap-3 items-center">
                <button
                  onClick={handleCleanupCancelled}
                  disabled={busy === 'cleanup'}
                  className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50 flex items-center gap-1"
                >
                  {busy === 'cleanup' ? '...' : '🧹 حذف الكروبات الملغية'}
                </button>
                <button
                  onClick={refreshGroups}
                  className="text-xs font-bold text-teal hover:underline"
                >
                  🔄 تحديث
                </button>
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-ink-muted">
                لا توجد كروبات بعد.
              </div>
            ) : (
              groups.map((g) => {
                const total = g.male_count + g.female_count;
                return (
                  <div
                    key={g.id}
                    className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-3"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-ink">
                            {g.name || `كروب #${g.serial}`}
                          </h3>
                          <span className="text-[10px] font-mono bg-ink/5 px-2 py-0.5 rounded">
                            {g.code}
                          </span>
                          <StatusBadge status={g.status} />
                        </div>
                        <div className="text-xs text-ink-muted mt-1 flex items-center flex-wrap gap-1.5">
                          <span>القائد:</span>
                          <span className="font-semibold text-ink-soft">
                            {g.leader?.full_name || '—'}
                          </span>
                          {g.leader && (
                            <>
                              <span className="font-mono" dir="ltr">
                                (@{g.leader.telegram_username})
                              </span>
                              {/* 👈 زر التواصل مع القائد */}
                              <a
                                href={`https://t.me/${g.leader.telegram_username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded bg-[#229ED9]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#229ED9] hover:bg-[#229ED9]/20 transition-colors"
                              >
                                💬 تواصل
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-center shrink-0">
                        <div className="text-lg font-bold text-teal">
                          {total}/{g.target_size}
                        </div>
                        <div className="text-[10px] text-ink-muted">
                          👨 {g.male_count} • 👩 {g.female_count}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 border-t border-line pt-2">
                      <button
                        onClick={() => handleRename(g)}
                        disabled={busy === `ren-${g.id}`}
                        className="rounded-md bg-ink/5 px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-ink/10 disabled:opacity-50"
                      >
                        ✏️ تعديل الاسم
                      </button>
                      <button
                        onClick={() => handleEditTarget(g)}
                        disabled={busy === `tsz-${g.id}`}
                        className="rounded-md bg-ink/5 px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-ink/10 disabled:opacity-50"
                      >
                        🎯 الحجم ({g.target_size})
                      </button>
                      <select
                        value={g.status}
                        onChange={(e) => handleSetStatus(g, e.target.value)}
                        disabled={busy === `st-${g.id}`}
                        className="rounded-md bg-ink/5 px-2 py-1.5 text-xs font-bold text-ink-soft disabled:opacity-50"
                      >
                        <option value="open">مفتوح</option>
                        <option value="full">مكتمل</option>
                        <option value="closed">مغلق</option>
                        <option value="cancelled">ملغى</option>
                      </select>
                      <button
                        onClick={() => handleDeleteGroup(g.id)}
                        disabled={busy === `del-${g.id}`}
                        className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 ml-auto"
                      >
                        🗑 حذف الكروب
                      </button>
                    </div>

                    {/* Requests */}
                    {g.requests && g.requests.length > 0 && (
                      <div className="border-t border-line pt-2">
                        <div className="text-xs font-bold text-amber-600 mb-2">طلبات الانضمام المعلقة ({g.requests.length})</div>
                        <div className="space-y-1.5">
                          {g.requests.map((req) => (
                            <div key={req.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs border border-amber-100">
                              <div className="flex items-center gap-2">
                                <span>{req.student?.gender === 'male' ? '👨' : '👩'}</span>
                                <span className="font-bold text-ink">{req.student?.full_name}</span>
                                <span className="text-ink-muted font-mono" dir="ltr">@{req.student?.telegram_username}</span>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleAdminRequest(req.id, 'accept')}
                                  disabled={busy === `req-${req.id}`}
                                  className="rounded bg-teal px-3 py-1 text-[10px] font-bold text-white hover:bg-teal/90 disabled:opacity-50"
                                >
                                  قبول
                                </button>
                                <button
                                  onClick={() => handleAdminRequest(req.id, 'reject')}
                                  disabled={busy === `req-${req.id}`}
                                  className="rounded bg-ink/10 px-3 py-1 text-[10px] font-bold text-ink-soft hover:bg-ink/20 disabled:opacity-50"
                                >
                                  رفض
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Members */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-ink-muted">الأعضاء ({total})</div>
                      {g.members.length === 0 ? (
                        <p className="text-xs text-ink-muted bg-paper-soft p-2 rounded text-center">
                          لا يوجد أعضاء
                        </p>
                      ) : (
                        g.members.map((m) => (
                          <div
                            key={m.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper-soft px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span>{m.student?.gender === 'male' ? '👨' : '👩'}</span>
                              <span className="font-semibold text-ink truncate">
                                {m.student?.full_name || '—'}
                              </span>
                              {m.role === 'leader' && (
                                <span className="text-[10px] bg-teal/10 text-teal px-1.5 py-0.5 rounded">
                                  👑 قائد
                                </span>
                              )}
                              <span className="font-mono text-ink-muted truncate" dir="ltr">
                                @{m.student?.telegram_username || '—'}
                              </span>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {m.role !== 'leader' && (
                                <button
                                  onClick={() => handleChangeLeader(g.id, m.student_id)}
                                  disabled={busy === `ld-${m.student_id}`}
                                  className="rounded bg-teal/10 px-2 py-1 text-[10px] font-bold text-teal hover:bg-teal/20 disabled:opacity-50"
                                >
                                  👑 تعيين قائد
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveMember(g.id, m.student_id)}
                                disabled={busy === `rm-${m.student_id}`}
                                className="rounded bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                              >
                                إزالة
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add from queue */}
                    {total < g.target_size && queue.length > 0 && (
                      <div className="border-t border-line pt-2">
                        <select
                          value=""
                          onChange={(e) => handleAddMember(g.id, e.target.value)}
                          disabled={busy === `add-${g.id}`}
                          className="w-full rounded-lg border border-teal/30 bg-teal/5 px-3 py-2 text-xs font-bold text-teal hover:bg-teal/10 disabled:opacity-50"
                        >
                          <option value="">➕ إضافة عضو من قائمة الانتظار</option>
                          {queue
                            .filter((q) => q.student)
                            .map((q) => (
                              <option key={q.student_id} value={q.student_id}>
                                {q.student?.gender === 'male' ? '👨' : '👩'} {q.student?.full_name} (@
                                {q.student?.telegram_username})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Sub-components ====================
function TabBtn({
  active,
  onClick,
  children,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${
        active ? 'bg-teal text-white' : 'text-ink-soft hover:bg-ink/5'
      }`}
    >
      <span>{children}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] ${
            active ? 'bg-white/20 text-white' : 'bg-ink/10 text-ink-soft'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'bg-teal/10 text-teal',
    full: 'bg-amber/10 text-amber-700',
    closed: 'bg-ink/10 text-ink-soft',
    cancelled: 'bg-red-100 text-red-600',
  };
  const labels: Record<string, string> = {
    open: 'مفتوح',
    full: 'مكتمل',
    closed: 'مغلق',
    cancelled: 'ملغى',
  };
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded ${styles[status] || 'bg-ink/10 text-ink-soft'}`}
    >
      {labels[status] || status}
    </span>
  );
}