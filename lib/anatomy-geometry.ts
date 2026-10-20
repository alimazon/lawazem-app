// lib/anatomy-geometry.ts
import { MUSCLES, type FanGeometry, type Muscle, type RingGeometry } from './anatomy-data';

export interface BuiltGeometry {
  d: string;
  dark: string;
  light: string;
  evenodd: boolean;
}

const f1 = (n: number): number => Math.round(n * 10) / 10;
const at = (a: readonly number[], i: number): number => a[i] ?? 0;

function fan(g: FanGeometry): BuiltGeometry {
  const { A, B, n, bulge } = g;
  let dark = '';
  let light = '';

  for (let i = 1; i < n; i++) {
    const u = i / n;
    const p: number[] = [];
    for (let k = 0; k < 8; k++) p.push(f1(at(A, k) + (at(B, k) - at(A, k)) * u));
    const seg = `M${p[0]},${p[1]}C${p[2]},${p[3]} ${p[4]},${p[5]} ${p[6]},${p[7]}`;
    if (i % 2) dark += seg;
    else light += seg;
  }

  const cap = (
    px: number, py: number, qx: number, qy: number,
    pcx: number, pcy: number, qcx: number, qcy: number,
  ): string => {
    const mx = (px + qx) / 2;
    const my = (py + qy) / 2;
    const cx = (pcx + qcx) / 2;
    const cy = (pcy + qcy) / 2;
    const dx = mx - cx;
    const dy = my - cy;
    const len = Math.hypot(dx, dy) || 1;
    const w = Math.hypot(px - qx, py - qy);
    const off = w < 2 ? 0 : 2 * bulge;
    return `${f1(mx + (dx / len) * off)},${f1(my + (dy / len) * off)}`;
  };

  const end = cap(at(A, 6), at(A, 7), at(B, 6), at(B, 7), at(A, 4), at(A, 5), at(B, 4), at(B, 5));
  const start = cap(at(B, 0), at(B, 1), at(A, 0), at(A, 1), at(B, 2), at(B, 3), at(A, 2), at(A, 3));

  const d =
    `M${A[0]},${A[1]}C${A[2]},${A[3]} ${A[4]},${A[5]} ${A[6]},${A[7]}` +
    `Q${end} ${B[6]},${B[7]}` +
    `C${B[4]},${B[5]} ${B[2]},${B[3]} ${B[0]},${B[1]}` +
    `Q${start} ${A[0]},${A[1]}Z`;

  return { d, dark, light, evenodd: false };
}

function ell(cx: number, cy: number, rx: number, ry: number): string {
  return (
    `M${f1(cx - rx)},${f1(cy)}` +
    `a${f1(rx)},${f1(ry)} 0 1,0 ${f1(2 * rx)},0` +
    `a${f1(rx)},${f1(ry)} 0 1,0 ${f1(-2 * rx)},0Z`
  );
}

function ring(g: RingGeometry): BuiltGeometry {
  let dark = '';
  let light = '';
  for (let i = 1; i < g.n; i++) {
    const u = i / g.n;
    const p = ell(g.cx, g.cy, g.irx + (g.rx - g.irx) * u, g.iry + (g.ry - g.iry) * u);
    if (i % 2) dark += p;
    else light += p;
  }
  return {
    d: ell(g.cx, g.cy, g.rx, g.ry) + ell(g.cx, g.cy, g.irx, g.iry),
    dark,
    light,
    evenodd: true,
  };
}

export function buildGeometry(m: Muscle): BuiltGeometry {
  return m.geometry.type === 'ring' ? ring(m.geometry) : fan(m.geometry);
}

export const GEOMETRY: Readonly<Record<string, BuiltGeometry>> = (() => {
  const out: Record<string, BuiltGeometry> = {};
  for (const m of MUSCLES) out[m.id] = buildGeometry(m);
  return out;
})();