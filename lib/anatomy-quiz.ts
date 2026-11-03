// lib/anatomy-quiz.ts
import { MUSCLES, MUSCLE_BY_ID, NECK_MUSCLE_IDS } from './anatomy-data';
import { FACIAL_BRANCHES, branchesOf } from './anatomy-extras';
import { TRIANGLES } from './anatomy-neck-notes';

export type QuestionKind = 'locate' | 'identify' | 'action' | 'attach' | 'branch' | 'nerve' | 'boundary' | 'contents';
export type QuizScope = 'all' | 'face' | 'neck';

export interface Question {
  kind: QuestionKind;
  /** العضلة المعنية (أو المثلث في أسئلة المثلثات: يُخزَّن في ref) */
  id: string;
  options: string[];
  correct: string;
  /** معرّف المثلث لأسئلة boundary/contents */
  ref?: string;
}

export interface RoundOptions {
  count: number;
  scope: QuizScope;
  /** عضلات تُفضَّل (للأخطاء السابقة) */
  only?: readonly string[];
}

// ==================== العصب المغذّي ====================
export interface NerveOption { id: string; en: string; ar: string }

export const NERVE_OPTIONS: readonly NerveOption[] = [
  { id: 'vii', en: 'Facial nerve (CN VII)', ar: 'العصب الوجهي' },
  { id: 'v3', en: 'Mandibular nerve (CN V3)', ar: 'العصب الفكي السفلي' },
  { id: 'xi', en: 'Accessory nerve (CN XI)', ar: 'العصب الإضافي' },
  { id: 'ansa', en: 'Ansa cervicalis (C1 to C3)', ar: 'العروة العنقية' },
  { id: 'c1xii', en: 'C1 fibres carried with the hypoglossal nerve', ar: 'ألياف C1 مع العصب تحت اللسان' },
  { id: 'dorsal', en: 'C3, C4 and the dorsal scapular nerve', ar: 'C3 وC4 والعصب الكتفي الظهري' },
  { id: 'post', en: 'Posterior rami of cervical nerves', ar: 'الفروع الخلفية للأعصاب العنقية' },
  { id: 'ant', en: 'Anterior rami of cervical nerves', ar: 'الفروع الأمامية للأعصاب العنقية' },
];

/** مفتاح العصب الأساسي للعضلة، أو null إن كانت مختلطة/غير واضحة */
export function nerveKeyOf(id: string): string | null {
  const m = MUSCLE_BY_ID[id];
  if (!m) return null;
  const n = m.nerve;
  const vii = /\bCN VII\b/.test(n);
  const v3 = /\bCN V3\b/.test(n);
  if (vii && v3) return null;
  if (vii) return 'vii';
  if (v3) return 'v3';
  if (/\bCN XI\b/.test(n)) return 'xi';
  if (/ansa cervicalis/i.test(n)) return 'ansa';
  if (/hypoglossal/i.test(n)) return 'c1xii';
  if (/C1/.test(n) && /anterior ramus of C1 \(/.test(n)) return 'c1xii';
  if (/dorsal scapular/i.test(n)) return 'dorsal';
  if (/posterior rami/i.test(n)) return 'post';
  if (/anterior rami/i.test(n)) return 'ant';
  return null;
}

// ==================== المثلثات ====================
const TRIANGLE_BOUNDARY: Readonly<Record<string, readonly string[]>> = {
  submental: ['digastric'],
  submandibular: ['digastric'],
  carotid: ['omohyoid', 'stylohyoid', 'digastric', 'scm'],
  muscular: ['omohyoid', 'scm'],
  posterior: ['scm', 'trapezius'],
  anterior: ['scm'],
};

// ==================== الأدوات ====================
const AMBIGUOUS_ACTION_GROUPS: readonly (readonly string[])[] = [
  ['lls', 'zmin', 'llsan', 'lao', 'zmaj'],
  ['masseter', 'temporalis'],
  ['corrugator', 'procerus'],
  ['scaleneAnt', 'scaleneMid', 'scalenePost'],
  ['digastric', 'stylohyoid', 'mylohyoid', 'geniohyoid'],
  ['omohyoid', 'sternohyoid', 'thyrohyoid', 'sternothyroid'],
  ['rcAnterior', 'rcLateralis', 'longusCapitis', 'longusColli'],
];

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i] as T;
    a[i] = a[j] as T;
    a[j] = t;
  }
  return a;
}

function sameAmbiguityGroup(a: string, b: string): boolean {
  return AMBIGUOUS_ACTION_GROUPS.some((g) => g.includes(a) && g.includes(b));
}

function inScope(id: string, scope: QuizScope): boolean {
  if (scope === 'all') return true;
  return scope === 'neck' ? NECK_MUSCLE_IDS.has(id) : !NECK_MUSCLE_IDS.has(id);
}

function distractors(id: string, n: number, kind: QuestionKind, scope: QuizScope): string[] {
  const target = MUSCLE_BY_ID[id];
  const base = MUSCLES.filter((m) => m.id !== id && !(kind === 'action' && sameAmbiguityGroup(id, m.id)));
  const scoped = base.filter((m) => inScope(m.id, scope));
  const pool = scoped.length >= n ? scoped : base;
  const same = shuffle(pool.filter((m) => m.region === target?.region));
  const other = shuffle(pool.filter((m) => m.region !== target?.region));
  return [...same, ...other].slice(0, n).map((m) => m.id);
}

function eligibleKinds(id: string): QuestionKind[] {
  const m = MUSCLE_BY_ID[id];
  const kinds: QuestionKind[] = ['locate', 'identify', 'action', 'attach'];
  if (m && branchesOf(m).length === 1) kinds.push('branch');
  if (nerveKeyOf(id)) kinds.push('nerve');
  return kinds;
}

function build(id: string, kind: QuestionKind, scope: QuizScope): Question {
  if (kind === 'locate') return { kind, id, options: [], correct: id };
  if (kind === 'branch') {
    const m = MUSCLE_BY_ID[id];
    const only = m ? branchesOf(m)[0] : undefined;
    return { kind, id, options: FACIAL_BRANCHES.map((b) => b.id), correct: only ?? 'buccal' };
  }
  if (kind === 'nerve') {
    const key = nerveKeyOf(id) ?? 'vii';
    const others = shuffle(NERVE_OPTIONS.filter((o) => o.id !== key)).slice(0, 3).map((o) => o.id);
    return { kind, id, options: shuffle([key, ...others]), correct: key };
  }
  return { kind, id, options: shuffle([id, ...distractors(id, 3, kind, scope)]), correct: id };
}

function triangleQuestion(): Question | null {
  const withBounds = TRIANGLES.filter((t) => (TRIANGLE_BOUNDARY[t.id]?.length ?? 0) > 0);
  const t = shuffle(withBounds)[0];
  if (!t) return null;
  if (Math.random() < 0.5) {
    const bounds = TRIANGLE_BOUNDARY[t.id] ?? [];
    const correct = shuffle(bounds)[0];
    if (!correct) return null;
    const wrong = shuffle(MUSCLES.filter((m) => !bounds.includes(m.id) && NECK_MUSCLE_IDS.has(m.id)).map((m) => m.id)).slice(0, 3);
    return { kind: 'boundary', id: correct, ref: t.id, options: shuffle([correct, ...wrong]), correct };
  }
  const correct = shuffle(t.contents)[0];
  if (!correct) return null;
  const foreign = TRIANGLES.filter((x) => x.id !== t.id).flatMap((x) => x.contents).filter((c) => !t.contents.includes(c));
  const wrong = shuffle([...new Set(foreign)]).slice(0, 3);
  if (wrong.length < 2) return null;
  return { kind: 'contents', id: t.id, ref: t.id, options: shuffle([correct, ...wrong]), correct };
}

export function makeRound(opts: RoundOptions | number = 10): Question[] {
  const o: RoundOptions = typeof opts === 'number' ? { count: opts, scope: 'all' } : opts;
  const pool = o.only && o.only.length > 0 ? [...o.only] : MUSCLES.map((m) => m.id).filter((id) => inScope(id, o.scope));
  const ids = shuffle(pool).slice(0, o.count);
  const out: Question[] = [];
  let prev: QuestionKind | null = null;
  const allowTri = (o.scope === 'neck' || o.scope === 'all') && !(o.only && o.only.length > 0);

  for (const id of ids) {
    if (allowTri && out.length > 0 && Math.random() < (o.scope === 'neck' ? 0.22 : 0.1)) {
      const tq = triangleQuestion();
      if (tq) {
        out.push(tq);
        prev = tq.kind;
        continue;
      }
    }
    const options = shuffle(eligibleKinds(id));
    const kind = options.find((k) => k !== prev) ?? options[0] ?? 'identify';
    out.push(build(id, kind, o.scope));
    prev = kind;
  }
  return out;
}
