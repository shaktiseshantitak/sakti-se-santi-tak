import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Sparkles } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'क्या यह पुस्तक शुरुआती लोगों के लिए है?',
      answer: 'हाँ, बिल्कुल! यह ग्रंथ उन सभी पाठकों के लिए लिखा गया है जो अभी आध्यात्मिक यात्रा आरंभ कर रहे हैं, तथा उनके लिए भी जो वर्षों से मंत्र जाप कर रहे हैं। जटिल विषय-वस्तु को अत्यंत सरल हिंदी में प्रस्तुत किया गया है।'
    },
    {
      question: 'क्या इसमें गायत्री मंत्र की विस्तृत व्याख्या है?',
      answer: 'जी हाँ, इस ग्रंथ में गायत्री महामंत्र के आध्यात्मिक अर्थ, 24 देवशक्तियों की अवधारणा, तथा आभ्यंतर चेतना पर पड़ने वाले प्रभावों का सुबोध निरूपण किया गया है।'
    },
    {
      question: 'क्या इसमें दुर्गा मंत्र की चर्चा है?',
      answer: 'हाँ, गायत्री मंत्र के साथ-साथ दुर्गा मंत्र एवं दुर्गा सप्तशती के गूढ़ आध्यात्मिक रहस्यों और अंतर्यात्रा के संबंधों को भी सहज भाषा में स्पष्ट किया गया है।'
    },
    {
      question: 'क्या यह धार्मिक कर्मकांड पुस्तक है या आध्यात्मिक व मनोवैज्ञानिक चिंतन?',
      answer: 'यह केवल बाह्य कर्मकांड या पूजा-विधि की पुस्तक नहीं है, बल्कि मंत्र जाप और साधना के माध्यम से मन को शांत करने, मानसिक एकाग्रता बढ़ाने और आत्मचिंतन करने का एक विचारशील आध्यात्मिक व मनोवैज्ञानिक ग्रंथ है।'
    },
    {
      question: 'क्या इसे मोबाइल पर भी पढ़ सकते हैं (E-Book / PDF format)?',
      answer: 'हाँ! हार्डकवर (Paperback/Hardcover) भौतिक पुस्तक के अतिरिक्त, आपइसे PDF E-Book तथा ऑडियोबुक फॉर्मेट में भी प्राप्त कर सकते हैं और अपने स्मार्टफोन, टैबलेट या कंप्यूटर पर कभी भी पढ़/सुन सकते हैं।'
    }
  ];

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-14 bg-[#F8F4E8] text-[#4A2C17] border-t border-[#D4AF37]/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/20 text-[#8B1E3F] text-xs font-extrabold border border-[#D4AF37]/50">
            <HelpCircle className="w-3.5 h-3.5 text-[#8B1E3F]" />
            <span>अक्सर पूछे जाने वाले प्रश्न (FAQs)</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#8B1E3F]">
            पाठकों की जिज्ञासाएं एवं समाधान
          </h2>

          <p className="text-xs sm:text-sm text-[#4A2C17]">
            'शक्ति से शांति' ग्रंथ के संबंध में मुख्य प्रश्नों के उत्तर।
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#FFF8EE] border border-[#D4AF37]/40 overflow-hidden transition-all duration-200 shadow-sm"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-serif font-bold text-sm sm:text-base text-[#8B1E3F] hover:text-[#66122C] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#8B1E3F] transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-[#4A2C17] leading-relaxed border-t border-[#D4AF37]/20 pt-3 font-medium">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
