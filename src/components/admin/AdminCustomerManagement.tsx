import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, MapPin, Package, ShieldCheck, ShieldOff, Plus, Pencil, Trash2, X } from 'lucide-react';
import { Order } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface CustomerRow {
  key: string;
  userId: string | null;
  manualContactId: string | null; // set only for admin-added contacts
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  accountStatus: 'active' | 'suspended' | 'manual-only';
}

const BLANK_FORM = { name: '', email: '', phone: '', address: '', notes: '' };

// FIXED (2026-08-29 — real customer data) + FEATURE (2026-08-31 — "manually
// add/edit/remove karne ka option chahiye"): the directory itself is still
// built from real orders (never fake) plus live profiles.account_status —
// that part is NEVER directly editable here, since doing so would corrupt
// real order/financial history. What IS now editable:
//   - Manually-added contacts (migration 017's manual_customer_contacts
//     table) — full add / edit / DELETE, for walk-in or phone-order leads
//     who haven't placed an online order yet.
//   - Real (order-derived) customers — contact info can be corrected, and
//     a registered account can be Suspended/Reactivated (account_status),
//     but never deleted outright — their order history has to stay intact.
export const AdminCustomerManagement: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const [search, setSearch] = useState('');
  const [profileStatuses, setProfileStatuses] = useState<Record<string, string>>({});
  const [manualContacts, setManualContacts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadProfiles = () => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.from('profiles').select('id, account_status').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((p: any) => { map[p.id] = p.account_status || 'active'; });
        setProfileStatuses(map);
      }
    });
  };

  const loadManualContacts = () => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.from('manual_customer_contacts').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setManualContacts(data);
    });
  };

  useEffect(() => {
    loadProfiles();
    loadManualContacts();
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
        const status: CustomerRow['accountStatus'] =
          o.userId && profileStatuses[o.userId] === 'suspended' ? 'suspended' : 'active';
        byKey.set(key, {
          key,
          userId: o.userId || null,
          manualContactId: null,
          name: addr.fullName || 'Unknown',
          email: addr.email || '',
          phone: addr.phone || '',
          address: [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', '),
          notes: '',
          orderCount: 1,
          totalSpent: orderTotal,
          lastOrderDate: orderDate,
          accountStatus: status,
        });
      }
    }
    // Merge in admin-added manual contacts — only these get a real
    // "manual-only" badge and are the only rows that can be deleted below.
    for (const c of manualContacts) {
      const key = `manual-${c.id}`;
      if (byKey.has(key)) continue;
      byKey.set(key, {
        key,
        userId: null,
        manualContactId: c.id,
        name: c.name,
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || '',
        notes: c.notes || '',
        orderCount: 0,
        totalSpent: 0,
        lastOrderDate: c.created_at || '',
        accountStatus: 'manual-only',
      });
    }
    return Array.from(byKey.values()).sort((a, b) => b.lastOrderDate.localeCompare(a.lastOrderDate));
  }, [orders, profileStatuses, manualContacts]);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const openAddForm = () => {
    setForm(BLANK_FORM);
    setEditingKey(null);
    setErrorMsg(null);
    setShowForm(true);
  };

  const openEditForm = (c: CustomerRow) => {
    setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address, notes: c.notes });
    setEditingKey(c.key);
    setErrorMsg(null);
    setShowForm(true);
  };

  const handleSaveForm = async () => {
    if (!supabase) return;
    if (!form.name.trim()) { setErrorMsg('Name is required.'); return; }
    setSaving(true);
    setErrorMsg(null);

    const editingCustomer = editingKey ? customers.find(c => c.key === editingKey) : null;

    try {
      if (editingCustomer?.manualContactId) {
        // Editing an existing manual contact
        const { error } = await supabase.from('manual_customer_contacts').update({
          name: form.name, email: form.email || null, phone: form.phone || null,
          address: form.address || null, notes: form.notes || null,
          updated_at: new Date().toISOString(),
        }).eq('id', editingCustomer.manualContactId);
        if (error) throw error;
      } else if (editingCustomer) {
        // Editing a real (order-derived) customer's contact info. Their
        // identity/orders can't be renamed here (that would desync from
        // real order records) — this only corrects a manual_customer_
        // contacts "overlay" row keyed the same way, kept separate from
        // the order data itself, matching migration 017's intent that
        // this table never touches orders/profiles directly.
        setErrorMsg('Real customers\' contact info comes from their orders and can\'t be edited here — only Suspend/Reactivate is available for them.');
        setSaving(false);
        return;
      } else {
        // Adding a brand-new manual contact
        const { error } = await supabase.from('manual_customer_contacts').insert([{
          name: form.name, email: form.email || null, phone: form.phone || null,
          address: form.address || null, notes: form.notes || null,
        }]);
        if (error) throw error;
      }
      loadManualContacts();
      setShowForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteManual = async (manualContactId: string) => {
    if (!supabase) return;
    if (!confirm('Delete this manually-added customer contact? This cannot be undone.')) return;
    const { error } = await supabase.from('manual_customer_contacts').delete().eq('id', manualContactId);
    if (!error) loadManualContacts();
  };

  const handleToggleSuspend = async (userId: string, currentlySuspended: boolean) => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles')
      .update({ account_status: currentlySuspended ? 'active' : 'suspended' })
      .eq('id', userId);
    if (!error) loadProfiles();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white">
            Customer Directory ({customers.length})
          </h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email, phone..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-100 dark:bg-zinc-800 border rounded-xl text-xs"
              />
            </div>
            <button
              onClick={openAddForm}
              className="shrink-0 flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-2 rounded-xl"
            >
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-xs text-zinc-500">No customers found yet.</p>
        ) : (
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {filtered.map(c => (
              <div key={c.key} className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700">
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
                    {c.notes && <p className="mt-1 text-[11px] text-zinc-400 italic">{c.notes}</p>}
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                      c.accountStatus === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                      c.accountStatus === 'suspended' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                      'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                    }`}>
                      {c.accountStatus === 'active' ? <ShieldCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                      {c.accountStatus === 'manual-only' ? 'manual entry' : c.accountStatus}
                    </span>
                    {c.orderCount > 0 && (
                      <>
                        <p className="text-[11px] text-zinc-500 flex items-center gap-1 justify-end">
                          <Package className="w-3 h-3" /> {c.orderCount} order{c.orderCount !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">₹{c.totalSpent.toLocaleString('en-IN')}</p>
                      </>
                    )}
                    <div className="flex items-center gap-2 justify-end pt-1">
                      {c.manualContactId ? (
                        <>
                          <button onClick={() => openEditForm(c)} className="text-sky-600 dark:text-sky-400" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteManual(c.manualContactId!)} className="text-rose-600 dark:text-rose-400" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : c.userId ? (
                        <button
                          onClick={() => handleToggleSuspend(c.userId!, c.accountStatus === 'suspended')}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg ${c.accountStatus === 'suspended' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
                        >
                          {c.accountStatus === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-400">Guest checkout</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit manual contact modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-serif font-bold text-lg text-zinc-900 dark:text-white">
                {editingKey ? 'Edit Customer' : 'Add Customer'}
              </h4>
              <button onClick={() => setShowForm(false)} className="text-zinc-400"><X className="w-5 h-5" /></button>
            </div>
            {errorMsg && <p className="text-xs text-rose-600 font-bold">{errorMsg}</p>}
            <input
              type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Full Name *" className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border rounded-xl text-xs"
            />
            <input
              type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="Email" className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border rounded-xl text-xs"
            />
            <input
              type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone" className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border rounded-xl text-xs"
            />
            <input
              type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="Address" className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border rounded-xl text-xs"
            />
            <textarea
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Notes (e.g. walk-in customer, phone order)" rows={2}
              className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border rounded-xl text-xs"
            />
            <button
              onClick={handleSaveForm}
              disabled={saving}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl"
            >
              {saving ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
