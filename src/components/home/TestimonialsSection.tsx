import { useSiteContent } from '../../lib/useSiteContent';
import React from 'react';
import { Quote, CheckCircle2 } from 'lucide-react';
import { Testimonial } from '../../types';
import { RatingStars } from '../common/RatingStars';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials }) => {
  const tx = useSiteContent();

  return (
    <section className="py-16 bg-[color:var(--c-page)] text-[color:var(--c-text)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[color:var(--c-primary)] uppercase tracking-widest block mb-1">
            {tx('t.TestimonialsSection.289cbda2')}
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[color:var(--c-primary)]">
            {tx('t.TestimonialsSection.b10d147a')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(item => (
            <div
              key={item.id}
              className="bg-[color:var(--c-surface)] p-6 rounded-3xl border border-[color:var(--c-accent)]/40 shadow-sm flex flex-col justify-between hover:border-[color:var(--c-accent)] transition-all"
            >
              <div>
                <RatingStars rating={item.rating} size="sm" />
                <Quote className="w-8 h-8 text-[color:var(--c-accent)] my-3" />
                <p className="text-xs sm:text-sm text-[color:var(--c-text)] italic leading-relaxed font-medium">
                  "{item.comment}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[color:var(--c-accent)]/30 flex items-center gap-3">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover border border-[color:var(--c-accent)]"  loading="lazy" decoding="async" />
                <div>
                  <h4 className="font-bold text-xs text-[color:var(--c-primary)] flex items-center gap-1">
                    {item.name}
                    {item.verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 inline" title={tx('t.TestimonialsSection.185fde92')} />
                    )}
                  </h4>
                  <p className="text-[11px] text-[color:var(--c-text-muted)]">
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
