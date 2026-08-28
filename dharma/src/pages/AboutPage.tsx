import React from 'react';
import { Award, BookOpen, Heart, Shield, Sparkles } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

interface AboutPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="py-8 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'About Our Press & Heritage' }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6 text-center space-y-3">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#8B1E3F]">
            Varanasi Publishing Heritage
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#8B1E3F]">
            About Shakti Se Shanti Tak
          </h1>
          <p className="text-xs sm:text-sm text-[#6E4E37] max-w-xl mx-auto leading-relaxed font-medium">
            Established on the holy banks of Assi Ghat in Varanasi, Shakti Se Shanti Tak (शक्ति से शांति तक) is dedicated to publishing, preserving, and distributing authentic Sanatana Dharma scriptures worldwide.
          </p>
        </div>

        <div className="bg-[#FFF8EE] rounded-3xl p-8 border border-[#D4AF37]/40 shadow-sm space-y-8 my-8">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-sm border border-[#D4AF37]/40">
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80"
              alt="Assi Ghat Varanasi Printing"
              className="w-full h-full object-cover"  loading="lazy" decoding="async" />
          </div>

          <div className="max-w-none text-xs sm:text-sm text-[#4A2C17] leading-relaxed space-y-4 font-medium">
            <h3 className="font-serif text-xl font-bold text-[#8B1E3F]">
              Our Vision & Vedic Promise
            </h3>
            <p>
              Ancient rishis composed the Vedas, Upanishads, and Gita for the spiritual elevation of all humanity. In an era of rapid digital summaries, authentic hardbound scriptures with word-for-word Sanskrit Devanagari commentary remain the gold standard for deep study.
            </p>
            <p>
              Every title produced by Shakti Se Shanti Tak undergoes a rigorous multi-stage review process involving traditional Sanskrit pundits, philologists, and master bookbinders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#D4AF37]/30 text-center">
            <div className="space-y-2">
              <Shield className="w-8 h-8 text-[#D4AF37] mx-auto" />
              <h4 className="font-serif font-bold text-sm text-[#8B1E3F]">Authentic Commentary</h4>
              <p className="text-xs text-[#6E4E37]">Based on Adi Shankaracharya, Ramanujacharya, and traditional bhashyas.</p>
            </div>

            <div className="space-y-2">
              <Award className="w-8 h-8 text-[#D4AF37] mx-auto" />
              <h4 className="font-serif font-bold text-sm text-[#8B1E3F]">Archival Quality</h4>
              <p className="text-xs text-[#6E4E37]">Gold embossed bindings using acid-free paper guaranteed for generations.</p>
            </div>

            <div className="space-y-2">
              <Heart className="w-8 h-8 text-[#D4AF37] mx-auto" />
              <h4 className="font-serif font-bold text-sm text-[#8B1E3F]">Global Distribution</h4>
              <p className="text-xs text-[#6E4E37]">Delivering sacred books to seekers and ashrams in 85+ countries.</p>
            </div>
          </div>

          <p className="text-center text-[11px] text-[#6E4E37]/70 pt-4 border-t border-[#D4AF37]/20">
            Website Developed &amp; Deployed by Mr. Sitaram Ghintala
          </p>
        </div>
      </div>
    </div>
  );
};
