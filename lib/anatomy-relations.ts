// lib/anatomy-relations.ts
/** علاقات العضلات التعليمية: المعادية، المساعدة، نفس العصب. الأزواج المعتمدة فقط. */
import { MUSCLES, MUSCLE_BY_ID } from './anatomy-data';
import { branchesOf, innervationOf } from './anatomy-extras';

export interface Relation {
  id: string;
  kind: 'antagonist' | 'synergist' | 'same-nerve';
}

const ANTAGONISTS: Readonly<Record<string, readonly string[]>> = {
  frontalis: ['procerus', 'corrugator'],
  procerus: ['frontalis'],
  corrugator: ['frontalis'],
  zmaj: ['dao', 'dli'],
  lls: ['dli', 'mentalis'],
  dao: ['zmaj', 'lao'],
  dli: ['zmaj', 'lls'],
  masseter: ['digastric'],
  temporalis: ['digastric'],
  digastric: ['masseter', 'temporalis'],
  sternohyoid: ['mylohyoid', 'geniohyoid', 'stylohyoid'],
  sternothyroid: ['mylohyoid', 'geniohyoid', 'stylohyoid'],
  omohyoid: ['mylohyoid', 'geniohyoid', 'stylohyoid'],
  mylohyoid: ['sternohyoid', 'omohyoid'],
  geniohyoid: ['sternohyoid', 'omohyoid'],
  stylohyoid: ['sternohyoid', 'omohyoid'],
  longusColli: ['spleniusCapitis'],
  longusCapitis: ['spleniusCapitis'],
  spleniusCapitis: ['longusColli', 'longusCapitis'],
};

function antagonistsOf(id: string): string[] {
  return (ANTAGONISTS[id] ?? []).filter((x) => MUSCLE_BY_ID[x]);
}

function synergistsOf(id: string): string[] {
  const m = MUSCLE_BY_ID[id];
  if (!m) return [];
  const b = branchesOf(m);
  if (b.length !== 1) return [];
  return MUSCLES.filter((x) => x.id !== id && branchesOf(x).includes(b[0] as never) && x.region === m.region).map((x) => x.id);
}

function sameNerveOf(id: string): string[] {
  const m = MUSCLE_BY_ID[id];
  const inn = m ? innervationOf(m) : null;
  if (!m || !inn) return [];
  return MUSCLES.filter((x) => x.id !== id && innervationOf(x) === inn && x.region !== m.region).map((x) => x.id);
}

export function relatedMuscles(id: string, limit = 6): Relation[] {
  const out: Relation[] = [
    ...antagonistsOf(id).slice(0, 3).map((x) => ({ id: x, kind: 'antagonist' as const })),
    ...synergistsOf(id).slice(0, 2).map((x) => ({ id: x, kind: 'synergist' as const })),
    ...sameNerveOf(id).slice(0, 2).map((x) => ({ id: x, kind: 'same-nerve' as const })),
  ];
  const seen = new Set<string>();
  return out.filter((r) => !seen.has(r.id) && (seen.add(r.id), true)).slice(0, limit);
}
