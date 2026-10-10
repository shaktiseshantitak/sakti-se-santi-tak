import React, { useState } from 'react';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Truck, Tag, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useCart } from '../context/CartContext';

interface CartPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const {
    cart,
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
  } = useCart();

  const [couponInput, setCouponInput] = useState<string>('');
  const [couponMsg, setCouponMsg] = useState<{ success: boolean; text: string } | null>(null);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyCoupon(couponInput);
    setCouponMsg({ success: res.success, text: res.message });
    if (res.success) setCouponInput('');
  };

  return (
    <div className="py-8 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[{ label: 'Shopping Cart' }]}
          onHomeClick={() => onNavigate('home')}
        />

        <h1 className="font-serif text-3xl font-bold text-[#8B1E3F] my-6">
          Shopping Cart ({cart.reduce((a, c) => a + c.quantity, 0)} Items)
        </h1>

        {cart.length === 0 ? (
          <div className="bg-[#FFF8EE] p-12 rounded-3xl border border-[#D4AF37]/40 text-center max-w-md mx-auto my-12 shadow-sm">
            <ShoppingBag className="w-16 h-16 text-[#8B1E3F] mx-auto mb-4" />
            <h2 className="font-serif text-xl font-bold text-[#8B1E3F]">
              Your cart is empty
            </h2>
            <p className="text-xs text-[#6E4E37] mt-1 mb-6">
              Browse our sacred scriptures to begin your journey.
            </p>
            <button
              onClick={() => onNavigate('books')}
              className="bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-bold text-xs px-6 py-3 rounded-xl shadow border border-amber-200"
            >
              Browse Books Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cart Items Table Left Column */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-[#FFF8EE] rounded-3xl border border-[#D4AF37]/40 shadow-sm p-6 overflow-hidden">
                <div className="divide-y divide-[#D4AF37]/20">
                  {cart.map(item => (
                    <div
                      key={`${item.book.id}-${item.selectedFormat}-${item.selectedLanguage}`}
                      className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <img
                          src={item.book.coverImage}
                          alt={item.book.title}
                          className="w-16 h-22 object-cover rounded-xl shadow-sm border border-[#D4AF37]/40 shrink-0"  loading="lazy" decoding="async" />
                        <div>
                          <h3 className="font-serif font-bold text-sm text-[#8B1E3F]">
                            {item.book.title}
                          </h3>
                          <p className="text-xs text-[#6E4E37]">
                            By {item.book.authorName}
                          </p>
                          <div className="flex gap-2 text-[10px] text-[#8B1E3F] font-semibold mt-1">
                            <span className="bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2 py-0.5 rounded">
                              {item.selectedFormat}
                            </span>
                            <span className="bg-[#F8F4E8] text-[#4A2C17] border border-[#D4AF37]/30 px-2 py-0.5 rounded">
                              {item.selectedLanguage}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                        <div className="flex items-center border border-[#D4AF37]/50 rounded-xl overflow-hidden bg-[#F8F4E8]">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.book.id,
                                item.selectedFormat,
                                item.selectedLanguage,
                                item.quantity - 1
                              )
                            }
                            className="px-3 py-1 text-[#8B1E3F] hover:bg-[#D4AF37]/20 font-bold"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 font-bold text-xs text-[#8B1E3F]">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.book.id,
                                item.selectedFormat,
                                item.selectedLanguage,
                                item.quantity + 1
                              )
                            }
                            className="px-3 py-1 text-[#8B1E3F] hover:bg-[#D4AF37]/20 font-bold"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-bold text-sm text-[#8B1E3F] w-20 text-right">
                          ₹{item.book.offerPrice * item.quantity}
                        </span>

                        <button
                          onClick={() => removeFromCart(item.book.id, item.selectedFormat, item.selectedLanguage)}
                          className="text-[#6E4E37] hover:text-[#8B1E3F]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-[#D4AF37]/20 flex justify-between items-center">
                  <button
                    onClick={clearCart}
                    className="text-xs text-[#8B1E3F] font-bold hover:underline"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={() => onNavigate('books')}
                    className="text-xs text-[#8B1E3F] font-bold hover:underline"
                  >
                    ← Continue Shopping
                  </button>
                </div>
              </div>
            </div>

            {/* Order Summary Right Column */}
            <div className="lg:col-span-4">
              <div className="bg-[#FFF8EE] rounded-3xl border border-[#D4AF37]/40 shadow-sm p-6 space-y-4 sticky top-24">
                <h3 className="font-serif font-bold text-base text-[#8B1E3F] border-b border-[#D4AF37]/30 pb-3">
                  Order Summary
                </h3>

                {/* Promo Code */}
                <div>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs">
                      <span className="font-bold text-emerald-900">
                        Coupon {appliedCoupon.code}
                      </span>
                      <button onClick={removeCoupon} className="text-rose-700 font-bold underline">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApply} className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={e => setCouponInput(e.target.value)}
                        placeholder="Coupon Code"
                        className="flex-1 px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-xs uppercase text-[#4A2C17]"
                      />
                      <button type="submit" className="bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] text-xs px-3 py-2 rounded-xl font-bold border border-amber-200">
                        Apply
                      </button>
                    </form>
                  )}
                  {couponMsg && (
                    <p className={`text-[11px] mt-1 font-semibold ${couponMsg.success ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {couponMsg.text}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-xs text-[#6E4E37] font-medium">
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
                    <span>Shipping</span>
                    <span>{shippingCharge === 0 ? <span className="text-emerald-800 font-bold">FREE</span> : `₹${shippingCharge}`}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#4A2C17] pt-2 border-t border-[#D4AF37]/30">
                    <span>Total Pay</span>
                    <span className="text-[#8B1E3F] text-base">₹{totalAmount}</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('checkout')}
                  className="w-full bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-extrabold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm border border-amber-200"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 text-[#3A1F0D]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
