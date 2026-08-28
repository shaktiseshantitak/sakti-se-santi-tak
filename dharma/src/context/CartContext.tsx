import React, { createContext, useContext, useState, useEffect } from 'react';
import { Book, CartItem, BookFormat, BookLanguage, Coupon } from '../types';
import { getLocalData, setLocalData, supabase, isSupabaseConfigured } from '../lib/supabase';
import { useBooks } from './BookContext';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartItem[];
  wishlistBookIds: string[];
  recentlyViewedBookIds: string[];
  appliedCoupon: Coupon | null;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Cart operations
  addToCart: (book: Book, format?: BookFormat, language?: BookLanguage, quantity?: number) => void;
  removeFromCart: (bookId: string, format: BookFormat, language: BookLanguage) => void;
  updateQuantity: (bookId: string, format: BookFormat, language: BookLanguage, quantity: number) => void;
  clearCart: () => void;

  // Coupon operations
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;

  // Wishlist operations
  toggleWishlist: (bookId: string) => void;
  isInWishlist: (bookId: string) => boolean;

  // Recently Viewed
  addRecentlyViewed: (bookId: string) => void;

  // Financial calculations
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingCharge: number;
  totalAmount: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  totalItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { coupons, siteSettings } = useBooks();
  const { user } = useAuth();

  const [cart, setCart] = useState<CartItem[]>(() => getLocalData<CartItem[]>('cart_items', []));
  // FIXED: every brand-new visitor/browser used to start with 'book-1' and
  // 'book-4' already sitting in their wishlist — fake pre-filled data with
  // no relation to anything the person actually did. A wishlist should
  // start genuinely empty.
  const [wishlistBookIds, setWishlistBookIds] = useState<string[]>(() =>
    getLocalData<string[]>('wishlist_ids', [])
  );
  const [recentlyViewedBookIds, setRecentlyViewedBookIds] = useState<string[]>(() =>
    getLocalData<string[]>('recently_viewed', ['book-1', 'book-2'])
  );
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() =>
    getLocalData<Coupon | null>('applied_coupon', null)
  );
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => { setLocalData('cart_items', cart); }, [cart]);
  useEffect(() => { setLocalData('wishlist_ids', wishlistBookIds); }, [wishlistBookIds]);
  useEffect(() => { setLocalData('recently_viewed', recentlyViewedBookIds); }, [recentlyViewedBookIds]);
  useEffect(() => { setLocalData('applied_coupon', appliedCoupon); }, [appliedCoupon]);

  // NOTE: previously toggleWishlist only ever touched local browser storage.
  // The database already has a `wishlists` table with RLS scoped to
  // auth.uid() specifically for this — it was just never wired up — meaning a
  // logged-in customer's wishlist never followed them to another device or
  // browser. When a user is signed in, pull their real wishlist from Supabase
  // once (merging local guest-session picks in too, since a customer may have
  // added items before logging in) so it actually follows their account.
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) return;
    let isMounted = true;

    supabase.from('wishlists').select('book_id').eq('user_id', user.id).then(({ data, error }) => {
      if (error) {
        console.warn('Supabase wishlist fetch error:', error.message);
        return;
      }
      if (!isMounted || !data) return;
      const remoteIds = data.map((r: any) => r.book_id);
      setWishlistBookIds(prev => Array.from(new Set([...prev, ...remoteIds])));
    });

    return () => { isMounted = false; };
  }, [user?.id]);

  const addToCart = (
    book: Book,
    format: BookFormat = book.primaryFormat,
    language: BookLanguage = book.primaryLanguage,
    quantity: number = 1
  ) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        item => item.book.id === book.id && item.selectedFormat === format && item.selectedLanguage === language
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, { book, selectedFormat: format, selectedLanguage: language, quantity }];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (bookId: string, format: BookFormat, language: BookLanguage) => {
    setCart(prev =>
      prev.filter(
        item => !(item.book.id === bookId && item.selectedFormat === format && item.selectedLanguage === language)
      )
    );
  };

  const updateQuantity = (
    bookId: string,
    format: BookFormat,
    language: BookLanguage,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(bookId, format, language);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.book.id === bookId && item.selectedFormat === format && item.selectedLanguage === language
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const toggleWishlist = (bookId: string) => {
    const currentlyIn = wishlistBookIds.includes(bookId);
    setWishlistBookIds(prev =>
      currentlyIn ? prev.filter(id => id !== bookId) : [...prev, bookId]
    );

    if (isSupabaseConfigured && supabase && user) {
      if (currentlyIn) {
        supabase.from('wishlists').delete().eq('user_id', user.id).eq('book_id', bookId).then(({ error }) => {
          if (error) console.warn('Supabase wishlist delete error:', error.message);
        });
      } else {
        supabase.from('wishlists').upsert({ user_id: user.id, book_id: bookId }, { onConflict: 'user_id,book_id' }).then(({ error }) => {
          if (error) console.warn('Supabase wishlist insert error:', error.message);
        });
      }
    }
  };

  const isInWishlist = (bookId: string) => wishlistBookIds.includes(bookId);

  const addRecentlyViewed = (bookId: string) => {
    setRecentlyViewedBookIds(prev => {
      const filtered = prev.filter(id => id !== bookId);
      return [bookId, ...filtered].slice(0, 8); // Keep max 8
    });
  };

  // Financial Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.book.offerPrice * item.quantity, 0);

  let discountAmount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.minOrderValue) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
      if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
        discountAmount = appliedCoupon.maxDiscount;
      }
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  const netSubtotal = Math.max(0, subtotal - discountAmount);
  const freeShippingThreshold = siteSettings.freeShippingMinAmount || 799;
  const shippingCharge = netSubtotal > 0 && netSubtotal < freeShippingThreshold ? 60 : 0;
  const taxAmount = Math.round((netSubtotal * (siteSettings.taxPercentage || 5)) / 100);
  const totalAmount = netSubtotal + shippingCharge + taxAmount;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - netSubtotal);
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const cleanCode = code.trim().toUpperCase();
    const found = coupons.find(c => c.code === cleanCode && c.active);

    if (!found) {
      return { success: false, message: 'Invalid or expired promo code.' };
    }
    // FIXED: this never checked expiryDate or usageCount/usage limit, so a
    // customer could see a coupon "successfully applied" here (with the
    // discount reflected in their cart total) that the server would then
    // correctly reject at actual checkout — meaning the amount they're
    // charged could come out higher than what their cart just showed them,
    // with no explanation. Checking the same conditions here that the server
    // enforces (see server.ts /api/orders/create) avoids that mismatch.
    if (found.expiryDate && new Date(found.expiryDate) < new Date()) {
      return { success: false, message: `${found.code} has expired.` };
    }
    if (subtotal < found.minOrderValue) {
      return {
        success: false,
        message: `Minimum order value for ${found.code} is ₹${found.minOrderValue}. Add ₹${found.minOrderValue - subtotal} more to apply.`,
      };
    }
    // Product-scoped coupons (migration 014) only apply if the cart
    // actually contains the one book they were created for.
    if (found.applicableBookId && !cart.some(item => item.book.id === found.applicableBookId)) {
      return { success: false, message: `${found.code} only applies to a specific book that isn't in your cart.` };
    }

    setAppliedCoupon(found);
    return { success: true, message: `Coupon ${found.code} applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlistBookIds,
        recentlyViewedBookIds,
        appliedCoupon,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        toggleWishlist,
        isInWishlist,
        addRecentlyViewed,
        subtotal,
        discountAmount,
        taxAmount,
        shippingCharge,
        totalAmount,
        freeShippingThreshold,
        amountNeededForFreeShipping,
        totalItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
