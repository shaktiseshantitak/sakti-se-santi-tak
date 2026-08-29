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
    const { data: items } = await supabase.from('order_items').select('book_id, quantity').eq('order_id', order.id);
    for (const item of items || []) {
      const { error: incErr } = await supabase.rpc('increment_inventory', {
        p_book_id: item.book_id, p_quantity: item.quantity,
      });
      if (!incErr) {
        await supabase.from('inventory_movements').insert([{
          book_id: item.book_id,
          change_quantity: item.quantity,
          movement_type: 'ORDER_PAYMENT_FAILED',
          reference_id: order.id,
          notes: `Stock restored — stale unpaid order auto-cancelled after 20 minutes.`,
        }]);
      }
    }
    await supabase.from('orders')
      .update({ order_status: 'Cancelled', payment_status: 'Failed', updated_at: new Date().toISOString() })
      .eq('id', order.id);
    cleaned++;
  }

  console.log(`[Stale Order Sweep] Cancelled ${cleaned} stale unpaid order(s).`);
  return { statusCode: 200, body: JSON.stringify({ cleaned }) };
};
