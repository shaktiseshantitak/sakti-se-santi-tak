import { createClient } from '@supabase/supabase-js';

// FIXED (2026-08-29 — "orders placed even when payment fails", edge case):
// the checkout page cancels an 'Awaiting Payment' order the moment the
// Razorpay popup is dismissed or verification fails — but if a customer
// just closes the browser tab entirely instead of clicking anything, no
// client-side code ever runs to clean that up. This scheduled sweep
// catches that case: any order still 'Awaiting Payment' after 20 minutes
// almost certainly means the customer walked away, so it's cancelled and
// its stock restored automatically. Scheduled every 15 minutes via
// netlify.toml.
export const handler = async () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Stale Order Sweep] Supabase not configured — skipping.');
    return { statusCode: 500, body: 'Supabase not configured.' };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const cutoff = new Date(Date.now() - 20 * 60 * 1000).toISOString();

  const { data: staleOrders, error } = await supabase
    .from('orders')
    .select('id')
    .eq('order_status', 'Awaiting Payment')
    .lt('created_at', cutoff);

  if (error) {
    console.error('[Stale Order Sweep] Failed listing stale orders:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  let cleaned = 0;
  for (const order of staleOrders || []) {
    // FIXED (BUG-009 — FINAL_BUG_SECURITY_AUDIT.md): this used to restore
    // stock and then cancel as two separate steps, with no re-check of the
    // order's current state in between — a payment succeeding for the same
    // order at the same moment (via /api/payment/verify or the webhook)
    // could have already moved it to 'Processing'/'Paid', and this sweep's
    // later unconditional cancel would have overwritten that back to
    // 'Cancelled'/'Failed', while stock was ALSO needlessly restored for an
    // order that was actually fulfilled. cancel_order_atomic (migration
    // 021) only transitions (and only restores stock for) an order that is
    // still 'Awaiting Payment' at the exact moment this runs.
    const { data: cancelled, error: cancelErr } = await supabase.rpc('cancel_order_atomic', {
      p_order_id: order.id,
      p_expected_statuses: ['Awaiting Payment'],
      p_restore_reason: 'Stock restored — stale unpaid order auto-cancelled after 20 minutes.',
    });
    if (cancelErr) {
      console.error(`[Stale Order Sweep] cancel_order_atomic failed for ${order.id}:`, cancelErr);
      continue;
    }
    if (cancelled) cleaned++;
  }

  console.log(`[Stale Order Sweep] Cancelled ${cleaned} stale unpaid order(s).`);
  return { statusCode: 200, body: JSON.stringify({ cleaned }) };
};
