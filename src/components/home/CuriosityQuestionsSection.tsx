import React, { useState } from 'react';
import { HelpCircle, Sparkles, Key, Zap, ShieldAlert, ShoppingCart, ArrowRight, Brain, Compass, Flame } from 'lucide-react';
import { Book } from '../../types';

interface CuriosityQuestionsSectionProps {
  onBuyNow: (book?: Book) => void;
  shaktiBook?: Book;
}

export const CuriosityQuestionsSection: React.FC<CuriosityQuestionsSectionProps> = ({
  onBuyNow,
  shaktiBook,
}) => {
  const [activeQuestion, setActiveQuestion] = useState<number>(0);

  const questionsData = [
    {
      id: 1,
      question: 'क्या आपने कभी सोचा है कि वर्षों तक मंत्र जाप के बाद भी मन को (या मन-चंचल और अशांत) शांति क्यों नहीं मिलती?',
      icon: HelpCircle,
      answer: 'अधिकांश साधक मंत्रों का केवल मौखिक या बाह्य उच्चारण करते हैं, जबकि मंत्र का वास्तविक सामर्थ्य उसके अंतर्मन में छिपे ध्वनि-स्पंदन (Sound Resonance) और भाव-चेतना में होता है। जब तक मंत्र जाप को केवल एक नियम मानकर किया जाता है, तब तक मन की चंचलता बनी रहती है। "शक्ति से शांति" ग्रंथ में गायत्री एवं दुर्गा मंत्र के उस आंतरिक संयोजन को उजागर किया गया है जो बाह्य जाप से आगे सीधे अंतर्मन को स्थिर कर परम शांति प्रदान करता है।'
    },
    {
      id: 2,
      question: 'क्या मंत्र सिर्फ शब्द है या किसी गुप्त ऊर्जा द्वार को खोलने की सूक्ष्म चाबी?',
      icon: Key,
      answer: 'मंत्र मात्र अक्षरों का समूह नहीं, बल्कि ब्रह्मांडीय ऊर्जा तरंगों का गणितीय एवं सूक्ष्म संयोजन है। जैसे सही पासवर्ड ही तिजोरी को खोल सकता है, वैसे ही गायत्री और दुर्गा मंत्र की सटीक उच्चारण आवृत्ति (Frequency) और भावना ही अंतर्मन के 24 ऊर्जा केंद्रों को जाग्रत करती है। यह ग्रंथ आपको उस गुप्त कुंजी का बोध कराता है जो आपके भीतर सोई हुई दिव्य शक्तियों के द्वार खोल देती है।'
    },
    {
      id: 3,
      question: 'शक्ति से शांति तक की अंतयात्रा का असली मार्ग क्या है?',
      icon: Compass,
      answer: 'शक्ति (ऊर्जा और सामर्थ्य) प्राप्त करना पहला चरण है, परन्तु यदि वह शक्ति शांति में रूपांतरित न हो तो वह अशांति का कारण बन जाती है। दुर्गा मंत्र की उग्र शक्ति को गायत्री मंत्र की शुद्ध बुद्धिमत्ता के साथ साधना ही शक्ति से शांति तक पहुँचने का एकमात्र प्रामाणिक वैदिक मार्ग है। इस ग्रंथ में चरणबद्ध विधि से अंतयात्रा की पूरी कुंजी दी गई है।'
    }
  ];

  return (
    <section className="py-16 bg-amber-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-amber-50 relative overflow-hidden">
      {/* Subtle Decorative Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(185,28,28,0.06),transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-900/10 dark:bg-red-950/60 border border-red-500/30 text-red-800 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Flame className="w-4 h-4 text-red-600 dark:text-amber-400 animate-pulse" />
            <span>जिज्ञासा पैदा करने वाले सवाल एवं गहन सत्य</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-red-950 dark:text-amber-100 leading-tight">
            अंतर्मन के वे सवाल जो आपकी साधना का <span className="text-red-700 dark:text-amber-400">दृष्टिकोण बदल देंगे</span>
          </h2>

          <p className="text-sm sm:text-base text-zinc-700 dark:text-amber-200/80">
            क्या आपकी साधना आपको वह परम शांति दे पा रही है जिसकी खोज में आप हैं? जानिए इस ग्रंथ के पन्नों में छिपे रहस्य।
          </p>
        </div>

        {/* 3 Interactive Big Curiosity Questions Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {questionsData.map((q, idx) => {
            const Icon = q.icon;
            const isSelected = activeQuestion === idx;
            return (
              <div
                key={q.id}
                onClick={() => setActiveQuestion(idx)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-gradient-to-br from-red-900 to-amber-950 text-amber-50 border-amber-400 shadow-sm scale-[1.02]'
                    : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-amber-100 border-amber-500/20 hover:border-amber-500/50 shadow-sm'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                      isSelected ? 'bg-amber-500 text-red-950' : 'bg-red-900/10 dark:bg-amber-500/20 text-red-700 dark:text-amber-400'
                    }`}>
                      0{q.id}
                    </span>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-amber-400' : 'text-red-700 dark:text-amber-400'}`} />
                  </div>

                  <h3 className="font-serif font-bold text-lg leading-snug">
                    {q.question}
                  </h3>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed ${
                  isSelected ? 'text-amber-100/90' : 'text-zinc-600 dark:text-amber-200/70'
                }`}>
                  {q.answer}
                </p>

                <div className="pt-2">
                  <span className={`text-xs font-bold inline-flex items-center gap-1 ${
                    isSelected ? 'text-amber-400' : 'text-red-700 dark:text-amber-400'
                  }`}>
                    {isSelected ? 'सत्य उजागर हुआ ✓' : 'रहस्य पढ़ने के लिए क्लिक करें →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Concepts Breakdown: Physical Paradox, Scientific Depth & Protection Shield */}
        <div className="bg-gradient-to-r from-red-950 via-zinc-900 to-red-950 text-amber-50 p-8 sm:p-10 rounded-3xl border-2 border-amber-500/40 shadow-sm space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-amber-500/20 pb-8">

            {/* Concept 1: भौतिक सफलता और शांति का विरोधाभास */}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-amber-200">
                भौतिक सफलता और शांति का विरोधाभास
              </h3>
              <p className="text-xs sm:text-sm text-amber-100/80 leading-relaxed">
                भौतिक सफलता और शक्ति पाने के बाद भी परम शांति का अनुभव क्यों अधूरा रह जाता है? इस ग्रंथ के पन्नों में ऐसा क्या छिपा है जो आपकी आंतरिक ऊर्जा का दृष्टिकोण बदल देगा? जब तक बाह्य सफलता आंतरिक चेतना से नहीं जुड़ती, तब तक मन अतृप्त रहता है।
              </p>
            </div>

            {/* Concept 2: वैज्ञानिक एवं मानसिक बदलाव */}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-amber-200">
                वैज्ञानिक एवं मानसिक बदलाव (Alpha Waves)
              </h3>
              <p className="text-xs sm:text-sm text-amber-100/80 leading-relaxed">
                आधुनिक विज्ञान ने भी स्वीकार किया है कि गायत्री मंत्र का निरंतर जप करने से मस्तिष्क से अल्फा (Alpha) तरंगें उत्पन्न होती हैं, जो तनाव को मिटाकर सही समय पर सही निर्णय लेने की शक्ति और एकाग्रता को कई गुना बढ़ा देती हैं।
              </p>
            </div>

            {/* Concept 3: सुरक्षा कवच */}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-amber-200">
                अभेद्य सुरक्षा कवच (Divine Aura)
              </h3>
              <p className="text-xs sm:text-sm text-amber-100/80 leading-relaxed">
                जब गायत्री और दुर्गा मंत्र की साधना विधिपूर्वक सिद्ध होती है, तो आपके चारों ओर एक ऐसा सुरक्षा कवच बन जाता है जिससे नकारात्मक विचार, चिंताएं या बुरी शक्तियां आपको स्पर्श भी नहीं कर पातीं।
              </p>
            </div>

          </div>

          {/* Section CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
            <div>
              <p className="font-serif font-bold text-lg text-amber-100">
                अपनी साधना को आज ही सही दिशा दें और आंतरिक रहस्यों को खोलें।
              </p>
              <p className="text-xs text-amber-300/80">
                मूल ग्रंथ 'शक्ति से शांति' केवल ₹499 में उपलब्ध (मूल्य ₹799) | फ्री डिलीवरी भारत भर में
              </p>
            </div>

            <button
              onClick={() => onBuyNow(shaktiBook)}
              className="bg-amber-500 hover:bg-amber-400 text-red-950 font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-sm shadow-amber-500/30 flex items-center gap-2 shrink-0 transition-transform active:scale-95 border border-amber-300"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>अभी प्राप्त करें (Buy Now)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
