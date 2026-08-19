import React, { useState } from 'react';
import { Sparkles, Play, Video, BookOpen, Sun, Heart, Flame, Shield, Droplet, Star, ShoppingCart, CheckCircle, ArrowRight } from 'lucide-react';
import { Book } from '../../types';

interface GayatriSecretsSectionProps {
  onBuyNow: (book?: Book) => void;
  shaktiBook?: Book;
}

export const GayatriSecretsSection: React.FC<GayatriSecretsSectionProps> = ({
  onBuyNow,
  shaktiBook,
}) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);

  return (
    <section className="py-16 bg-gradient-to-b from-zinc-900 via-red-950 to-zinc-950 text-amber-50 relative overflow-hidden">
      {/* Background Decorative Mandala Rays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(217,119,6,0.15),transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-extrabold uppercase tracking-widest">
            <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>आध्यात्मिक लेख एवं अंतर्मन का गुप्त रहस्य</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-amber-100 leading-tight">
            गायत्री महामंत्र का रहस्य एवं <span className="text-amber-400">24 देवशक्तियाँ</span>
          </h2>

          <p className="text-xs sm:text-base text-amber-200/80 font-light">
            वेदों की ऋचाओं से लेकर आधुनिक विज्ञान की खोजों तक—जानिए क्यों गायत्री और दुर्गा मंत्र मानव चेतना का सर्वोपरि रहस्य हैं।
          </p>
        </div>

        {/* 5 Spiritual Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Article 1: मंत्र का मुख्य रहस्य */}
          <div className="bg-zinc-900/90 border border-amber-500/30 p-6 rounded-3xl hover:border-amber-400 transition-all space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-xl text-amber-200 leading-snug">
              1. मंत्र का मुख्य रहस्य (ॐ भूर्भुवः स्वः)
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/85 leading-relaxed">
              इस संपूर्ण ब्रह्मांड में यदि कोई ऐसी ध्वनि है जो मनुष्य की चेतना को सीधे ईश्वर से जोड़ सकती है, तो वह है <strong>"ॐ भूर्भुवः स्वः"</strong>। वेदों की ऋचाओं से लेकर आधुनिक विज्ञान की खोजों तक, गायत्री मंत्र केवल एक प्रार्थना नहीं बल्कि ब्रह्मांडीय ऊर्जा को जाग्रत करने की एक अमोघ कुंजी है। लोग इसे केवल एक धार्मिक मंत्र मानते हैं, परन्तु इसका रहस्य बहुत गहरा है।
            </p>
          </div>

          {/* Article 2: 24 देवशक्तियों का दिव्य रूप */}
          <div className="bg-zinc-900/90 border border-amber-500/30 p-6 rounded-3xl hover:border-amber-400 transition-all space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Sun className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-xl text-amber-200 leading-snug">
              2. 24 देवशक्तियों का दिव्य रूप
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/85 leading-relaxed">
              गायत्री मंत्र के 24 अक्षर केवल शब्द नहीं हैं, ये मानव शरीर की <strong>24 ग्रंथियों और 24 सिद्धि-शक्तियों</strong> को जाग्रत करने वाली सूक्ष्म ध्वनि-तरंगें हैं। जब हम इन 24 अक्षरों का सही उच्चारण और ध्यान करते हैं, तो शरीर के 24 मुख्य ऊर्जा केंद्र जाग्रत होने लगते हैं, जिससे जीवन में चमत्कारिक परिवर्तन होता है।
            </p>
          </div>

          {/* Article 3: सद्बुद्धि की प्रार्थना */}
          <div className="bg-zinc-900/90 border border-amber-500/30 p-6 rounded-3xl hover:border-amber-400 transition-all space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-xl text-amber-200 leading-snug">
              3. सद्बुद्धि की अमोघ प्रार्थना
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/85 leading-relaxed">
              दुनिया के अधिकांश लोग प्रार्थना में ईश्वर से धन, आरोग्य या मुक्ति मांगते हैं, लेकिन गायत्री मंत्र ईश्वर से केवल एक ही चीज़ मांगती है—<strong>सद्बुद्धि (धियो यो नः प्रचोदयात्)</strong>। जब बुद्धि शुद्ध, स्थिर और प्रखर होगी, तो जीवन का हर सुख, सफलता और परम शांति स्वतः ही आपके कदम चूमेगी।
            </p>
          </div>

          {/* Article 4: अमर जल और अलौकिक तेज */}
          <div className="bg-zinc-900/90 border border-amber-500/30 p-6 rounded-3xl hover:border-amber-400 transition-all space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Droplet className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-xl text-amber-200 leading-snug">
              4. अमर जल और अलौकिक तेज
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/85 leading-relaxed">
              शरीर को स्वच्छ रखने के लिए जल की आवश्यकता होती है, और आत्मा तथा बुद्धि को निर्मल रखने के लिए <strong>गायत्री महामंत्र के अमर जल</strong> की। जो साधक नियम से गायत्री मंत्र का प्रामाणिक जप करता है, उसके चेहरे पर एक दिव्य आभा और अलौकिक ओजस्वी तेज स्पष्ट दिखाई देने लगता है।
            </p>
          </div>

          {/* Article 5: दुर्गा सप्तशती और अंतयात्रा का संबंध */}
          <div className="bg-zinc-900/90 border border-amber-500/30 p-6 rounded-3xl hover:border-amber-400 transition-all space-y-4 shadow-sm md:col-span-2 lg:col-span-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-xl text-amber-200 leading-snug">
              5. दुर्गा सप्तशती और अंतयात्रा का गूढ़ संबंध
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/85 leading-relaxed">
              गायत्री महामंत्र का आध्यात्मिक महत्व और दुर्गा सप्तशती का अंतयात्रा से गहरा सीधा संबंध है। दुर्गा सप्तशती के 13 अध्याय वास्तव में मनुष्य के भीतर छिपे 13 दुर्गुणों (महिषासुर, शुम्भ-निशुम्भ आदि) के संहार और नौ देवशक्तियों के जागरण की आभ्यंतर गाथा हैं। जब दुर्गा की आद्याशक्ति और गायत्री की ब्रह्मचेतना मिलती है, तब साधक की अंतयात्रा पूर्ण होती है और परम शांति प्राप्त होती है।
            </p>
          </div>

        </div>

        {/* Embedded Video Section for Gayatri Mantra & Inner Journey Secrets */}
        <div className="bg-gradient-to-r from-red-950 via-amber-950 to-zinc-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/60 border border-red-500/40 text-amber-300 text-xs font-bold">
              <Video className="w-4 h-4 text-amber-400" />
              <span>विशेष वीडियो व्याख्यान (Special Video Presentation)</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-amber-100 leading-tight">
              गायत्री मंत्र एवं दुर्गा मंत्र की अंतयात्रा का गुप्त रहस्य (Video)
            </h3>

            <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed">
              देखिए कैसे गायत्री और दुर्गा मंत्र के सही स्पंदन आपके जीवन को बदल सकते हैं। इस वीडियो में स्वामी जी एवं आचार्यों द्वारा व्यावहारिक मार्गदर्शन दिया गया है।
            </p>

            <div className="flex items-center gap-4 text-xs font-semibold text-amber-400">
              <span>✓ अवधि: 18 मिनट</span>
              <span>•</span>
              <span>✓ 4K UHD प्रामाणिक ऑडियो</span>
              <span>•</span>
              <span>✓ 100% नि:शुल्क दृश्य</span>
            </div>
          </div>

          {/* Video Thumbnail with Play Button */}
          <div className="relative w-full md:w-80 aspect-video rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-sm group cursor-pointer shrink-0"
               onClick={() => setIsVideoModalOpen(true)}>
            <img
              src="https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80"
              alt="Gayatri Mantra Secrets Video"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"  loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-amber-500 text-red-950 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
            </div>
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              18:42
            </span>
          </div>

        </div>

        {/* Video Player Modal */}
        {isVideoModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-sm relative">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <h4 className="font-serif font-bold text-lg text-amber-200">
                  गायत्री मंत्र एवं दुर्गा मंत्र का अंतयात्रा रहस्य
                </h4>
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="text-amber-400 hover:text-white font-bold text-xl px-2"
                >
                  ✕
                </button>
              </div>

              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-amber-500/30">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"
                  title="Gayatri Mantra Secrets"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-5 py-2 rounded-xl"
                >
                  बंद करें
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section Buy Now CTA */}
        <div className="text-center pt-4">
          <button
            onClick={() => onBuyNow(shaktiBook)}
            className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-red-950 font-extrabold text-base px-9 py-4 rounded-2xl shadow-sm shadow-amber-500/30 inline-flex items-center gap-3 transition-transform active:scale-95 border border-amber-300"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>इन रहस्यों को गहराई से समझें — अभी ग्रंथ प्राप्त करें (Buy Now)</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </button>
        </div>

      </div>
    </section>
  );
};
