import { useSiteContent } from '../lib/useSiteContent';
import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useBooks } from '../context/BookContext';
import { Scene3D } from '../components/motion/Scene3D';
import { Layer3D } from '../components/motion/Layer3D';

interface FaqPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

// This is the EXACT original list that used to be hardcoded directly in this
// component (verified byte-identical). It's the DEFAULT — used whenever
// the admin hasn't added/edited FAQ items in Control Panel yet — so
// nothing visually changes for a site that hasn't touched this setting.
const DEFAULT_FAQS: { q: string; a: string }[] = [
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
    a: 'Orders above ₹{freeShipping} automatically qualify for FREE Express Courier shipping across all pincodes in India.',
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

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate }) => {
  const c = useSiteContent();
  const { siteSettings } = useBooks();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [search, setSearch] = useState<string>('');

  const freeShip = siteSettings.freeShippingMinAmount || siteSettings.freeShippingThreshold || 799;
  const faqs = (siteSettings.faqItems && siteSettings.faqItems.length > 0 ? siteSettings.faqItems : DEFAULT_FAQS)
    .map(f => ({ q: f.q, a: f.a.split('{freeShipping}').join(String(freeShip)) }));

  const filteredFaqs = faqs.filter(
    f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-8 bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: c('faq.breadcrumb') }]} onHomeClick={() => onNavigate('home')} />

        <Scene3D heightVh={170}>
          <div className="w-full">
            <Layer3D delay={0} className="my-6 text-center">
              <HelpCircle className="w-12 h-12 text-[color:var(--c-accent)] mx-auto mb-2" />
              <h1 className="font-serif text-3xl font-bold text-[color:var(--c-primary)]">
                {c('faq.title')}
              </h1>
              <p className="text-xs text-[color:var(--c-text-muted)] mt-1 font-medium">
                {c('faq.subtitle')}
              </p>

              <div className="relative max-w-md mx-auto mt-6">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={c('faq.search')}
                  className="w-full pl-9 pr-4 py-2.5 bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/40 rounded-2xl text-xs text-[color:var(--c-text)] placeholder-[color:var(--c-text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                />
                <Search className="w-4 h-4 text-[color:var(--c-primary)] absolute left-3 top-3" />
              </div>
            </Layer3D>

            <Layer3D delay={0.15} className="space-y-4 my-8">
              {filteredFaqs.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[color:var(--c-surface)] rounded-2xl border border-[color:var(--c-accent)]/40 overflow-hidden shadow-xs"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                    className="w-full p-5 text-left font-serif font-bold text-sm text-[color:var(--c-primary)] flex items-center justify-between gap-4"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[color:var(--c-accent)] transition-transform ${openIndex === idx ? 'rotate-180' : ''}`} />
                  </button>

                  {openIndex === idx && (
                    <div className="px-5 pb-5 text-xs text-[color:var(--c-text)] leading-relaxed border-t border-[color:var(--c-accent)]/20 pt-3 font-medium">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </Layer3D>
          </div>
        </Scene3D>
      </div>
    </div>
  );
};
