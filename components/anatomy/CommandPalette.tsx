'use client';

// components/anatomy/CommandPalette.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MUSCLES, ZOOMS, type ZoomId } from '@/lib/anatomy-data';
import { EXPRESSIONS } from '@/lib/anatomy-ar';
import { TRIANGLES } from '@/lib/anatomy-neck-notes';

export type PaletteAction = 'quiz' | 'flashcards' | 'progress' | 'shortcuts' | 'export' | 'import' | 'share';

export interface CommandHandlers {
  onMuscle: (id: string) => void;
  onExpression: (id: string) => void;
  onZoom: (id: ZoomId) => void;
  onTriangle: (id: string) => void;
  onAction: (id: PaletteAction) => void;
}

interface Item { id: string; group: string; title: string; subtitle?: string; action: () => void }

export default function CommandPalette({ open, onClose, handlers }: { open: boolean; onClose: () => void; handlers: CommandHandlers }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setActive(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const query = q.trim().toLowerCase();
    const has = (text: string): boolean => !query || text.toLowerCase().includes(query);
    const out: Item[] = [];

    const cmds: [PaletteAction, string, string][] = [
      ['quiz', 'Start quiz', 'اختبر نفسك'],
      ['flashcards', 'Flashcards (spaced review)', 'بطاقات المراجعة'],
      ['progress', 'My progress', 'تقدّمي'],
      ['shortcuts', 'Keyboard shortcuts', 'الاختصارات'],
      ['share', 'Share link', 'مشاركة الرابط'],
      ['export', 'Export my data', 'تصدير التقدّم'],
      ['import', 'Import my data', 'استيراد التقدّم'],
    ];
    for (const [id, title, sub] of cmds) {
      if (has(title) || has(sub)) out.push({ id: `cmd-${id}`, group: 'Actions', title, subtitle: sub, action: () => handlers.onAction(id) });
    }
    for (const [id, z] of Object.entries(ZOOMS)) {
      if (has(z.labelEn) || has(z.labelAr) || has(id)) {
        out.push({ id: `zoom-${id}`, group: 'Regions', title: z.labelEn, subtitle: z.labelAr, action: () => handlers.onZoom(id as ZoomId) });
      }
    }
    for (const x of EXPRESSIONS) {
      if (has(x.en) || has(x.ar) || has(x.id)) {
        out.push({ id: `mov-${x.id}`, group: 'Movements', title: x.en, subtitle: x.ar, action: () => handlers.onExpression(x.id) });
      }
    }
    for (const t of TRIANGLES) {
      if (has(t.en) || has(t.ar) || has(t.id)) {
        out.push({ id: `tri-${t.id}`, group: 'Triangles', title: t.en, subtitle: t.ar, action: () => handlers.onTriangle(t.id) });
      }
    }
    const muscles = MUSCLES.map((m) => {
      const name = `${m.en} ${m.short ?? ''}`.toLowerCase();
      const hay = `${name} ${m.region ?? ''} ${m.id}`.toLowerCase();
      if (query && !hay.includes(query)) return null;
      const score = !query ? 1 : m.id.toLowerCase() === query ? 4 : name.startsWith(query) ? 3 : name.includes(query) ? 2 : 1;
      return { m, score };
    })
      .filter((x): x is { m: (typeof MUSCLES)[number]; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, query ? 14 : 8);
    for (const { m } of muscles) {
      out.push({ id: `m-${m.id}`, group: 'Muscles', title: m.en, subtitle: m.region, action: () => handlers.onMuscle(m.id) });
    }
    return out;
  }, [q, handlers]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = useCallback((item: Item) => {
    onClose();
    item.action();
  }, [onClose]);

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); const it = items[active]; if (it) choose(it); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  if (!open) return null;
  let lastGroup = '';

  return (
    <div className="fa-cmd-overlay" role="dialog" aria-modal="true" aria-label="Search and commands" onClick={onClose}>
      <div className="fa-cmd" onClick={(e) => e.stopPropagation()} onKeyDown={onKeyDown} dir="rtl">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن عضلة أو حركة أو منطقة أو أمر…"
          className="fa-cmd-input"
          aria-label="Search"
          dir="ltr"
          role="combobox"
          aria-expanded="true"
          aria-controls="fa-cmd-list"
        />
        <div ref={listRef} id="fa-cmd-list" className="fa-cmd-list" role="listbox">
          {items.length === 0 && <div className="fa-cmd-empty">لا توجد نتائج.</div>}
          {items.map((it, i) => {
            const showGroup = it.group !== lastGroup;
            lastGroup = it.group;
            return (
              <div key={it.id}>
                {showGroup && <div className="fa-cmd-group" dir="ltr">{it.group}</div>}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  tabIndex={-1}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(it)}
                  className={`fa-cmd-item${i === active ? ' is-active' : ''}`}
                >
                  <span className="fa-cmd-title" dir="ltr">{it.title}</span>
                  {it.subtitle && <span className="fa-cmd-sub">{it.subtitle}</span>}
                </button>
              </div>
            );
          })}
        </div>
        <div className="fa-cmd-foot"><kbd>↑</kbd><kbd>↓</kbd> تنقّل · <kbd>Enter</kbd> تنفيذ · <kbd>Esc</kbd> إغلاق</div>
      </div>
    </div>
  );
}
