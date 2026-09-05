import React from 'react';
import { Quote, CheckCircle2 } from 'lucide-react';
import { Testimonial } from '../../types';
import { RatingStars } from '../common/RatingStars';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials }) => {
  return (
    <section className="py-16 bg-[#F8F4E8] text-[#4A2C17]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#8B1E3F] uppercase tracking-widest block mb-1">
            पाठकों की अनुभूतियां (Reader Reflections)
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#8B1E3F]">
            साधकों एवं विद्वानों की सम्मतियां
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(item => (
            <div
              key={item.id}
              className="bg-[#FFF8EE] p-6 rounded-3xl border border-[#D4AF37]/40 shadow-sm flex flex-col justify-between hover:border-[#D4AF37] transition-all"
            >
              <div>
                <RatingStars rating={item.rating} size="sm" />
                <Quote className="w-8 h-8 text-[#D4AF37] my-3" />
                <p className="text-xs sm:text-sm text-[#4A2C17] italic leading-relaxed font-medium">
                  "{item.comment}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#D4AF37]/30 flex items-center gap-3">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]"  loading="lazy" decoding="async" />
                <div>
                  <h4 className="font-bold text-xs text-[#8B1E3F] flex items-center gap-1">
                    {item.name}
                    {item.verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 inline" title="Verified Purchaser" />
                    )}
                  </h4>
                  <p className="text-[11px] text-[#6E4E37]">
                    {item.role} • {item.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
