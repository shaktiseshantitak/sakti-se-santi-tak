import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

interface FaqPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [search, setSearch] = useState<string>('');

  const faqs = [
    {
      q: 'Are your Sanskrit texts and Devanagari verses authentic and typo-free?',
      a: 'Yes, absolutely. All manuscripts and commentaries are thoroughly proofread by a panel of 5+ traditional Sanskrit acharyas at Varanasi Sanskrit Vishwavidyalaya before printing.',
    },
    {
      q: 'Do you ship hardbound scriptures internationally outside India?',
      a: 'Yes! We ship to over 85 countries worldwide including USA, UK, Canada, Australia, Germany, Singapore, and UAE using India Post International Tracked, DHL, and FedEx.',
    },
    {
      q: 'What is the quality of paper and binding used?',
      a: 'We use premium 100 GSM acid-free cream royal paper, heavy-duty thread section sewing, and genuine gold foil embossed cloth/leatherette hardbound covers designed to last centuries.',
    },
    {
      q: 'How do I get free shipping on my order?',
      a: 'Orders above ₹999 automatically qualify for FREE Express Courier shipping across all pincodes in India.',
    },
    {
      q: 'Can I request a custom bulk printing order for temple distribution or Anna Daan?',
      a: 'Yes! We offer bulk discount rates for religious institutions, ashrams, and personal book donation drives. Please contact us via our support page or call +91 98765 43210.',
    },
    {
      q: 'What formats are available for digital readers?',
      a: 'We provide watermarked high-resolution PDF E-Books with interactive bookmarks and audio QR codes for listening to chanted stotrams on mobile apps.',
    },
  ];

  const filteredFaqs = faqs.filter(
    f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-8 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Frequently Asked Questions' }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6 text-center">
          <HelpCircle className="w-12 h-12 text-[#D4AF37] mx-auto mb-2" />
          <h1 className="font-serif text-3xl font-bold text-[#8B1E3F]">
            Frequently Asked Questions (FAQ)
          </h1>
          <p className="text-xs text-[#6E4E37] mt-1 font-medium">
            Answers to common questions about our printing press, authentic translations, and shipping.
          </p>

          <div className="relative max-w-md mx-auto mt-6">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search questions (e.g. shipping, Sanskrit, binding)..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#FFF8EE] border border-[#D4AF37]/40 rounded-2xl text-xs text-[#4A2C17] placeholder-[#6E4E37]/60 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
            />
            <Search className="w-4 h-4 text-[#8B1E3F] absolute left-3 top-3" />
          </div>
        </div>

        <div className="space-y-4 my-8">
          {filteredFaqs.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#FFF8EE] rounded-2xl border border-[#D4AF37]/40 overflow-hidden shadow-xs"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full p-5 text-left font-serif font-bold text-sm text-[#8B1E3F] flex items-center justify-between gap-4"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-[#D4AF37] transition-transform ${openIndex === idx ? 'rotate-180' : ''}`} />
              </button>

              {openIndex === idx && (
                <div className="px-5 pb-5 text-xs text-[#4A2C17] leading-relaxed border-t border-[#D4AF37]/20 pt-3 font-medium">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
