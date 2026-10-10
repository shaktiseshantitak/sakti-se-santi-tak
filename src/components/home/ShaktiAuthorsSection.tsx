import React from 'react';
import { User, Award, BookOpen, Star, Sparkles, ShoppingCart, Heart, ArrowRight } from 'lucide-react';
import { Book } from '../../types';
import { useBooks } from '../../context/BookContext';

interface ShaktiAuthorsSectionProps {
  onBuyNow: (book?: Book) => void;
  shaktiBook?: Book;
}

// This is the EXACT original hardcoded text that used to live directly in
// this component's JSX (verified byte-identical). It's the DEFAULT for
// any field the admin hasn't edited in Control Panel yet — so nothing
// visually changes for a site that hasn't touched these new settings.
const DEFAULTS = {
  badgeText: 'लेखकों के बारे में (About Authors)',
  heading: 'कुंजेश शर्मा एवं पूनम शर्मा',
  subtitle: "वैदिक परंपरा और आधुनिक व्यावहारिक चेतना के संगम से 'शक्ति से शांति' ग्रंथ की रचना करने वाले मूर्धन्य साधक।",
  author1Name: 'कुंजेश शर्मा (Kunjesh Sharma)',
  author1Title: 'आध्यात्मिक साधक एवं वैदिक मंत्र अनुसंधानकर्ता',
  author1Bio: 'कुंजेश शर्मा जी ने विगत 25 से अधिक वर्षों तक गायत्री महामंत्र एवं वैदिक ऋचाओं के व्यावहारिक एवं वैज्ञानिक पक्षों का गहन अध्ययन एवं साधना की है। उनका उद्देश्य मंत्रों के पारंपरिक एवं गुप्त ज्ञान को सरल भाषा में साधकों तक पहुँचाना है ताकि वे शक्ति से परम शांति की ओर अग्रसर हो सकें।',
  author1Image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  author1Role: 'सह-लेखक, शक्ति से शांति',
  author2Name: 'पूनम शर्मा (Poonam Sharma)',
  author2Title: 'ध्यान गुरु, अध्यात्म चिन्तक एवं मंत्र चेतना विदुषी',
  author2Bio: 'पूनम शर्मा जी ने नारी चेतना, अंतर्मन ध्यान और दुर्गा सप्तशती की आभ्यंतर साधना पर व्यापक शोध कार्य किया है। उन्होंने सह-लेखिका के रूप में ग्रंथ में अंतर्मन की 24 देवशक्तियों के जाग्रत होने और दैनिक जीवन में शांति व ओजस्विता प्राप्त करने के सुगम उपाय साझा किए हैं।',
  author2Image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
  author2Role: 'सह-लेखिका, शक्ति से शांति',
  missionTitle: 'हमारा उद्देश्य (Our Mission)',
  missionText: 'वैदिक संस्कृत ऋचाओं, गायत्री महामंत्र एवं दुर्गा साधना के जटिल रहस्यों को अत्यंत सरल, सुबोध और व्यावहारिक भाषा में साधकों व जिज्ञासु पाठकों तक पहुँचाना।',
  visionTitle: 'हमारा दृष्टिकोण (Our Vision)',
  visionText: 'प्रत्येक साधक को मंत्र जप के केवल बाह्य उच्चारण से आगे ले जाकर अंतर्मन में शांति, संतुलन और आत्मचिंतन की स्थायी अनुभूति कराना।',
  ctaHeading: "लेखकों के इस पावन ग्रंथ 'शक्ति से शांति' को आज ही मंगवाएं",
  ctaSubtext: 'shaktiseshanti.com से सीधे आर्डर करें — 38% डिस्काउंट एवं फ्री शिपिंग का लाभ उठाएं।',
  ctaButtonText: 'अभी प्राप्त करें (Buy Now)',
};

export const ShaktiAuthorsSection: React.FC<ShaktiAuthorsSectionProps> = ({
  onBuyNow,
  shaktiBook,
}) => {
  const { siteSettings } = useBooks();
  const s = siteSettings.shaktiAuthorsSection || {};
  const t = (key: keyof typeof DEFAULTS) => s[key] || DEFAULTS[key];

  const authors = [
    {
      id: 'kunjesh-sharma',
      name: t('author1Name'),
      title: t('author1Title'),
      bio: t('author1Bio'),
      image: t('author1Image'),
      role: t('author1Role'),
    },
    {
      id: 'poonam-sharma',
      name: t('author2Name'),
      title: t('author2Title'),
      bio: t('author2Bio'),
      image: t('author2Image'),
      role: t('author2Role'),
    }
  ];

  return (
    <section className="py-16 bg-[#F8F4E8] text-[#4A2C17] relative overflow-hidden border-t border-[#D4AF37]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#8B1E3F] text-xs font-extrabold uppercase tracking-wider">
            <Award className="w-4 h-4 text-[#8B1E3F]" />
            <span>{t('badgeText')}</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#8B1E3F] leading-tight">
            प्रेरणादायक लेखकद्वय: <span className="text-[#8B1E3F]">{t('heading')}</span>
          </h2>

          <p className="text-xs sm:text-base text-[#4A2C17] max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* 2 Authors Profile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {authors.map(author => (
            <div
              key={author.id}
              className="bg-[#FFF8EE] rounded-3xl p-6 sm:p-8 border-2 border-[#D4AF37]/40 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 hover:border-[#D4AF37] transition-all"
            >
              {/* Image */}
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-[#D4AF37] shadow-sm shrink-0">
                <img
                  src={author.image}
                  alt={author.name}
                  className="w-full h-full object-cover"
                 loading="lazy" decoding="async" />
                <span className="absolute bottom-0 inset-x-0 bg-[#8B1E3F] text-amber-100 text-[10px] font-bold text-center py-0.5">
                  {author.role}
                </span>
              </div>

              {/* Bio & Details */}
              <div className="space-y-3 text-center sm:text-left">
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#8B1E3F]">
                    {author.name}
                  </h3>
                  <p className="text-xs text-[#6E4E37] font-semibold mt-0.5">
                    {author.title}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-[#4A2C17] leading-relaxed font-medium">
                  "{author.bio}"
                </p>

                <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-[#8B1E3F]">
                  <Star className="w-4 h-4 fill-current text-[#D4AF37]" />
                  <span>साधना मार्गदर्शन एवं ग्रंथ रचयिता</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div className="p-6 rounded-3xl bg-[#FFF8EE] border border-[#D4AF37]/40 text-[#4A2C17] shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-[#8B1E3F] font-serif font-bold text-lg">
              <Sparkles className="w-5 h-5 text-[#8B1E3F]" />
              <span>{t('missionTitle')}</span>
            </div>
            <p className="text-xs sm:text-sm text-[#4A2C17] leading-relaxed">
              {t('missionText')}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#FFF8EE] border border-[#D4AF37]/40 text-[#4A2C17] shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-[#8B1E3F] font-serif font-bold text-lg">
              <BookOpen className="w-5 h-5 text-[#8B1E3F]" />
              <span>{t('visionTitle')}</span>
            </div>
            <p className="text-xs sm:text-sm text-[#4A2C17] leading-relaxed">
              {t('visionText')}
            </p>
          </div>
        </div>

        {/* Bottom CTA Box */}
        <div className="bg-gradient-to-r from-[#8B1E3F] via-[#66122C] to-[#500D20] text-amber-50 p-6 sm:p-8 rounded-3xl border border-[#D4AF37]/50 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-serif font-bold text-xl text-white">
              {t('ctaHeading')}
            </h4>
            <p className="text-xs text-amber-100/90">
              {t('ctaSubtext')}
            </p>
          </div>

          <button
            onClick={() => onBuyNow(shaktiBook)}
            className="bg-[#D4AF37] hover:bg-amber-300 text-[#3A1F0D] font-extrabold text-sm px-7 py-3.5 rounded-2xl shadow-sm flex items-center gap-2 shrink-0 transition-transform active:scale-95 border border-amber-200"
          >
            <ShoppingCart className="w-4 h-4 text-[#3A1F0D]" />
            <span>{t('ctaButtonText')}</span>
            <ArrowRight className="w-4 h-4 ml-1 text-[#3A1F0D]" />
          </button>
        </div>

      </div>
    </section>
  );
};
