import React from 'react';
import { Sparkles, BookOpen, Brain, Heart, Compass, CheckCircle } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const points = [
    {
      icon: BookOpen,
      title: 'सरल एवं सुबोध भाषा',
      description: 'संस्कृत ग्रंथों के जटिल रहस्यों को अत्यंत सरल, स्पष्ट और व्यावहारिक हिंदी भाषा में प्रस्तुत किया गया है।'
    },
    {
      icon: Brain,
      title: 'गहन आध्यात्मिक चिंतन',
      description: 'मंत्र जाप के केवल बाह्य उच्चारण से आगे बढ़कर आभ्यंतर चेतना और मानसिक एकाग्रता का गूढ़ विश्लेषण।'
    },
    {
      icon: Heart,
      title: 'शांति और आत्मचिंतन की प्रेरणा',
      description: 'दैनिक जीवन के तनाव, अशांति और भटकाव से मुक्त होकर अंतर्मन में स्थायी शांति प्राप्त करने का मार्ग।'
    },
    {
      icon: Compass,
      title: 'आध्यात्मिक साधकों हेतु उपयोगी',
      description: 'नवीन साधकों से लेकर वर्षों से अभ्यास कर रहे साधकों एवं अध्यात्म प्रेमी पाठकों के लिए एक प्रामाणिक मार्गदर्शिका।'
    }
  ];

  return (
    <section className="py-12 bg-[#FAF7F2] border-y border-[#B8923A]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#B8923A]/20 text-[#6B1D3A] text-xs font-extrabold border border-[#B8923A]/50">
            <Sparkles className="w-3.5 h-3.5 text-[#6B1D3A]" />
            <span>विशेषता एवं प्रामाणिकता</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#6B1D3A]">
            यह पुस्तक ही क्यों? (Why This Book?)
          </h2>

          <p className="text-xs sm:text-base text-[#33231B] leading-relaxed">
            आध्यात्मिक दृष्टिकोण एवं साधना परंपरा के गहन अनुशीलन पर आधारित चार मुख्य आधार स्तंभ।
          </p>
        </div>

        {/* 4 Point Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {points.map((pt, idx) => {
            const Icon = pt.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#FFFCF7] border border-[#B8923A]/40 shadow-sm hover:shadow-sm hover:border-[#B8923A] transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#B8923A]/20 text-[#6B1D3A] border border-[#B8923A]/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-[#B8923A] shrink-0" />
                  <h3 className="font-serif font-bold text-lg text-[#6B1D3A]">
                    {pt.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-[#33231B] leading-relaxed">
                  {pt.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
