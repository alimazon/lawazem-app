// lib/anatomy-data.ts
/**
 * بيانات أطلس عضلات الوجه.
 * المصطلحات الطبية بالإنجليزية (كما تُدرَّس في كلية الطب).
 * الواجهة (العناوين، التبويبات، الأزرار) بالعربية.
 */

// ==================== Types ====================
export type ZoomId = 'whole' | 'eyes' | 'nose' | 'mouth' | 'side' | 'neck';

export interface FanGeometry {
  type: 'fan';
  n: number;
  bulge: number;
  A: readonly number[];
  B: readonly number[];
}

export interface RingGeometry {
  type: 'ring';
  n: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  irx: number;
  iry: number;
}

export type Geometry = FanGeometry | RingGeometry;

export interface Muscle {
  id: string;
  paired: boolean;
  zoom: ZoomId;
  geometry: Geometry;
  en: string;
  short?: string;
  label: { s: 'L' | 'R'; x: number; y: number };
  nerve: string;
  origin: string;
  insertion: string;
  actEn: string;
  clin: string;
  arrows: readonly (readonly [number, number, number, number])[];
  pose: Record<string, number>;
  region?: string;
}

// ==================== Muscles ====================
export const MUSCLES: readonly Muscle[] = [
  {
    id: 'platysma',
    paired: true,
    zoom: 'neck',
    geometry: { type: 'fan', n: 13, bulge: 3,
      A: [206, 530, 206, 490, 204, 462, 204, 436],
      B: [262, 530, 262, 490, 264, 440, 262, 398] },
    en: 'Platysma',
    label: { s: 'R', x: 240, y: 470 },
    nerve: 'Facial nerve (CN VII), cervical branch',
    origin: 'Fascia over the upper pectoralis major and deltoid',
    insertion: 'Inferior border of the mandible, skin of the lower face and angle of the mouth',
    actEn: 'Depresses the mandible and lower lip, and tenses the skin of the neck.',
    clin: 'Stands out as vertical bands in the neck during effort or grimacing.',
    arrows: [[236, 438, 246, 500]],
    pose: { ld: 0.6, jaw: 0.35, nk: 1, smile: -0.3 },
  },
  {
    id: 'masseter',
    paired: true,
    zoom: 'side',
    geometry: { type: 'fan', n: 12, bulge: 4,
      A: [280, 296, 280, 320, 276, 350, 270, 372],
      B: [304, 290, 308, 312, 306, 340, 292, 364] },
    en: 'Masseter',
    label: { s: 'R', x: 296, y: 332 },
    nerve: 'Mandibular nerve (CN V3), masseteric nerve',
    origin: 'Zygomatic arch',
    insertion: 'Lateral surface of the ramus and angle of the mandible',
    actEn: 'Elevates the mandible (closes the jaw). It is a main muscle of mastication.',
    clin: 'A muscle of mastication, so it is supplied by the trigeminal nerve, not the facial nerve. Spasm causes trismus.',
    arrows: [[292, 376, 292, 316]],
    pose: { cl: 1 },
  },
  {
    id: 'temporalis',
    paired: true,
    zoom: 'side',
    geometry: { type: 'fan', n: 13, bulge: 4,
      A: [296, 258, 290, 226, 288, 186, 294, 132],
      B: [300, 260, 314, 228, 322, 196, 312, 140] },
    en: 'Temporalis',
    label: { s: 'R', x: 306, y: 196 },
    nerve: 'Mandibular nerve (CN V3), deep temporal nerves',
    origin: 'Temporal fossa and temporal fascia',
    insertion: 'Coronoid process and anterior border of the ramus of the mandible',
    actEn: 'Elevates the mandible; its posterior fibres retract it (chewing).',
    clin: 'A muscle of mastication; it bulges at the temple when you clench your teeth.',
    arrows: [[304, 252, 306, 192]],
    pose: { tb: 1, cl: 0.5 },
  },
  {
    id: 'frontalis',
    paired: true,
    zoom: 'eyes',
    geometry: { type: 'fan', n: 16, bulge: 6,
      A: [204, 152, 203, 120, 204, 96, 208, 66],
      B: [292, 156, 298, 128, 296, 100, 282, 84] },
    en: 'Frontalis',
    label: { s: 'L', x: 250, y: 104 },
    nerve: 'Facial nerve (CN VII), temporal branch',
    origin: 'Epicranial aponeurosis (galea aponeurotica)',
    insertion: 'Skin of the eyebrows and forehead',
    actEn: 'Raises the eyebrows and wrinkles the forehead horizontally (surprise).',
    clin: 'In an upper motor neuron facial palsy the forehead is spared (bilateral cortical input); in a lower motor neuron palsy such as Bell’s palsy it is paralysed.',
    arrows: [[236, 146, 236, 108], [270, 150, 270, 116]],
    pose: { br: 1, fh: 1 },
  },
  {
    id: 'buccinator',
    paired: true,
    zoom: 'mouth',
    geometry: { type: 'fan', n: 10, bulge: 3,
      A: [254, 358, 268, 352, 282, 348, 294, 347],
      B: [256, 362, 262, 372, 268, 380, 274, 383] },
    en: 'Buccinator',
    label: { s: 'R', x: 272, y: 368 },
    nerve: 'Facial nerve (CN VII), buccal branch',
    origin: 'Maxilla and mandible (alveolar processes opposite the molars), pterygomandibular raphe',
    insertion: 'Orbicularis oris at the angle of the mouth (modiolus)',
    actEn: 'Compresses the cheek against the teeth: keeps food between the teeth while chewing, and is used in blowing and sucking.',
    clin: 'In facial palsy food collects between the cheek and the gums.',
    arrows: [[262, 370, 292, 362]],
    pose: { ck: 1, out: 0.3 },
  },
  {
    id: 'orbOris',
    paired: false,
    zoom: 'mouth',
    geometry: { type: 'ring', n: 13, cx: 200, cy: 347, rx: 54, ry: 25, irx: 34, iry: 7 },
    en: 'Orbicularis oris',
    label: { s: 'R', x: 216, y: 327 },
    nerve: 'Facial nerve (CN VII), buccal and marginal mandibular branches',
    origin: 'Modiolus, maxilla and mandible near the midline; fibres of the other perioral muscles',
    insertion: 'Skin and mucous membrane of the lips (fibres encircle the mouth)',
    actEn: 'Closes and purses the lips (kissing, whistling, speech).',
    clin: 'Weakness causes drooling and difficulty whistling or blowing.',
    arrows: [[146, 346, 166, 346], [254, 346, 234, 346], [200, 318, 200, 336], [200, 376, 200, 358]],
    pose: { purse: 1 },
  },
  {
    id: 'orbOculi',
    paired: true,
    zoom: 'eyes',
    geometry: { type: 'ring', n: 15, cx: 248, cy: 202, rx: 46, ry: 35, irx: 21, iry: 8 },
    en: 'Orbicularis oculi',
    label: { s: 'R', x: 284, y: 226 },
    nerve: 'Facial nerve (CN VII), temporal and zygomatic branches',
    origin: 'Medial orbital margin, medial palpebral ligament, lacrimal bone',
    insertion: 'Skin around the orbit, eyelids (tarsal plates), lateral palpebral raphe',
    actEn: 'Closes the eyelids: the palpebral part blinks gently, the orbital part squeezes the eye shut forcefully.',
    clin: 'In Bell’s palsy the eye cannot close (lagophthalmos), risking dry eye and corneal ulceration.',
    arrows: [[300, 202, 278, 202], [248, 160, 248, 182], [248, 244, 248, 222]],
    pose: { eye: 1, sq: 1, bd: 0.4 },
  },
  {
    id: 'nasalis',
    paired: true,
    zoom: 'nose',
    geometry: { type: 'fan', n: 8, bulge: 2,
      A: [226, 300, 222, 282, 216, 262, 208, 244],
      B: [214, 304, 212, 286, 208, 266, 204, 248] },
    en: 'Nasalis',
    label: { s: 'L', x: 214, y: 270 },
    nerve: 'Facial nerve (CN VII), buccal branch',
    origin: 'Maxilla (above the lateral incisor)',
    insertion: 'Transverse part: aponeurosis over the bridge of the nose. Alar part: alar cartilage',
    actEn: 'Transverse part compresses the nostrils; alar part flares them.',
    clin: 'The nostrils flare in respiratory distress.',
    arrows: [[228, 302, 246, 306]],
    pose: { flare: 1 },
  },
  {
    id: 'llsan',
    paired: true,
    zoom: 'nose',
    geometry: { type: 'fan', n: 8, bulge: 2,
      A: [224, 236, 222, 256, 222, 282, 224, 310],
      B: [234, 238, 236, 258, 238, 284, 234, 314] },
    en: 'Levator labii superioris alaeque nasi',
    short: 'Lev. labii sup. alaeque nasi',
    label: { s: 'R', x: 233, y: 280 },
    nerve: 'Facial nerve (CN VII), zygomatic and buccal branches',
    origin: 'Frontal process of the maxilla',
    insertion: 'Alar cartilage and skin of the upper lip',
    actEn: 'Elevates the upper lip and dilates the nostril.',
    clin: 'Takes part in the expression of disgust (sneer).',
    arrows: [[236, 318, 234, 262]],
    pose: { lu: 1, flare: 1, nlf: 1 },
  },
  {
    id: 'lls',
    paired: true,
    zoom: 'nose',
    geometry: { type: 'fan', n: 10, bulge: 3,
      A: [244, 240, 242, 262, 238, 290, 232, 318],
      B: [262, 244, 260, 266, 252, 296, 246, 324] },
    en: 'Levator labii superioris',
    label: { s: 'L', x: 252, y: 272 },
    nerve: 'Facial nerve (CN VII), zygomatic and buccal branches',
    origin: 'Infraorbital margin of the maxilla (above the infraorbital foramen)',
    insertion: 'Skin and muscle of the upper lip',
    actEn: 'Elevates the upper lip and deepens the nasolabial fold.',
    clin: 'Lies over the infraorbital foramen, the site of an infraorbital nerve block.',
    arrows: [[250, 318, 254, 264]],
    pose: { lu: 1, nlf: 1 },
  },
  {
    id: 'zmin',
    paired: true,
    zoom: 'nose',
    geometry: { type: 'fan', n: 7, bulge: 2,
      A: [270, 252, 268, 272, 260, 300, 252, 322],
      B: [282, 258, 280, 280, 270, 306, 260, 326] },
    en: 'Zygomaticus minor',
    label: { s: 'L', x: 276, y: 288 },
    nerve: 'Facial nerve (CN VII), zygomatic and buccal branches',
    origin: 'Lateral surface of the zygomatic bone',
    insertion: 'Upper lip (blends with orbicularis oris)',
    actEn: 'Elevates the upper lip and contributes to the nasolabial fold.',
    clin: 'Lies medial to zygomaticus major.',
    arrows: [[262, 322, 278, 264]],
    pose: { lu: 0.6, nlf: 0.8, smile: 0.2 },
  },
  {
    id: 'zmaj',
    paired: true,
    zoom: 'mouth',
    geometry: { type: 'fan', n: 9, bulge: 2,
      A: [292, 262, 284, 286, 270, 312, 252, 346],
      B: [304, 272, 296, 300, 278, 326, 256, 356] },
    en: 'Zygomaticus major',
    label: { s: 'R', x: 278, y: 304 },
    nerve: 'Facial nerve (CN VII), zygomatic and buccal branches',
    origin: 'Zygomatic bone (anterior to the zygomaticotemporal suture)',
    insertion: 'Angle of the mouth (modiolus)',
    actEn: 'Draws the angle of the mouth upward and laterally (smiling).',
    clin: 'The main smiling muscle. In Bell’s palsy the corner of the mouth droops on the affected side.',
    arrows: [[254, 354, 294, 284]],
    pose: { smile: 1, out: 0.6, nlf: 0.8 },
  },
  {
    id: 'lao',
    paired: true,
    zoom: 'mouth',
    geometry: { type: 'fan', n: 6, bulge: 2,
      A: [243, 322, 242, 332, 243, 342, 245, 352],
      B: [256, 322, 257, 332, 256, 342, 252, 352] },
    en: 'Levator anguli oris',
    label: { s: 'L', x: 250, y: 338 },
    nerve: 'Facial nerve (CN VII), buccal branch',
    origin: 'Canine fossa of the maxilla (below the infraorbital foramen)',
    insertion: 'Angle of the mouth (modiolus)',
    actEn: 'Elevates the angle of the mouth (assists in smiling).',
    clin: 'A deep muscle lying beneath levator labii superioris.',
    arrows: [[248, 346, 248, 304]],
    pose: { smile: 0.6, lu: 0.2, nlf: 0.8 },
  },
  {
    id: 'risorius',
    paired: true,
    zoom: 'mouth',
    geometry: { type: 'fan', n: 6, bulge: 1,
      A: [300, 330, 286, 336, 270, 342, 254, 347],
      B: [302, 340, 288, 348, 272, 355, 255, 355] },
    en: 'Risorius',
    label: { s: 'L', x: 284, y: 344 },
    nerve: 'Facial nerve (CN VII), buccal branch',
    origin: 'Parotid fascia and fascia over the masseter',
    insertion: 'Skin at the angle of the mouth (modiolus)',
    actEn: 'Retracts the angle of the mouth laterally (grin / grimace).',
    clin: 'A weak muscle that is absent in some people.',
    arrows: [[258, 350, 298, 334]],
    pose: { out: 1, smile: 0.15 },
  },
  {
    id: 'dao',
    paired: true,
    zoom: 'mouth',
    geometry: { type: 'fan', n: 9, bulge: 3,
      A: [251, 358, 252, 372, 254, 386, 256, 398],
      B: [250, 360, 246, 374, 242, 386, 238, 396] },
    en: 'Depressor anguli oris',
    label: { s: 'R', x: 250, y: 384 },
    nerve: 'Facial nerve (CN VII), marginal mandibular branch',
    origin: 'Oblique line of the mandible',
    insertion: 'Angle of the mouth (modiolus)',
    actEn: 'Depresses the angle of the mouth (frowning, sadness).',
    clin: 'Gives the downturned mouth of sadness; weakness of the marginal mandibular branch makes the smile asymmetric.',
    arrows: [[254, 362, 256, 400]],
    pose: { smile: -1, mar: 1 },
  },
  {
    id: 'dli',
    paired: true,
    zoom: 'mouth',
    geometry: { type: 'fan', n: 8, bulge: 3,
      A: [238, 400, 236, 392, 232, 382, 230, 372],
      B: [222, 404, 221, 394, 218, 384, 216, 374] },
    en: 'Depressor labii inferioris',
    label: { s: 'L', x: 228, y: 388 },
    nerve: 'Facial nerve (CN VII), marginal mandibular branch',
    origin: 'Oblique line of the mandible (between the symphysis and the mental foramen)',
    insertion: 'Skin of the lower lip and orbicularis oris',
    actEn: 'Depresses the lower lip and draws it slightly laterally.',
    clin: 'Exposes the lower teeth in speaking and smiling.',
    arrows: [[228, 376, 232, 408]],
    pose: { ld: 1, out: 0.2 },
  },
  {
    id: 'mentalis',
    paired: true,
    zoom: 'mouth',
    geometry: { type: 'fan', n: 7, bulge: 5,
      A: [202, 386, 201, 398, 200, 410, 202, 424],
      B: [204, 386, 214, 396, 216, 412, 204, 426] },
    en: 'Mentalis',
    label: { s: 'L', x: 207, y: 410 },
    nerve: 'Facial nerve (CN VII), marginal mandibular branch',
    origin: 'Incisive fossa of the mandible',
    insertion: 'Skin of the chin',
    actEn: 'Elevates and protrudes the lower lip and wrinkles the skin of the chin (pouting, doubt).',
    clin: 'Overactivity gives a dimpled, "pebbled" chin.',
    arrows: [[206, 424, 206, 390]],
    pose: { lup: 1, ped: 1, purse: 0.25 },
  },
  {
    id: 'corrugator',
    paired: true,
    zoom: 'eyes',
    geometry: { type: 'fan', n: 7, bulge: 2,
      A: [212, 170, 226, 160, 244, 152, 266, 150],
      B: [214, 178, 228, 172, 246, 160, 268, 158] },
    en: 'Corrugator supercilii',
    label: { s: 'R', x: 246, y: 158 },
    nerve: 'Facial nerve (CN VII), temporal and zygomatic branches',
    origin: 'Medial end of the superciliary arch',
    insertion: 'Skin of the medial half of the eyebrow',
    actEn: 'Draws the eyebrows medially and downward, producing vertical frown lines.',
    clin: 'Responsible for the vertical frown lines between the eyebrows.',
    arrows: [[264, 156, 222, 174]],
    pose: { bi: 1, bd: 0.35, gl: 1 },
  },
  {
    id: 'procerus',
    paired: false,
    zoom: 'eyes',
    geometry: { type: 'fan', n: 8, bulge: 3,
      A: [197, 232, 196, 210, 193, 192, 190, 172],
      B: [203, 232, 204, 210, 207, 192, 210, 172] },
    en: 'Procerus',
    label: { s: 'R', x: 204, y: 198 },
    nerve: 'Facial nerve (CN VII), temporal and zygomatic branches',
    origin: 'Nasal bone and upper lateral nasal cartilage',
    insertion: 'Skin of the glabella (between the eyebrows)',
    actEn: 'Pulls the medial end of the eyebrows downward, creating transverse wrinkles over the bridge of the nose.',
    clin: 'Works with corrugator to give an angry or concentrating look.',
    arrows: [[200, 176, 200, 224]],
    pose: { bd: 0.8, bi: 0.3, nr: 1 },
  },
  {
    id: 'depSepti',
    paired: false,
    zoom: 'nose',
    geometry: { type: 'fan', n: 5, bulge: 2,
      A: [197, 326, 197, 316, 197, 308, 198, 300],
      B: [203, 326, 203, 316, 203, 308, 202, 300] },
    en: 'Depressor septi nasi',
    label: { s: 'L', x: 200, y: 314 },
    nerve: 'Facial nerve (CN VII), buccal branch',
    origin: 'Maxilla (above the central incisor)',
    insertion: 'Nasal septum and alar part of nasalis',
    actEn: 'Pulls the nasal septum and the tip of the nose downward and widens the nostrils.',
    clin: 'Pulls the nose tip down when smiling in some people.',
    arrows: [[200, 304, 200, 330]],
    pose: { td: 1, flare: 0.5 },
  },
];

// ==================== Groups (with Arabic translations) ====================
export const MUSCLE_GROUPS: readonly {
  label: string;
  labelEn: string;
  ids: readonly string[];
}[] = [
  { label: 'الجبين والحاجب', labelEn: 'Forehead & brow', ids: ['frontalis', 'corrugator', 'procerus'] },
  { label: 'حول العين',      labelEn: 'Around the eye',    ids: ['orbOculi'] },
  { label: 'الأنف',           labelEn: 'Nose',             ids: ['nasalis', 'depSepti', 'llsan'] },
  { label: 'الشفة العليا والوجنة', labelEn: 'Upper lip & cheek', ids: ['lls', 'zmin', 'zmaj', 'lao', 'risorius', 'buccinator'] },
  { label: 'الفم والذقن',    labelEn: 'Mouth & chin',     ids: ['orbOris', 'dao', 'dli', 'mentalis'] },
  { label: 'الرقبة',          labelEn: 'Neck',             ids: ['platysma'] },
  { label: 'المضغ (عصب مثلث التوائم V3)', labelEn: 'Mastication (V3)', ids: ['masseter', 'temporalis'] },
];

// ==================== Zoom Presets ====================
export interface ZoomPreset {
  center: readonly [number, number];
  size: number;
  labelAr: string;
  labelEn: string;
}

export const ZOOMS: Record<ZoomId, ZoomPreset> = {
  whole: { center: [200, 270], size: 400, labelAr: 'الوجه كامل',      labelEn: 'Whole face' },
  eyes:  { center: [200, 165], size: 230, labelAr: 'الجبين والعينان', labelEn: 'Forehead & eyes' },
  nose:  { center: [210, 285], size: 170, labelAr: 'الأنف',            labelEn: 'Nose' },
  mouth: { center: [215, 365], size: 210, labelAr: 'الفم والذقن',      labelEn: 'Mouth & chin' },
  side:  { center: [255, 230], size: 200, labelAr: 'الوجنة والصدغ',    labelEn: 'Cheek & temple' },
  neck:  { center: [200, 390], size: 280, labelAr: 'الرقبة',           labelEn: 'Neck' },
};

// ==================== Lookup Helpers ====================
export const MUSCLE_BY_ID: Record<string, Muscle> = (() => {
  const map: Record<string, Muscle> = {};
  for (const m of MUSCLES) map[m.id] = m;
  return map;
})();

// Attach region names for display
for (const g of MUSCLE_GROUPS) {
  for (const id of g.ids) {
    if (MUSCLE_BY_ID[id]) MUSCLE_BY_ID[id].region = g.label;
  }
}