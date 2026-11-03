// lib/anatomy-surface.ts
/**
 * سطح تقريبي للرأس والرقبة.
 * مصدر واحد لشكل الرقبة في الرسم 2D ولمجسّم الـ 3D:
 * يحوّل إحداثيات الرسم (x, y) إلى عمق z حتى تستند عضلات الـ 3D إلى نفس إحداثيات الـ SVG.
 */

export const CX = 200;
/** وحدات الرسم لكل وحدة عالم في three.js */
export const UNITS = 100;
/** y في الرسم يقابل Y = 0 في العالم */
export const Y0 = 330;

/** [y, نصف العرض, العمق الأمامي, العمق الخلفي] */
export type SurfaceRow = readonly [number, number, number, number];

export const HEAD_TABLE: readonly SurfaceRow[] = [
  [18, 0, 0, 0],
  [19.6, 23, 14, 12],
  [31, 61, 44, 40],
  [54, 90, 72, 66],
  [86, 109, 94, 82],
  [127, 119, 106, 92],
  [170, 120, 112, 96],
  [247, 117, 106, 92],
  [330, 106, 96, 82],
  [367, 90, 84, 72],
  [389, 72, 70, 62],
  [408, 48, 48, 50],
  [421, 26, 28, 34],
  [427, 9, 12, 14],
  [430, 0, 0, 0],
];

export const NECK_TABLE: readonly SurfaceRow[] = [
  [370, 70, 20, 50],
  [430, 84, 36, 54],
  [490, 96, 46, 58],
  [540, 106, 52, 62],
  [570, 126, 56, 66],
  [596, 166, 64, 74],
  [616, 196, 72, 82],
  [700, 198, 74, 84],
  [780, 198, 74, 84],
];

export function sampleTable(table: readonly SurfaceRow[], y: number): SurfaceRow {
  const first = table[0];
  const last = table[table.length - 1];
  if (!first || !last) return [y, 0, 0, 0];
  if (y <= first[0]) return [y, first[1], first[2], first[3]];
  if (y >= last[0]) return [y, last[1], last[2], last[3]];
  for (let i = 1; i < table.length; i++) {
    const b = table[i];
    const a = table[i - 1];
    if (!a || !b || y > b[0]) continue;
    const t = (y - a[0]) / (b[0] - a[0] || 1);
    return [y, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t];
  }
  return [y, last[1], last[2], last[3]];
}

const smooth = (t: number): number => t * t * (3 - 2 * t);
const clamp01 = (t: number): number => Math.max(0, Math.min(1, t));

function ellipseZ(w: number, depth: number, x: number): number {
  if (w <= 0.01 || depth <= 0.01) return 0;
  const u = Math.max(-0.97, Math.min(0.97, (x - CX) / w));
  return depth * Math.sqrt(1 - u * u);
}

/** منطقة المزج بين الرأس والرقبة (تحت الذقن) */
const BLEND_FROM = 412;
const BLEND_TO = 440;

/** عمق السطح الأمامي عند النقطة (x, y) بوحدات الرسم */
export function surfaceZ(x: number, y: number): number {
  const h = sampleTable(HEAD_TABLE, y);
  const n = sampleTable(NECK_TABLE, y);
  const zh = ellipseZ(h[1], h[2], x);
  const zn = ellipseZ(n[1], n[2], x);
  if (y <= BLEND_FROM) return zh;
  if (y >= BLEND_TO) return zn;
  const t = smooth(clamp01((y - BLEND_FROM) / (BLEND_TO - BLEND_FROM)));
  return zh * (1 - t) + zn * t;
}

/** إحداثيات العالم (three.js) لنقطة من الرسم رُفعت `lift` وحدة عن السطح */
export function toWorld(x: number, y: number, z: number): [number, number, number] {
  return [(x - CX) / UNITS, (Y0 - y) / UNITS, z / UNITS];
}

export function surfacePoint(x: number, y: number, lift: number): [number, number, number] {
  return toWorld(x, y, surfaceZ(x, y) + lift);
}

// ==================== مخطط الرقبة للرسم 2D ====================
function neckSide(sign: 1 | -1, ys: readonly number[]): [number, number][] {
  return ys.map((y) => [CX + sign * sampleTable(NECK_TABLE, y)[1], y]);
}

function buildNeckOutline(): string {
  const ys: number[] = [];
  for (let y = 380; y <= 700; y += 16) ys.push(y);
  const right = neckSide(1, ys);
  const left = neckSide(-1, ys).reverse();
  const pts = [...right, ...left];
  return (
    pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${Math.round(x * 10) / 10},${y}`).join('') + 'Z'
  );
}

/** مسار الرقبة والكتفين (يُرسم خلف الرأس) */
export const NECK_OUTLINE: string = buildNeckOutline();
