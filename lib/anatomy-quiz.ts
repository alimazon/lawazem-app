// lib/anatomy-quiz.ts
import { MUSCLES, MUSCLE_BY_ID } from './anatomy-data';
import { FACIAL_BRANCHES, branchesOf } from './anatomy-extras';

export type QuestionKind = 'locate' | 'identify' | 'action' | 'attach' | 'branch';

export interface Question {
  kind: QuestionKind;
  id: string;
  options: string[];
  correct: string;
}

const AMBIGUOUS_ACTION_GROUPS: readonly (readonly string[])[] = [
  ['lls', 'zmin', 'llsan', 'lao', 'zmaj'],
  ['masseter', 'temporalis'],
  ['corrugator', 'procerus'],
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

function distractors(id: string, n: number, kind: QuestionKind): string[] {
  const target = MUSCLE_BY_ID[id];
  const pool = MUSCLES.filter(
    (m) => m.id !== id && !(kind === 'action' && sameAmbiguityGroup(id, m.id)),
  );
  const same = shuffle(pool.filter((m) => m.region === target?.region));
  const other = shuffle(pool.filter((m) => m.region !== target?.region));
  return [...same, ...other].slice(0, n).map((m) => m.id);
}

function eligibleKinds(id: string): QuestionKind[] {
  const m = MUSCLE_BY_ID[id];
  const kinds: QuestionKind[] = ['locate', 'identify', 'action', 'attach'];
  if (m && branchesOf(m).length === 1) kinds.push('branch');
  return kinds;
}

function build(id: string, kind: QuestionKind): Question {
  if (kind === 'locate') return { kind, id, options: [], correct: id };
  if (kind === 'branch') {
    const m = MUSCLE_BY_ID[id];
    const only = m ? branchesOf(m)[0] : undefined;
    return { kind, id, options: FACIAL_BRANCHES.map((b) => b.id), correct: only ?? 'buccal' };
  }
  return { kind, id, options: shuffle([id, ...distractors(id, 3, kind)]), correct: id };
}

export function makeRound(count = 10): Question[] {
  const ids = shuffle(MUSCLES.map((m) => m.id)).slice(0, count);
  const out: Question[] = [];
  let prev: QuestionKind | null = null;
  for (const id of ids) {
    const options = shuffle(eligibleKinds(id));
    const kind = options.find((k) => k !== prev) ?? options[0] ?? 'identify';
    out.push(build(id, kind));
    prev = kind;
  }
  return out;
}