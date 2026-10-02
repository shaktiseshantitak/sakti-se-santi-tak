import React from 'react';
import { BookOpen, Sparkles, Feather, Flame, Shield, Sun, HeartHandshake } from 'lucide-react';
import { useBooks } from '../../context/BookContext';

export const AboutBookSection: React.FC = () => {
  const { books, siteSettings } = useBooks();
  const heroBookId = siteSettings?.featuredHeroBookId || 'book-shakti';
  const shaktiBook = books.find(b => b.id === heroBookId) || books[0];

  const topics = [
    {
      icon: Sun,
      title: 'गायत्री महामंत्र का चिंतन',
      desc: 'परंपरागत मान्यताओं के अनुसार गायत्री महामंत्र की ऋचाओं का आत्मिक चेतना और एकाग्रता पर गहरा प्रभाव पड़ता है।'
    },
    {
      icon: Flame,
      title: 'दुर्गा मंत्र एवं सप्तशती का आध्यात्मिक रहस्य',
      desc: 'दुर्गा साधना के प्रतीकात्मक एवं अंतर्मन के रहस्यों का सरल व सुबोध शैली में निरूपण।'
    },
    {
      icon: Shield,
      title: 'आध्यात्मिक साधना एवं मनोबल',
      desc: 'लेखकद्वय के अध्ययन व साधना चिंतन के आधार पर ध्यान और जप के माध्यम से मानसिक सुदृढ़ता का विकास।'
    },
    {
      icon: HeartHandshake,
      title: 'मन की शांति और भावात्मक संतुलन',
      desc: 'दैनिक जीवन की भागदौड़ में मानसिक उथल-पुथल को शांत कर आंतरिक सौहार्द प्राप्त करने का दृष्टिकोण।'
    },
    {
      icon: Feather,
      title: 'आत्मचिंतन और विवेक जागृति',
      desc: 'स्वयं के विचारों, आचरण और आत्मनिरीक्षण की शक्ति को जागृत करने वाली प्रेरणादायी सामग्रियाँ।'
    },
    {
      icon: Sparkles,
      title: 'सार्थक आध्यात्मिक जीवन शैली',
      desc: 'आध्यात्मिक सिद्धांतों को आधुनिक जीवनशैली में सामंजस्यपूर्ण तरीके से अपनाने के व्यावहारिक सुझाव।'
    }
  ];

  return (
    <section className="py-14 bg-[#F8F4E8] text-[#4A2C17] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/20 text-[#8B1E3F] text-xs font-extrabold border border-[#D4AF37]/50">
            <BookOpen className="w-3.5 h-3.5 text-[#8B1E3F]" />
            <span>विषय-वस्तु एवं गूढ़ चिंतन</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#8B1E3F]">
            {siteSettings?.aboutSectionTitle || `'${shaktiBook?.title || 'शक्ति से शांति'}' ग्रंथ में क्या सम्मिलित है?`}
          </h2>

          <p className="text-xs sm:text-base text-[#4A2C17] leading-relaxed">
            {siteSettings?.aboutSectionDescription || 'वैदिक परंपरा, मंत्र साधना और आधुनिक जीवन के परिप्रेक्ष्य में एक संतुलित एवं प्रामाणिक आध्यात्मिक विमर्श।'}
          </p>
        </div>

        {/* 6 Grid Topics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-3xl bg-[#FFF8EE] border border-[#D4AF37]/40 shadow-sm hover:shadow-sm hover:border-[#D4AF37] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 text-[#8B1E3F] flex items-center justify-center mb-4 border border-[#D4AF37]/40">
                  <Icon className="w-5 h-5" />
                </div>

                <h3 className="font-serif font-bold text-lg text-[#8B1E3F] mb-2">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#4A2C17] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Responsible Disclaimer Box */}
        <div className="mt-10 p-4 sm:p-5 rounded-2xl bg-[#FFF8EE] border border-[#D4AF37]/40 text-center max-w-3xl mx-auto text-xs text-[#6E4E37] italic shadow-sm">
          * टिप्पणी: इस ग्रंथ में व्यक्त विचार एवं व्याख्याएं सनातन साधना परंपरा, परंपरागत धार्मिक मान्यताओं तथा लेखकद्वय के व्यक्तिगत अध्ययन व चिंतन पर आधारित हैं।
        </div>

      </div>
    </section>
  );
};
