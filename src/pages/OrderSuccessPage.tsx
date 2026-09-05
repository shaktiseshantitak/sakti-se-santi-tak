import React from 'react';
import { CheckCircle2, Printer, Truck, ArrowRight, ShieldCheck, Mail, Phone } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useBooks } from '../context/BookContext';

interface OrderSuccessPageProps {
  orderId: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ orderId, onNavigate }) => {
  const { orders } = useBooks();
  // FIXED (2026-08-29 — invoice data integrity): `|| orders[0]` meant that
  // if this exact orderId wasn't found yet (e.g. orders still loading, or
  // a stale/incorrect id in the URL), the page silently rendered some
  // OTHER random order's full invoice — name, address, phone, payment
  // details — instead of showing a clear "not found" state. That's a real
  // privacy problem, not just a cosmetic one.
  const order = orders.find(o => o.id === orderId);

  const handlePrintInvoice = () => {
    window.print();
  };

  if (!order) {
    return (
      <div className="py-16 text-center bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
        <p className="text-[#6E4E37] font-medium">Order not found.</p>
        <button onClick={() => onNavigate('home')} className="mt-4 text-[#8B1E3F] font-bold underline">Return Home</button>
      </div>
    );
  }

  return (
    <div className="py-12 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header Card */}
        <div className="bg-[#FFF8EE] rounded-3xl p-8 border border-[#D4AF37]/40 shadow-sm text-center space-y-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-300">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-xs uppercase tracking-widest text-emerald-900 font-extrabold">
            Order Confirmed & Sacred Package In Preparation
          </span>

          <h1 className="font-serif text-3xl font-bold text-[#8B1E3F]">
            Thank You for Your Order!
          </h1>

          <p className="text-xs sm:text-sm text-[#6E4E37] max-w-md mx-auto font-medium">
            Your order number <span className="font-mono font-bold text-[#8B1E3F]">{order.id}</span> has been successfully logged with our Varanasi dispatch desk.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={handlePrintInvoice}
              className="bg-[#F8F4E8] hover:bg-[#D4AF37]/20 text-[#8B1E3F] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors border border-[#D4AF37]/40"
            >
              <Printer className="w-4 h-4" />
              <span>Print Tax Invoice</span>
            </button>

            <button
              onClick={() => onNavigate('track-order', { trackingNumber: order.trackingNumber })}
              className="bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow transition-colors border border-amber-200"
            >
              <Truck className="w-4 h-4" />
              <span>Track Live Delivery Status</span>
            </button>
          </div>
        </div>

        {/* Printable Order Tax Invoice */}
        <div className="bg-[#FFF8EE] rounded-3xl p-8 border border-[#D4AF37]/40 shadow-sm space-y-6">
          <div className="flex justify-between items-start border-b border-[#D4AF37]/30 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-2xl text-[#8B1E3F]">ॐ शक्ति से शांति तक</span>
              </div>
              <p className="text-xs text-[#6E4E37] mt-1 font-medium">Assi Ghat, Varanasi, Uttar Pradesh - 221005</p>
              <p className="text-[11px] text-[#6E4E37]/80 font-mono">GSTIN: 09AAAAA0000A1Z5</p>
            </div>

            <div className="text-right text-xs text-[#6E4E37]">
              <p className="font-bold text-[#8B1E3F] text-sm">TAX INVOICE</p>
              <p className="font-mono mt-1 font-bold text-[#4A2C17]">Invoice ID: {order.id}</p>
              <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="font-bold text-emerald-800 mt-0.5">Status: {order.orderStatus}</p>
            </div>
          </div>

          {/* Shipping & Payment info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-[#4A2C17]">
            <div>
              <h4 className="font-bold uppercase tracking-wider text-[#8B1E3F] mb-2">Billed & Shipped To:</h4>
              <p className="font-bold text-sm text-[#8B1E3F]">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
              <p>Phone: {order.shippingAddress.phone}</p>
            </div>

            <div>
              <h4 className="font-bold uppercase tracking-wider text-[#8B1E3F] mb-2">Logistics & Payment:</h4>
              <p>Courier: <span className="font-bold text-[#8B1E3F]">{order.courierName}</span></p>
              <p>Tracking Code: <span className="font-mono font-bold">{order.trackingNumber}</span></p>
              <p>Payment Mode: <span className="font-semibold">{order.paymentMethod} ({order.paymentStatus})</span></p>
              <p>Estimated Delivery: <span className="font-bold text-emerald-800">{order.estimatedDeliveryDate}</span></p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-[#D4AF37]/40 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F4E8] text-[#8B1E3F] uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-center">Format</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4AF37]/20">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-bold text-[#8B1E3F]">
                      {item.bookTitle} ({item.language})
                    </td>
                    <td className="p-3 text-center text-[#6E4E37] font-medium">{item.format}</td>
                    <td className="p-3 text-center font-bold text-[#4A2C17]">{item.quantity}</td>
                    <td className="p-3 text-right text-[#4A2C17]">₹{item.unitPrice}</td>
                    <td className="p-3 text-right font-bold text-[#8B1E3F]">₹{item.totalPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-xs text-[#6E4E37] font-medium">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-[#4A2C17]">₹{order.subtotal}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Discount</span>
                  <span>-₹{order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST Tax (5%)</span>
                <span>₹{order.taxAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span>{order.shippingCharge === 0 ? <span className="text-emerald-800 font-bold">FREE</span> : `₹${order.shippingCharge}`}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#4A2C17] pt-2 border-t border-[#D4AF37]/30">
                <span>Grand Total Paid</span>
                <span className="text-[#8B1E3F]">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
