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