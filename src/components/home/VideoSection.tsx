import React, { useState } from 'react';
import { Play, Youtube, Clock, X, Sparkles } from 'lucide-react';

export const VideoSection: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  // YouTube video ID for spiritual Gayatri Mantra discourse
  const videoId = "cK15456_fXg"; 

  return (
    <section className="py-14 bg-[#F8F4E8] text-[#4A2C17] relative border-t border-[#D4AF37]/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/20 text-[#8B1E3F] text-xs font-extrabold border border-[#D4AF37]/50">
            <Youtube className="w-4 h-4 text-[#8B1E3F]" />
            <span>वीडियो व्याख्यान (Video Discourse)</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#8B1E3F]">
            गायत्री मंत्र का आध्यात्मिक रहस्य
          </h2>

          <p className="text-xs sm:text-base text-[#4A2C17] max-w-2xl mx-auto leading-relaxed">
            देखिए कैसे मंत्र ध्वनि तरंगें मन को शांत करती हैं और आभ्यंतर चेतना में ऊर्जा का संचार करती हैं।
          </p>
        </div>

        {/* Video Card Player */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-[#D4AF37]/50 bg-[#FFF8EE] shadow-sm max-w-3xl mx-auto group">
          <div className="relative aspect-video w-full bg-[#3A1F0D] flex items-center justify-center">
            
            {isPlaying ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title="गायत्री मंत्र का आध्यात्मिक रहस्य"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div
                onClick={() => setIsPlaying(true)}
                className="relative w-full h-full cursor-pointer flex items-center justify-center"
              >
                <img
                  src="https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1200&q=80"
                  alt="गायत्री मंत्र का आध्यात्मिक रहस्य"
                  className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                 loading="lazy" decoding="async" />
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#66122C]/90 via-[#3A1F0D]/40 to-transparent flex flex-col justify-between p-6">
                  
                  <div className="flex items-center justify-between">
                    <span className="bg-[#D4AF37] text-[#3A1F0D] font-extrabold text-[11px] px-3 py-1 rounded-full shadow border border-amber-200">
                      विशेष वीडियो 🔴
                    </span>
                    <span className="bg-[#500D20]/80 text-[#F4E285] text-xs font-mono px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#D4AF37]/40">
                      <Clock className="w-3.5 h-3.5 text-[#F4E285]" /> 18:24 मिनट
                    </span>
                  </div>

                  {/* Centered Play Button */}
                  <div className="self-center my-auto">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#D4AF37] text-[#3A1F0D] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform border-2 border-amber-200">
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-lg sm:text-2xl text-white">
                      गायत्री मंत्र का आध्यात्मिक रहस्य
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-100/90">
                      लेखकद्वय कुंजेश शर्मा एवं पूनम शर्मा जी का विस्तृत आध्यात्मिक व्याख्यान
                    </p>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </section>
  );
};
