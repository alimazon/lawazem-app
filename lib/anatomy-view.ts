// lib/anatomy-view.ts
import { MUSCLES, ZOOMS, type Muscle, type ZoomId } from './anatomy-data';

export const W0 = 400;
export const H0 = 540;
export const LABEL_MARGIN = 170;

export type ViewBox = readonly [number, number, number, number];

export const canvasRatio = (labelsOn: boolean): number =>
  (W0 + (labelsOn ? 2 * LABEL_MARGIN : 0)) / H0;

export function viewBoxFor(zoom: ZoomId, labelsOn: boolean): ViewBox {
  const z = ZOOMS[zoom];
  const h = (z.size * H0) / W0;
  const w = h * canvasRatio(labelsOn);
  return [z.center[0] - w / 2, z.center[1] - h / 2, w, h];
}

export interface PlacedLabel {
  id: string;
  text: string;
  ax: number;
  ay: number;
  tx: number;
  ty: number;
  anchor: 'start' | 'end';
  sx: number;
  sy: number;
}

export interface LabelLayout {
  fs: number;
  items: PlacedLabel[];
}

interface Raw {
  m: Muscle;
  ax: number;
  ay: number;
  ly: number;
}

export function layoutLabels(
  vb: ViewBox,
  widthPx: number,
  emWidth: (text: string) => number,
): LabelLayout {
  if (!(widthPx > 0)) return { fs: 0, items: [] };

  const s = widthPx / vb[2];
  const fs = 11 / s;
  const lineH = fs * 1.45;
  const lists: [Raw[], Raw[]] = [[], []];

  for (const m of MUSCLES) {
    const ax = m.label.s === 'L' ? W0 - m.label.x : m.label.x;
    const ay = m.label.y;
    if (ax < vb[0] + fs || ax > vb[0] + vb[2] - fs || ay < vb[1] + fs || ay > vb[1] + vb[3] - fs) continue;
    lists[m.label.s === 'L' ? 0 : 1].push({ m, ax, ay, ly: ay });
  }

  const items: PlacedLabel[] = [];

  lists.forEach((list, si) => {
    list.sort((a, b) => a.ay - b.ay);

    for (let i = 1; i < list.length; i++) {
      const cur = list[i];
      const prev = list[i - 1];
      if (cur && prev && cur.ly < prev.ly + lineH) cur.ly = prev.ly + lineH;
    }

    const maxY = vb[1] + vb[3] - fs;
    for (let i = list.length - 1; i >= 0; i--) {
      const cur = list[i];
      if (!cur) continue;
      const lim = maxY - (list.length - 1 - i) * lineH;
      if (cur.ly > lim) cur.ly = lim;
    }

    for (const it of list) {
      const text = it.m.short ?? it.m.en;
      const x = si === 0 ? vb[0] + fs * 0.5 : vb[0] + vb[2] - fs * 0.5;
      const len = emWidth(text) * fs;
      items.push({
        id: it.m.id,
        text,
        ax: it.ax,
        ay: it.ay,
        tx: x,
        ty: it.ly + fs * 0.35,
        anchor: si === 0 ? 'start' : 'end',
        sx: si === 0 ? x + len + fs * 0.4 : x - len - fs * 0.4,
        sy: it.ly,
      });
    }
  });

  return { fs, items };
}