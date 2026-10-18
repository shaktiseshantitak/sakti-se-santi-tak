// Newsletter safety checks (src/lib/newsletterApi.ts)
import assert from 'node:assert/strict';
import { subscribeNewsletterApi, subscribersToCsv } from '../src/lib/newsletterApi.ts';

let n = 0;
const ok = async (name: string, fn: () => void | Promise<void>) => { await fn(); n++; console.log('  ✓', name); };

await ok('invalid emails are rejected before any network call', async () => {
  for (const bad of ['', 'abc', 'a@b', '@x.com', 'a b@x.com', 'x'.repeat(260) + '@x.com', '<script>@x.com'])
    assert.equal(await subscribeNewsletterApi(bad), 'invalid');
});
await ok('valid email with no database configured is "unavailable", never a fake success', async () => {
  assert.equal(await subscribeNewsletterApi('reader@example.com'), 'unavailable');
});
await ok('CSV export neutralises spreadsheet formula injection', () => {
  const csv = subscribersToCsv([{ id: '1', email: '=HYPERLINK("http://evil")@x.com', source: '+cmd', created_at: '2026-10-15' }]);
  const line = csv.split('\n')[1];
  assert.ok(line.startsWith(`"'=`));
  assert.ok(line.includes(`"'+cmd"`));
});
await ok('CSV escapes quotes', () => {
  const csv = subscribersToCsv([{ id: '1', email: 'a"b@x.com', source: 'footer', created_at: 'd' }]);
  assert.ok(csv.includes('"a""b@x.com"'));
});
console.log(`\n${n} checks passed`);
