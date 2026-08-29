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
  // FIXED (2026-08-29 — "Expand order tracking to show complete details:
  // ...order status timeline. Customers should see all these details"):
  // this used to be a fixed array of decorative, hardcoded dates/text
  // ("Aug 01, 10:30 AM", "Quality Inspection & Moisture Seal") shown for
  // EVERY order regardless of when it was actually placed. Now fetched
  // from the real order_status_history table (written for real by
  // /api/admin/update-order-status — see server.ts).
  const [realHistory, setRealHistory] = useState<{ status: string; note: string | null; changedAt: string }[]>([]);

  useEffect(() => {
    if (!searchedOrder) { setRealHistory([]); return; }
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
  }, [searchedOrder?.id]);

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
      } else if (data.order) {
        // Map db order to UI Order
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
  const steps = realHistory.length > 0
    ? realHistory.map(h => ({
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
    <div className="py-8 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Track Order Status' }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6 text-center">
          <h1 className="font-serif text-3xl font-bold text-[#8B1E3F]">
            Live Order Tracking
          </h1>
          <p className="text-xs text-[#6E4E37] mt-1 font-medium">
            Enter your Order ID (e.g. DH-2024-9841) or Courier Tracking Code.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col gap-3 max-w-md mx-auto mt-6">
            <div className="relative">
              <input
                type="text"
                value={searchNum}
                onChange={e => setSearchNum(e.target.value)}
                placeholder="Tracking Code or Order ID..."
                className="w-full pl-9 pr-4 py-3 bg-[#FFF8EE] border border-[#D4AF37]/40 rounded-2xl text-xs font-mono font-bold text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
              />
              <Search className="w-4 h-4 text-[#8B1E3F] absolute left-3 top-3.5" />
            </div>

            {!user && (
              <div className="relative">
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={e => setEmailOrPhone(e.target.value)}
                  placeholder="Verification Email or Phone (Required for Guest Lookup)..."
                  className="w-full pl-9 pr-4 py-3 bg-[#FFF8EE] border border-[#D4AF37]/40 rounded-2xl text-xs font-medium text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                />
                <Lock className="w-4 h-4 text-[#8B1E3F] absolute left-3 top-3.5" />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-bold text-xs px-6 py-3 rounded-2xl shadow border border-amber-200 transition-colors disabled:opacity-50"
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
          <div className="bg-[#FFF8EE] rounded-3xl p-8 border border-[#D4AF37]/40 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#F8F4E8] rounded-2xl border border-[#D4AF37]/30 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#8B1E3F]">
                  Tracking Code: {searchedOrder.trackingNumber}
                </span>
                <h3 className="font-serif font-bold text-lg text-[#8B1E3F] mt-0.5">
                  Order Status: <span className="text-[#8B1E3F]">{searchedOrder.orderStatus}</span>
                </h3>
              </div>

              <div className="text-right text-xs text-[#6E4E37] font-medium">
                <p>Courier: <span className="font-bold text-[#8B1E3F]">{searchedOrder.courierName}</span></p>
                <p>Expected Delivery: <span className="font-bold text-emerald-800">{searchedOrder.estimatedDeliveryDate}</span></p>
              </div>
            </div>

            {/* FIXED: "Expand order tracking to show complete details:
                payment status, shipping address..." — previously absent
                from this page entirely. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#F8F4E8] rounded-2xl border border-[#D4AF37]/30">
                <p className="font-bold text-[#8B1E3F] mb-1">Payment</p>
                <p className="text-[#6E4E37]">Method: <span className="font-bold">{searchedOrder.paymentMethod}</span></p>
                <p className="text-[#6E4E37]">Status: <span className={`font-bold ${searchedOrder.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>{searchedOrder.paymentStatus}</span></p>
              </div>
              <div className="p-4 bg-[#F8F4E8] rounded-2xl border border-[#D4AF37]/30">
                <p className="font-bold text-[#8B1E3F] mb-1">Shipping Address</p>
                <p className="text-[#6E4E37]">{searchedOrder.shippingAddress.fullName}</p>
                <p className="text-[#6E4E37]">
                  {[searchedOrder.shippingAddress.addressLine1, searchedOrder.shippingAddress.city, searchedOrder.shippingAddress.state, searchedOrder.shippingAddress.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-[#D4AF37]/30 pl-2">
              {steps.map((st, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    st.done
                      ? 'bg-emerald-700 text-amber-100 shadow-sm border border-emerald-500'
                      : 'bg-[#F8F4E8] text-[#6E4E37]/50 border border-[#D4AF37]/40'
                  }`}>
                    {st.done ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 bg-[#F8F4E8] p-4 rounded-2xl border border-[#D4AF37]/30">
                    <div className="flex justify-between items-center">
                      <h4 className={`font-serif font-bold text-xs ${st.done ? 'text-[#8B1E3F]' : 'text-[#6E4E37]/60'}`}>
                        {st.title}
                      </h4>
                      <span className="text-[10px] text-[#6E4E37] font-medium">{st.time}</span>
                    </div>
                    <p className="text-[11px] text-[#4A2C17] mt-1 font-medium">{st.desc}</p>
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
