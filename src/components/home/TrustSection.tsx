import React from 'react';
import { useSiteContent } from '../../lib/useSiteContent';
import { Sparkles, BookOpen, Brain, Heart, Compass, CheckCircle } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const c = useSiteContent();
  const points = [
    {
      icon: BookOpen,
      title: c('trust.p1Title'),
      description: c('trust.p1Text')
    },
    {
      icon: Brain,
      title: c('trust.p2Title'),
      description: c('trust.p2Text')
    },
    {
      icon: Heart,
      title: c('trust.p3Title'),
      description: c('trust.p3Text')
    },
    {
      icon: Compass,
      title: c('trust.p4Title'),
      description: c('trust.p4Text')
    }
  ];

  return (
    <section className="py-12 bg-[color:var(--c-page)] border-y border-[color:var(--c-accent)]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[color:var(--c-accent)]/20 text-[color:var(--c-primary)] text-xs font-extrabold border border-[color:var(--c-accent)]/50">
            <Sparkles className="w-3.5 h-3.5 text-[color:var(--c-primary)]" />
            <span>{c('trust.badge')}</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[color:var(--c-primary)]">
            {c('trust.title')}
          </h2>

          <p className="text-xs sm:text-base text-[color:var(--c-text)] leading-relaxed">
            {c('trust.subtitle')}
          </p>
        </div>

        {/* 4 Point Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {points.map((pt, idx) => {
            const Icon = pt.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/40 shadow-sm hover:shadow-sm hover:border-[color:var(--c-accent)] transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-[color:var(--c-accent)]/20 text-[color:var(--c-primary)] border border-[color:var(--c-accent)]/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-[color:var(--c-accent)] shrink-0" />
                  <h3 className="font-serif font-bold text-lg text-[color:var(--c-primary)]">
                    {pt.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-[color:var(--c-text)] leading-relaxed">
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
