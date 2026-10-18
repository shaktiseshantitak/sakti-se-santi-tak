import React, { useState } from 'react';
import { ChevronDown, ArrowUp, ArrowDown, Trash2, Plus, RotateCcw } from 'lucide-react';
import { CONTENT_LISTS, CARD_TITLE_MAX, CARD_BODY_MAX, resolveContentList, ContentCard } from '../../utils/contentLists';

interface Props {
  value: Record<string, ContentCard[]>;
  onChange: (next: Record<string, ContentCard[]>) => void;
}

/** Add / edit / reorder / delete the cards of the long-content pages. Saved with the normal Settings "Save". */
export const ContentListEditor: React.FC<Props> = ({ value, onChange }) => {
  const [open, setOpen] = useState<string | null>(null);
  const input = 'w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs';

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
      <div>
        <h4 className="font-bold text-sm">लंबे लेख वाले पेज (Articles & Question Cards)</h4>
        <p className="text-[11px] text-zinc-500 mt-1">
          यहाँ से गायत्री रहस्य और जिज्ञासा पेज के कार्ड जोड़ें, बदलें, क्रम बदलें या हटाएँ। सब कार्ड हटाने पर वह हिस्सा पेज से छुप जाता है। बदलाव के बाद नीचे "Save" दबाएँ। सिर्फ़ सादा लेख चलता है (मोटे अक्षर: **शब्द**)।
        </p>
      </div>
      {CONTENT_LISTS.map(def => {
        const isOpen = open === def.key;
        const cards = resolveContentList(value, def.key);
        const isCustom = value[def.key] !== undefined;
        const set = (next: ContentCard[]) => onChange({ ...value, [def.key]: next });
        const move = (i: number, d: number) => {
          const j = i + d; if (j < 0 || j >= cards.length) return;
          const n = [...cards]; [n[i], n[j]] = [n[j], n[i]]; set(n);
        };
        return (
          <div key={def.key} className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
            <button type="button" onClick={() => setOpen(isOpen ? null : def.key)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold bg-zinc-50 dark:bg-zinc-800">
              <span>{def.label} <span className="font-normal text-zinc-500">({cards.length}{isCustom ? ' • बदला हुआ' : ''})</span></span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="p-3.5 space-y-3">
                <p className="text-[11px] text-zinc-500">{def.help}</p>
                {cards.length === 0 && <p className="text-[11px] text-rose-700">कोई कार्ड नहीं — यह हिस्सा पेज पर नहीं दिखेगा।</p>}
                {cards.map((c, i) => (
                  <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold">{def.itemName} {i + 1}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="ऊपर" className="p-1 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                        <button type="button" onClick={() => move(i, 1)} disabled={i === cards.length - 1} aria-label="नीचे" className="p-1 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                        <button type="button" onClick={() => { if (window.confirm('यह कार्ड हटाएँ?')) set(cards.filter((_, k) => k !== i)); }} aria-label="हटाएँ" className="p-1 text-rose-700"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <input type="text" maxLength={CARD_TITLE_MAX} value={c.title} placeholder="शीर्षक"
                      onChange={e => set(cards.map((x, k) => k === i ? { ...x, title: e.target.value } : x))} className={input} />
                    <textarea rows={5} maxLength={CARD_BODY_MAX} value={c.body} placeholder="विवरण"
                      onChange={e => set(cards.map((x, k) => k === i ? { ...x, body: e.target.value } : x))} className={input} />
                  </div>
                ))}
                <div className="flex items-center gap-2 flex-wrap">
                  <button type="button" disabled={cards.length >= def.maxItems}
                    onClick={() => set([...cards, { title: '', body: '' }])}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 text-white disabled:opacity-40 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> नया {def.itemName}
                  </button>
                  {isCustom && (
                    <button type="button" onClick={() => { const n = { ...value }; delete n[def.key]; onChange(n); }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-zinc-300 dark:border-zinc-700 flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5" /> मूल सामग्री लौटाएँ
                    </button>
                  )}
                  <span className="text-[10px] text-zinc-500">अधिकतम {def.maxItems}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
