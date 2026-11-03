'use client';

// components/anatomy/NoteForm.tsx
import { useState } from 'react';

export default function NoteForm({
  initial, title, onSave, onCancel,
}: { initial: string; title: string; onSave: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(initial);
  return (
    <div>
      <p className="fq-name" dir="ltr">{title}</p>
      <label className="fa-note-label">
        <span className="sr-only">Note</span>
        <textarea
          className="fa-note"
          value={text}
          maxLength={600}
          rows={6}
          autoFocus
          placeholder="اكتب ملاحظتك الشخصية عن هذه العضلة…"
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <p className="fq-note">{text.length} / 600 · تُحفظ على جهازك فقط.</p>
      <div className="fq-row">
        <button type="button" className="fa-btn is-primary" onClick={() => onSave(text)}>حفظ</button>
        <button type="button" className="fa-btn" onClick={onCancel}>إلغاء</button>
        {initial && <button type="button" className="fa-btn" onClick={() => onSave('')}>حذف الملاحظة</button>}
      </div>
    </div>
  );
}
