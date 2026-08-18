'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

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
                  return (
                    <div key={a.id} className="rounded-lg border border-line bg-white/70 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold">{a.title}</span>
                        {a.due_date && <span className="rounded-full bg-amber/20 px-3 py-1 text-xs font-bold text-ink">تسليم: {a.due_date}</span>}
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