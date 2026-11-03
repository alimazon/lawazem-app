// lib/anatomy-layers.ts
/** عمق كل عضلة من السطح إلى العمق (للتقشير في وضع 3D): 1 سطحية … 4 الأعمق */
export type Depth = 1 | 2 | 3 | 4;

export const DEPTH_LABEL: Readonly<Record<Depth, string>> = {
  1: 'سطحية',
  2: 'متوسطة',
  3: 'عميقة',
  4: 'الأعمق',
};

export const MUSCLE_DEPTH: Readonly<Record<string, Depth>> = {
  platysma: 1, frontalis: 1, orbOculi: 1, orbOris: 1, nasalis: 1, procerus: 1,
  lls: 1, llsan: 1, lao: 2, zmin: 1, zmaj: 1, risorius: 1, dao: 1, dli: 1, mentalis: 1, depSepti: 2,
  buccinator: 2, masseter: 1, temporalis: 2, corrugator: 2,
  scm: 1, trapezius: 1,
  digastric: 2, stylohyoid: 2, mylohyoid: 2, omohyoid: 2, sternohyoid: 2,
  spleniusCapitis: 2, levatorScapulae: 2,
  geniohyoid: 3, thyrohyoid: 3, sternothyroid: 3, scaleneAnt: 3, scaleneMid: 3, scalenePost: 3,
  longusCapitis: 4, longusColli: 4, rcAnterior: 4, rcLateralis: 4,
};

/** عضلات السياق (غير المدرجة في الأطلس) */
export function contextDepth(name: string): Depth {
  if (/pterygoid|rectus|oblique|levator palpebrae/.test(name) && !/capitis/.test(name)) return 3;
  if (/capitis posterior/.test(name)) return 4;
  return 3;
}
