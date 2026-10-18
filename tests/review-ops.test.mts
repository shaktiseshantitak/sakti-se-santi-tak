// The Control Panel must never say "published" unless the DATABASE really changed.
import assert from 'node:assert/strict';
import { adminSetReviewApprovalVerifiedApi, adminDeleteReviewVerifiedApi, isDbReviewId } from '../src/lib/reviewsApi.ts';

let n = 0;
const ok = async (name: string, fn: () => Promise<void> | void) => { await fn(); n++; console.log('  ✓', name); };
// tiny fake of the Supabase query builder: .from().update()/delete().eq().select() -> { data, error }
const fake = (result: { data: any; error: any } | (() => never)) => ({
  from: () => ({
    update: () => ({ eq: () => ({ select: async () => { if (typeof result === 'function') result(); return result; } }) }),
    delete: () => ({ eq: () => ({ select: async () => { if (typeof result === 'function') result(); return result; } }) }),
  }),
});
const ID = '3f2b1c3e-8a5d-4c1e-9b7a-0d5e6f7a8b9c';

await ok('only real UUIDs count as database ids ("rev-…" is browser-only)', () => {
  assert.equal(isDbReviewId(ID), true);
  for (const bad of ['rev-1760000000000-ab12c', '', '123', 'cr-99', ID + 'x']) assert.equal(isDbReviewId(bad), false);
});
await ok('approve: a row really changed -> ok', async () => {
  assert.deepEqual(await adminSetReviewApprovalVerifiedApi(ID, true, fake({ data: [{ id: ID }], error: null })), { ok: true });
});
await ok('approve: NO row matched (the old silent-failure case) -> error, not "published"', async () => {
  const r: any = await adminSetReviewApprovalVerifiedApi(ID, true, fake({ data: [], error: null }));
  assert.equal(r.ok, false); assert.ok(r.error.length > 5);
});
await ok('approve: database refuses (permission) -> error text is passed on', async () => {
  const r: any = await adminSetReviewApprovalVerifiedApi(ID, true, fake({ data: null, error: { message: 'permission denied' } }));
  assert.deepEqual(r, { ok: false, error: 'permission denied' });
});
await ok('approve: network crash -> error, never an exception', async () => {
  const r: any = await adminSetReviewApprovalVerifiedApi(ID, true, fake((() => { throw new Error('offline'); }) as any));
  assert.deepEqual(r, { ok: false, error: 'offline' });
});
await ok('delete: same honesty (no row removed -> error)', async () => {
  assert.equal(((await adminDeleteReviewVerifiedApi(ID, fake({ data: [], error: null }))) as any).ok, false);
  assert.deepEqual(await adminDeleteReviewVerifiedApi(ID, fake({ data: [{ id: ID }], error: null })), { ok: true });
});
await ok('demo mode (no database) still works locally', async () => {
  assert.deepEqual(await adminSetReviewApprovalVerifiedApi(ID, true, null), { ok: true });
});
await ok('Control Panel waits for the database result before saying "published"', async () => {
  const fs = await import('node:fs');
  const admin = fs.readFileSync(new URL('../src/pages/AdminPage.tsx', import.meta.url), 'utf8');
  assert.ok(admin.includes('const res = await toggleReviewApproval(r.id);'));
  assert.ok(!admin.includes("triggerToast(r.approved ? 'Review unapproved' : 'Review approved & published!')"));
  assert.ok(admin.includes('सिर्फ़ इस ब्राउज़र में'));
});
console.log(`\n${n} checks passed`);
