import React from 'react';
import { Quote, Sparkles, CheckCircle2 } from 'lucide-react';

export const AuthorMessageSection: React.FC = () => {
  return (
    <section className="py-20 bg-amber-950 text-amber-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-sm border-2 border-amber-500/40">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80"
                alt="Swami Gambhirananda"
                className="w-full h-full object-cover"  loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-amber-950 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-6 left-6 right-6 text-center">
                <span className="text-xs uppercase font-semibold text-amber-400 tracking-wider">
                  Varanasi Acharya Board
                </span>
                <h3 className="font-serif text-xl font-bold text-white mt-1">
                  Swami Gambhirananda & Editorial Pundits
                </h3>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <Quote className="w-12 h-12 text-amber-500/60" />

            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight">
              "A sacred book in the home is not merely ink on paper — it is the living vibration of Eternal Truth (Dharma)."
            </h2>

            <p className="text-sm sm:text-base text-amber-200/90 leading-relaxed font-light">
              Our mission at Shakti Se Shanti Tak (शक्ति से शांति तक) is to publish flawless editions of the Bhagavad Gita, Upanishads, and Ramayana without alteration or commercial compromise. Every volume is printed with pristine Sanskrit Devanagari fonts, gold gilding, and clear word-for-word commentary so that modern seekers can experience the original clarity of ancient rishis.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-amber-800/80 text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Zero typo policy verified by 5+ Acharyas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Archival 100 GSM Acid-Free Royal Paper</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Includes Audio QR Codes for Chanting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Respectful Eco-Friendly Transit Packaging</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
