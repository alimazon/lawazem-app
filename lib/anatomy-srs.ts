// lib/anatomy-srs.ts
/**
 * مراجعة متباعدة مبسّطة (مستوحاة من SM-2).
 * نسيت / صعب (<3): تُعاد بعد 10 دقائق. بعدها: يوم، 3 أيام، 7 أيام، ثم الفاصل × معامل السهولة.
 */
export type Grade = 0 | 1 | 2 | 3 | 4 | 5;

export interface SrsCard {
  id: string;
  reps: number;
  ease: number;
  interval: number;
  due: number;
  last: number;
  total: number;
  lapses: number;
}

export interface SrsState {
  cards: Record<string, SrsCard>;
}

const DAY = 86_400_000;
const MIN = 60_000;

export function newCard(id: string, now = Date.now()): SrsCard {
  return { id, reps: 0, ease: 2.5, interval: 0, due: now, last: 0, total: 0, lapses: 0 };
}

export function grade(card: SrsCard, g: Grade, now = Date.now()): SrsCard {
  const c: SrsCard = { ...card, total: card.total + 1, last: now };
  if (g < 3) {
    c.reps = 0;
    c.interval = 0;
    c.due = now + 10 * MIN;
    c.ease = Math.max(1.3, card.ease - 0.2);
    c.lapses = card.lapses + 1;
    return c;
  }
  c.reps = card.reps + 1;
  if (c.reps === 1) {
    c.interval = 1;
  } else if (c.reps === 2) {
    c.interval = 3;
  } else if (c.reps === 3) {
    c.interval = 7;
  } else {
    const factor = g === 5 ? 1.3 : g === 4 ? 1.15 : 1;
    c.interval = Math.max(1, Math.round(card.interval * card.ease * factor));
  }
  c.due = now + c.interval * DAY;
  c.ease = Math.max(1.3, Math.min(3, card.ease + (0.1 - (5 - g) * 0.08)));
  return c;
}

export function isDue(card: SrsCard, now = Date.now()): boolean {
  return card.due <= now;
}
