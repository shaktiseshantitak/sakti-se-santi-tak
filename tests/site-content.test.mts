// Safety checks for the Control-Panel text system (src/utils/siteContent.ts).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_FIELDS, CONTENT_MAX_LEN, cleanContentMap, resolveContent, formatContent } from '../src/utils/siteContent.ts';

let n = 0;
const ok = (name: string, fn: () => void) => { fn(); n++; console.log('  ✓', name); };

ok('every key is unique and has a fallback', () => {
  const keys = CONTENT_FIELDS.map(f => f.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(CONTENT_FIELDS.every(f => f.optional || f.fallback.length > 0));
  assert.ok(CONTENT_FIELDS.filter(f => f.fallback === '').every(f => f.optional), 'empty fallback only allowed for optional fields');
});
ok('unknown keys from a tampered row are dropped', () => {
  const m = cleanContentMap({ 'trust.title': 'ठीक', 'evil.key': 'x', '__proto__': { a: 1 }, constructor: 'x' });
  assert.deepEqual(Object.keys(m), ['trust.title']);
});
ok('non-string values are dropped', () => {
  const m = cleanContentMap({ 'trust.title': { html: '<b>' }, 'trust.badge': 5, 'trust.subtitle': null });
  assert.deepEqual(m, {});
});
ok('non-object input is safe', () => {
  for (const bad of [null, undefined, 'x', 7, [1, 2]]) assert.deepEqual(cleanContentMap(bad), {});
});
ok('control characters removed, length capped', () => {
  const m = cleanContentMap({ 'trust.title': 'a\u0000b\u0007c' + 'x'.repeat(CONTENT_MAX_LEN * 2) });
  assert.ok(!/[\u0000-\u0008]/.test(m['trust.title']));
  assert.ok(m['trust.title'].length <= CONTENT_MAX_LEN);
});
ok('empty -> default, single space -> hidden, text -> text', () => {
  assert.equal(resolveContent({}, 'trust.title'), CONTENT_FIELDS.find(f => f.key === 'trust.title')!.fallback);
  assert.equal(resolveContent({ 'trust.title': ' ' }, 'trust.title'), '');
  assert.equal(resolveContent({ 'trust.title': ' नया ' }, 'trust.title'), 'नया');
});
ok('markup is kept as inert text (pages render it through React text nodes)', () => {
  const m = cleanContentMap({ 'trust.title': '<img src=x onerror=alert(1)>' });
  assert.equal(m['trust.title'], '<img src=x onerror=alert(1)>');
});
ok('optional invoice lines stay hidden until filled (no fake GSTIN/address ever)', () => {
  assert.equal(resolveContent({}, 'invoice.gstin'), '');
  assert.equal(resolveContent({}, 'invoice.address'), '');
  assert.equal(resolveContent({ 'invoice.gstin': ' 09ABCDE1234F1Z5 ' }, 'invoice.gstin'), '09ABCDE1234F1Z5');
});
ok('{rate} token is filled with the real rate', () => {
  assert.equal(formatContent(resolveContent({}, 'cart.gst'), { rate: 12 }), 'GST Tax (12%)');
  assert.equal(formatContent('no tokens', { rate: 5 }), 'no tokens');
});
ok('EVERY editable text is actually used by a page (no box in Control Panel that changes nothing)', () => {
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(d, e.name)) : /\.(tsx?|mts)$/.test(e.name) ? [path.join(d, e.name)] : []);
  const files = walk(new URL('../src', import.meta.url).pathname).filter(f => !/siteContent(Auto)?\.ts$/.test(f));
  const code = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const unused = CONTENT_FIELDS.filter(f => !code.includes(`'${f.key}'`)).map(f => f.key);
  assert.deepEqual(unused, [], 'registry keys not used by any page: ' + unused.join(', '));
});
console.log(`\n${n} checks passed`);
