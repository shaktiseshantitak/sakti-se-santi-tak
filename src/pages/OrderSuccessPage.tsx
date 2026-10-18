import { useSiteContent } from '../lib/useSiteContent';
import { formatContent } from '../utils/siteContent';
import React from 'react';
import { CheckCircle2, Printer, Truck, ArrowRight, ShieldCheck, Mail, Phone } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useBooks } from '../context/BookContext';

interface OrderSuccessPageProps {
  orderId: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ orderId, onNavigate }) => {
  const tx = useSiteContent();

  const { orders, siteSettings } = useBooks();
  const c = useSiteContent();
  // `|| orders[0]` meant that
  // if this exact orderId wasn't found yet (e.g. orders still loading, or
  // a stale/incorrect id in the URL), the page silently rendered some
  // OTHER random order's full invoice — name, address, phone, payment
  // details — instead of showing a clear "not found" state. That's a real
  // privacy problem, not just a cosmetic one.
  const order = orders.find(o => o.id === orderId);
  // GST % that was actually charged on THIS order (tax / amount after discount),
  // falling back to the store rate — so the label can never disagree with the money shown.
  const taxableBase = order ? order.subtotal - (order.discountAmount || 0) : 0;
  const orderTaxRate = order && taxableBase > 0
    ? Math.round((order.taxAmount / taxableBase) * 1000) / 10
    : (siteSettings?.taxPercentage || 5);

  const handlePrintInvoice = () => {
    window.print();
  };

  if (!order) {
    return (
      <div className="py-16 text-center bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen">
        <p className="text-[color:var(--c-text-muted)] font-medium">{c('order.notFound')}</p>
        <button onClick={() => onNavigate('home')} className="mt-4 text-[color:var(--c-primary)] font-bold underline">{tx('t.OrderSuccessPage.3c5841d1')}</button>
      </div>
    );
  }

  return (
    <div className="py-12 bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header Card */}
        <div className="bg-[color:var(--c-surface)] rounded-3xl p-8 border border-[color:var(--c-accent)]/40 shadow-sm text-center space-y-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-300">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-xs uppercase tracking-widest text-emerald-900 font-extrabold">
            {c('order.badge')}
          </span>

          <h1 className="font-serif text-3xl font-bold text-[color:var(--c-primary)]">
            {c('order.thanks')}
          </h1>

          <p className="text-xs sm:text-sm text-[color:var(--c-text-muted)] max-w-md mx-auto font-medium">
            {tx('t.OrderSuccessPage.8ebdbb6c')} <span className="font-mono font-bold text-[color:var(--c-primary)]">{order.orderNumber}</span> {tx('t.OrderSuccessPage.1ea2ca0a')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={handlePrintInvoice}
              className="bg-[color:var(--c-page)] hover:bg-[color:var(--c-accent)]/20 text-[color:var(--c-primary)] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors border border-[color:var(--c-accent)]/40"
            >
              <Printer className="w-4 h-4" />
              <span>{c('order.print')}</span>
            </button>

            <button
              onClick={() => onNavigate('track-order', { trackingNumber: order.trackingNumber })}
              className="bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow transition-colors border border-amber-200"
            >
              <Truck className="w-4 h-4" />
              <span>{c('order.track')}</span>
            </button>
          </div>
        </div>

        {/* Printable Order Tax Invoice */}
        <div className="bg-[color:var(--c-surface)] rounded-3xl p-8 border border-[color:var(--c-accent)]/40 shadow-sm space-y-6">
          <div className="flex justify-between items-start border-b border-[color:var(--c-accent)]/30 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-2xl text-[color:var(--c-primary)]">{c('invoice.company')}</span>
              </div>
              {(c('invoice.address') || siteSettings?.address) && (
                <p className="text-xs text-[color:var(--c-text-muted)] mt-1 font-medium">{c('invoice.address') || siteSettings?.address}</p>
              )}
              {c('invoice.gstin') && (
                <p className="text-[11px] text-[color:var(--c-text-muted)]/80 font-mono">{tx('t.OrderSuccessPage.2e2107e9')} {c('invoice.gstin')}</p>
              )}
            </div>

            <div className="text-right text-xs text-[color:var(--c-text-muted)]">
              <p className="font-bold text-[color:var(--c-primary)] text-sm">{c('invoice.title')}</p>
              <p className="font-mono mt-1 font-bold text-[color:var(--c-text)]">{tx('t.OrderSuccessPage.463f683a')} {order.id}</p>
              <p>{tx('t.OrderSuccessPage.b94fea26')} {new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="font-bold text-emerald-800 mt-0.5">{tx('t.OrderSuccessPage.3388a2fb')} {order.orderStatus}</p>
            </div>
          </div>

          {/* Shipping & Payment info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-[color:var(--c-text)]">
            <div>
              <h4 className="font-bold uppercase tracking-wider text-[color:var(--c-primary)] mb-2">{tx('t.OrderSuccessPage.6229846d')}</h4>
              <p className="font-bold text-sm text-[color:var(--c-primary)]">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
              <p>{tx('t.OrderSuccessPage.ea0cc8ac')} {order.shippingAddress.phone}</p>
            </div>

            <div>
              <h4 className="font-bold uppercase tracking-wider text-[color:var(--c-primary)] mb-2">{tx('t.OrderSuccessPage.cf18e2b4')}</h4>
              <p>{tx('t.OrderSuccessPage.ece7606f')} <span className="font-bold text-[color:var(--c-primary)]">{order.courierName}</span></p>
              <p>{tx('t.OrderSuccessPage.e1f04961')} <span className="font-mono font-bold">{order.trackingNumber}</span></p>
              <p>{tx('t.OrderSuccessPage.21d41438')} <span className="font-semibold">{order.paymentMethod} ({order.paymentStatus})</span></p>
              <p>{tx('t.OrderSuccessPage.9d92a8bf')} <span className="font-bold text-emerald-800">{order.estimatedDeliveryDate}</span></p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-[color:var(--c-accent)]/40 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[color:var(--c-page)] text-[color:var(--c-primary)] uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-3">{tx('t.OrderSuccessPage.4e5518a5')}</th>
                  <th className="p-3 text-center">{tx('t.OrderSuccessPage.fd0ec96d')}</th>
                  <th className="p-3 text-center">{tx('t.OrderSuccessPage.4c2f92b9')}</th>
                  <th className="p-3 text-right">{tx('t.OrderSuccessPage.9fb9c7a2')}</th>
                  <th className="p-3 text-right">{tx('t.OrderSuccessPage.9401f139')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--c-accent)]/20">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-bold text-[color:var(--c-primary)]">
                      {item.bookTitle} ({item.language})
                    </td>
                    <td className="p-3 text-center text-[color:var(--c-text-muted)] font-medium">{item.format}</td>
                    <td className="p-3 text-center font-bold text-[color:var(--c-text)]">{item.quantity}</td>
                    <td className="p-3 text-right text-[color:var(--c-text)]">₹{item.unitPrice}</td>
                    <td className="p-3 text-right font-bold text-[color:var(--c-primary)]">₹{item.totalPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-xs text-[color:var(--c-text-muted)] font-medium">
              <div className="flex justify-between">
                <span>{c('cart.subtotal')}</span>
                <span className="font-bold text-[color:var(--c-text)]">₹{order.subtotal}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>{c('cart.discount')}</span>
                  <span>-₹{order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{formatContent(c('cart.gst'), { rate: orderTaxRate })}</span>
                <span>₹{order.taxAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>{tx('t.OrderSuccessPage.264fd8dd')}</span>
                <span>{order.shippingCharge === 0 ? <span className="text-emerald-800 font-bold">{c('cart.free')}</span> : `₹${order.shippingCharge}`}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[color:var(--c-text)] pt-2 border-t border-[color:var(--c-accent)]/30">
                <span>{c('invoice.grandTotal')}</span>
                <span className="text-[color:var(--c-primary)]">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
