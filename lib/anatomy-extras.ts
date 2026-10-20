// lib/anatomy-extras.ts
import { MUSCLES, MUSCLE_GROUPS, type Muscle } from './anatomy-data';

export type FacialBranch = 'temporal' | 'zygomatic' | 'buccal' | 'marginal' | 'cervical';

export const FACIAL_BRANCHES: readonly {
  id: FacialBranch;
  en: string;
  ar: string;
  match: string;
}[] = [
  { id: 'temporal',  en: 'Temporal',            ar: 'الصدغي',        match: 'temporal' },
  { id: 'zygomatic', en: 'Zygomatic',           ar: 'الوجني',        match: 'zygomatic' },
  { id: 'buccal',    en: 'Buccal',              ar: 'الشدقي',        match: 'buccal' },
  { id: 'marginal',  en: 'Marginal mandibular', ar: 'الفكي الهامشي', match: 'marginal mandibular' },
  { id: 'cervical',  en: 'Cervical',            ar: 'العنقي',        match: 'cervical' },
];

export const BRANCH_MNEMONIC = 'To Zanzibar By Motor Car';

export type Innervation = 'VII' | 'V3';

export function innervationOf(m: Muscle): Innervation | null {
  if (m.nerve.includes('CN VII')) return 'VII';
  if (m.nerve.includes('CN V3')) return 'V3';
  return null;
}

export function branchesOf(m: Muscle): FacialBranch[] {
  if (innervationOf(m) !== 'VII') return [];
  const n = m.nerve.toLowerCase();
  return FACIAL_BRANCHES.filter((b) => n.includes(b.match)).map((b) => b.id);
}

export function pharyngealArchOf(m: Muscle): 1 | 2 | null {
  const inn = innervationOf(m);
  return inn === 'VII' ? 2 : inn === 'V3' ? 1 : null;
}

export const MUSCLES_BY_BRANCH: Record<FacialBranch, string[]> = (() => {
  const out: Record<FacialBranch, string[]> = {
    temporal: [], zygomatic: [], buccal: [], marginal: [], cervical: [],
  };
  for (const m of MUSCLES) for (const b of branchesOf(m)) out[b].push(m.id);
  return out;
})();

export interface ExtraMuscle {
  id: string;
  en: string;
  nerve: string;
  origin: string;
  insertion: string;
  actEn: string;
  clin: string;
}

export const EXTRA_MUSCLES: readonly ExtraMuscle[] = [
  {
    id: 'lateralPterygoid',
    en: 'Lateral pterygoid',
    nerve: 'Mandibular nerve (CN V3), nerve to lateral pterygoid',
    origin: 'Upper head: infratemporal surface and crest of the greater wing of the sphenoid. Lower head: lateral surface of the lateral pterygoid plate',
    insertion: 'Pterygoid fovea on the neck of the mandible, articular disc and capsule of the TMJ',
    actEn: 'Protrudes the mandible and opens the jaw; acting alone on one side it moves the jaw to the opposite side.',
    clin: 'The only muscle of mastication that opens the jaw. With unilateral weakness the jaw deviates toward the weak side on opening.',
  },
  {
    id: 'medialPterygoid',
    en: 'Medial pterygoid',
    nerve: 'Mandibular nerve (CN V3), nerve to medial pterygoid',
    origin: 'Deep head: medial surface of the lateral pterygoid plate and pyramidal process of the palatine bone. Superficial head: tuberosity of the maxilla',
    insertion: 'Medial surface of the ramus and angle of the mandible',
    actEn: 'Elevates the mandible and assists protrusion and side-to-side movement.',
    clin: 'Forms a muscular sling with the masseter around the angle of the mandible.',
  },
  {
    id: 'occipitalis',
    en: 'Occipitalis (occipital belly of occipitofrontalis)',
    nerve: 'Facial nerve (CN VII), posterior auricular branch',
    origin: 'Lateral part of the highest nuchal line of the occipital bone and the mastoid process',
    insertion: 'Epicranial aponeurosis (galea aponeurotica)',
    actEn: 'Retracts the scalp and fixes the galea so that frontalis can raise the eyebrows.',
    clin: 'The posterior auricular nerve leaves just below the stylomastoid foramen, so it is lost in a nerve lesion at or above that point.',
  },
  {
    id: 'auricular',
    en: 'Auricular muscles (anterior, superior, posterior)',
    nerve: 'Facial nerve (CN VII): temporal branch (anterior, superior), posterior auricular nerve (posterior)',
    origin: 'Temporal fascia and galea (anterior, superior); mastoid process (posterior)',
    insertion: 'Different parts of the auricle',
    actEn: 'Draw the ear forward, up and back; rudimentary in most people.',
    clin: 'Vestigial in humans, but still supplied by the facial nerve.',
  },
];

export const EXAM_TIPS: Readonly<Record<string, { ar: string; en: string }>> = {
  frontalis:   { ar: 'اطلب منه يرفع حاجبيه — هل تظهر تجاعيد الجبين؟',          en: 'Raise the eyebrows' },
  corrugator:  { ar: 'اطلب منه يعبس',                                           en: 'Frown' },
  orbOculi:    { ar: 'اطلب إغماض العينين بقوة وقارن دفن الرموش بين الجهتين',   en: 'Screw the eyes shut' },
  zmaj:        { ar: 'اطلب ابتسامة مع إظهار الأسنان وقارن الجهتين',            en: 'Smile and show the teeth' },
  buccinator:  { ar: 'اطلب نفخ الخدين، وراقب تسرّب الهواء',                    en: 'Puff out the cheeks' },
  orbOris:     { ar: 'اطلب الصفير أو ضمّ الشفتين بقوة',                        en: 'Whistle / purse the lips' },
  dli:         { ar: 'اطلب إظهار الأسنان السفلية',                             en: 'Show the lower teeth' },
  mentalis:    { ar: 'اطلب منه يعبّس بالذقن (pout)',                            en: 'Pout' },
  platysma:    { ar: 'اطلب فتح الفم مقابل مقاومة وراقب الشرائط العمودية',      en: 'Open the mouth against resistance' },
  masseter:    { ar: 'اطلب صرّ الأسنان وتحسّس العضلة على زاوية الفك',          en: 'Clench the teeth and palpate' },
  temporalis:  { ar: 'اطلب صرّ الأسنان وتحسّس العضلة فوق الصدغ',               en: 'Clench the teeth and palpate' },
};

export const FACIAL_PALSY_COMPARISON: readonly {
  feature: string;
  umn: string;
  lmn: string;
}[] = [
  { feature: 'Lesion site',
    umn: 'Above the facial nucleus (contralateral motor cortex / corticobulbar tract)',
    lmn: 'Facial nucleus or the nerve itself (pons, internal acoustic meatus, facial canal, parotid)' },
  { feature: 'Forehead',
    umn: 'Spared (bilateral cortical input to the upper face)',
    lmn: 'Paralysed' },
  { feature: 'Lower face',
    umn: 'Paralysed on the side opposite the lesion',
    lmn: 'Paralysed on the same side as the lesion' },
  { feature: 'Eye closure',
    umn: 'Mostly preserved',
    lmn: 'Lost (lagophthalmos); Bell’s phenomenon on attempted closure' },
  { feature: 'Typical cause',
    umn: 'Stroke',
    lmn: 'Bell’s palsy, parotid tumour or surgery, trauma, Ramsay Hunt syndrome' },
  { feature: 'Other signs (depend on lesion level)',
    umn: 'Usually accompanied by limb weakness',
    lmn: 'Loss of taste in the anterior two-thirds of the tongue (chorda tympani), hyperacusis (nerve to stapedius), reduced lacrimation' },
];

export function validateAtlas(): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();

  for (const m of MUSCLES) {
    if (ids.has(m.id)) problems.push(`duplicate id: ${m.id}`);
    ids.add(m.id);

    if (!m.nerve.trim()) problems.push(`${m.id}: missing nerve`);
    if (innervationOf(m) === null) problems.push(`${m.id}: nerve is neither CN VII nor CN V3`);

    if (m.geometry.type === 'fan') {
      if (m.geometry.A.length !== 8 || m.geometry.B.length !== 8) {
        problems.push(`${m.id}: fan geometry needs 8 numbers in A and B`);
      }
    } else if (m.geometry.irx >= m.geometry.rx || m.geometry.iry >= m.geometry.ry) {
      problems.push(`${m.id}: ring inner radius must be smaller than outer radius`);
    }
  }

  const seen = new Map<string, number>();
  for (const g of MUSCLE_GROUPS) {
    for (const id of g.ids) {
      if (!ids.has(id)) problems.push(`group "${g.labelEn}" references unknown muscle: ${id}`);
      seen.set(id, (seen.get(id) ?? 0) + 1);
    }
  }
  for (const id of ids) {
    const c = seen.get(id) ?? 0;
    if (c === 0) problems.push(`${id}: not in any group`);
    if (c > 1) problems.push(`${id}: appears in ${c} groups`);
  }

  return problems;
}

if (process.env.NODE_ENV !== 'production') {
  const issues = validateAtlas();
  if (issues.length) console.warn('[anatomy] data issues:\n' + issues.join('\n'));
}