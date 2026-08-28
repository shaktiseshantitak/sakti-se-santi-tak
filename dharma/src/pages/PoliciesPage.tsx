import React from 'react';
import { ShieldCheck, Truck, RotateCcw, FileText } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

interface PoliciesPageProps {
  type: 'privacy' | 'terms' | 'shipping' | 'return';
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const PoliciesPage: React.FC<PoliciesPageProps> = ({ type, onNavigate }) => {
  const titles = {
    privacy: 'Privacy Policy & Data Security',
    terms: 'Terms of Service & Usage',
    shipping: 'Shipping & Delivery Policy',
    return: 'Returns & Refund Policy',
  };

  return (
    <div className="py-8 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: titles[type] }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6">
          <h1 className="font-serif text-3xl font-bold text-[#8B1E3F]">
            {titles[type]}
          </h1>
          <p className="text-xs text-[#6E4E37] font-medium mt-1">Last Updated: August 2024 • Shakti Se Shanti Tak Varanasi Desk</p>
        </div>

        <div className="bg-[#FFF8EE] rounded-3xl p-8 border border-[#D4AF37]/40 shadow-sm space-y-6 my-6 text-xs sm:text-sm text-[#4A2C17] leading-relaxed font-medium">
          {type === 'shipping' && (
            <>
              <h3 className="font-serif font-bold text-lg text-[#8B1E3F]">1. Dispatch Timelines</h3>
              <p>All hardbound scripture orders are processed and reverently packed at our Varanasi warehouse within 24 hours of payment confirmation. Domestic India deliveries take 2 to 5 business days via Delhivery, India Post, or DTDC.</p>
              <h3 className="font-serif font-bold text-lg text-[#8B1E3F]">2. Free Shipping Threshold</h3>
              <p>Orders above ₹999 qualify for FREE Express Courier shipping anywhere in India.</p>
            </>
          )}

          {type === 'return' && (
            <>
              <h3 className="font-serif font-bold text-lg text-[#8B1E3F]">1. 7-Day Replacement Guarantee</h3>
              <p>If your physical book arrives damaged, missing pages, or misprinted, we offer a 100% free replacement or full refund within 7 days of delivery.</p>
            </>
          )}

          {type === 'privacy' && (
            <>
              <h3 className="font-serif font-bold text-lg text-[#8B1E3F]">1. Privacy Protection</h3>
              <p>We respect your privacy. Customer contact info and address details are used solely to fulfill book shipments and track delivery status. We never sell or share data with third-party advertisers.</p>
            </>
          )}

          {type === 'terms' && (
            <>
              <h3 className="font-serif font-bold text-lg text-[#8B1E3F]">1. Sacred Copyright & Re-Printing</h3>
              <p>The English translations, word-by-word Sanskrit commentaries, and custom layouts in our books are copyrighted by Shakti Se Shanti Tak (shaktiseshanti.com). Commercial reproduction without prior written permission is prohibited.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
