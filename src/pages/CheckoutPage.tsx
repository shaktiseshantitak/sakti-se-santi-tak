import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, CreditCard, Lock, ShieldAlert, QrCode } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import { useAffiliate } from '../context/AffiliateContext';
import { OrderAddress, PaymentMethod, ShippingCourier } from '../types';
import { sanitizeInput, isRateLimited, isHoneypotTriggered, validateEmail, validatePhone, validatePincode } from '../utils/security';

interface CheckoutPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { cart, subtotal, discountAmount, taxAmount, shippingCharge, totalAmount, clearCart, appliedCoupon } = useCart();
  const { user, sessionToken } = useAuth();
  const { createOrder, siteSettings } = useBooks();
  const { processOrderCommission } = useAffiliate();

  // FIXED (2026-08-29 — "customer addresses are hardcoded, must reflect
  // real database data"): a brand-new customer with no saved address used
  // to have their city/state/pincode PRE-FILLED with the shop's own
  // Varanasi / Uttar Pradesh / 221005 — not their real address. If they
  // didn't notice and change it, their order could ship to the wrong
  // place. Left blank now, so the form genuinely reflects "no address on
  // file yet" instead of silently substituting the seller's own location.
  const defaultAddress = user?.addresses[0] || {
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  };

  const [address, setAddress] = useState<OrderAddress>(defaultAddress);
  const [hasAppliedSavedAddress, setHasAppliedSavedAddress] = useState<boolean>(Boolean(user?.addresses?.[0]));

  // FIXED: user.addresses can finish loading from Supabase AFTER this page
  // has already mounted (e.g. navigating here directly). The form used to
  // capture `defaultAddress` exactly once at mount via useState's
  // initializer and never look at user.addresses again — so a returning
  // customer with a real saved address could still see a blank form.
  // Only auto-fills once, and only if the customer hasn't already started
  // typing their own values (never overwrites active edits).
  useEffect(() => {
    if (!hasAppliedSavedAddress && user?.addresses?.[0]) {
      setAddress(user.addresses[0]);
      setHasAppliedSavedAddress(true);
    }
  }, [user?.addresses, hasAppliedSavedAddress]);
  const [courier, setCourier] = useState<ShippingCourier>('Delhivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  // FIXED (2026-08-29 — "BHIM UPI Integration: UPI ID field + QR code"):
  // there was no UPI ID input at all, and the Razorpay modal always opened
  // to its generic all-methods screen. Below, this VPA is passed as
  // prefill.vpa and the modal is configured to open straight into the UPI
  // tab (which is where Razorpay renders its own scannable QR code) —
  // reusing the SAME secure, backend-signature-verified payment flow
  // already fixed earlier, rather than a separate unverified QR path.
  const [upiId, setUpiId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [honeypot, setHoneypot] = useState<string>('');
  const [securityError, setSecurityError] = useState<string | null>(null);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);

    // 1. Anti-Bot Honeypot Check
    if (isHoneypotTriggered(honeypot)) {
      console.warn('[Security] Bot honeypot triggered on checkout form.');
      setIsSubmitting(true);
      setTimeout(() => { setIsSubmitting(false); }, 1000);
      return;
    }

    // 2. Client Rate Limiting
    if (isRateLimited('checkout-submit', 3, 60000)) {
      setSecurityError('Security Alert: Too many order attempts in a short time. Please wait 1 minute.');
      return;
    }

    // 3. User Authentication Check
    if (!user || !sessionToken) {
      setSecurityError('Authentication required to place an order. Please sign in.');
      return;
    }

    // 4. Address Validations
    if (!validateEmail(address.email)) {
      setSecurityError('Please enter a valid email address.');
      return;
    }
    if (!validatePhone(address.phone)) {
      setSecurityError('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    if (!validatePincode(address.pincode)) {
      setSecurityError('Please enter a valid 6-digit Indian Pincode.');
      return;
    }

    // 5. Sanitize Address Inputs
    const cleanAddress: OrderAddress = {
      fullName: sanitizeInput(address.fullName, 100),
      phone: sanitizeInput(address.phone, 20),
      email: sanitizeInput(address.email, 100),
      addressLine1: sanitizeInput(address.addressLine1, 250),
      addressLine2: address.addressLine2 ? sanitizeInput(address.addressLine2, 250) : '',
      city: sanitizeInput(address.city, 100),
      state: sanitizeInput(address.state, 100),
      pincode: sanitizeInput(address.pincode, 10),
      country: 'India',
    };

    setIsSubmitting(true);

    const orderItems = cart.map(c => ({
      bookId: c.book.id,
      quantity: c.quantity,
      format: c.selectedFormat,
      language: c.selectedLanguage,
    }));

    // Server-side authoritative order creation call
    fetch('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        items: orderItems,
        shippingAddress: cleanAddress,
        couponCode: appliedCoupon?.code,
        paymentMethod,
      }),
    })
      .then(res => {
        if (res.status === 503) {
          throw new Error('Ordering service is temporarily unavailable. Database/Backend connection required.');
        }
        if (res.status === 401) {
          throw new Error('Your session has expired. Please sign in again.');
        }
        return res.json();
      })
      .then(async apiResult => {
        if (!apiResult.success || apiResult.error) {
          setSecurityError(apiResult.error || 'Failed to create order on server.');
          setIsSubmitting(false);
          return;
        }

        const serverTotal = apiResult.totalAmount;

        // Razorpay Online Gateway Integration
        if ((paymentMethod === 'Razorpay' || paymentMethod === 'UPI' || paymentMethod === 'Card') && (window as any).Razorpay) {
          try {
            const payOrderRes = await fetch('/api/payment/create-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`,
              },
              body: JSON.stringify({
                orderId: apiResult.orderId,
              }),
            });

            const payData = await payOrderRes.json();

            if (payData.configured && payData.id) {
              const options = {
                key: payData.keyId,
                amount: payData.amount,
                currency: payData.currency,
                name: 'Shakti Se Shanti Tak',
                description: `Order Payment #${apiResult.orderNumber}`,
                order_id: payData.id,
                prefill: {
                  name: cleanAddress.fullName,
                  email: cleanAddress.email,
                  contact: cleanAddress.phone,
                  ...(paymentMethod === 'UPI' && upiId ? { method: 'upi', vpa: upiId } : {}),
                },
                // Opens straight into the UPI tab (QR code + VPA entry +
                // intent apps) instead of the generic all-methods screen,
                // when the customer picked BHIM/UPI on our own page.
                ...(paymentMethod === 'UPI' ? {
                  config: {
                    display: {
                      blocks: {
                        upi: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] },
                      },
                      sequence: ['block.upi'],
                      preferences: { show_default_blocks: false },
                    },
                  },
                } : {}),
                theme: { color: '#8B1E3F' },
                handler: async (response: any) => {
                  const verifyRes = await fetch('/api/payment/verify', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${sessionToken}`,
                    },
                    body: JSON.stringify({
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      orderId: apiResult.orderId,
                    }),
                  });

                  const verifyData = await verifyRes.json();
                  if (verifyData.success) {
                    finalizeOrder(apiResult, verifyData.transactionId, 'Paid', cleanAddress);
                  } else {
                    // FIXED (2026-08-29 — "orders placed even when payment
                    // fails"): server-side /api/payment/verify already
                    // cancels the order + restores stock on a failed
                    // signature check (see cancelUnpaidOrderAndRestoreStock
                    // in server.ts). This just surfaces that clearly to the
                    // customer instead of leaving them thinking their order
                    // might still be sitting there pending.
                    setSecurityError((verifyData.error || 'Payment verification failed.') + ' Your order was not placed.');
                    setIsSubmitting(false);
                  }
                },
                modal: {
                  ondismiss: () => {
                    // FIXED (2026-08-29 — same bug): closing the Razorpay
                    // popup used to just show an error locally while the
                    // order created moments earlier by /api/orders/create
                    // stayed in the database as a real-looking "Processing"
                    // order forever, with stock already deducted for it.
                    // Now explicitly cancelled server-side and its stock
                    // restored the moment the popup is dismissed.
                    fetch('/api/payment/cancel-unpaid-order', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionToken}`,
                      },
                      body: JSON.stringify({ orderId: apiResult.orderId }),
                    }).catch(() => {});
                    setIsSubmitting(false);
                    setSecurityError('Payment window closed before completion. Your order was not placed.');
                  },
                },
              };

              const rzp = new (window as any).Razorpay(options);
              rzp.open();
              return;
            } else {
              // FIXED: Razorpay order creation itself failing also left an
              // 'Awaiting Payment' order + deducted stock behind with no
              // popup ever shown — same bug, different failure point.
              fetch('/api/payment/cancel-unpaid-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
                body: JSON.stringify({ orderId: apiResult.orderId }),
              }).catch(() => {});
              setSecurityError(payData.error || 'Payment Gateway is not configured. Your order was not placed.');
              setIsSubmitting(false);
              return;
            }
          } catch (payErr: any) {
            fetch('/api/payment/cancel-unpaid-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
              body: JSON.stringify({ orderId: apiResult.orderId }),
            }).catch(() => {});
            setSecurityError('Online payment processing failed. Your order was not placed.');
            setIsSubmitting(false);
            return;
          }
        }

        // COD Order Completion
        if (paymentMethod === 'COD') {
          finalizeOrder(apiResult, undefined, 'Pending', cleanAddress);
        } else {
          setSecurityError('Selected payment method requires server gateway verification.');
          setIsSubmitting(false);
        }
      })
      .catch(err => {
        console.error('[Checkout API Error]:', err);
        setSecurityError(err.message || 'Server communication error during order creation.');
        setIsSubmitting(false);
      });
  };

  const finalizeOrder = (apiResult: any, transactionId?: string, paymentStatus: any = 'Paid', cleanAddress?: OrderAddress) => {
    const newOrd = createOrder({
      userId: user?.id,
      items: cart.map(c => ({
        bookId: c.book.id,
        bookTitle: sanitizeInput(c.book.title, 200),
        coverImage: c.book.coverImage,
        format: c.selectedFormat,
        language: c.selectedLanguage,
        unitPrice: c.book.offerPrice,
        quantity: c.quantity,
        totalPrice: c.book.offerPrice * c.quantity,
      })),
      shippingAddress: cleanAddress || address,
      subtotal: apiResult.subtotal || subtotal,
      discountAmount: apiResult.discountAmount || discountAmount,
      shippingCharge: apiResult.shippingCharge !== undefined ? apiResult.shippingCharge : shippingCharge,
      taxAmount: apiResult.taxAmount || taxAmount,
      totalAmount: apiResult.totalAmount || totalAmount,
      paymentMethod,
      paymentStatus,
      paymentTransactionId: transactionId,
      orderStatus: 'Processing',
      courierName: courier,
      trackingNumber: `TRACK-${apiResult.orderNumber}`,
      estimatedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      couponCodeUsed: appliedCoupon?.code,
    }, { orderId: apiResult.orderId, orderNumber: apiResult.orderNumber });

    processOrderCommission(
      newOrd.id,
      apiResult.totalAmount || totalAmount,
      cleanAddress?.fullName || user?.fullName || 'Valued Customer'
    );

    clearCart();
    setIsSubmitting(false);
    onNavigate('order-success', { orderId: newOrd.id });
  };

  return (
    <div className="py-8 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[{ label: 'Cart', onClick: () => onNavigate('cart') }, { label: 'Secure Checkout' }]}
          onHomeClick={() => onNavigate('home')}
        />

        <h1 className="font-serif text-3xl font-bold text-[#8B1E3F] my-6">
          Checkout & Order Confirmation
        </h1>

        {securityError && (
          <div className="mb-6 p-4 bg-rose-100/80 border border-rose-300 rounded-2xl text-xs text-rose-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0" />
            <span className="font-bold">{securityError}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Honeypot Field */}
          <div className="hidden" aria-hidden="true">
            <input
              type="text"
              name="honeypot_bot_trap"
              tabIndex={-1}
              value={honeypot}
              onChange={e => setHoneypot(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Address */}
            <div className="bg-[#FFF8EE] rounded-3xl p-6 border border-[#D4AF37]/40 shadow-sm space-y-4">
              <h2 className="font-serif font-bold text-lg text-[#8B1E3F] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#8B1E3F] text-amber-100 text-xs flex items-center justify-center font-sans">
                  1
                </span>
                Shipping Address Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-[#8B1E3F]">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={e => setAddress({ ...address, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 text-[#4A2C17] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#8B1E3F]">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={address.phone}
                    onChange={e => setAddress({ ...address, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 text-[#4A2C17] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#8B1E3F]">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={address.email}
                    onChange={e => setAddress({ ...address, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 text-[#4A2C17] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#8B1E3F]">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={address.pincode}
                    onChange={e => setAddress({ ...address, pincode: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 text-[#4A2C17] rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1 text-[#8B1E3F]">Address Line 1 *</label>
                  <input
                    type="text"
                    required
                    value={address.addressLine1}
                    onChange={e => setAddress({ ...address, addressLine1: e.target.value })}
                    placeholder="House No, Street, Landmark"
                    className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 text-[#4A2C17] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#8B1E3F]">City *</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={e => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 text-[#4A2C17] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#8B1E3F]">State *</label>
                  <input
                    type="text"
                    required
                    value={address.state}
                    onChange={e => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 text-[#4A2C17] rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Courier Choice */}
            <div className="bg-[#FFF8EE] rounded-3xl p-6 border border-[#D4AF37]/40 shadow-sm space-y-4">
              <h2 className="font-serif font-bold text-lg text-[#8B1E3F] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#8B1E3F] text-amber-100 text-xs flex items-center justify-center font-sans">
                  2
                </span>
                Logistics Courier Partner
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {(['Delhivery', 'India Post', 'Blue Dart', 'DTDC'] as ShippingCourier[]).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCourier(c)}
                    className={`p-3 rounded-2xl border text-left font-bold transition-all ${
                      courier === c
                        ? 'bg-[#8B1E3F] text-amber-100 border-[#8B1E3F] shadow-sm'
                        : 'bg-[#F8F4E8] border-[#D4AF37]/40 text-[#4A2C17]'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-[#D4AF37] mb-1" />
                    <span>{c}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Payment Options */}
            <div className="bg-[#FFF8EE] rounded-3xl p-6 border border-[#D4AF37]/40 shadow-sm space-y-4">
              <h2 className="font-serif font-bold text-lg text-[#8B1E3F] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#8B1E3F] text-amber-100 text-xs flex items-center justify-center font-sans">
                  3
                </span>
                Payment Gateway Mode
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {/* FIXED ("payment mode toggle must work in real-time"):
                    this list used to be a hardcoded array — admin toggles
                    in site_settings (enableCod/enableUpi/enableOnlinePayment)
                    were saved but never actually read here. Now filtered
                    live against siteSettings, which itself updates
                    instantly via the Realtime subscription in
                    BookContext.tsx. */}
                {(['Razorpay', 'UPI', 'Card', 'COD'] as PaymentMethod[])
                  .filter(m => {
                    if (m === 'COD') return siteSettings.enableCod ?? true;
                    if (m === 'UPI') return siteSettings.enableUpi ?? true;
                    return siteSettings.enableOnlinePayment ?? true; // Razorpay / Card
                  })
                  .map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`p-3.5 rounded-2xl border text-left font-bold transition-all ${
                      paymentMethod === m
                        ? 'bg-[#8B1E3F] text-amber-100 border-[#8B1E3F] shadow-sm'
                        : 'bg-[#F8F4E8] border-[#D4AF37]/40 text-[#4A2C17]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mb-1 text-[#D4AF37]" />
                    <span>{m === 'Razorpay' ? 'Razorpay (Cards/NetBanking)' : m === 'UPI' ? 'BHIM / UPI' : m}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === 'UPI' && (
                <div className="pt-1">
                  <label className="text-[11px] font-bold text-[#6E4E37] block mb-1">
                    Apna UPI ID daalein (optional) — ya popup mein QR code scan karke bhi pay kar sakte hain
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="w-full px-3.5 py-2.5 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-xs font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-[#FFF8EE] rounded-3xl p-6 border border-[#D4AF37]/40 shadow-sm space-y-4 sticky top-24">
              <h3 className="font-serif font-bold text-base text-[#8B1E3F] border-b border-[#D4AF37]/30 pb-3">
                Review & Confirm ({cart.length} Items)
              </h3>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={`${item.book.id}-${item.selectedFormat}`} className="flex justify-between text-xs text-[#4A2C17]">
                    <span className="truncate max-w-[180px] font-medium">{item.book.title} x {item.quantity}</span>
                    <span className="font-bold text-[#8B1E3F]">₹{item.book.offerPrice * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-xs text-[#6E4E37] pt-3 border-t border-[#D4AF37]/30 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#4A2C17]">₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST Tax (5%)</span>
                  <span>₹{taxAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping ({courier})</span>
                  <span>{shippingCharge === 0 ? <span className="text-emerald-800 font-bold">FREE</span> : `₹${shippingCharge}`}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#4A2C17] pt-2 border-t border-[#D4AF37]/30">
                  <span>Total Amount</span>
                  <span className="text-[#8B1E3F]">₹{totalAmount}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-extrabold py-4 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-sm border border-amber-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Securing Order...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#3A1F0D]" />
                    <span>Pay ₹{totalAmount} & Place Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
