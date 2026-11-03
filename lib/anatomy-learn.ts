// lib/anatomy-learn.ts
/** حالة التعلّم الموحّدة: التقدّم، المفضّلة، الملاحظات، وبطاقات المراجعة المتباعدة. تُحفَظ محلياً على الجهاز. */
import { MUSCLES, MUSCLE_BY_ID } from './anatomy-data';
import { grade as srsGrade, isDue, newCard, type Grade, type SrsState } from './anatomy-srs';

export interface MuscleProgress {
  seen: number;
  correct: number;
  wrong: number;
  /** مستوى الإتقان 0..5 */
  mastery: number;
  last: number;
}

export interface LearnState {
  progress: Record<string, MuscleProgress>;
  favorites: string[];
  notes: Record<string, string>;
  srs: SrsState;
}

export const LEARN_KEY = 'anatomy-learn';
export const LEARN_VERSION = 2;

export const DEFAULT_LEARN: LearnState = { progress: {}, favorites: [], notes: {}, srs: { cards: {} } };

const EMPTY: MuscleProgress = { seen: 0, correct: 0, wrong: 0, mastery: 0, last: 0 };

export function markSeen(s: LearnState, id: string): LearnState {
  if (!MUSCLE_BY_ID[id]) return s;
  const p = s.progress[id] ?? EMPTY;
  return { ...s, progress: { ...s.progress, [id]: { ...p, seen: p.seen + 1, last: Date.now() } } };
}

function masteryOf(correct: number, wrong: number): number {
  const total = correct + wrong;
  if (total === 0) return 0;
  return Math.round((correct / total) * Math.min(1, total / 5) * 5);
}

/**
 * يسجّل إجابة ويقيّم بطاقة المراجعة مرة واحدة فقط.
 * `g` اختياري: من البطاقات يُمرَّر تقييم المستخدم، ومن الاختبار تُستخدم درجة افتراضية (4 صحيح، 1 خطأ).
 */
export function recordAnswer(s: LearnState, id: string, correct: boolean, g?: Grade): LearnState {
  if (!MUSCLE_BY_ID[id]) return s;
  const p = s.progress[id] ?? EMPTY;
  const c = p.correct + (correct ? 1 : 0);
  const w = p.wrong + (correct ? 0 : 1);
  const progress: MuscleProgress = { ...p, correct: c, wrong: w, mastery: masteryOf(c, w), last: Date.now() };
  const card = s.srs.cards[id] ?? newCard(id);
  const updated = srsGrade(card, g ?? (correct ? 4 : 1));
  return { ...s, progress: { ...s.progress, [id]: progress }, srs: { cards: { ...s.srs.cards, [id]: updated } } };
}

export function toggleFavorite(s: LearnState, id: string): LearnState {
  const has = s.favorites.includes(id);
  return { ...s, favorites: has ? s.favorites.filter((x) => x !== id) : [...s.favorites, id] };
}

export function setNote(s: LearnState, id: string, note: string): LearnState {
  const notes = { ...s.notes };
  const t = note.trim();
  if (t) notes[id] = t;
  else delete notes[id];
  return { ...s, notes };
}

export interface Stats {
  total: number;
  seen: number;
  mastered: number;
  accuracy: number;
  due: number;
  favorites: number;
  notes: number;
  perRegion: Record<string, { total: number; mastered: number }>;
}

export function computeStats(s: LearnState): Stats {
  let seen = 0;
  let mastered = 0;
  let correct = 0;
  let wrong = 0;
  const perRegion: Stats['perRegion'] = {};
  for (const m of MUSCLES) {
    const region = m.region ?? 'Other';
    const r = (perRegion[region] ??= { total: 0, mastered: 0 });
    r.total++;
    const p = s.progress[m.id];
    if (!p) continue;
    if (p.seen > 0 || p.correct + p.wrong > 0) seen++;
    if (p.mastery >= 4) {
      mastered++;
      r.mastered++;
    }
    correct += p.correct;
    wrong += p.wrong;
  }
  return {
    total: MUSCLES.length,
    seen,
    mastered,
    accuracy: correct + wrong > 0 ? correct / (correct + wrong) : 0,
    due: dueForReview(s).length,
    favorites: s.favorites.length,
    notes: Object.keys(s.notes).length,
    perRegion,
  };
}

/** بطاقات استحقّت مراجعتها (الأقدم أولاً) */
export function dueForReview(s: LearnState): string[] {
  return Object.values(s.srs.cards)
    .filter((c) => MUSCLE_BY_ID[c.id] && isDue(c))
    .sort((a, b) => a.due - b.due)
    .map((c) => c.id);
}

/** عضلات لم تُراجَع بعد (لبدء الدراسة قبل أي اختبار) */
export function newForStudy(s: LearnState, limit: number): string[] {
  return MUSCLES.filter((m) => !s.srs.cards[m.id]).map((m) => m.id).slice(0, limit);
}

export function buildStudyQueue(s: LearnState, size = 20): string[] {
  const due = dueForReview(s).slice(0, size);
  return [...due, ...newForStudy(s, Math.max(0, Math.min(10, size - due.length)))];
}

export function exportLearn(s: LearnState): string {
  return JSON.stringify({ version: LEARN_VERSION, exportedAt: Date.now(), data: s }, null, 2);
}

export function importLearn(json: string): LearnState | null {
  try {
    const parsed = JSON.parse(json) as { data?: Partial<LearnState> };
    const d = parsed.data;
    if (!d || typeof d !== 'object') return null;
    return {
      progress: d.progress ?? {},
      favorites: Array.isArray(d.favorites) ? d.favorites.filter((id) => MUSCLE_BY_ID[id]) : [],
      notes: d.notes ?? {},
      srs: d.srs ?? { cards: {} },
    };
  } catch {
    return null;
  }
}
