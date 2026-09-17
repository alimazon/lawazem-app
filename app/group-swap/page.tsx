// app/group-swap/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { postJson } from '@/lib/api-client';
import { useStudentStage } from '@/hooks/useStudentStage';

// ==================== Constants ====================
const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
type Group = (typeof GROUPS)[number];

const OWNERS_KEY = 'my_group_swap_owners';        // { [requestId]: owner_secret }
const USERNAME_KEY = 'my_group_swap_username';    // آخر يوزر استخدمه الطالب

// ==================== Types ====================
interface SwapRequest {
  id: string;
  student_name: string;
  telegram_username: string;
  current_group: Group;
  target_group: Group;
  notes: string | null;
  status: string;
  created_at: string;
}

type OwnerMap = Record<string, string>;

interface FormState {
  student_name: string;
  telegram_username: string;
  current_group: Group | '';
  target_group: Group | '';
  notes: string;
}

function emptyForm(): FormState {
  return {
    student_name: '',
    telegram_username: '',
    current_group: '',
    target_group: '',
    notes: '',
  };
}

// ==================== Icons ====================
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconSwap() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
function IconTelegram() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
function IconCopy() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ==================== Helpers ====================
function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'الآن';
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  if (hours < 24) return `قبل ${hours} ساعة`;
  if (days === 1) return 'أمس';
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
  return `قبل ${Math.floor(days / 30)} شهر`;
}

function normalizeUsername(u: string): string {
  return u.trim().replace(/^@/, '').toLowerCase();
}

function loadOwners(): OwnerMap {
  try {
    const saved = localStorage.getItem(OWNERS_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as OwnerMap;
    }
  } catch {}
  return {};
}

function saveOwners(owners: OwnerMap) {
  try {
    localStorage.setItem(OWNERS_KEY, JSON.stringify(owners));
  } catch {}
}

function loadUsername(): string {
  try {
    return localStorage.getItem(USERNAME_KEY) ?? '';
  } catch {}
  return '';
}

function saveUsername(username: string) {
  try {
    localStorage.setItem(USERNAME_KEY, username);
  } catch {}
}

function clearUsername() {
  try {
    localStorage.removeItem(USERNAME_KEY);
  } catch {}
}

// ==================== Group Badge ====================
function GroupBadge({ group, variant }: { group: Group; variant: 'current' | 'target' }) {
  const base = 'inline-flex h-9 w-9 items-center justify-center rounded-lg font-mono text-base font-black';
  if (variant === 'current') {
    return <span className={`${base} bg-ink/8 text-ink/70 dark:bg-white/10 dark:text-ink/80`}>{group}</span>;
  }
  return <span className={`${base} bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)]`}>{group}</span>;
}

// ==================== Copy Username Button ====================
function CopyUsernameButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`@${username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.show('فشل النسخ — يرجى النسخ يدوياً', 'error');
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="نسخ اليوزر"
      className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-1 text-[11px] font-bold text-ink/60 transition-all hover:border-teal/30 hover:text-teal active:scale-95 dark:bg-white/[0.06] dark:hover:bg-teal/10"
    >
      {copied ? <IconCheck /> : <IconCopy />}
      {copied ? 'تم' : 'نسخ'}
    </button>
  );
}

// ==================== Request Card ====================
function RequestCard({
  request,
  isOwn,
  matchCount,
  onDelete,
  showActions = true,
}: {
  request: SwapRequest;
  isOwn: boolean;
  matchCount: number;
  onDelete: () => void;
  showActions?: boolean;
}) {
  const telegramUrl = `https://t.me/${request.telegram_username}`;
  const initial = request.student_name.trim().charAt(0);

  return (
    <div
      className={`rounded-2xl border bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-200 dark:bg-paper/80 ${
        isOwn
          ? 'border-teal/40 shadow-[0_4px_16px_rgba(14,74,74,0.10)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.30)]'
          : 'border-line hover:border-teal/20'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {/* Avatar */}
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-teal-light text-base font-black text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.30)]">
            {initial}
          </span>

          <div className="min-w-0 flex-1">
            {/* الاسم + Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-ink">{request.student_name}</span>
              {isOwn && (
                <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-black text-teal dark:bg-teal/25">
                  طلبك
                </span>
              )}
              {matchCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-black text-amber-800 dark:bg-amber/30 dark:text-amber-300">
                  <IconSparkles />
                  {matchCount} {matchCount === 1 ? 'تطابق مثالي' : 'تطابقات مثالية'}
                </span>
              )}
            </div>

            {/* اليوزر */}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-teal hover:underline"
              >
                <IconTelegram />@{request.telegram_username}
              </a>
              <CopyUsernameButton username={request.telegram_username} />
            </div>

            {/* ===== الانتقال بين الكروبات ===== */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* "من" الحالي */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-ink/50">من</span>
                <GroupBadge group={request.current_group} variant="current" />
              </div>

              {/* السهم يشير يساراً (RTL) */}
              <svg
                className="h-4 w-4 flex-shrink-0 text-ink/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 5l-7 7m0 0l7 7m-7-7h18"
                />
              </svg>

              {/* "إلى" المطلوب */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-ink/50">إلى</span>
                <GroupBadge group={request.target_group} variant="target" />
              </div>
            </div>

            {/* ملاحظات */}
            {request.notes && (
              <p className="mt-2 rounded-lg bg-paper/60 px-2.5 py-1.5 text-xs leading-relaxed text-ink/60 dark:bg-white/[0.04]">
                {request.notes}
              </p>
            )}

            {/* الوقت */}
            <div className="mt-2 flex items-center gap-1 text-[11px] text-ink/40">
              <IconClock />
              {formatRelativeTime(request.created_at)}
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        {showActions && (
          <div className="flex flex-shrink-0 gap-1.5">
            {!isOwn && (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-teal/30 bg-teal/5 px-3 text-xs font-bold text-teal transition-all hover:border-teal/50 hover:bg-teal/10 active:scale-95 dark:border-teal/40 dark:bg-teal/10 dark:hover:bg-teal/15"
              >
                <IconTelegram />
                <span className="hidden sm:inline">تواصل</span>
              </a>
            )}
            {isOwn && (
              <button
                type="button"
                onClick={onDelete}
                aria-label="حذف الطلب"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-600 transition-all hover:bg-red-50 active:scale-95 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <IconTrash />
                حذف طلبي
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Stats Card ====================
function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: 'teal' | 'amber';
}) {
  const styles =
    accent === 'teal'
      ? 'bg-teal/8 text-teal dark:bg-teal/15 dark:text-teal'
      : 'bg-amber/15 text-amber-800 dark:bg-amber/25 dark:text-amber-300';
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/70 px-4 py-3 dark:bg-paper/70">
      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-mono text-lg font-black ${styles}`}>
        {value}
      </span>
      <p className="text-xs font-bold text-ink/60">{label}</p>
    </div>
  );
}

// ==================== Page ====================
export default function GroupSwapPage() {
  const { stage, ready } = useStudentStage();
  const toast = useToast();
  const confirm = useConfirm();

  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState<OwnerMap>({});
  const [savedUsername, setSavedUsername] = useState('');
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurrent, setFilterCurrent] = useState<Group | 'all'>('all');
  const [filterTarget, setFilterTarget] = useState<Group | 'all'>('all');

  // ===== تحميل localStorage =====
  useEffect(() => {
    setOwners(loadOwners());
    setSavedUsername(loadUsername());
    setMounted(true);
  }, []);

  // ===== تحميل الطلبات =====
  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await postJson<{ requests: SwapRequest[] }>('/api/group-swap', {
        action: 'list',
      });
      setRequests(data.requests ?? []);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل تحميل الطلبات', 'error');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (stage === 'المرحلة الثانية') {
      loadRequests();
    }
  }, [stage, loadRequests]);

  // ===== طلبي (اكتشاف) =====
  const myRequest = useMemo(() => {
    // أولوية 1: owner_secret معروف
    const byOwner = requests.find((r) => owners[r.id] !== undefined);
    if (byOwner) return byOwner;

    // أولوية 2: اليوزر المحفوظ
    if (savedUsername) {
      const normalized = normalizeUsername(savedUsername);
      const byUsername = requests.find(
        (r) => normalizeUsername(r.telegram_username) === normalized
      );
      if (byUsername) return byUsername;
    }

    return null;
  }, [requests, owners, savedUsername]);

  // ===== التطابقات المثالية =====
  const perfectMatches = useMemo(() => {
    if (!myRequest) return [];
    return requests.filter(
      (r) =>
        r.id !== myRequest.id &&
        r.current_group === myRequest.target_group &&
        r.target_group === myRequest.current_group
    );
  }, [requests, myRequest]);

  // ===== عدد التطابقات =====
  const matchCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of requests) {
      const count = requests.filter(
        (o) =>
          o.id !== r.id &&
          o.current_group === r.target_group &&
          o.target_group === r.current_group
      ).length;
      map.set(r.id, count);
    }
    return map;
  }, [requests]);

  // ===== إحصائيات =====
  const stats = useMemo(() => {
    return {
      total: requests.length,
      perfectPairs: Math.floor(
        requests.filter((r) => (matchCounts.get(r.id) ?? 0) > 0).length / 2
      ),
    };
  }, [requests, matchCounts]);

  // ===== الفلترة =====
  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return requests
      .filter((r) => filterCurrent === 'all' || r.current_group === filterCurrent)
      .filter((r) => filterTarget === 'all' || r.target_group === filterTarget)
      .filter(
        (r) =>
          !term ||
          r.student_name.toLowerCase().includes(term) ||
          r.telegram_username.toLowerCase().includes(term)
      );
  }, [requests, searchTerm, filterCurrent, filterTarget]);

  // ===== إضافة طلب =====
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();

    if (myRequest) {
      toast.show('لديك طلب مفتوح بالفعل. احذفه أولاً.', 'error');
      return;
    }
    if (!form.student_name.trim()) return toast.show('أدخل اسمك', 'error');
    if (!form.telegram_username.trim()) return toast.show('أدخل يوزر التليكرام', 'error');
    if (!form.current_group) return toast.show('اختر كروبك الحالي', 'error');
    if (!form.target_group) return toast.show('اختر الكروب المطلوب', 'error');
    if (form.current_group === form.target_group) {
      return toast.show('الكروب الحالي والمطلوب متطابقان', 'error');
    }

    const normalizedUsername = normalizeUsername(form.telegram_username);

    // فحص إضافي: هل يوجد طلب مفتوح بنفس اليوزر في القائمة؟
    const existingByUsername = requests.find(
      (r) => normalizeUsername(r.telegram_username) === normalizedUsername
    );
    if (existingByUsername) {
      toast.show('لديك طلب مفتوح بهذا اليوزر. احذفه أولاً.', 'error');
      saveUsername(normalizedUsername);
      setSavedUsername(normalizedUsername);
      return;
    }

    setSubmitting(true);
    try {
      const data = await postJson<{ id: string; owner_secret: string }>('/api/group-swap', {
        action: 'add',
        student_name: form.student_name.trim(),
        telegram_username: normalizedUsername,
        current_group: form.current_group,
        target_group: form.target_group,
        notes: form.notes.trim() || null,
      });

      // حفظ owner_secret + اليوزر
      const nextOwners = { ...owners, [data.id]: data.owner_secret };
      setOwners(nextOwners);
      saveOwners(nextOwners);
      saveUsername(normalizedUsername);
      setSavedUsername(normalizedUsername);

      setForm(emptyForm());
      toast.show('تم نشر طلبك', 'success');
      loadRequests();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الإضافة', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ===== حذف طلب =====
  async function handleDelete(request: SwapRequest) {
    const owner_secret = owners[request.id] ?? '';

    if (!owner_secret) {
      // لا يوجد owner_secret — نطلب تأكيد باليوزر
      const ok = await confirm(
        `سيتم حذف الطلب الخاص بـ @${request.telegram_username}. هل أنت متأكد أنه طلبك؟`,
        { variant: 'danger', confirmLabel: 'نعم، احذف' }
      );
      if (!ok) return;

      try {
        await postJson('/api/group-swap', {
          action: 'delete',
          id: request.id,
          owner_secret: '',
          telegram_username: request.telegram_username,
        });
      } catch (err) {
        toast.show(
          err instanceof Error ? err.message : 'لا يمكنك حذف هذا الطلب',
          'error'
        );
        return;
      }
    } else {
      const ok = await confirm('سيتم حذف طلبك نهائياً. هل أنت متأكد؟', {
        variant: 'danger',
        confirmLabel: 'حذف',
      });
      if (!ok) return;

      try {
        await postJson('/api/group-swap', {
          action: 'delete',
          id: request.id,
          owner_secret,
        });
      } catch (err) {
        toast.show(err instanceof Error ? err.message : 'فشل الحذف', 'error');
        return;
      }
    }

    // تحديث الحالة
    const nextOwners = { ...owners };
    delete nextOwners[request.id];
    setOwners(nextOwners);
    saveOwners(nextOwners);
    clearUsername();
    setSavedUsername('');

    toast.show('تم حذف طلبك', 'success');
    loadRequests();
  }

  // ==================== Render Guards ====================
  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 skeleton-shimmer rounded-2xl" />
          ))}
        </div>
      </main>
    );
  }

  if (stage !== 'المرحلة الثانية') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal"
        >
          <span className="transition-transform duration-200 group-hover:translate-x-1">
            <IconArrowLeft />
          </span>
          رجوع إلى لوحة الأقسام
        </Link>

        <div className="mt-8 rounded-3xl border border-amber/30 bg-amber/8 p-8 text-center dark:bg-amber/15">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber/20 text-amber-700 dark:text-amber-300">
            <IconWarning />
          </div>
          <h1 className="mt-4 text-xl font-black text-ink">قسم مؤقت — المرحلة الثانية</h1>
          <p className="mt-2 text-sm text-ink/60">
            هذا القسم مخصص لطلاب المرحلة الثانية فقط لتبديل كروبات العملي.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
      <Link
        href="/"
        className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal"
      >
        <span className="transition-transform duration-200 group-hover:translate-x-1">
          <IconArrowLeft />
        </span>
        رجوع إلى لوحة الأقسام
      </Link>

      {/* ==================== Header ==================== */}
      <div className="mt-6 animate-slide-up">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
            المرحلة الثانية
          </span>
          <span className="rounded-full bg-amber/20 px-3 py-1 text-[10px] font-black text-amber-800 dark:bg-amber/30 dark:text-amber-300">
            مؤقت
          </span>
        </div>
        <h1 className="mt-3 flex items-center gap-2 text-3xl font-black leading-tight text-ink sm:text-4xl">
          <IconSwap />
          تبديل كروبات العملي
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          ابحث عن بديل قبل الانتقال! انشر طلبك مع اسمك ويوزر تليكرام وكروبك الحالي، وسنخبرك تلقائياً إذا وجدنا تطابقاً مثاليًا.
        </p>
      </div>

      {/* ==================== Stats ==================== */}
      {!loading && requests.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-2 animate-slide-up" style={{ animationDelay: '80ms' }}>
          <StatCard label="طلب مفتوح" value={stats.total} accent="teal" />
          <StatCard label="تطابق مثالي متوفر" value={stats.perfectPairs} accent="amber" />
        </div>
      )}

      {/* ==================== My Request ==================== */}
      {myRequest && (
        <div className="mt-6 rounded-3xl border-2 border-teal/40 bg-gradient-to-bl from-teal/8 via-teal/4 to-transparent p-5 animate-slide-up dark:border-teal/50 dark:from-teal/15">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal text-white shadow-[0_4px_14px_rgba(14,74,74,0.30)]">
              <IconInfo />
            </span>
            <div>
              <h2 className="text-base font-black text-ink">طلبك الحالي</h2>
              <p className="text-xs text-ink/60">
                يمكنك نشر طلب واحد فقط. لحذفه، اضغط زر «حذف طلبي».
              </p>
            </div>
          </div>
          <RequestCard
            request={myRequest}
            isOwn={true}
            matchCount={matchCounts.get(myRequest.id) ?? 0}
            onDelete={() => handleDelete(myRequest)}
          />
        </div>
      )}

      {/* ==================== Perfect Matches ==================== */}
      {myRequest && perfectMatches.length > 0 && (
        <div className="mt-6 rounded-3xl border-2 border-amber/50 bg-gradient-to-bl from-amber/10 via-amber/5 to-transparent p-5 animate-slide-up dark:border-amber/40 dark:from-amber/20">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber text-ink shadow-[0_4px_14px_rgba(224,166,58,0.30)]">
              <IconSparkles />
            </span>
            <div>
              <h2 className="text-base font-black text-ink">
                🎉 {perfectMatches.length === 1 ? 'تطابق مثالي!' : `${perfectMatches.length} تطابقات مثالية!`}
              </h2>
              <p className="text-xs text-ink/60">هؤلاء الأشخاص في الكروب الذي تريده، ويريدون كروبك الحالي</p>
            </div>
          </div>
          <div className="space-y-2">
            {perfectMatches.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                isOwn={false}
                matchCount={matchCounts.get(r.id) ?? 0}
                onDelete={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* ==================== Form ==================== */}
      {!myRequest && (
        <form
          onSubmit={handleAdd}
          className="mt-6 space-y-4 rounded-3xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm animate-slide-up dark:bg-paper/80"
          style={{ animationDelay: '120ms' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-ink">انشر طلبك</h2>
            <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-black text-teal dark:bg-teal/20">
              طلب واحد فقط
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="gs-name" className="mb-2 block text-sm font-bold text-ink/70">
                اسمك الكامل
              </label>
              <Input
                id="gs-name"
                type="text"
                value={form.student_name}
                onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                placeholder="مثلاً: علي مازن"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label htmlFor="gs-telegram" className="mb-2 block text-sm font-bold text-ink/70">
                يوزر تيليكرام
              </label>
              <Input
                id="gs-telegram"
                type="text"
                value={form.telegram_username}
                onChange={(e) => setForm({ ...form, telegram_username: e.target.value })}
                placeholder="مثلاً: E_W_9"
                maxLength={100}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="gs-current" className="mb-2 block text-sm font-bold text-ink/70">
                كروبك الحالي
              </label>
              <Select
                id="gs-current"
                value={form.current_group}
                onChange={(e) => setForm({ ...form, current_group: e.target.value as Group })}
                required
                className="w-full"
              >
                <option value="">اختر الكروب</option>
                {GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="gs-target" className="mb-2 block text-sm font-bold text-ink/70">
                الكروب الذي تريده
              </label>
              <Select
                id="gs-target"
                value={form.target_group}
                onChange={(e) => setForm({ ...form, target_group: e.target.value as Group })}
                required
                className="w-full"
              >
                <option value="">اختر الكروب</option>
                {GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label htmlFor="gs-notes" className="mb-2 block text-sm font-bold text-ink/70">
              ملاحظات (اختياري)
            </label>
            <Textarea
              id="gs-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="أي تفاصيل إضافية تريد ذكرها..."
              rows={2}
              maxLength={300}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            loading={submitting}
            className="w-full"
            icon={<IconSwap />}
          >
            نشر الطلب
          </Button>

          <div className="flex items-start gap-2 rounded-xl border border-amber/30 bg-amber/8 p-3 text-xs text-ink/70 dark:bg-amber/15">
            <span className="text-amber">
              <IconWarning />
            </span>
            <p>
              يمكنك نشر <strong>طلب واحد فقط</strong>. إذا نشرت بالخطأ، يجب حذفه أولاً قبل نشر طلب جديد.
            </p>
          </div>
        </form>
      )}

      {/* ==================== Filters ==================== */}
      {requests.length > 0 && (
        <div className="mt-6 space-y-3 animate-slide-up" style={{ animationDelay: '160ms' }}>
          <div className="relative">
            <IconSearch />
            <Input
              type="text"
              placeholder="ابحث بالاسم أو اليوزر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-11"
              aria-label="بحث"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={filterCurrent}
              onChange={(e) => setFilterCurrent(e.target.value as Group | 'all')}
              className="w-40"
              aria-label="فلترة حسب الكروب الحالي"
            >
              <option value="all">كل الكروبات الحالية</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>الكروب {g}</option>
              ))}
            </Select>

            <Select
              value={filterTarget}
              onChange={(e) => setFilterTarget(e.target.value as Group | 'all')}
              className="w-40"
              aria-label="فلترة حسب الكروب المطلوب"
            >
              <option value="all">كل الكروبات المطلوبة</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>يريد الكروب {g}</option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {/* ==================== List ==================== */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 skeleton-shimmer rounded-2xl" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm dark:bg-paper/80">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/8 text-teal dark:bg-teal/15">
              <IconSwap />
            </div>
            <p className="mt-4 font-bold text-ink/70">لا توجد طلبات تبديل حالياً.</p>
            <p className="mt-1 text-sm text-ink/50">كن أول من ينشر طلباً!</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm dark:bg-paper/80">
            <IconSearch />
            <p className="mt-4 font-bold text-ink/70">لا توجد نتائج مطابقة</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRequests.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                isOwn={
                  owners[r.id] !== undefined ||
                  (!!savedUsername &&
                    r.telegram_username.toLowerCase() === normalizeUsername(savedUsername))
                }
                matchCount={matchCounts.get(r.id) ?? 0}
                onDelete={() => handleDelete(r)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ==================== Note ==================== */}
      <p className="mt-8 text-center text-[11px] text-ink/40">
        ⚠️ هذا القسم مؤقت لطلاب المرحلة الثانية. تأكد من التنسيق مع الطرف الآخر قبل التبديل الرسمي مع الإدارة.
      </p>
    </main>
  );
}