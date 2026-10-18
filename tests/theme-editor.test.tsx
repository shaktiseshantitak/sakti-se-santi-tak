import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeColorEditor } from '../src/components/admin/ThemeColorEditor';
import { COLOR_TOKENS, THEME_PRESETS } from '../src/utils/themeColors';

const ok = (n: string, c: boolean) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) process.exitCode = 1; };
const noop = () => {};

const base = renderToStaticMarkup(<ThemeColorEditor value={{}} onChange={noop} />);
ok('every colour has a picker + hex box', COLOR_TOKENS.every(t => base.includes(`aria-label="${t.label}"`)));
ok('all presets are offered', THEME_PRESETS.every(p => base.includes(p.label)));
ok('live preview is shown', base.includes('Colour preview') && base.includes('शक्ति से शांति तक'));
ok('default palette reports readable (no warning)', base.includes('WCAG AA') && !base.includes('पढ़ने में कठिनाई'));
const weak = renderToStaticMarkup(<ThemeColorEditor value={{ text: '#EEEEEE', page: '#FFFFFF' }} onChange={noop} />);
ok('unreadable choice shows a warning', weak.includes('पढ़ने में कठिनाई'));
ok('"reset all" button appears only once something is changed', !base.includes('सब मूल रंग') && weak.includes('सब मूल रंग'));
ok('changed colour offers a per-colour "मूल" reset', weak.includes('मूल</button>'));
