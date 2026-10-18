import React, { useState } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { CONTENT_FIELDS, CONTENT_MAX_LEN } from '../../utils/siteContent';

interface Props {
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}

/**
 * One editor for all page wording. Empty box = the site's built-in text.
 * A single space hides that line. Saved with the normal Settings "Save".
 */
export const SiteContentEditor: React.FC<Props> = ({ value, onChange }) => {
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const matches = (f: typeof CONTENT_FIELDS[number]) =>
    !needle || f.label.toLowerCase().includes(needle) || f.fallback.toLowerCase().includes(needle) || f.key.toLowerCase().includes(needle) || (value[f.key] || '').toLowerCase().includes(needle);
  const groups = Array.from(new Set(CONTENT_FIELDS.filter(matches).map(f => f.group)));

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
      <div>
        <h4 className="font-bold text-sm">पूरी वेबसाइट के लेख (Page Text Manager)</h4>
        <p className="text-[11px] text-zinc-500 mt-1">
          हर बॉक्स में ग्रे अक्षर साइट का मौजूदा लेख है। बदलना हो तो अपना लेख लिखें; खाली छोड़ने पर वही मौजूदा लेख रहेगा; कोई पंक्ति छुपानी हो तो सिर्फ़ एक space डालें। बदलाव के बाद नीचे "Save" दबाएँ। सिर्फ़ सादा लेख चलता है (HTML नहीं)।
        </p>
      </div>
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="खोजें: कोई शब्द लिखें (जैसे Cart, शिपिंग, Wishlist)..."
        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs"
      />
      {groups.length === 0 && <p className="text-[11px] text-zinc-500">कुछ नहीं मिला।</p>}
      {groups.map(group => {
        const fields = CONTENT_FIELDS.filter(f => f.group === group && matches(f));
        const isOpen = needle ? true : open === group;
        const changed = fields.filter(f => (value[f.key] || '') !== '').length;
        return (
          <div key={group} className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : group)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold bg-zinc-50 dark:bg-zinc-800"
            >
              <span>{group}{changed > 0 && <span className="ml-2 text-[10px] text-emerald-700">({changed} बदले हुए)</span>}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="p-3.5 space-y-3">
                {fields.map(f => {
                  const common = {
                    maxLength: f.maxLen ?? CONTENT_MAX_LEN,
                    placeholder: f.fallback || '(खाली = यह पंक्ति पेज पर नहीं दिखेगी)',
                    value: value[f.key] || '',
                    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                      onChange({ ...value, [f.key]: e.target.value }),
                    className: 'w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs',
                  };
                  return (
                    <div key={f.key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold">{f.label}</label>
                        {(value[f.key] || '') !== '' && (
                          <button
                            type="button"
                            onClick={() => { const n = { ...value }; delete n[f.key]; onChange(n); }}
                            className="text-[10px] text-zinc-500 hover:text-rose-700 flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> मूल लेख
                          </button>
                        )}
                      </div>
                      {f.multiline ? <textarea rows={3} {...common} /> : <input type="text" {...common} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
