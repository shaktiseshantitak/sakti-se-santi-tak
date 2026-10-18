import { useSiteContent } from '../lib/useSiteContent';
import React, { useState, useEffect } from 'react';
import { Search, Package, Truck, CheckCircle2, MapPin, Clock, ShieldAlert, Lock } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useBooks } from '../context/BookContext';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';

interface OrderTrackingPageProps {
  initialTrackingNumber?: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  initialTrackingNumber = '',
  onNavigate,
}) => {
  const c = useSiteContent();
  const { orders } = useBooks();
  const { user, isAdmin, sessionToken } = useAuth();

  // Filter orders to only user's own orders or all for admin (fail-closed)
  const userOrders = orders.filter(o => {
    if (isAdmin) return true;
    if (!user) return false;
    if (o.userId) return o.userId === user.id;
    if (user.email && o.shippingAddress?.email) {
      return o.shippingAddress.email.toLowerCase().trim() === user.email.toLowerCase().trim();
    }
    return false;
  });

  const [searchNum, setSearchNum] = useState<string>(initialTrackingNumber || (userOrders[0]?.trackingNumber || ''));
  const [emailOrPhone, setEmailOrPhone] = useState<string>('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(userOrders[0] || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  // The order tracking timeline used to be a fixed array of decorative, hardcoded dates/text
  // ("Aug 01, 10:30 AM", "Quality Inspection & Moisture Seal") shown for
  // EVERY order regardless of when it was actually placed. Now fetched
  // from the real order_status_history table (written for real by
  // /api/admin/update-order-status — see server/index.ts).
  const [realHistory, setRealHistory] = useState<{ status: string; note: string | null; changedAt: string }[]>([]);
  // Guest lookups (verified only by email/phone) get a MINIMAL server response
  // — status, courier, tracking code, ETA and a status/time timeline — and
  // never the address, payment or price details (see /api/orders/track). In
  // that mode the timeline comes from the server response, not from a direct
  // Supabase query (which a guest isn't allowed to run anyway).
  const [minimalView, setMinimalView] = useState<boolean>(false);
  const [guestTimeline, setGuestTimeline] = useState<{ status: string; at: string }[]>([]);

  useEffect(() => {
    if (!searchedOrder || minimalView) { setRealHistory([]); return; }
    import('../lib/supabase').then(({ supabase, isSupabaseConfigured }) => {
      if (!isSupabaseConfigured || !supabase) return;
      supabase.from('order_status_history')
        .select('status, notes, created_at')
        .eq('order_id', searchedOrder.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          if (data) setRealHistory(data.map((r: any) => ({ status: r.status, note: r.notes, changedAt: r.created_at })));
        });
    });
  }, [searchedOrder?.id, minimalView]);

  useEffect(() => {
    if (initialTrackingNumber) {
      handlePerformTrack(initialTrackingNumber, emailOrPhone);
    }
  }, [initialTrackingNumber]);

  const handlePerformTrack = async (numToSearch: string, contactInfo: string) => {
    setErrorMessage(null);
    setLoading(true);

    const targetNum = numToSearch.trim().toLowerCase();
    if (!targetNum) {
      setErrorMessage('Please enter an Order ID or Tracking Code.');
      setLoading(false);
      return;
    }

    // 1. Check client-side filtered orders first
    const clientFound = userOrders.find(
      o => o.trackingNumber.toLowerCase() === targetNum || o.id.toLowerCase() === targetNum || o.orderNumber?.toLowerCase() === targetNum
    );

    if (clientFound) {
      setMinimalView(false);
      setSearchedOrder(clientFound);
      setLoading(false);
      return;
    }

    // 2. If not found in user's client orders, query secure server endpoint
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          trackingNumber: targetNum,
          emailOrPhone: contactInfo
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setSearchedOrder(null);
        setErrorMessage(data.error || 'Unable to locate order. Please verify details.');
      } else if (data.order && data.minimal) {
        // Guest view: server returned only the minimal tracking DTO.
        const o = data.order;
        setMinimalView(true);
        setGuestTimeline(Array.isArray(o.timeline) ? o.timeline : []);
        setSearchedOrder({
          id: '',
          orderNumber: o.reference || '',
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          shippingAddress: {},
          items: [],
          subtotal: 0,
          discountAmount: 0,
          shippingCharge: 0,
          taxAmount: 0,
          totalAmount: 0,
          paymentMethod: 'UPI',
          paymentStatus: 'Pending',
          orderStatus: o.order_status || 'Processing',
          trackingNumber: o.tracking_number || o.reference || '',
          courierName: o.courier_name || 'To be assigned',
          estimatedDeliveryDate: o.estimated_delivery_date || 'To be confirmed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as unknown as Order);
      } else if (data.order) {
        // Map db order to UI Order
        setMinimalView(false);
        const o = data.order;
        setSearchedOrder({
          id: o.id,
          orderNumber: o.order_number,
          userId: o.user_id,
          customerName: o.shipping_address?.fullName || o.customer_name || 'Customer',
          customerEmail: o.shipping_address?.email || o.customer_email || '',
          customerPhone: o.shipping_address?.phone || o.customer_phone || '',
          shippingAddress: o.shipping_address || {},
          items: o.order_items || [],
          subtotal: Number(o.subtotal || 0),
          discountAmount: Number(o.discount_amount || 0),
          shippingCharge: Number(o.shipping_charge || 0),
          taxAmount: Number(o.tax_amount || 0),
          totalAmount: Number(o.total_amount || 0),
          paymentMethod: o.payment_method || 'UPI',
          paymentStatus: o.payment_status || 'Pending',
          orderStatus: o.order_status || 'Processing',
          trackingNumber: o.tracking_number || o.order_number || 'DEL-IND-001',
          courierName: o.courier_name || 'Delhivery Express',
          estimatedDeliveryDate: o.estimated_delivery_date || '3-5 Business Days',
          createdAt: o.created_at || new Date().toISOString(),
          updatedAt: o.updated_at || new Date().toISOString()
        });
      }
    } catch (err) {
      setSearchedOrder(null);
      setErrorMessage('Network error while checking order tracking status.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handlePerformTrack(searchNum, emailOrPhone);
  };

  // FIXED: was a fixed array of decorative fake dates/locations shown
  // identically for every order. Now built from realHistory (real rows
  // from order_status_history) when available; falls back to a single
  // honest "Order Placed" entry (using the order's real createdAt) for
  // orders placed before this table started being written to, rather
  // than inventing fake intermediate steps for them.
  const timelineRows = minimalView
    ? guestTimeline.map(t => ({ status: t.status, note: null as string | null, changedAt: t.at }))
    : realHistory;
  const steps = timelineRows.length > 0
    ? timelineRows.map(h => ({
        title: h.status,
        desc: h.note || '',
        time: new Date(h.changedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        done: true,
      }))
    : searchedOrder
      ? [{
          title: searchedOrder.orderStatus,
          desc: '',
          time: new Date(searchedOrder.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          done: true,
        }]
      : [];


  return (
    <div className="py-8 bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: c('track.breadcrumb') }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6 text-center">
          <h1 className="font-serif text-3xl font-bold text-[color:var(--c-primary)]">
            {c('track.title')}
          </h1>
          <p className="text-xs text-[color:var(--c-text-muted)] mt-1 font-medium">
            {c('track.subtitle')}
          </p>

          <form onSubmit={handleSearch} className="flex flex-col gap-3 max-w-md mx-auto mt-6">
            <div className="relative">
              <input
                type="text"
                value={searchNum}
                onChange={e => setSearchNum(e.target.value)}
                placeholder={c('track.idPlaceholder')}
                className="w-full pl-9 pr-4 py-3 bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/40 rounded-2xl text-xs font-mono font-bold text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
              />
              <Search className="w-4 h-4 text-[color:var(--c-primary)] absolute left-3 top-3.5" />
            </div>

            {!user && (
              <div className="relative">
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={e => setEmailOrPhone(e.target.value)}
                  placeholder={c('track.contactPlaceholder')}
                  className="w-full pl-9 pr-4 py-3 bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/40 rounded-2xl text-xs font-medium text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                />
                <Lock className="w-4 h-4 text-[color:var(--c-primary)] absolute left-3 top-3.5" />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] font-bold text-xs px-6 py-3 rounded-2xl shadow border border-amber-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </form>

          {errorMessage && (
            <div className="mt-4 p-4 max-w-md mx-auto bg-rose-100 border border-rose-300 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-semibold text-left">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {searchedOrder && (
          <div className="bg-[color:var(--c-surface)] rounded-3xl p-8 border border-[color:var(--c-accent)]/40 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[color:var(--c-page)] rounded-2xl border border-[color:var(--c-accent)]/30 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[color:var(--c-primary)]">
                  {c('track.lblCode')} {searchedOrder.trackingNumber}
                </span>
                <h3 className="font-serif font-bold text-lg text-[color:var(--c-primary)] mt-0.5">
                  {c('track.lblOrderStatus')} <span className="text-[color:var(--c-primary)]">{searchedOrder.orderStatus}</span>
                </h3>
              </div>

              <div className="text-right text-xs text-[color:var(--c-text-muted)] font-medium">
                <p>{c('track.lblCourier')} <span className="font-bold text-[color:var(--c-primary)]">{searchedOrder.courierName}</span></p>
                <p>{c('track.lblExpected')} <span className="font-bold text-emerald-800">{searchedOrder.estimatedDeliveryDate}</span></p>
              </div>
            </div>

            {/* FIXED: "Expand order tracking to show complete details:
                payment status, shipping address..." — previously absent
                from this page entirely. */}
            {!minimalView && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[color:var(--c-page)] rounded-2xl border border-[color:var(--c-accent)]/30">
                <p className="font-bold text-[color:var(--c-primary)] mb-1">{c('track.lblPayment')}</p>
                <p className="text-[color:var(--c-text-muted)]">{c('track.lblMethod')} <span className="font-bold">{searchedOrder.paymentMethod}</span></p>
                <p className="text-[color:var(--c-text-muted)]">{c('track.lblStatus')} <span className={`font-bold ${searchedOrder.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>{searchedOrder.paymentStatus}</span></p>
              </div>
              <div className="p-4 bg-[color:var(--c-page)] rounded-2xl border border-[color:var(--c-accent)]/30">
                <p className="font-bold text-[color:var(--c-primary)] mb-1">{c('track.lblShipTo')}</p>
                <p className="text-[color:var(--c-text-muted)]">{searchedOrder.shippingAddress.fullName}</p>
                <p className="text-[color:var(--c-text-muted)]">
                  {[searchedOrder.shippingAddress.addressLine1, searchedOrder.shippingAddress.city, searchedOrder.shippingAddress.state, searchedOrder.shippingAddress.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
            )}

            {minimalView && (
              <p className="text-[11px] text-[color:var(--c-text-muted)] font-medium">
                {c('track.privacy')}
              </p>
            )}

            {/* Timeline */}
            <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-[color:var(--c-accent)]/30 pl-2">
              {steps.map((st, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    st.done
                      ? 'bg-emerald-700 text-amber-100 shadow-sm border border-emerald-500'
                      : 'bg-[color:var(--c-page)] text-[color:var(--c-text-muted)]/50 border border-[color:var(--c-accent)]/40'
                  }`}>
                    {st.done ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 bg-[color:var(--c-page)] p-4 rounded-2xl border border-[color:var(--c-accent)]/30">
                    <div className="flex justify-between items-center">
                      <h4 className={`font-serif font-bold text-xs ${st.done ? 'text-[color:var(--c-primary)]' : 'text-[color:var(--c-text-muted)]/60'}`}>
                        {st.title}
                      </h4>
                      <span className="text-[10px] text-[color:var(--c-text-muted)] font-medium">{st.time}</span>
                    </div>
                    <p className="text-[11px] text-[color:var(--c-text)] mt-1 font-medium">{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
