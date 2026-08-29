import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, MapPin, Package, ShieldCheck, ShieldOff } from 'lucide-react';
import { Order } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface CustomerRow {
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  accountStatus: 'active' | 'unknown';
}

// FIXED (2026-08-29 — "Customer details are not displayed anywhere in the
// admin panel. Add a customer management section... name, email, phone,
// address, order history, account status"). Built entirely from the same
// real `orders` array every other admin tab already uses (grouped by
// customer) plus a live `profiles` read for account status — no
// hardcoded/dummy customer rows.
export const AdminCustomerManagement: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const [search, setSearch] = useState('');
  const [profileStatuses, setProfileStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.from('profiles').select('id, account_status').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((p: any) => { map[p.id] = p.account_status || 'active'; });
        setProfileStatuses(map);
      }
    });
  }, []);

  const customers: CustomerRow[] = React.useMemo(() => {
    const byKey = new Map<string, CustomerRow>();
    for (const o of orders) {
      const addr = o.shippingAddress;
      if (!addr) continue;
      const key = o.userId || addr.email?.toLowerCase() || addr.phone || o.id;
      const existing = byKey.get(key);
      const orderTotal = o.totalAmount || 0;
      const orderDate = o.createdAt || '';
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += orderTotal;
        if (orderDate > existing.lastOrderDate) existing.lastOrderDate = orderDate;
      } else {
        byKey.set(key, {
          userId: o.userId || null,
          name: addr.fullName || 'Unknown',
          email: addr.email || '',
          phone: addr.phone || '',
          address: [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', '),
          orderCount: 1,
          totalSpent: orderTotal,
          lastOrderDate: orderDate,
          accountStatus: (o.userId && profileStatuses[o.userId] === 'suspended') ? 'unknown' : 'active',
        });
      }
    }
    return Array.from(byKey.values()).sort((a, b) => b.lastOrderDate.localeCompare(a.lastOrderDate));
  }, [orders, profileStatuses]);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white">
            Customer Directory ({customers.length})
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, phone..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-100 dark:bg-zinc-800 border rounded-xl text-xs"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-xs text-zinc-500">No customers found yet.</p>
        ) : (
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {filtered.map((c, i) => (
              <div key={c.userId || c.email || i} className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm text-zinc-900 dark:text-white">{c.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-zinc-500">
                      {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
                      {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                    </div>
                    {c.address && (
                      <p className="flex items-start gap-1 mt-1 text-[11px] text-zinc-500">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {c.address}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${c.accountStatus === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}`}>
                      {c.accountStatus === 'active' ? <ShieldCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                      {c.accountStatus}
                    </span>
                    <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1 justify-end">
                      <Package className="w-3 h-3" /> {c.orderCount} order{c.orderCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">₹{c.totalSpent.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
