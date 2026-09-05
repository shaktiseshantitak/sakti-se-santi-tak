import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, Truck, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    subtotal,
    discountAmount,
    taxAmount,
    shippingCharge,
    totalAmount,
    freeShippingThreshold,
    amountNeededForFreeShipping,
    totalItemsCount,
  } = useCart();

  const [couponInput, setCouponInput] = useState<string>('');
  const [couponMessage, setCouponMessage] = useState<{ success: boolean; text: string } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyCoupon(couponInput);
    setCouponMessage({ success: res.success, text: res.message });
    if (res.success) setCouponInput('');
  };

  const shippingProgressPercent = Math.min(
    100,
    Math.round(((subtotal - discountAmount) / freeShippingThreshold) * 100)
  );

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} aria-hidden="true" />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-panel shadow-sm flex flex-col text-zinc-900 dark:text-zinc-100">
          {/* Header */}
          <div className="bg-amber-900 text-amber-100 px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <h2 id="cart-drawer-title" className="font-serif font-bold text-lg text-white">
                Your Sacred Cart ({totalItemsCount})
              </h2>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-amber-800 transition-colors"
              aria-label="Close Cart"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="bg-amber-50 dark:bg-amber-950/40 p-3 px-6 border-b border-amber-200/60 dark:border-amber-900/40 text-xs">
            {amountNeededForFreeShipping > 0 ? (
              <div>
                <div className="flex justify-between font-medium text-amber-900 dark:text-amber-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4 text-amber-600" /> Add ₹{amountNeededForFreeShipping} more for Free Shipping
                  </span>
                  <span>{shippingProgressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-amber-200 dark:bg-amber-900 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${shippingProgressPercent}%` }}
                    className="h-full bg-amber-600 rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> You unlocked FREE Express Shipping!
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-white">
                  Your cart is empty
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                  Explore our sacred scripture catalog of Bhagavad Gita, Ramayana, and Upanishads to begin your journey.
                </p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={`${item.book.id}-${item.selectedFormat}-${item.selectedLanguage}`}
                  className="flex gap-4 p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 relative group"
                >
                  <img
                    src={item.book.coverImage}
                    alt={item.book.title}
                    className="w-16 h-22 object-cover rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-700 shrink-0"
                   loading="lazy" decoding="async" />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif font-semibold text-xs text-zinc-900 dark:text-white line-clamp-2">
                          {item.book.title}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.book.id, item.selectedFormat, item.selectedLanguage)}
                          className="text-zinc-400 hover:text-rose-600 transition-colors p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                        <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium">
                          {item.selectedFormat}
                        </span>
                        <span>• {item.selectedLanguage}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-800 text-xs">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.book.id,
                              item.selectedFormat,
                              item.selectedLanguage,
                              item.quantity - 1
                            )
                          }
                          className="px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                        >
                          -
                        </button>
                        <span className="px-2 py-1 font-semibold min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.book.id,
                              item.selectedFormat,
                              item.selectedLanguage,
                              item.quantity + 1
                            )
                          }
                          className="px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-bold text-sm text-amber-900 dark:text-amber-400">
                        ₹{item.book.offerPrice * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout & Summary Panel */}
          {cart.length > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
              {/* Promo Code Form */}
              <div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Coupon {appliedCoupon.code} Applied</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-rose-600 text-[11px] underline font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value)}
                      placeholder="Promo Code (e.g. DHARMA10, RAMA108)"
                      className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
                    />
                    <button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3 py-2 rounded-xl transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponMessage && (
                  <p
                    className={`text-[11px] mt-1 font-medium ${
                      couponMessage.success ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {couponMessage.text}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    ₹{subtotal}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Coupon Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated GST Tax (5%)</span>
                  <span>₹{taxAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span>
                    {shippingCharge === 0 ? (
                      <span className="text-emerald-600 font-semibold">FREE</span>
                    ) : (
                      `₹${shippingCharge}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-zinc-900 dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span>Total Amount</span>
                  <span className="text-amber-900 dark:text-amber-400 text-base">
                    ₹{totalAmount}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Encrypted 256-bit Secure Checkout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
