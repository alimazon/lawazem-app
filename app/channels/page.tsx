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
  const [searchTerm, setSearchTerm] = useState('');

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

  function scrollToSubject(id: string) {
    const el = document.getElementById(`subject-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

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

  const term = searchTerm.trim().toLowerCase();

  const visibleSubjects = subjects
    .map((s: any) => {
      const subjectMatches = s.name.toLowerCase().includes(term);
      const filteredChannels = subjectMatches ? s.channels : s.channels.filter((c: any) => c.name.toLowerCase().includes(term));
      return { ...s, filteredChannels, subjectMatches };
    })
    .filter((s: any) => term === '' || s.subjectMatches || s.filteredChannels.length > 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="font-mono text-xs uppercase tracking-widest text-teal">استكشف حسب المادة</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">قنوات الدراسة</h1>

      <div className="relative mt-6 mb-2">
        <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="ابحث باسم القناة أو المادة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-line bg-white px-4 py-3 pr-11 placeholder:text-ink/40 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
      </div>

      {term === '' && subjects.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {subjects.map((s: any) => (
            <button
              key={s.id}
              onClick={() => scrollToSubject(s.id)}
              className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-bold text-ink transition-colors hover:border-teal hover:text-teal"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {visibleSubjects.length === 0 && <p className="mt-8 text-ink/60">لا نتائج مطابقة.</p>}

      {visibleSubjects.map((s: any) => {
        const subjectAssignments = assignments
          .filter((a: any) => a.subject_id === s.id)
          .sort((a: any, b: any) => {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return a.due_date.localeCompare(b.due_date);
          });

        return (
          <section key={s.id} id={`subject-${s.id}`} className="mt-8 scroll-mt-4">
            <h2 className="mb-3 border-b border-line pb-2 text-lg font-extrabold">{s.name}</h2>

            {s.filteredChannels.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {s.filteredChannels.map((c: any) => {
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

            {term === '' && subjectAssignments.length > 0 && (
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