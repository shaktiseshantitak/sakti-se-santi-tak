import http from 'node:http';
import crypto from 'node:crypto';
import { AddressInfo } from 'node:net';

// ---- fake Supabase (PostgREST + auth) ----
const orders: Record<string, any> = {
  A: { id: 'A', user_id: 'u1', order_status: 'Awaiting Payment', payment_status: 'Pending', payment_transaction_id: null, razorpay_order_id: 'order_AAA', total_amount: 549 },
  B: { id: 'B', user_id: 'u2', order_status: 'Awaiting Payment', payment_status: 'Pending', payment_transaction_id: null, razorpay_order_id: 'order_BBB', total_amount: 100 },
  C: { id: 'C', user_id: 'u1', order_status: 'Cancelled', payment_status: 'Pending', payment_transaction_id: null, razorpay_order_id: 'order_CCC', total_amount: 100 },
  D: { id: 'D', user_id: 'u1', order_status: 'Processing', payment_status: 'Paid', payment_transaction_id: 'pay_done1', razorpay_order_id: 'order_DDD', total_amount: 100 },
  V1: { id: 'V1', user_id: 'u1', order_status: 'Processing', payment_status: 'Paid', payment_transaction_id: 'pay_v1', razorpay_order_id: 'order_V1', total_amount: 2 },
  V2: { id: 'V2', user_id: 'u1', order_status: 'Cancelled', payment_status: 'Pending', payment_transaction_id: null, razorpay_order_id: 'order_V2', total_amount: 2 },
  V3: { id: 'V3', user_id: 'u1', order_status: 'Processing', payment_status: 'Paid', payment_transaction_id: 'pay_OTHER', razorpay_order_id: 'order_V3', total_amount: 2 },
  V4: { id: 'V4', user_id: 'u1', order_status: 'Awaiting Payment', payment_status: 'Pending', payment_transaction_id: null, razorpay_order_id: 'order_V4', total_amount: 2 },
  E: { id: 'E', user_id: 'u1', order_status: 'Awaiting Payment', payment_status: 'Pending', payment_transaction_id: null, razorpay_order_id: 'order_EEE', total_amount: 200 },
};
const rpcCalls: any[] = [];
let rlCount = 0;
const fake = http.createServer((req, res) => {
  const url = new URL(req.url!, 'http://x');
  let body = ''; req.on('data', d => body += d); req.on('end', () => {
    const send = (code: number, obj: any) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
    if (url.pathname === '/auth/v1/user') {
      const t = (req.headers.authorization || '').replace('Bearer ', '');
      if (t === 'tok-u1') return send(200, { id: 'u1', aud: 'authenticated', email: 'a@b.c' });
      if (t === 'tok-u2') return send(200, { id: 'u2', aud: 'authenticated', email: 'b@b.c' });
      return send(401, { msg: 'bad jwt' });
    }
    if (url.pathname === '/rest/v1/rpc/check_and_increment_rate_limit') {
      const p = JSON.parse(body || '{}'); rlCount++;
      return send(200, [{ allowed: !(p.p_key?.startsWith('reconcile:u2') && rlCount > 0 && globalThis.__deny), retry_after_seconds: 1 }]);
    }
    if (url.pathname === '/rest/v1/rpc/mark_order_paid_atomic') { const b = JSON.parse(body); rpcCalls.push(b); const o = orders[b.p_order_id]; const ok = !!o && o.order_status === 'Awaiting Payment'; if (ok) { o.order_status = 'Processing'; o.payment_status = 'Paid'; o.payment_transaction_id = b.p_transaction_id; } return send(200, ok); }
    if (url.pathname === '/rest/v1/payments' || url.pathname === '/rest/v1/audit_logs') return send(201, []);
    if (url.pathname === '/rest/v1/orders') {
      const id = (url.searchParams.get('id') || '').replace('eq.', '');
      const row = orders[id];
      if (!row) return send(406, { code: 'PGRST116', message: 'no rows' });
      return send(200, row);
    }
    send(404, {});
  });
});
await new Promise<void>(r => fake.listen(0, '127.0.0.1', r));
const fport = (fake.address() as AddressInfo).port;
process.env.SUPABASE_URL = `http://127.0.0.1:${fport}`;
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
process.env.RAZORPAY_KEY_ID = 'rzp_test_x';
process.env.RAZORPAY_KEY_SECRET = 'secret';
process.env.NETLIFY = '1';

// ---- fake Razorpay via fetch patch ----
const payments: Record<string, any[]> = {
  order_AAA: [{ id: 'pay_good', order_id: 'order_AAA', currency: 'INR', amount: 54900, amount_refunded: 0, status: 'captured' }],
  order_BBB: [{ id: 'pay_b', order_id: 'order_BBB', currency: 'INR', amount: 10000, amount_refunded: 0, status: 'captured' }],
  order_CCC: [{ id: 'pay_c', order_id: 'order_CCC', currency: 'INR', amount: 10000, amount_refunded: 0, status: 'captured' }],
  order_EEE: [{ id: 'pay_wrong_amt', order_id: 'order_EEE', currency: 'INR', amount: 100, amount_refunded: 0, status: 'captured' }],
};
const singlePay: Record<string, any> = {
  pay_v1: { id: 'pay_v1', order_id: 'order_V1', currency: 'INR', amount: 200, amount_refunded: 0, status: 'captured' },
  pay_v2: { id: 'pay_v2', order_id: 'order_V2', currency: 'INR', amount: 200, amount_refunded: 0, status: 'captured' },
  pay_v3: { id: 'pay_v3', order_id: 'order_V3', currency: 'INR', amount: 200, amount_refunded: 0, status: 'captured' },
  pay_v4: { id: 'pay_v4', order_id: 'order_V4', currency: 'INR', amount: 200, amount_refunded: 0, status: 'captured' },
};
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: any, init?: any) => {
  const u = typeof input === 'string' ? input : input.url;
  if (u.startsWith('https://api.razorpay.com/v1/payments/')) {
    const pid = u.split('/payments/')[1];
    return singlePay[pid] ? new Response(JSON.stringify(singlePay[pid]), { status: 200 }) : new Response('{}', { status: 404 });
  }
  if (u.startsWith('https://api.razorpay.com/v1/orders/')) {
    const oid = u.split('/orders/')[1].split('/')[0];
    return new Response(JSON.stringify({ items: payments[oid] || [] }), { status: 200 });
  }
  return realFetch(input, init);
}) as any;

const { app } = await import('../server/index.ts');
const srv = app.listen(0, '127.0.0.1');
await new Promise(r => srv.once('listening', r));
const base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
const call = async (token: string | null, orderId: any) => {
  const r = await realFetch(`${base}/api/payment/reconcile`, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ orderId }) });
  return { status: r.status, body: await r.json() };
};
let pass = 0, fail = 0;
const check = (name: string, cond: boolean, extra?: any) => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + JSON.stringify(extra)}`); };

let r = await call(null, 'A');            check('no token -> 401', r.status === 401, r);
r = await call('bad', 'A');               check('bad token -> 401', r.status === 401, r);
r = await call('tok-u1', undefined);      check('missing orderId -> 400', r.status === 400, r);
r = await call('tok-u1', { $ne: 1 });     check('object orderId -> 400', r.status === 400, r);
r = await call('tok-u1', 'B');            check("other user's order -> 404", r.status === 404, r);
check("other user's order never marked paid", rpcCalls.length === 0, rpcCalls);
r = await call('tok-u1', 'NOPE');         check('unknown order -> 404', r.status === 404, r);
r = await call('tok-u1', 'C');            check('cancelled order is NOT revived', r.status === 200 && r.body.paid === false, r);
r = await call('tok-u1', 'E');            check('captured payment with wrong amount rejected', r.status === 200 && r.body.paid === false, r);
check('no RPC for C or E', rpcCalls.length === 0, rpcCalls);
r = await call('tok-u1', 'D');            check('already-paid order returns paid, no RPC', r.status === 200 && r.body.paid === true && rpcCalls.length === 0, r);
r = await call('tok-u1', 'A');            check('valid captured payment -> paid:true', r.status === 200 && r.body.paid === true && r.body.transactionId === 'pay_good', r);
check('RPC called once with strict expected status', rpcCalls.length === 1 && rpcCalls[0].p_order_id === 'A' && rpcCalls[0].p_transaction_id === 'pay_good' && JSON.stringify(rpcCalls[0].p_expected_statuses) === '["Awaiting Payment"]', rpcCalls);

const verify = async (token: string, orderId: string, rzpOrder: string, payId: string) => {
  const sig = crypto.createHmac('sha256', 'secret').update(`${rzpOrder}|${payId}`).digest('hex');
  const r = await realFetch(`${base}/api/payment/verify`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ orderId, razorpay_order_id: rzpOrder, razorpay_payment_id: payId, razorpay_signature: sig }) });
  return { status: r.status, body: await r.json() };
};
console.log('--- /api/payment/verify (webhook-race fix) ---');
r = await verify('tok-u1', 'V1', 'order_V1', 'pay_v1'); check('webhook already marked Paid with SAME payment id -> success (was the false "cancelled" error)', r.status === 200 && r.body.success === true, r);
r = await verify('tok-u1', 'V4', 'order_V4', 'pay_v4'); check('normal flow: Awaiting Payment -> marked paid, success', r.status === 200 && r.body.success === true && orders.V4.payment_status === 'Paid', r);
r = await verify('tok-u1', 'V2', 'order_V2', 'pay_v2'); check('genuinely Cancelled order still returns the 409 error', r.status === 409 && r.body.success === false, r);
r = await verify('tok-u1', 'V3', 'order_V3', 'pay_v3'); check('Paid but under a DIFFERENT payment id -> NOT accepted (409)', r.status === 409 && r.body.success === false, r);
r = await verify('tok-u2', 'V1', 'order_V1', 'pay_v1'); check("verify on another customer's order -> 403", r.status === 403, r);
(globalThis as any).__deny = true;
r = await call('tok-u2', 'B');            check('per-customer rate limit -> 429', r.status === 429, r);
r = await call('tok-u1', 'D');            check('limit is per customer (u1 unaffected)', r.status === 200, r);
console.log(`\n${pass} passed, ${fail} failed`);
srv.close(); fake.close(); process.exit(fail ? 1 : 0);
