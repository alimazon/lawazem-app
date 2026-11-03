// components/anatomy/atlas3d-model.ts
/** نموذج بيانات المجسّم: المجموعات، الإعدادات المسبقة، وحالة الرؤية (إخفاء/عزل/تراجع). */
import { MUSCLE_GROUPS, NECK_GROUP_NAMES } from '@/lib/anatomy-data';
import { MUSCLE_DEPTH, contextDepth, type Depth } from '@/lib/anatomy-layers';
import { HEAD_BONES, MUSCLE_MESHES } from '@/lib/anatomy-meshes';

export interface GroupDef {
  id: string;
  en: string;
  ar: string;
}

export const BONE_GROUPS: readonly GroupDef[] = [
  { id: 'b:cranium', en: 'Cranium', ar: 'الجمجمة' },
  { id: 'b:mandible', en: 'Mandible', ar: 'الفك السفلي' },
  { id: 'b:hyoid', en: 'Hyoid bone', ar: 'العظم اللامي' },
  { id: 'b:cervical', en: 'Cervical spine', ar: 'الفقرات العنقية' },
  { id: 'b:thoracic', en: 'Thoracic spine', ar: 'الفقرات الصدرية' },
  { id: 'b:ribs', en: 'Ribs', ar: 'الأضلاع' },
  { id: 'b:sternum', en: 'Sternum', ar: 'القص' },
  { id: 'b:clavicle', en: 'Clavicle', ar: 'الترقوة' },
  { id: 'b:scapula', en: 'Scapula', ar: 'لوح الكتف' },
];

export const MUSCLE_GROUP_DEFS: readonly GroupDef[] = MUSCLE_GROUPS.map((g) => ({
  id: `m:${g.labelEn}`,
  en: g.labelEn,
  ar: g.label,
}));

export const CONTEXT_GROUPS: readonly GroupDef[] = [
  { id: 'c:eye', en: 'Eye muscles', ar: 'عضلات العين' },
  { id: 'c:pterygoid', en: 'Pterygoids', ar: 'العضلات الجناحية' },
  { id: 'c:suboccipital', en: 'Deep posterior neck', ar: 'عضلات الرقبة الخلفية العميقة' },
  { id: 'c:chest', en: 'Chest & shoulder', ar: 'الصدر والكتف' },
];

const NECK_SET = new Set(NECK_GROUP_NAMES);
export const FACE_MUSCLE_GROUP_IDS: readonly string[] = MUSCLE_GROUPS.filter((g) => !NECK_SET.has(g.labelEn)).map((g) => `m:${g.labelEn}`);
export const NECK_MUSCLE_GROUP_IDS: readonly string[] = MUSCLE_GROUPS.filter((g) => NECK_SET.has(g.labelEn)).map((g) => `m:${g.labelEn}`);
export const ALL_MUSCLE_GROUP_IDS: readonly string[] = MUSCLE_GROUP_DEFS.map((g) => g.id);
export const ALL_CONTEXT_IDS: readonly string[] = CONTEXT_GROUPS.map((g) => g.id);
export const ALL_BONE_IDS: readonly string[] = BONE_GROUPS.map((g) => g.id);

export const MUSCLE_GROUP_OF = new Map<string, string>();
for (const g of MUSCLE_GROUPS) for (const id of g.ids) MUSCLE_GROUP_OF.set(id, `m:${g.labelEn}`);

const OWNER = new Map<string, string>();
for (const [id, names] of Object.entries(MUSCLE_MESHES)) for (const n of names) OWNER.set(n, id);
const HEAD_BONE_SET = new Set(HEAD_BONES);

function boneGroup(name: string): string {
  if (/mandible/.test(name)) return 'b:mandible';
  if (/hyoid/.test(name)) return 'b:hyoid';
  if (/^(atlas|axis)$|cervical vertebra/.test(name)) return 'b:cervical';
  if (/thoracic vertebra/.test(name)) return 'b:thoracic';
  if (/rib$/.test(name)) return 'b:ribs';
  if (/sternum|manubrium|xiphoid/.test(name)) return 'b:sternum';
  if (/clavicle/.test(name)) return 'b:clavicle';
  if (/scapula/.test(name)) return 'b:scapula';
  return 'b:cranium';
}

function contextGroup(name: string): string {
  if (/pectoralis|deltoid|subclavius|serratus|ascending part/.test(name)) return 'c:chest';
  if (/pterygoid/.test(name)) return 'c:pterygoid';
  if (/capitis posterior|longissimus|splenius cervicis/.test(name)) return 'c:suboccipital';
  return 'c:eye';
}

export interface PartInfo {
  key: string;
  kind: 'bone' | 'muscle';
  name: string;
  muscleId: string | null;
  group: string;
  /** يتحرك مع الرأس */
  head: boolean;
  /** يتحرك مع الفك السفلي */
  jaw: boolean;
  depth: Depth;
}

const JAW_RE = /^(mandible|(left|right) (superficial part of masseter|deep part of masseter|medial pterygoid|inferior head of lateral pterygoid|mentalis|depressor labii inferioris|depressor anguli oris))$/;
const HEAD_CONTEXT_RE = /((superior|inferior|medial|lateral) rectus|superior oblique|inferior oblique|levator palpebrae|pterygoid)/;

const titleCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export function describePart(raw: string): PartInfo {
  const kind = raw.startsWith('b|') ? 'bone' : 'muscle';
  const name = raw.slice(2);
  const muscleId = kind === 'muscle' ? (OWNER.get(name) ?? null) : null;
  const group =
    kind === 'bone' ? boneGroup(name) : muscleId ? (MUSCLE_GROUP_OF.get(muscleId) ?? 'c:eye') : contextGroup(name);
  const head =
    kind === 'bone'
      ? HEAD_BONE_SET.has(name)
      : muscleId
        ? !NECK_GROUP_MEMBER.has(muscleId)
        : HEAD_CONTEXT_RE.test(name) && !/capitis/.test(name);
  const depth: Depth = muscleId ? (MUSCLE_DEPTH[muscleId] ?? 2) : contextDepth(name);
  return { key: raw, kind, name, muscleId, group, head, jaw: JAW_RE.test(name) || /pterygoid/.test(name), depth };
}

const NECK_GROUP_MEMBER = new Set<string>(
  MUSCLE_GROUPS.filter((g) => NECK_SET.has(g.labelEn)).flatMap((g) => [...g.ids]),
);

export function labelOfPart(p: PartInfo, en: (id: string) => string | undefined): string {
  const side = /^left /.test(p.name) ? 'Left' : /^right /.test(p.name) ? 'Right' : '';
  const base = p.muscleId ? (en(p.muscleId) ?? p.name) : titleCase(p.name.replace(/^(left|right) /, '').replace(/ \(2\)$/, ''));
  return side ? `${base} · ${side}` : base;
}

// ==================== الرؤية ====================
export interface Visibility {
  groups: ReadonlySet<string>;
  muscles: ReadonlySet<string>;
  parts: ReadonlySet<string>;
}

export const DEFAULT_VISIBILITY: Visibility = {
  groups: new Set(['c:chest']),
  muscles: new Set(),
  parts: new Set(),
};

export function partVisible(p: PartInfo, v: Visibility, peel: Depth): boolean {
  if (v.groups.has(p.group) || v.parts.has(p.key)) return false;
  if (p.kind === 'muscle') {
    if (p.muscleId && v.muscles.has(p.muscleId)) return false;
    if (p.depth < peel) return false;
  }
  return true;
}

export type PresetId = 'all' | 'neck' | 'anterior' | 'posterior' | 'skeleton' | 'muscles';

export const PRESETS: readonly { id: PresetId; en: string; ar: string }[] = [
  { id: 'all', en: 'All', ar: 'الكل' },
  { id: 'neck', en: 'Neck only', ar: 'الرقبة فقط' },
  { id: 'anterior', en: 'Anterior triangle', ar: 'المثلث الأمامي' },
  { id: 'posterior', en: 'Posterior triangle', ar: 'المثلث الخلفي' },
  { id: 'skeleton', en: 'Skeleton', ar: 'الهيكل العظمي' },
  { id: 'muscles', en: 'Muscles only', ar: 'العضلات فقط' },
];

const ANTERIOR_KEEP = ['scm', 'digastric', 'stylohyoid', 'mylohyoid', 'geniohyoid', 'omohyoid', 'sternohyoid', 'thyrohyoid', 'sternothyroid'];
const POSTERIOR_KEEP = ['scm', 'trapezius', 'spleniusCapitis', 'levatorScapulae', 'scaleneAnt', 'scaleneMid', 'scalenePost', 'omohyoid'];
export const ALL_MUSCLE_IDS = Object.keys(MUSCLE_MESHES);

function only(keep: readonly string[], extraGroups: readonly string[]): Visibility {
  const k = new Set(keep);
  return {
    groups: new Set([...ALL_CONTEXT_IDS, ...extraGroups]),
    muscles: new Set(ALL_MUSCLE_IDS.filter((id) => !k.has(id))),
    parts: new Set(),
  };
}

export function presetVisibility(id: PresetId): Visibility {
  switch (id) {
    case 'neck':
      return {
        groups: new Set([...FACE_MUSCLE_GROUP_IDS, 'm:Mastication (V3)', 'c:eye', 'c:pterygoid', 'c:chest']),
        muscles: new Set(),
        parts: new Set(),
      };
    case 'anterior':
      return only(ANTERIOR_KEEP, []);
    case 'posterior':
      return { ...only(POSTERIOR_KEEP, []), groups: new Set(['c:eye', 'c:pterygoid', 'c:chest']) };
    case 'skeleton':
      return { groups: new Set([...ALL_MUSCLE_GROUP_IDS, ...ALL_CONTEXT_IDS]), muscles: new Set(), parts: new Set() };
    case 'muscles':
      return { groups: new Set([...ALL_BONE_IDS, 'c:chest']), muscles: new Set(), parts: new Set() };
    default:
      return DEFAULT_VISIBILITY;
  }
}
