import { useSiteContent, useTaxPercent } from '../lib/useSiteContent';
import { formatContent } from '../utils/siteContent';
import React, { useState } from 'react';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Truck, Tag, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useCart } from '../context/CartContext';

interface CartPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const tx = useSiteContent();

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
  const c = useSiteContent();
  const taxPct = useTaxPercent();

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
    <div className="py-8 bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[{ label: c('crumb.cartPage') }]}
          onHomeClick={() => onNavigate('home')}
        />

        <h1 className="font-serif text-3xl font-bold text-[color:var(--c-primary)] my-6">
          {tx('t.CartPage.d559f6b6')}{cart.reduce((a, c) => a + c.quantity, 0)} {tx('t.CartPage.a28e16a7')}
        </h1>

        {cart.length === 0 ? (
          <div className="bg-[color:var(--c-surface)] p-12 rounded-3xl border border-[color:var(--c-accent)]/40 text-center max-w-md mx-auto my-12 shadow-sm">
            <ShoppingBag className="w-16 h-16 text-[color:var(--c-primary)] mx-auto mb-4" />
            <h2 className="font-serif text-xl font-bold text-[color:var(--c-primary)]">
              {c('cart.emptyTitle')}
            </h2>
            <p className="text-xs text-[color:var(--c-text-muted)] mt-1 mb-6">
              {c('cart.emptyText')}
            </p>
            <button
              onClick={() => onNavigate('books')}
              className="bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] font-bold text-xs px-6 py-3 rounded-xl shadow border border-amber-200"
            >
              {c('cart.browse')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cart Items Table Left Column */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-[color:var(--c-surface)] rounded-3xl border border-[color:var(--c-accent)]/40 shadow-sm p-6 overflow-hidden">
                <div className="divide-y divide-[color:var(--c-accent)]/20">
                  {cart.map(item => (
                    <div
                      key={`${item.book.id}-${item.selectedFormat}-${item.selectedLanguage}`}
                      className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <img
                          src={item.book.coverImage}
                          alt={item.book.title}
                          className="w-16 h-22 object-cover rounded-xl shadow-sm border border-[color:var(--c-accent)]/40 shrink-0"  loading="lazy" decoding="async" />
                        <div>
                          <h3 className="font-serif font-bold text-sm text-[color:var(--c-primary)]">
                            {item.book.title}
                          </h3>
                          <p className="text-xs text-[color:var(--c-text-muted)]">
                            {tx('t.CartPage.9c22cdec')} {item.book.authorName}
                          </p>
                          <div className="flex gap-2 text-[10px] text-[color:var(--c-primary)] font-semibold mt-1">
                            <span className="bg-[color:var(--c-accent)]/20 border border-[color:var(--c-accent)]/40 px-2 py-0.5 rounded">
                              {item.selectedFormat}
                            </span>
                            <span className="bg-[color:var(--c-page)] text-[color:var(--c-text)] border border-[color:var(--c-accent)]/30 px-2 py-0.5 rounded">
                              {item.selectedLanguage}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                        <div className="flex items-center border border-[color:var(--c-accent)]/50 rounded-xl overflow-hidden bg-[color:var(--c-page)]">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.book.id,
                                item.selectedFormat,
                                item.selectedLanguage,
                                item.quantity - 1
                              )
                            }
                            className="px-3 py-1 text-[color:var(--c-primary)] hover:bg-[color:var(--c-accent)]/20 font-bold"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 font-bold text-xs text-[color:var(--c-primary)]">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.book.id,
                                item.selectedFormat,
                                item.selectedLanguage,
                                item.quantity + 1
                              )
                            }
                            className="px-3 py-1 text-[color:var(--c-primary)] hover:bg-[color:var(--c-accent)]/20 font-bold"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-bold text-sm text-[color:var(--c-primary)] w-20 text-right">
                          ₹{item.book.offerPrice * item.quantity}
                        </span>

                        <button
                          onClick={() => removeFromCart(item.book.id, item.selectedFormat, item.selectedLanguage)}
                          className="text-[color:var(--c-text-muted)] hover:text-[color:var(--c-primary)]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-[color:var(--c-accent)]/20 flex justify-between items-center">
                  <button
                    onClick={clearCart}
                    className="text-xs text-[color:var(--c-primary)] font-bold hover:underline"
                  >
                    {c('cart.clear')}
                  </button>
                  <button
                    onClick={() => onNavigate('books')}
                    className="text-xs text-[color:var(--c-primary)] font-bold hover:underline"
                  >
                    {c('cart.continue')}
                  </button>
                </div>
              </div>
            </div>

            {/* Order Summary Right Column */}
            <div className="lg:col-span-4">
              <div className="bg-[color:var(--c-surface)] rounded-3xl border border-[color:var(--c-accent)]/40 shadow-sm p-6 space-y-4 sticky top-24">
                <h3 className="font-serif font-bold text-base text-[color:var(--c-primary)] border-b border-[color:var(--c-accent)]/30 pb-3">
                  {c('cart.summary')}
                </h3>

                {/* Promo Code */}
                <div>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs">
                      <span className="font-bold text-emerald-900">
                        {tx('t.CartPage.79627e2c')} {appliedCoupon.code}
                      </span>
                      <button onClick={removeCoupon} className="text-rose-700 font-bold underline">
                        {tx('t.CartPage.785b1f30')}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApply} className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={e => setCouponInput(e.target.value)}
                        placeholder={c('cart.couponPlaceholder')}
                        className="flex-1 px-3 py-2 bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 rounded-xl text-xs uppercase text-[color:var(--c-text)]"
                      />
                      <button type="submit" className="bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] text-xs px-3 py-2 rounded-xl font-bold border border-amber-200">
                        {c('cart.apply')}
                      </button>
                    </form>
                  )}
                  {couponMsg && (
                    <p className={`text-[11px] mt-1 font-semibold ${couponMsg.success ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {couponMsg.text}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-xs text-[color:var(--c-text-muted)] font-medium">
                  <div className="flex justify-between">
                    <span>{c('cart.subtotal')}</span>
                    <span className="font-bold text-[color:var(--c-text)]">₹{subtotal}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-800 font-bold">
                      <span>{c('cart.discount')}</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{formatContent(c('cart.gst'), { rate: taxPct })}</span>
                    <span>₹{taxAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{c('cart.shipping')}</span>
                    <span>{shippingCharge === 0 ? <span className="text-emerald-800 font-bold">{c('cart.free')}</span> : `₹${shippingCharge}`}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[color:var(--c-text)] pt-2 border-t border-[color:var(--c-accent)]/30">
                    <span>{c('cart.total')}</span>
                    <span className="text-[color:var(--c-primary)] text-base">₹{totalAmount}</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('checkout')}
                  className="w-full bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] font-extrabold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm border border-amber-200"
                >
                  <span>{c('cart.checkout')}</span>
                  <ArrowRight className="w-4 h-4 text-[color:var(--c-ink)]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
