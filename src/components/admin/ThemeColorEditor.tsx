import React, { useEffect, useState } from 'react';
import { RotateCcw, ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  COLOR_TOKENS, THEME_PRESETS, HEX6, ThemeColors, ColorKey, ColorToken,
  contrastPairs, contrastRatio, accentRamp, mixHex,
} from '../../utils/themeColors';

interface Props { value: ThemeColors; onChange: (next: ThemeColors) => void }

const ColorField: React.FC<{ token: ColorToken; value?: string; onSet: (k: ColorKey, v?: string) => void }> = ({ token, value, onSet }) => {
  const shown = value || token.fallback || '';
  const [text, setText] = useState(value || '');
  useEffect(() => { setText(value || ''); }, [value]);
  const invalid = text !== '' && !HEX6.test(text);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[11px] font-semibold">{token.label}</label>
        {value && (
          <button type="button" onClick={() => onSet(token.key, undefined)} className="text-[10px] text-zinc-500 hover:text-rose-700 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> मूल
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={token.label}
          value={HEX6.test(shown) ? shown : '#000000'}
          onChange={e => onSet(token.key, e.target.value.toUpperCase())}
          className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-300 shrink-0"
        />
        <input
          type="text"
          maxLength={7}
          value={text}
          placeholder={token.fallback || 'पैलेट वाला रंग'}
          onChange={e => {
            const v = e.target.value.trim();
            setText(v);
            if (v === '') onSet(token.key, undefined);
            else if (HEX6.test(v)) onSet(token.key, v.toUpperCase());
          }}
          className={`flex-1 min-w-0 px-3 py-2 bg-white dark:bg-zinc-900 border rounded-xl font-mono text-xs ${invalid ? 'border-rose-500' : 'border-zinc-300 dark:border-zinc-700'}`}
        />
      </div>
      <p className="text-[10px] text-zinc-500 mt-1">{token.hint}</p>
      {invalid && <p className="text-[10px] text-rose-600 mt-0.5">रंग #RRGGBB रूप में लिखें (जैसे #6B1D3A)</p>}
    </div>
  );
};

/** Colour palette editor with presets, live preview and readability (WCAG) checks. */
export const ThemeColorEditor: React.FC<Props> = ({ value, onChange }) => {
  const set = (k: ColorKey, v?: string) => {
    const next = { ...value };
    if (v) next[k] = v; else delete next[k];
    onChange(next);
  };
  const get = (k: ColorKey) => value[k] || COLOR_TOKENS.find(t => t.key === k)!.fallback!;
  const ramp = accentRamp(get('accent'));
  const headerBg = value.headerBg || get('primary');
  const headerText = value.headerText || (value.accent ? ramp['50'] : '#FBF7EC');
  const stripBg = value.stripBg || get('primaryDeep');
  const footerBg = value.footerBg || get('primary');
  const footerText = value.footerText || (value.accent ? ramp['100'] : '#F5EBCF');
  const pageTop = mixHex(get('page'), '#FFFFFF', 0.4);
  const pairs = contrastPairs(value).map(p => ({ ...p, ratio: contrastRatio(p.fg, p.bg) }));
  const weak = pairs.filter(p => p.ratio < p.min);
  const palette = COLOR_TOKENS.filter(t => t.group === 'palette');
  const areas = COLOR_TOKENS.filter(t => t.group === 'area');
  const changed = Object.keys(value).length;

  return (
    <div className="space-y-5">
      <div>
        <h5 className="font-bold text-xs text-zinc-700 dark:text-zinc-300">🎨 वेबसाइट के रंग (Colour Palette)</h5>
        <p className="text-[11px] text-zinc-500 mt-1">
          यहाँ बदला हर रंग पूरी साइट पर लागू होता है (Admin पैनल पर नहीं)। खाली/“मूल” = साइट का पुराना रंग। बदलाव के बाद नीचे “Save” दबाएँ।
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold">तैयार रंग-योजना:</span>
        {THEME_PRESETS.map(p => (
          <button key={p.id} type="button" onClick={() => onChange({ ...p.colors })}
            className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-[11px] font-bold hover:bg-amber-50 dark:hover:bg-zinc-800 flex items-center gap-2">
            <span className="flex">
              {[p.colors.primary || '#6B1D3A', p.colors.accent || '#B8923A', p.colors.page || '#FAF7F2'].map((c, i) => (
                <span key={i} style={{ background: c }} className="w-3 h-3 rounded-full border border-zinc-300 -ml-1 first:ml-0" />
              ))}
            </span>
            {p.label}
          </button>
        ))}
        {changed > 0 && (
          <button type="button" onClick={() => onChange({})} className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-rose-700 border border-rose-300 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> सब मूल रंग
          </button>
        )}
      </div>

      {/* Live preview */}
      <div aria-label="Colour preview" className="rounded-2xl overflow-hidden border border-zinc-300 dark:border-zinc-700 text-[11px]" style={{ background: `linear-gradient(180deg, ${pageTop}, ${get('page')})` }}>
        <div style={{ background: stripBg, color: get('accentLight') }} className="px-3 py-1 font-medium">📞 हेल्पलाइन • Order Tracking • Help &amp; Support</div>
        <div style={{ background: headerBg, color: headerText, borderBottom: `1px solid ${get('accent')}66` }} className="px-3 py-2.5 flex items-center justify-between">
          <span className="font-serif font-extrabold text-sm">शक्ति से शांति तक</span>
          <span style={{ background: get('accent'), color: get('ink') }} className="px-2.5 py-1 rounded-lg font-black">कार्ट</span>
        </div>
        <div className="p-3">
          <div style={{ background: get('surface'), border: `1px solid ${get('accent')}66` }} className="rounded-xl p-3 space-y-1.5">
            <p style={{ color: get('primary') }} className="font-serif font-extrabold text-sm">पुस्तक का शीर्षक</p>
            <p style={{ color: get('text') }}>यह मुख्य लेख का नमूना है — साधकों के लिए प्रामाणिक मार्गदर्शन।</p>
            <p style={{ color: get('textMuted') }}>यह हल्के लेख का नमूना है (उप-शीर्षक / विवरण)।</p>
            <span style={{ background: get('accent'), color: get('ink') }} className="inline-block px-3 py-1.5 rounded-lg font-extrabold">अभी खरीदें</span>
          </div>
        </div>
        <div style={{ background: footerBg, color: footerText }} className="px-3 py-2.5">© फुटर का नमूना — शक्ति से शांति तक</div>
      </div>

      {/* Readability */}
      <div className={`rounded-xl border p-3 ${weak.length ? 'border-amber-400 bg-amber-50 dark:bg-zinc-800' : 'border-emerald-300 bg-emerald-50/50 dark:bg-zinc-800'}`}>
        <p className="font-bold text-[11px] flex items-center gap-1.5 mb-1.5">
          {weak.length ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <ShieldCheck className="w-4 h-4 text-emerald-700" />}
          {weak.length ? `${weak.length} जगह पढ़ने में कठिनाई हो सकती है — रंग बदलने पर विचार करें` : 'सब रंग-जोड़ियाँ आसानी से पढ़ी जा सकती हैं (WCAG AA)'}
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
          {pairs.map(p => (
            <li key={p.id} className="flex items-center justify-between gap-2 text-[10px]">
              <span className="flex items-center gap-1.5 min-w-0">
                <span style={{ background: p.bg, color: p.fg }} className="w-5 h-4 rounded text-[9px] leading-4 text-center font-bold border border-zinc-300 shrink-0">Aa</span>
                <span className="truncate">{p.label}</span>
              </span>
              <span className={p.ratio >= p.min ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>{p.ratio.toFixed(1)}:1</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h6 className="font-bold text-[11px] mb-2 uppercase tracking-wider text-zinc-500">मुख्य रंग (Palette)</h6>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {palette.map(t => <ColorField key={t.key} token={t} value={value[t.key]} onSet={set} />)}
        </div>
      </div>
      <div>
        <h6 className="font-bold text-[11px] mb-1 uppercase tracking-wider text-zinc-500">हेडर एवं फुटर के अलग रंग (वैकल्पिक)</h6>
        <p className="text-[10px] text-zinc-500 mb-2">खाली छोड़ने पर ये ऊपर के मुख्य रंगों का पालन करते हैं।</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {areas.map(t => <ColorField key={t.key} token={t} value={value[t.key]} onSet={set} />)}
        </div>
      </div>
    </div>
  );
};
