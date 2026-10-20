// lib/anatomy-pose.ts
export type Pose = Readonly<Record<string, number>>;

const r2 = (x: number): number => Math.round(x * 100) / 100;
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

export function scalePose(pose: Pose, k: number): Pose {
  const out: Record<string, number> = {};
  for (const key of Object.keys(pose)) out[key] = (pose[key] ?? 0) * k;
  return out;
}

export function combinePoses(
  parts: readonly { pose: Pose; w?: number }[],
  extra: Pose = {},
): Pose {
  const out: Record<string, number> = {};
  for (const { pose, w = 1 } of parts) {
    for (const key of Object.keys(pose)) {
      const v = (pose[key] ?? 0) * w;
      if (Math.abs(v) > Math.abs(out[key] ?? 0)) out[key] = v;
    }
  }
  for (const key of Object.keys(extra)) out[key] = extra[key] ?? 0;
  return out;
}

export interface FaceShape {
  head: string;
  eyeL: string;
  eyeR: string;
  irisOpacity: number;
  browL: string;
  browR: string;
  noseWingL: string;
  noseWingR: string;
  noseBase: string;
  nostril: { lx: number; rx: number; y: number; rad: number };
  mouth: string;
  nlfL: string;
  nlfR: string;
  nlfOpacity: number;
  marL: string;
  marR: string;
  marOpacity: number;
  purse: readonly [string, string, string, string];
  op: {
    purse: number; forehead: number; glabella: number; nose: number; squint: number;
    temple: number; clench: number; cheek: number; chin: number; neck: number;
  };
}

export function computeFace(P: Pose): FaceShape {
  const g = (k: string): number => P[k] ?? 0;

  const hy = r2(222 + g('jaw') * 10);
  const head =
    `M110,14 C62,14 40,52 40,100 C40,142 50,176 68,198 C80,212 96,${hy} 110,${hy} ` +
    `C124,${hy} 140,212 152,198 C170,176 180,142 180,100 C180,52 158,14 110,14 Z`;

  const e = g('eye');
  const eyePath = (cx: number): string =>
    `M${cx - 14},98 Q${cx},${r2(82 + 22 * e)} ${cx + 14},98 Q${cx},${r2(112 - 8 * e)} ${cx - 14},98 Z`;

  const br = g('br');
  const bi = g('bi');
  const bd = g('bd');
  const A: [number, number] = [124 - 7 * bi, 80 + 6 * bi + 8 * bd - 5 * br];
  const B: [number, number] = [140, 71 - 11 * br + 8 * bd + 3 * bi];
  const C: [number, number] = [156, 79 - 10 * br + 7 * bd - bi];

  const wf = g('flare') * 4;
  const wy = -3 * g('lu') + 3 * g('td');

  const sm = g('smile');
  const pu = g('purse');
  const cy = 170 - 7 * sm;
  const hw = 20 + 6 * g('out') - 7 * pu + 3 * Math.max(sm, 0);
  const Lx = 110 - hw;
  const Rx = 110 + hw;
  const ty = 166 - 4 * g('lu') - 3 * pu - Math.max(sm, 0);
  const by = 174 + 10 * g('ld') + 12 * g('jaw') - 3 * g('lup') + 3 * pu;

  const nlf = g('nlf');

  return {
    head,
    eyeL: eyePath(80),
    eyeR: eyePath(140),
    irisOpacity: clamp01(1 - e < 0.15 ? 0 : 1 - e),
    browR: `M${r2(A[0])},${r2(A[1])} Q${B[0]},${r2(B[1])} ${C[0]},${r2(C[1])}`,
    browL: `M${r2(220 - A[0])},${r2(A[1])} Q${220 - B[0]},${r2(B[1])} ${r2(220 - C[0])},${r2(C[1])}`,
    noseWingR: `M122,146 Q${r2(130 + wf)},${r2(152 + wy)} ${r2(126 + wf)},${r2(160 + wy)}`,
    noseWingL: `M98,146 Q${r2(90 - wf)},${r2(152 + wy)} ${r2(94 - wf)},${r2(160 + wy)}`,
    noseBase: `M${r2(94 - wf)},${r2(160 + wy)} Q110,${r2(168 + wy)} ${r2(126 + wf)},${r2(160 + wy)}`,
    nostril: { lx: r2(102 - wf * 0.6), rx: r2(118 + wf * 0.6), y: r2(158.5 + wy), rad: r2(3 + g('flare') * 1.5) },
    mouth: `M${r2(Lx)},${r2(cy)} Q110,${r2(ty)} ${r2(Rx)},${r2(cy)} Q110,${r2(by)} ${r2(Lx)},${r2(cy)} Z`,
    nlfR: `M124,152 Q${r2(134 + 3 * nlf)},162 ${r2(Rx + 3)},${r2(cy - 3)}`,
    nlfL: `M96,152 Q${r2(86 - 3 * nlf)},162 ${r2(Lx - 3)},${r2(cy - 3)}`,
    nlfOpacity: clamp01(0.3 + 0.55 * nlf),
    marR: `M${r2(Rx)},${r2(cy + 3)} Q${r2(Rx + 2)},${r2(cy + 12)} ${r2(Rx - 1)},${r2(cy + 22)}`,
    marL: `M${r2(Lx)},${r2(cy + 3)} Q${r2(Lx - 2)},${r2(cy + 12)} ${r2(Lx + 1)},${r2(cy + 22)}`,
    marOpacity: clamp01(g('mar')),
    purse: [
      `M${r2(Lx - 3)},${r2(cy - 2)} l-6,-3`,
      `M${r2(Lx - 3)},${r2(cy + 2)} l-6,3`,
      `M${r2(Rx + 3)},${r2(cy - 2)} l6,-3`,
      `M${r2(Rx + 3)},${r2(cy + 2)} l6,3`,
    ],
    op: {
      purse: clamp01(pu),
      forehead: clamp01(g('fh')),
      glabella: clamp01(g('gl')),
      nose: clamp01(g('nr')),
      squint: clamp01(g('sq')),
      temple: clamp01(g('tb')),
      clench: clamp01(g('cl')),
      cheek: clamp01(g('ck')),
      chin: clamp01(g('ped')),
      neck: clamp01(g('nk')),
    },
  };
}