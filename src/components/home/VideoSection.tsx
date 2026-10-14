import React, { useState } from 'react';
import { Play, Youtube, Clock, X, Sparkles } from 'lucide-react';
import { NO_IMAGE_PLACEHOLDER } from '../../lib/placeholderImage';

export const VideoSection: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  // YouTube video ID for spiritual Gayatri Mantra discourse
  const videoId = "cK15456_fXg"; 

  return (
    <section className="py-14 bg-[#FAF7F2] text-[#33231B] relative border-t border-[#B8923A]/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#B8923A]/20 text-[#6B1D3A] text-xs font-extrabold border border-[#B8923A]/50">
            <Youtube className="w-4 h-4 text-[#6B1D3A]" />
            <span>वीडियो व्याख्यान (Video Discourse)</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#6B1D3A]">
            गायत्री मंत्र का आध्यात्मिक रहस्य
          </h2>

          <p className="text-xs sm:text-base text-[#33231B] max-w-2xl mx-auto leading-relaxed">
            देखिए कैसे मंत्र ध्वनि तरंगें मन को शांत करती हैं और आभ्यंतर चेतना में ऊर्जा का संचार करती हैं।
          </p>
        </div>

        {/* Video Card Player */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-[#B8923A]/50 bg-[#FFFCF7] shadow-sm max-w-3xl mx-auto group">
          <div className="relative aspect-video w-full bg-[#2B1B14] flex items-center justify-center">
            
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
                  src={NO_IMAGE_PLACEHOLDER}
                  alt="गायत्री मंत्र का आध्यात्मिक रहस्य"
                  className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                 loading="lazy" decoding="async" />
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#4F1229]/90 via-[#2B1B14]/40 to-transparent flex flex-col justify-between p-6">
                  
                  <div className="flex items-center justify-between">
                    <span className="bg-[#B8923A] text-[#2B1B14] font-extrabold text-[11px] px-3 py-1 rounded-full shadow border border-amber-200">
                      विशेष वीडियो 🔴
                    </span>
                    <span className="bg-[#3F0E21]/80 text-[#E3C77E] text-xs font-mono px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#B8923A]/40">
                      <Clock className="w-3.5 h-3.5 text-[#E3C77E]" /> 18:24 मिनट
                    </span>
                  </div>

                  {/* Centered Play Button */}
                  <div className="self-center my-auto">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#B8923A] text-[#2B1B14] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform border-2 border-amber-200">
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
