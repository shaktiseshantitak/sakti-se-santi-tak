// Safety checks for editable card lists (src/utils/contentLists.ts) and RichText.
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CONTENT_LISTS, CARD_BODY_MAX, CARD_TITLE_MAX, cleanContentLists, resolveContentList } from '../src/utils/contentLists.ts';
import { RichText } from '../src/components/common/RichText.tsx';

let n = 0;
const ok = (name: string, fn: () => void) => { fn(); n++; console.log('  ✓', name); };
const gk = 'gayatriArticles';

ok('defaults exist for every list and are within limits', () => {
  for (const d of CONTENT_LISTS) {
    assert.ok(d.defaults.length > 0 && d.defaults.length <= d.maxItems, d.key);
    for (const c of d.defaults) { assert.ok(c.title.length <= CARD_TITLE_MAX); assert.ok(c.body.length <= CARD_BODY_MAX); }
  }
});
ok('nothing saved -> built-in cards; saved list -> admin cards; saved empty list -> section hidden', () => {
  assert.equal(resolveContentList({}, gk).length, 5);
  assert.deepEqual(resolveContentList({ [gk]: [{ title: 'क', body: 'ख' }] }, gk), [{ title: 'क', body: 'ख' }]);
  assert.deepEqual(resolveContentList({ [gk]: [] }, gk), []);
});
ok('unknown list keys and non-arrays are dropped', () => {
  assert.deepEqual(cleanContentLists({ evil: [{ title: 'x', body: 'y' }], [gk]: 'no', __proto__: { a: 1 } }), {});
  for (const bad of [null, undefined, 5, 'x', []]) assert.deepEqual(cleanContentLists(bad), {});
});
ok('card count capped, lengths capped, control chars removed, empty cards dropped', () => {
  const many = Array.from({ length: 100 }, (_, i) => ({ title: `t${i}`, body: 'b' }));
  assert.equal(cleanContentLists({ [gk]: many })[gk].length, CONTENT_LISTS.find(d => d.key === gk)!.maxItems);
  const c = cleanContentLists({ [gk]: [{ title: 'a\u0000b', body: 'x'.repeat(CARD_BODY_MAX * 3) }, { title: '  ', body: '' }, { title: 5, body: null }] })[gk];
  assert.equal(c.length, 1);
  assert.equal(c[0].title, 'ab');
  assert.equal(c[0].body.length, CARD_BODY_MAX);
});
ok('RichText: **bold** works', () => {
  assert.equal(renderToStaticMarkup(React.createElement(RichText, { text: 'अ **ब** स' })), 'अ <strong>ब</strong> स');
});
ok('RichText: HTML/script is shown as inert text, never executed', () => {
  const html = renderToStaticMarkup(React.createElement(RichText, { text: '<img src=x onerror=alert(1)> **<script>alert(2)</script>**' }));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('<script'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('<strong>&lt;script&gt;'));
});
console.log(`\n${n} checks passed`);
