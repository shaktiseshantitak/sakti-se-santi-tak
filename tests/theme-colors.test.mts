// Safety + correctness checks for the website colour system (src/utils/themeColors.ts).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  COLOR_TOKENS, THEME_PRESETS, cleanThemeColors, buildThemeCss, effectiveThemeColors,
  contrastPairs, contrastRatio, accentRamp, type ThemeColors,
} from '../src/utils/themeColors.ts';

let n = 0;
const ok = (name: string, fn: () => void) => { fn(); n++; console.log('  ✓', name); };
const css = fs.readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

ok('only whitelisted keys with #RRGGBB survive (no CSS/JS injection possible)', () => {
  const m = cleanThemeColors({
    primary: '#6b1d3a', accent: 'red', page: '#FFF', surface: 'url(http://evil)', text: '#000000;}body{display:none}',
    ink: 'expression(alert(1))', evil: '#123456', __proto__: { primary: '#000000' }, headerBg: '#12345G',
  });
  assert.deepEqual(m, { primary: '#6B1D3A' });
  for (const bad of [null, undefined, 5, 'x', []]) assert.deepEqual(cleanThemeColors(bad), {});
});
ok('built CSS contains nothing but safe colour declarations', () => {
  const out = buildThemeCss(cleanThemeColors({ primary: '#112233', accent: '#C2790A', page: '#FFF8F0', headerBg: '#000000' }));
  assert.ok(out.startsWith(':root:not([data-admin]){') && out.endsWith('}'));
  assert.ok(/^[:\w\-\[\]=(){};#,. ]+$/.test(out), out);
  assert.ok(!/[<>"'\\\/@]|url\(|expression|javascript/i.test(out));
});
ok('nothing saved -> no CSS at all (site looks exactly as before)', () => {
  assert.equal(buildThemeCss({}), '');
  assert.equal(buildThemeCss(cleanThemeColors({ primary: 'nonsense' })), '');
});
ok('admin panel is excluded from the palette', () => {
  assert.ok(buildThemeCss({ primary: '#112233' }).includes(':not([data-admin])'));
  for (const f of ['AdminPage', 'AdminLoginPage'])
    assert.ok(fs.readFileSync(new URL(`../src/pages/${f}.tsx`, import.meta.url), 'utf8').includes("setAttribute('data-admin'"));
});
ok('every palette colour has a default in index.css identical to its built-in value', () => {
  for (const t of COLOR_TOKENS.filter(t => t.group === 'palette')) {
    const m = css.match(new RegExp(`${t.css}:\\s*(#[0-9A-Fa-f]{6})`));
    assert.ok(m, `${t.css} missing from index.css`);
    assert.equal(m![1].toUpperCase(), t.fallback!.toUpperCase());
  }
});
ok('generated amber ramp matches the original hand-tuned gold ramp (default look unchanged)', () => {
  const ramp = accentRamp('#B8923A');
  for (const [k, v] of Object.entries(ramp)) {
    if (k === '500') continue;
    const m = css.match(new RegExp(`--color-amber-${k}:\\s*var\\(--ramp-${k},\\s*(#[0-9A-Fa-f]{6})\\)`));
    assert.ok(m, `amber-${k} ramp default missing`);
    for (let i = 1; i < 7; i += 2) assert.ok(Math.abs(parseInt(v.slice(i, i + 2), 16) - parseInt(m![1].slice(i, i + 2), 16)) <= 2, `amber-${k} drifts: ${v} vs ${m![1]}`);
  }
});
ok('built-in palette and every preset are readable (WCAG AA 4.5:1 for all checked pairs)', () => {
  const all: [string, ThemeColors][] = [['default', {}], ...THEME_PRESETS.map(p => [p.id, p.colors] as [string, ThemeColors])];
  for (const [id, colors] of all)
    for (const p of contrastPairs(colors)) assert.ok(contrastRatio(p.fg, p.bg) >= p.min, `${id}: "${p.label}" only ${contrastRatio(p.fg, p.bg).toFixed(2)}:1`);
});
ok('contrast maths is right (black/white = 21, same = 1)', () => {
  assert.ok(Math.abs(contrastRatio('#000000', '#FFFFFF') - 21) < 0.01);
  assert.ok(Math.abs(contrastRatio('#336699', '#336699') - 1) < 0.001);
});
ok('old Primary/Secondary theme fields still work; the new palette wins', () => {
  assert.deepEqual(effectiveThemeColors({ theme: { primaryColor: '#112233', secondaryColor: '#B8923A' } }), { primary: '#112233' });
  assert.deepEqual(effectiveThemeColors({ theme: { primaryColor: '#112233' }, themeColors: { primary: '#445566' } }), { primary: '#445566' });
  assert.deepEqual(effectiveThemeColors({ theme: { primaryColor: '#6B1D3A', secondaryColor: '#B8923A' } }), {});
});
ok('no public page still hardcodes a palette colour (all go through the variables)', () => {
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(d, e.name)) : /\.tsx$/.test(e.name) ? [path.join(d, e.name)] : []);
  const root = new URL('../src', import.meta.url).pathname;
  const re = /\[#(6B1D3A|B8923A|FAF7F2|6B5748|33231B|FFFCF7|2B1B14|E3C77E|4F1229|3F0E21)\]/i;
  const bad = walk(root).filter(f => !/Admin|components\/admin\//.test(f) && re.test(fs.readFileSync(f, 'utf8')));
  assert.deepEqual(bad.map(f => path.relative(root, f)), []);
});
ok('codemod mapping: every old hard-coded hex maps to the token whose default is that same hex', () => {
  const MAP: Record<string, string> = { B8923A: 'accent', '6B1D3A': 'primary', FAF7F2: 'page', '6B5748': 'textMuted', '33231B': 'text', FFFCF7: 'surface', '2B1B14': 'ink', E3C77E: 'accentLight', '4F1229': 'primaryDeep', '3F0E21': 'primaryDarkest' };
  for (const [hex, key] of Object.entries(MAP)) assert.equal(COLOR_TOKENS.find(t => t.key === key)!.fallback!.slice(1).toUpperCase(), hex);
});
ok('browser address-bar colour follows the palette', () => {
  const inj = fs.readFileSync(new URL('../src/components/common/ThemeColorInjector.tsx', import.meta.url), 'utf8');
  assert.ok(inj.includes('meta[name="theme-color"]') && inj.includes('setMetaThemeColor'));
});
console.log(`\n${n} checks passed`);
