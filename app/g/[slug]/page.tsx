// app/g/[slug]/page.tsx
'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { groupsFetch, getToken, clearToken } from '@/lib/groups/client';
import type { MeResponse, PublicGroup, RequestWithStudent, RequestWithGroup } from '@/lib/types/groups';
import { SkeletonCard } from '../_components/SkeletonCard';
import { PushButton } from '../_components/PushButton';

interface Notification {
  id: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

export default function GroupsHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [hasMoreGroups, setHasMoreGroups] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [leaderRequests, setLeaderRequests] = useState<RequestWithStudent[]>([]);
  const [myRequests, setMyRequests] = useState<RequestWithGroup[]>([]);
  const [inQueue, setInQueue] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [copied, setCopied] = useState(false);

  // ✅ جديد: تتبع عدد الطلبات السابق (يمنع التنبيه في أول تحميل)
  const lastReqCountRef = useRef<number>(-1);
  // ✅ جديد: لمنع مسح رسائل أحدث (نظام نسخ الرسائل)
  const msgVersionRef = useRef(0);

  // ==================== ✅ جديدة: دوال الرسائل ====================
  function showMsg(type: string, text: string) {
    msgVersionRef.current++;
    setMsg({ type, text });
  }
  function showMsgTimed(type: string, text: string, ms = 5000) {
    const v = ++msgVersionRef.current;
    setMsg({ type, text });
    setTimeout(() => {
      if (msgVersionRef.current === v) setMsg({ type: '', text: '' });
    }, ms);
  }
  function clearMsg() {
    msgVersionRef.current++;
    setMsg({ type: '', text: '' });
  }

  // ✅ جديدة: صوت تنبيه بسيط (بدون مكتبات)
  function playNewRequestSound() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }

  // ✅ جديدة: إشعار المتصفح
  function showBrowserNotification(count: number) {
    try {
      if (typeof Notification === 'undefined') return;
      if (Notification.permission !== 'granted') return;
      new Notification('طلب انضمام جديد 🎉', {
        body: `لديك ${count} طلب في الانتظار`,
        tag: 'join-request',
      });
    } catch {}
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace(`/g/${slug}/register`);
      return;
    }
    loadData();

    // ✅ جديد: طلب إذن إشعارات المتصفح (مرة واحدة)
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    // ✅ التعديل 3: polling كل 5 ثوانٍ بدلاً من 15
    const interval = setInterval(() => {
      refreshInBackground();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, router]);

  async function loadData() {
    try {
      const meData = await groupsFetch<MeResponse>('/api/groups/me');
      setMe(meData);

      const notifData = await groupsFetch<{ list: Notification[], unread: number }>('/api/groups/notifications');
      setNotifications(notifData?.list || []);
      setUnreadCount(notifData?.unread || 0);

      if (meData?.group) {
        if (meData.isLeader) {
          const reqData = await groupsFetch<{ requests: RequestWithStudent[] }>('/api/groups/requests/list');
          const initialRequests = reqData?.requests || [];
          setLeaderRequests(initialRequests);
          // ✅ جديد: تهيئة المرجع دون تنبيه عند أول تحميل
          lastReqCountRef.current = initialRequests.length;
        }
      } else {
        const [listData, myReqData, matchData] = await Promise.all([
          groupsFetch<{ groups: PublicGroup[], hasMore: boolean }>('/api/groups/list', { page: 1, limit: 10 }),
          groupsFetch<{ requests: RequestWithGroup[] }>('/api/groups/my-requests'),
          groupsFetch<{ inQueue: boolean }>('/api/groups/match', { action: 'status' })
        ]);
        setGroups(listData?.groups || []);
        setHasMoreGroups(listData?.hasMore || false);
        setPage(1);
        setMyRequests(myReqData?.requests || []);
        setInQueue(matchData?.inQueue || false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل التحميل';
      if (errorMsg.includes('تسجيل الدخول')) {
        clearToken();
        router.replace(`/g/${slug}/register`);
      } else {
        showMsg('error', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function refreshInBackground() {
    if (!getToken()) return;
    try {
      const notifData = await groupsFetch<{ list: Notification[], unread: number }>('/api/groups/notifications');
      setNotifications(notifData?.list || []);
      setUnreadCount(notifData?.unread || 0);

      if (me?.isLeader) {
        const reqData = await groupsFetch<{ requests: RequestWithStudent[] }>('/api/groups/requests/list');
        const newRequests = reqData?.requests || [];
        const prev = lastReqCountRef.current;

        // ✅ التعديل 3: كشف الطلبات الجديدة → تنبيه
        if (prev >= 0 && newRequests.length > prev) {
          playNewRequestSound();
          showBrowserNotification(newRequests.length);
          showMsgTimed('success', `🔔 وصل ${newRequests.length - prev} طلب انضمام جديد!`, 5000);
        }

        lastReqCountRef.current = newRequests.length;
        setLeaderRequests(newRequests);
      }

      if (!me?.group) {
        const listData = await groupsFetch<{ groups: PublicGroup[], hasMore: boolean }>('/api/groups/list', { page: 1, limit: 10 });
        setGroups(listData?.groups || []);
        setHasMoreGroups(listData?.hasMore || false);
      }
    } catch {}
  }

  async function loadMoreGroups() {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const listData = await groupsFetch<{ groups: PublicGroup[], hasMore: boolean }>('/api/groups/list', { page: nextPage, limit: 10 });
      setGroups(prev => [...prev, ...(listData?.groups || [])]);
      setHasMoreGroups(listData?.hasMore || false);
      setPage(nextPage);
    } catch {
      showMsg('error', 'فشل تحميل المزيد من الكروبات');
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleLeaderAction(reqId: string, action: 'accept' | 'reject') {
    const backupRequests = [...leaderRequests];
    setLeaderRequests(prev => prev.filter(r => r.id !== reqId));
    showMsgTimed('success', action === 'accept' ? 'تم قبول الطالب' : 'تم رفض الطالب', 3000);
    try {
      await groupsFetch('/api/groups/requests/handle', { request_id: reqId, action });
      loadData();
    } catch (err) {
      setLeaderRequests(backupRequests);
      showMsgTimed('error', err instanceof Error ? err.message : 'حدث خطأ', 4000);
    }
  }

  async function handleAction(endpoint: string, payload: any, successMsg: string, btnId: string) {
    setActionLoading(btnId);
    clearMsg();
    try {
      await groupsFetch(endpoint, payload);
      showMsgTimed('success', successMsg, 4000);
      await loadData();
    } catch (err) {
      showMsgTimed('error', err instanceof Error ? err.message : 'حدث خطأ', 5000);
    } finally {
      setActionLoading(null);
    }
  }

  async function markNotifRead() {
    if (unreadCount === 0) return;
    await groupsFetch('/api/groups/notifications', { mark_all: true });
    setUnreadCount(0);
  }

  function copyInviteLink() {
    if (!me?.group) return;
    const url = `${window.location.origin}/g/${slug}/join/${me.group.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 w-full animate-pulse rounded-2xl bg-white/50 border border-line"></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }
  if (!me) return null;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-sm relative">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-ink leading-tight">مرحباً، {me.student.full_name.split(' ')[0]}</h1>
            <p className="mt-1 text-xs sm:text-sm text-ink-soft font-mono" dir="ltr">@{me.student.telegram_username}</p>
          </div>
          <div className="flex sm:hidden items-center gap-2">
             <PushButton />
             <button onClick={() => { setShowNotif(!showNotif); markNotifRead(); }} className="relative rounded-full p-2 bg-ink/5 text-xl">
              🔔
              {unreadCount > 0 && <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">{unreadCount}</span>}
            </button>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <PushButton />
          <div className="relative">
            <button onClick={() => { setShowNotif(!showNotif); markNotifRead(); }} className="relative rounded-full p-2 hover:bg-ink/5 text-xl">
              🔔
              {unreadCount > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">{unreadCount}</span>}
            </button>
            {showNotif && (
              <div className="absolute left-0 mt-2 w-72 rounded-xl border border-line bg-white shadow-lg z-50 max-h-80 overflow-y-auto">
                <div className="p-3 border-b border-line font-bold text-sm text-ink">الإشعارات</div>
                {notifications?.length === 0 ? <p className="p-4 text-center text-sm text-ink-muted">لا توجد إشعارات.</p> : (
                  notifications?.map(n => (
                    <div key={n.id} className={`p-3 border-b border-line text-sm ${!n.read_at ? 'bg-teal/5' : ''}`}>
                      <div className="font-bold text-ink">{n.title}</div>
                      {n.body && <div className="text-ink-soft text-xs mt-1">{n.body}</div>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button onClick={() => { clearToken(); router.replace(`/g/${slug}/register`); }} className="text-xs font-semibold text-ink-muted hover:text-red-500 bg-ink/5 sm:bg-transparent px-3 py-1.5 rounded-lg sm:p-0">خروج</button>
        </div>
      </div>

      {showNotif && (
         <div className="sm:hidden fixed inset-0 z-50 bg-black/20" onClick={() => setShowNotif(false)}>
            <div className="absolute top-16 left-4 right-4 rounded-xl border border-line bg-white shadow-xl max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-3 border-b border-line font-bold text-sm text-ink flex justify-between">
                <span>الإشعارات</span>
                <button onClick={() => setShowNotif(false)}>✕</button>
              </div>
              {notifications?.length === 0 ? <p className="p-4 text-center text-sm text-ink-muted">لا توجد إشعارات.</p> : (
                  notifications?.map(n => (
                    <div key={n.id} className={`p-3 border-b border-line text-sm ${!n.read_at ? 'bg-teal/5' : ''}`}>
                      <div className="font-bold text-ink">{n.title}</div>
                      {n.body && <div className="text-ink-soft text-xs mt-1">{n.body}</div>}
                    </div>
                  ))
                )}
            </div>
         </div>
      )}

      {msg.text && <div className={`rounded-xl p-3 sm:p-4 text-sm font-semibold ${msg.type === 'success' ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-600'}`}>{msg.text}</div>}

      {me.group ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-teal/30 bg-teal/5 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-ink">{me.group.name || `كروب #${me.group.serial}`}</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1">أنت {me.isLeader ? 'قائد هذا الكروب 👑' : 'عضو في هذا الكروب'}</p>
              </div>
              <div className="flex items-center justify-between sm:block text-center border-t sm:border-t-0 border-teal/20 pt-3 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold text-teal">{me.group.male_count + me.group.female_count}/{me.group.target_size}</div>
                <div className="text-xs text-ink-muted">عضو</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-teal/20 pt-4">
              <div className="flex gap-4 text-sm font-semibold bg-white/50 px-3 py-1 rounded-lg">
                <span>👨 {me.group.male_count}</span>
                <span>👩 {me.group.female_count}</span>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                {me.isLeader && (
                  <button onClick={copyInviteLink} className="flex-1 sm:flex-none rounded-lg border border-teal/30 bg-white px-4 py-2 text-xs font-bold text-teal hover:bg-teal/5 transition-colors">
                    {copied ? '✓ تم النسخ' : '🔗 نسخ رابط الدعوة'}
                  </button>
                )}
                <button onClick={() => { if (confirm('هل أنت متأكد من مغادرة الكروب؟')) handleAction('/api/groups/leave', {}, 'تمت المغادرة بنجاح', 'leave'); }} disabled={actionLoading === 'leave'} className="flex-1 sm:flex-none rounded-lg bg-red-100 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-200 disabled:opacity-50">
                  {actionLoading === 'leave' ? '...' : 'مغادرة'}
                </button>
              </div>
            </div>
          </div>

          {me.isLeader && (
            <div className="space-y-3">
              <h3 className="font-bold text-ink flex justify-between items-center">
                <span>طلبات الانضمام ({leaderRequests?.length || 0})</span>
                <span className="text-[10px] text-ink-muted font-normal bg-ink/5 px-2 py-1 rounded-md">🔄 يتحدث تلقائياً كل 5 ثوانٍ</span>
              </h3>
              {leaderRequests?.length === 0 ? <p className="text-sm text-ink-muted bg-white p-4 rounded-xl border border-line text-center">لا توجد طلبات جديدة.</p> : (
                <div className="space-y-2">
                  {leaderRequests?.map(req => (
                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line bg-white p-3 text-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink text-base">{req.student.full_name}</span>
                          <span className="text-ink-muted text-xs bg-ink/5 px-2 py-0.5 rounded-md">({req.student.gender === 'male' ? 'ذكر 👨' : 'أنثى 👩'})</span>
                        </div>
                        <div className="text-xs text-ink-muted mt-1 font-mono" dir="ltr">@{req.student.telegram_username}</div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => handleLeaderAction(req.id, 'accept')} className="flex-1 sm:flex-none rounded-md bg-teal px-4 py-2 text-xs font-bold text-white hover:bg-teal/90 transition-colors">قبول</button>
                        <button onClick={() => handleLeaderAction(req.id, 'reject')} className="flex-1 sm:flex-none rounded-md bg-ink/5 px-4 py-2 text-xs font-bold text-ink-soft hover:bg-ink/10 transition-colors">رفض</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="font-bold text-ink mb-3">الأعضاء ({me.members?.length || 0})</h3>
            <ul className="space-y-2">
              {me.members?.map(m => (
                <li key={m.id} className="flex justify-between items-center rounded-xl border border-line bg-white p-3 text-sm">
                  <div>
                    <span className="font-semibold text-ink">{m.student.full_name} {m.role === 'leader' && '👑'}</span>
                    <span className="block sm:inline font-mono text-ink-muted text-xs sm:text-sm mt-1 sm:mt-0 sm:ml-3" dir="ltr">@{m.student.telegram_username}</span>
                  </div>
                  {me.isLeader && m.student_id !== me.student.id && (
                    <button onClick={() => { if (confirm(`هل أنت متأكد من طرد ${m.student.full_name}؟`)) handleAction('/api/groups/kick', { group_id: me.group?.id, student_id: m.student_id }, 'تم طرد الطالب', `kick-${m.id}`); }} disabled={actionLoading === `kick-${m.id}`} className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50">
                      {actionLoading === `kick-${m.id}` ? '...' : 'طرد'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-2xl border border-dashed border-line bg-white p-6 sm:p-8 text-center shadow-sm">
            <h2 className="text-lg font-bold text-ink">أنت لست في أي كروب حتى الآن</h2>
            <p className="mt-2 text-xs sm:text-sm text-ink-soft leading-relaxed max-w-md mx-auto">يمكنك إنشاء كروب جديد، أو الانضمام لكروب موجود، أو ترك النظام يكوّن لك كروباً تلقائياً.</p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <Link href={`/g/${slug}/create`} className="rounded-lg bg-teal px-6 py-3 text-sm font-bold text-white transition hover:bg-teal/90">+ إنشاء كروب جديد</Link>
              {inQueue ? (
                <button onClick={() => handleAction('/api/groups/match', { action: 'leave' }, 'تم الخروج من قائمة الانتظار', 'match')} disabled={actionLoading === 'match'} className="rounded-lg border border-amber bg-amber/10 px-6 py-3 text-sm font-bold text-amber-700 transition hover:bg-amber/20 disabled:opacity-50">
                  {actionLoading === 'match' ? '...' : 'في قائمة الانتظار ⏳ (خروج)'}
                </button>
              ) : (
                <button onClick={() => handleAction('/api/groups/match', { action: 'join' }, 'انضممت لقائمة الانتظار، بانتظار الإدارة.', 'match')} disabled={actionLoading === 'match'} className="rounded-lg border border-gold bg-gold/10 px-6 py-3 text-sm font-bold text-gold-ink transition hover:bg-gold/20 disabled:opacity-50">
                  {actionLoading === 'match' ? '...' : '🤖 كوّن لي كروباً تلقائياً'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">الكروبات المتاحة <span className="bg-ink/5 text-ink-muted px-2 py-0.5 rounded-full text-xs">{groups?.length || 0}</span></h2>
            {groups?.length === 0 ? <p className="text-sm text-ink-muted bg-white p-6 rounded-2xl border border-line text-center">لا توجد كروبات متاحة للانضمام حالياً.</p> : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groups?.map(g => {
                  const hasPendingRequest = myRequests?.find(r => r.group_id === g.id);
                  return (
                    <div key={g.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm flex flex-col justify-between hover:border-teal/30 transition-colors">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-ink truncate">{g.name || `كروب #${g.serial}`}</h3>
                            <p className="text-xs text-ink-muted truncate">القائد: {g.leader_name}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-teal/10 px-2.5 py-1 text-[10px] font-bold text-teal">{g.spots_left} مقاعد</span>
                        </div>
                        <div className="mt-4 flex gap-3 text-xs font-semibold bg-paper-soft p-2 rounded-lg justify-center">
                          <span className="text-ink-soft">👨 {g.male_count}</span>
                          <span className="text-ink-soft">👩 {g.female_count}</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        {hasPendingRequest ? (
                          <div className="flex gap-2">
                            <div className="flex-1 rounded-lg bg-amber/10 border border-amber/20 py-2 text-center text-xs font-bold text-amber-700 flex items-center justify-center gap-1">قيد الانتظار ⏳</div>
                            <button onClick={() => handleAction('/api/groups/my-requests', { action: 'cancel', request_id: hasPendingRequest.id }, 'تم إلغاء الطلب', g.id)} disabled={actionLoading === g.id} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50">إلغاء</button>
                          </div>
                        ) : (
                          <button onClick={() => handleAction('/api/groups/join-request', { group_id: g.id }, 'تم إرسال الطلب بنجاح، بانتظار القائد.', g.id)} disabled={actionLoading === g.id || inQueue} className="w-full rounded-lg border border-teal/30 bg-teal/5 py-2.5 text-xs font-bold text-teal transition hover:bg-teal/10 disabled:opacity-50">
                            {actionLoading === g.id ? '...' : (inQueue ? 'أنت في قائمة الانتظار' : 'طلب انضمام')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {hasMoreGroups && (
              <div className="text-center pt-4">
                <button onClick={loadMoreGroups} disabled={loadingMore} className="rounded-lg border border-line bg-white px-6 py-2 text-sm font-bold text-ink hover:bg-ink/5 disabled:opacity-50 transition-colors">
                  {loadingMore ? 'جارٍ التحميل...' : 'عرض المزيد من الكروبات'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}